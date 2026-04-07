import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteUserAccount } from '@/lib/db/gdpr'
import { writeAuditLog } from '@/lib/db/audit'
import { onUserDeactivated, onUserActivated, enforceDowngradeLimits, cancelStripeOnDeletion, notifyPlanChange } from '@/lib/services/plan-enforcement'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

async function getAdmin(): Promise<{ isAdmin: boolean; email: string; userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { isAdmin: false, email: '', userId: '' }
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return { isAdmin: adminEmails.includes(user.email.toLowerCase()), email: user.email, userId: user.id }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const { isAdmin: admin, email: adminEmail, userId: adminUserId } = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    userId: string
    orgId?: string
    action: 'deactivate' | 'activate' | 'change_plan' | 'change_compete_plan'
    planId?: string
  }

  if (!body.userId || !body.action) {
    return NextResponse.json({ error: 'userId and action are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (body.action === 'deactivate') {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', body.userId)

    if (error) {
      return NextResponse.json({ error: `Failed to deactivate: ${error.message}` }, { status: 500 })
    }

    // Consequence 1: Sign the user out of all sessions
    await supabase.auth.admin.signOut(body.userId, 'global')

    // Consequence 2: Pause org monitors if no active users remain
    await onUserDeactivated(body.userId)

    await writeAuditLog({
      orgId: null as unknown as string,
      userId: adminUserId,
      action: 'admin.user_deactivated',
      resourceType: 'user',
      resourceId: body.userId,
      metadata: { adminEmail },
    })

    return NextResponse.json({ success: true })
  }

  if (body.action === 'activate') {
    const { error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', body.userId)

    if (error) {
      return NextResponse.json({ error: `Failed to activate: ${error.message}` }, { status: 500 })
    }

    // Consequence: unpause monitors that were paused by deactivation
    await onUserActivated(body.userId)

    await writeAuditLog({
      orgId: null as unknown as string,
      userId: adminUserId,
      action: 'admin.user_activated',
      resourceType: 'user',
      resourceId: body.userId,
      metadata: { adminEmail },
    })

    return NextResponse.json({ success: true })
  }

  if (body.action === 'change_plan') {
    if (!body.planId) {
      return NextResponse.json({ error: 'planId is required for plan change' }, { status: 400 })
    }

    // Get user's org
    const { data: user } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', body.userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cancel existing subscription
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('org_id', user.org_id)
      .eq('status', 'active')

    // Create new subscription with the chosen plan (admin override — no Stripe)
    const { error } = await supabase.from('subscriptions').insert({
      org_id: user.org_id,
      plan_id: body.planId,
      status: 'active',
      billing_cycle: 'monthly',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    })

    if (error) {
      logger.error('Admin plan change failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 })
    }

    // Get plan name for notification
    const { data: newPlan } = await supabase
      .from('plans')
      .select('name')
      .eq('id', body.planId)
      .single()

    // Consequence 1: enforce downgrade limits (pauses excess monitors, disables channels, etc.)
    const { affected } = await enforceDowngradeLimits(user.org_id, body.userId)

    // Consequence 2: notify user about plan change
    await notifyPlanChange(user.org_id, newPlan?.name ?? 'Unknown', affected.length > 0 ? 'downgraded' : 'changed')

    await writeAuditLog({
      orgId: user.org_id,
      userId: adminUserId,
      action: 'admin.plan_changed',
      resourceType: 'subscription',
      resourceId: body.userId,
      metadata: { adminEmail, planId: body.planId, affected },
    })

    return NextResponse.json({ success: true, affected })
  }

  if (body.action === 'change_compete_plan') {
    if (!body.planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 })
    }

    // Resolve org_id from userId if not provided
    let orgId = body.orgId ?? null
    if (!orgId) {
      const { data: userRow } = await supabase.from('users').select('org_id').eq('id', body.userId).single()
      orgId = userRow?.org_id ?? null
    }

    if (!orgId) {
      return NextResponse.json({ error: 'User or org not found' }, { status: 404 })
    }

    // Cancel any existing active compete subscription for this org
    await supabase
      .from('compete_subscriptions')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .eq('status', 'active')

    // Create new compete subscription (admin override — no Stripe)
    const { error: insertError } = await supabase.from('compete_subscriptions').insert({
      org_id: orgId,
      compete_plan_id: body.planId,
      status: 'active',
      billing_cycle: 'monthly',
      extra_products_purchased: 0,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    })

    if (insertError) {
      logger.error('Admin compete plan assignment failed', { error: insertError.message })
      return NextResponse.json({ error: 'Failed to assign Compete plan' }, { status: 500 })
    }

    await writeAuditLog({
      orgId,
      userId: adminUserId,
      action: 'admin.compete_plan_assigned',
      resourceType: 'compete_subscription',
      resourceId: body.userId,
      metadata: { adminEmail, competePlanId: body.planId },
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const { isAdmin: admin, email: adminEmail, userId: adminUserId } = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  // Don't allow deleting yourself
  if (userId === adminUserId) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  try {
    await writeAuditLog({
      orgId: null as unknown as string,
      userId: adminUserId,
      action: 'admin.user_deleted',
      resourceType: 'user',
      resourceId: userId,
      metadata: { adminEmail },
    })

    // Get user's org for cascade delete
    const supabaseAdmin = createAdminClient()
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('org_id')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Consequence: cancel Stripe subscriptions before deleting data
    await cancelStripeOnDeletion(targetUser.org_id)

    const result = await deleteUserAccount(userId, targetUser.org_id)

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Admin user delete failed', { error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}

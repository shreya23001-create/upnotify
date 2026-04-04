import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteUserAccount } from '@/lib/db/gdpr'
import { writeAuditLog } from '@/lib/db/audit'
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
    action: 'deactivate' | 'activate' | 'change_plan'
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

    // Sign the user out of all sessions (forces re-auth, which will hit the deactivated check)
    await supabase.auth.admin.signOut(body.userId, 'global')

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

    await writeAuditLog({
      orgId: user.org_id,
      userId: adminUserId,
      action: 'admin.plan_changed',
      resourceType: 'subscription',
      resourceId: body.userId,
      metadata: { adminEmail, planId: body.planId },
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

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Json } from '@/lib/types/database.types'

/**
 * Structured GDPR data export payload.
 * Every field uses UUIDs (no internal numeric IDs).
 * Sensitive fields (password hashes, API key hashes) are excluded.
 */
interface GdprExportData {
  exportedAt: string
  user: {
    id: string
    email: string | null
    fullName: string | null
    role: string
    createdAt: string
  }
  organisation: {
    id: string
    name: string
    slug: string | null
    createdAt: string
  } | null
  monitors: Array<{
    id: string
    name: string
    type: string
    target: string
    status: string
    checkIntervalSeconds: number | null
    createdAt: string
  }>
  incidents: Array<{
    id: string
    monitorId: string
    title: string
    status: string
    severity: string
    startedAt: string
    resolvedAt: string | null
    durationSeconds: number | null
  }>
  alertChannels: Array<{
    id: string
    type: string
    name: string
    severityFilter: string[] | null
    isEnabled: boolean
    createdAt: string
  }>
  checkResults: Array<{
    id: string
    monitorId: string
    status: string
    responseTimeMs: number | null
    statusCode: number | null
    region: string | null
    checkedAt: string
  }>
  statusPages: Array<{
    id: string
    name: string
    slug: string
    isPublished: boolean
    createdAt: string
  }>
  billing: {
    subscription: {
      id: string
      planId: string
      status: string
      billingCycle: string | null
      currentPeriodStart: string | null
      currentPeriodEnd: string | null
    } | null
    invoices: Array<{
      id: string
      amountGbp: number
      status: string
      periodStart: string | null
      periodEnd: string | null
      createdAt: string
    }>
  }
}

/**
 * Collects ALL user data across tables for GDPR data export.
 *
 * - Scopes everything by orgId to prevent cross-tenant data leakage.
 * - Excludes password hashes, API key hashes, and internal metadata.
 * - Check results limited to last 30 days to keep export manageable.
 * - Returns null on critical failure (user not found).
 */
export async function exportUserData(
  userId: string,
  orgId: string
): Promise<{ success: true; data: GdprExportData } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString()

    // Fetch user profile — scoped to the authenticated user only
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('id', userId)
      .eq('org_id', orgId)
      .single()

    if (userError || !user) {
      logger.error('GDPR export: user not found', {
        userId,
        orgId,
        error: userError?.message,
      })
      return { success: false, error: 'User not found' }
    }

    // Fetch organisation
    const { data: org } = await supabase
      .from('organisations')
      .select('id, name, slug, created_at')
      .eq('id', orgId)
      .single()

    // Fetch monitors — scoped by org_id
    const { data: monitors } = await supabase
      .from('monitors')
      .select('id, name, type, target, status, check_interval_seconds, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    // Fetch incidents — scoped by org_id
    const { data: incidents } = await supabase
      .from('incidents')
      .select('id, monitor_id, title, status, severity, started_at, resolved_at, duration_seconds')
      .eq('org_id', orgId)
      .order('started_at', { ascending: false })

    // Fetch alert channels — scoped by org_id
    const { data: alertChannels } = await supabase
      .from('alert_channels')
      .select('id, type, name, severity_filter, is_enabled, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    // Fetch check results — last 30 days only, scoped by org_id
    const { data: checkResults } = await supabase
      .from('check_results')
      .select('id, monitor_id, status, response_time_ms, status_code, region, checked_at')
      .eq('org_id', orgId)
      .gte('checked_at', thirtyDaysAgo)
      .order('checked_at', { ascending: false })
      .limit(10000)

    // Fetch status pages — scoped by org_id
    const { data: statusPages } = await supabase
      .from('status_pages')
      .select('id, name, slug, is_published, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    // Fetch active subscription — scoped by org_id
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('id, plan_id, status, billing_cycle, current_period_start, current_period_end')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .limit(1)

    const subscription = subscriptions?.[0] ?? null

    // Fetch invoices — scoped by org_id
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, amount_gbp, status, period_start, period_end, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    const exportData: GdprExportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email ?? null,
        fullName: user.full_name ?? null,
        role: user.role,
        createdAt: user.created_at,
      },
      organisation: org
        ? {
            id: org.id,
            name: org.name,
            slug: org.slug ?? null,
            createdAt: org.created_at,
          }
        : null,
      monitors: (monitors ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        target: m.target,
        status: m.status,
        checkIntervalSeconds: m.check_interval_seconds,
        createdAt: m.created_at,
      })),
      incidents: (incidents ?? []).map((i) => ({
        id: i.id,
        monitorId: i.monitor_id,
        title: i.title,
        status: i.status,
        severity: i.severity,
        startedAt: i.started_at,
        resolvedAt: i.resolved_at ?? null,
        durationSeconds: i.duration_seconds ?? null,
      })),
      alertChannels: (alertChannels ?? []).map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        severityFilter: c.severity_filter ?? null,
        isEnabled: c.is_enabled,
        createdAt: c.created_at,
      })),
      checkResults: (checkResults ?? []).map((r) => ({
        id: r.id,
        monitorId: r.monitor_id,
        status: r.status,
        responseTimeMs: r.response_time_ms ?? null,
        statusCode: r.status_code ?? null,
        region: r.region ?? null,
        checkedAt: r.checked_at,
      })),
      statusPages: (statusPages ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        isPublished: p.is_published,
        createdAt: p.created_at,
      })),
      billing: {
        subscription: subscription
          ? {
              id: subscription.id,
              planId: subscription.plan_id,
              status: subscription.status,
              billingCycle: subscription.billing_cycle,
              currentPeriodStart: subscription.current_period_start ?? null,
              currentPeriodEnd: subscription.current_period_end ?? null,
            }
          : null,
        invoices: (invoices ?? []).map((inv) => ({
          id: inv.id,
          amountGbp: inv.amount_gbp,
          status: inv.status,
          periodStart: inv.period_start ?? null,
          periodEnd: inv.period_end ?? null,
          createdAt: inv.created_at,
        })),
      },
    }

    logger.info('GDPR data export completed', { userId, orgId })
    return { success: true, data: exportData }
  } catch (error) {
    logger.error('GDPR data export failed with exception', {
      userId,
      orgId,
      error: String(error),
    })
    return { success: false, error: 'Export failed due to an internal error' }
  }
}

// =========================================================================
// GDPR Account Deletion
// =========================================================================

interface DeletionResult {
  success: boolean
  error?: string
  failedStep?: string
}

/**
 * Write an audit log entry using the admin client (service-role)
 * so the record persists even after the user row is deleted.
 */
async function writeGdprDeletionAuditLog(
  orgId: string,
  userId: string,
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('audit_log').insert({
    org_id: orgId,
    user_id: userId,
    action,
    resource_type: 'account',
    resource_id: userId,
    metadata: metadata as Json,
  })

  if (error) {
    // Log but never throw — a failed audit insert must not block
    // the user's right to erasure.
    logger.error('Failed to write GDPR deletion audit log', {
      error: error.message,
    })
  }
}

/**
 * Deletes all user and organisation data using Postgres ON DELETE CASCADE.
 *
 * All tables with org_id → organisations(id) have CASCADE defined in the
 * DB schema, so deleting the organisation row cascades everything automatically.
 * This is safer than manual step-by-step deletion because it never misses
 * new tables added after this code was written.
 *
 * **Pre-conditions (enforced by the API route, NOT here):**
 * - Active Stripe/Razorpay subscriptions have already been cancelled
 * - `orgId` is confirmed to belong to `userId`
 *
 * @param userId - The Supabase Auth user ID
 * @param orgId  - The organisation ID the user belongs to
 */
export async function deleteUserAccount(
  userId: string,
  orgId: string,
): Promise<DeletionResult> {
  const supabase = createAdminClient()

  await writeGdprDeletionAuditLog(orgId, userId, 'account.deletion_started', {
    reason: 'Admin-initiated account deletion',
  })
  logger.info('Account deletion started', { userId, orgId })

  // Sign out all active sessions before deleting the user
  await supabase.auth.admin.signOut(userId, 'global')

  // Check if user is the sole member of the org
  const { count: remainingUsers } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  if ((remainingUsers ?? 0) <= 1) {
    // Delete the organisation — Postgres ON DELETE CASCADE removes ALL org data
    // automatically: monitors, incidents, check_results, subscriptions, invoices,
    // compete_subscriptions, alert_channels, status_pages, user_messages,
    // aoe data, llms_txt_generations, citation runs, and everything else.
    const { error: orgDeleteError } = await supabase
      .from('organisations')
      .delete()
      .eq('id', orgId)

    if (orgDeleteError) {
      logger.error('Deletion failed at organisation', { error: orgDeleteError.message })
      return { success: false, error: orgDeleteError.message, failedStep: 'organisation' }
    }
  } else {
    // Other members exist — only remove this user's row
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (userDeleteError) {
      logger.error('Deletion failed at user row', { error: userDeleteError.message })
      return { success: false, error: userDeleteError.message, failedStep: 'users' }
    }
  }

  // Remove the Supabase Auth record (public.users already gone via cascade or direct delete)
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
  if (authDeleteError) {
    logger.error('Deletion failed at auth user', { error: authDeleteError.message })
    return { success: false, error: authDeleteError.message, failedStep: 'auth_user' }
  }

  await writeGdprDeletionAuditLog(orgId, userId, 'account.deletion_completed', {})
  logger.info('Account deletion completed', { userId, orgId })

  return { success: true }
}

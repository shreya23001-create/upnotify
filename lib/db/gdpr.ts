import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Database, Json } from '@/lib/types/database.types'

type TableName = keyof Database['public']['Tables']

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

/**
 * Counts of rows deleted per table. Returned so the caller can
 * confirm exactly what was removed.
 */
interface DeletedCounts {
  check_results: number
  voice_call_logs: number
  alerts: number
  incidents: number
  alert_channels: number
  monitors: number
  maintenance_windows: number
  status_page_subscribers: number
  status_pages: number
  reports: number
  api_keys: number
  invoices: number
  subscriptions: number
  contact_preferences: number
  agency_tags: number
  stripe_connect_payouts: number
  admin_permissions: number
  users: number
  workspaces: number
  organisation: number
  auth_user: number
}

interface DeletionResult {
  success: boolean
  deletedCounts: DeletedCounts
  error?: string
  /** The step that failed — allows partial-result diagnosis */
  failedStep?: string
}

/**
 * Delete all rows from a table matching a column value and return
 * the count of rows deleted. Uses count-then-delete because the
 * Supabase JS client does not expose affected-row counts on delete.
 */
async function deleteByOrgFilter(
  table: TableName,
  column: string,
  value: string,
): Promise<{ count: number; error: string | null }> {
  const supabase = createAdminClient()

  const { count, error: countError } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, value)

  if (countError) {
    return { count: 0, error: countError.message }
  }

  const rowCount = count ?? 0
  if (rowCount === 0) {
    return { count: 0, error: null }
  }

  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq(column, value)

  if (deleteError) {
    return { count: 0, error: deleteError.message }
  }

  return { count: rowCount, error: null }
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
 * Cascading delete of all user and organisation data.
 *
 * **Pre-conditions (enforced by the API route, NOT here):**
 * - `userId` is the currently authenticated user
 * - `orgId` is that user's organisation
 * - Active Stripe subscription has been cancelled
 * - The user has provided the confirmation string
 *
 * Deletion order respects foreign keys (children first).
 * If any step fails the function stops immediately and returns
 * a partial result so the caller knows exactly what was deleted.
 *
 * @param userId - The Supabase Auth user ID
 * @param orgId  - The organisation ID the user belongs to
 */
export async function deleteUserAccount(
  userId: string,
  orgId: string,
): Promise<DeletionResult> {
  const counts: DeletedCounts = {
    check_results: 0,
    voice_call_logs: 0,
    alerts: 0,
    incidents: 0,
    alert_channels: 0,
    monitors: 0,
    maintenance_windows: 0,
    status_page_subscribers: 0,
    status_pages: 0,
    reports: 0,
    api_keys: 0,
    invoices: 0,
    subscriptions: 0,
    contact_preferences: 0,
    agency_tags: 0,
    stripe_connect_payouts: 0,
    admin_permissions: 0,
    users: 0,
    workspaces: 0,
    organisation: 0,
    auth_user: 0,
  }

  // ── Audit log BEFORE any deletion ────────────────────────────────
  await writeGdprDeletionAuditLog(orgId, userId, 'account.deletion_started', {
    reason: 'User requested account deletion (GDPR right to erasure)',
  })

  logger.info('GDPR account deletion started', { userId, orgId })

  // Helper that runs a step, mutates counts, and returns early on error.
  type StepKey = keyof DeletedCounts
  async function runStep(
    stepKey: StepKey,
    table: TableName,
    column: string,
    value: string,
  ): Promise<string | null> {
    const result = await deleteByOrgFilter(table, column, value)
    if (result.error) {
      logger.error(`GDPR deletion failed at ${stepKey}`, { error: result.error })
      return result.error
    }
    counts[stepKey] = result.count
    return null
  }

  // ── 1. Check results (FK -> monitors) ────────────────────────────
  let err = await runStep('check_results', 'check_results', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'check_results' }

  // ── 2. Voice call logs (FK -> alerts) ────────────────────────────
  err = await runStep('voice_call_logs', 'voice_call_logs', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'voice_call_logs' }

  // ── 3. Alerts (FK -> incidents, alert_channels) ──────────────────
  err = await runStep('alerts', 'alerts', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'alerts' }

  // ── 4. Incidents (FK -> monitors) ────────────────────────────────
  err = await runStep('incidents', 'incidents', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'incidents' }

  // ── 5. Alert channels (FK -> org) ────────────────────────────────
  err = await runStep('alert_channels', 'alert_channels', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'alert_channels' }

  // ── 6. Monitors (FK -> org, workspace) ───────────────────────────
  err = await runStep('monitors', 'monitors', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'monitors' }

  // ── 7. Maintenance windows (FK -> org, workspace) ────────────────
  err = await runStep('maintenance_windows', 'maintenance_windows', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'maintenance_windows' }

  // ── 8. Status page subscribers (FK -> status_pages) ──────────────
  // Must delete subscribers before their parent status pages.
  const supabase = createAdminClient()
  const { data: statusPages } = await supabase
    .from('status_pages')
    .select('id')
    .eq('org_id', orgId)

  let subscriberCount = 0
  if (statusPages && statusPages.length > 0) {
    for (const sp of statusPages) {
      const sub = await deleteByOrgFilter('status_page_subscribers', 'status_page_id', sp.id)
      if (sub.error) {
        logger.error('GDPR deletion failed at status_page_subscribers', {
          error: sub.error,
          statusPageId: sp.id,
        })
        return {
          success: false,
          deletedCounts: counts,
          error: sub.error,
          failedStep: 'status_page_subscribers',
        }
      }
      subscriberCount += sub.count
    }
  }
  counts.status_page_subscribers = subscriberCount

  // ── 9. Status pages (FK -> org) ──────────────────────────────────
  err = await runStep('status_pages', 'status_pages', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'status_pages' }

  // ── 10. Reports (FK -> org) ──────────────────────────────────────
  err = await runStep('reports', 'reports', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'reports' }

  // ── 11. API keys (FK -> org) ─────────────────────────────────────
  err = await runStep('api_keys', 'api_keys', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'api_keys' }

  // ── 12. Invoices (FK -> subscriptions, org) ──────────────────────
  err = await runStep('invoices', 'invoices', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'invoices' }

  // ── 13. Subscriptions (FK -> org, plans) ─────────────────────────
  err = await runStep('subscriptions', 'subscriptions', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'subscriptions' }

  // ── 14. Contact preferences (FK -> user, org) ───────────────────
  err = await runStep('contact_preferences', 'contact_preferences', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'contact_preferences' }

  // ── 15. Agency tags (FK -> org) ──────────────────────────────────
  err = await runStep('agency_tags', 'agency_tags', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'agency_tags' }

  // ── 16. Stripe connect payouts (FK -> org) ───────────────────────
  err = await runStep('stripe_connect_payouts', 'stripe_connect_payouts', 'org_id', orgId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'stripe_connect_payouts' }

  // ── 17. Admin permissions (FK -> users) ──────────────────────────
  err = await runStep('admin_permissions', 'admin_permissions', 'user_id', userId)
  if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'admin_permissions' }

  // ── 18. User row ────────────────────────────────────────────────
  // Delete only the requesting user — other org members are unaffected.
  const userDelete = await deleteByOrgFilter('users', 'id', userId)
  if (userDelete.error) {
    logger.error('GDPR deletion failed at users', { error: userDelete.error })
    return { success: false, deletedCounts: counts, error: userDelete.error, failedStep: 'users' }
  }
  counts.users = userDelete.count

  // ── 19. Check if user was sole member of org ────────────────────
  const { count: remainingUsers } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  if (remainingUsers === 0) {
    // ── 20. Workspaces (FK -> org) ────────────────────────────────
    err = await runStep('workspaces', 'workspaces', 'org_id', orgId)
    if (err) return { success: false, deletedCounts: counts, error: err, failedStep: 'workspaces' }

    // ── 21. Organisation ──────────────────────────────────────────
    const orgDelete = await deleteByOrgFilter('organisations', 'id', orgId)
    if (orgDelete.error) {
      logger.error('GDPR deletion failed at organisation', { error: orgDelete.error })
      return { success: false, deletedCounts: counts, error: orgDelete.error, failedStep: 'organisation' }
    }
    counts.organisation = orgDelete.count
  } else {
    logger.info('Organisation not deleted — other members remain', {
      orgId,
      remainingUsers,
    })
  }

  // ── 22. Supabase Auth user ──────────────────────────────────────
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
  if (authDeleteError) {
    logger.error('GDPR deletion failed at auth user', {
      error: authDeleteError.message,
    })
    return {
      success: false,
      deletedCounts: counts,
      error: authDeleteError.message,
      failedStep: 'auth_user',
    }
  }
  counts.auth_user = 1

  // ── Final audit log ─────────────────────────────────────────────
  // The user row is gone, but we still write the completion log
  // keyed by the now-deleted userId for traceability.
  await writeGdprDeletionAuditLog(orgId, userId, 'account.deletion_completed', {
    deletedCounts: counts,
  })

  logger.info('GDPR account deletion completed', { userId, orgId, counts })

  return { success: true, deletedCounts: counts }
}

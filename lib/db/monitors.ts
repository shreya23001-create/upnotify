import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Monitor } from '@/lib/types'

export async function getMonitorsByWorkspace(workspaceId: string): Promise<Monitor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get monitors', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getMonitorById(id: string): Promise<Monitor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Failed to get monitor', { error: error.message })
    return null
  }
  return data
}

export async function getMonitorStats(
  orgId: string,
  workspaceId?: string
): Promise<{ total: number; up: number; down: number; degraded: number; paused: number }> {
  const supabase = await createClient()
  let query = supabase.from('monitors').select('status').eq('org_id', orgId)
  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error || !data) {
    logger.error('Failed to get monitor stats', { error: error?.message })
    return { total: 0, up: 0, down: 0, degraded: 0, paused: 0 }
  }

  return {
    total: data.length,
    up: data.filter(m => m.status === 'up').length,
    down: data.filter(m => m.status === 'down').length,
    degraded: data.filter(m => m.status === 'degraded').length,
    paused: data.filter(m => m.status === 'paused').length,
  }
}

// --- Admin client functions (for cron jobs and background tasks) ---

export async function getDueMonitors(): Promise<Monitor[]> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('is_paused', false)
    .or(`next_check_at.lte.${now},next_check_at.is.null`)
    .order('next_check_at', { ascending: true, nullsFirst: true })
    .limit(100)

  if (error) {
    logger.error('Failed to get due monitors', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getMonitorsByOrgId(orgId: string): Promise<Pick<Monitor, 'id' | 'name' | 'target'>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monitors')
    .select('id, name, target')
    .eq('org_id', orgId)
    .eq('is_paused', false)
    .order('name', { ascending: true })

  if (error) {
    logger.error('Failed to get monitors by org', { error: error.message })
    return []
  }
  return (data ?? []) as Pick<Monitor, 'id' | 'name' | 'target'>[]
}

export interface DomainMonitorSummary {
  count: number
  types: string[]
}

/** Monitor count + distinct monitor types per target_domain for this org —
 *  used by the Plans page to show "3 monitors" and a row of type pills
 *  (HTTP, SSL, DNS, ...) next to a paid website, so customers can see
 *  exactly what coverage they're getting. Monitors created before the
 *  per-website billing model have target_domain = null and are grouped
 *  under the empty-string key. */
export async function getMonitorSummaryByDomain(orgId: string): Promise<Record<string, DomainMonitorSummary>> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('monitors')
    .select('target_domain, type')
    .eq('org_id', orgId) as { data: Array<{ target_domain: string | null; type: string }> | null; error: { message: string } | null }

  if (error) {
    logger.error('Failed to get monitor summary by domain', { error: error.message, orgId })
    return {}
  }

  const summary: Record<string, DomainMonitorSummary> = {}
  for (const row of data ?? []) {
    const key = row.target_domain ?? ''
    if (!summary[key]) summary[key] = { count: 0, types: [] }
    summary[key].count += 1
    if (!summary[key].types.includes(row.type)) summary[key].types.push(row.type)
  }
  return summary
}

export async function getMonitorsByOrg(orgId: string): Promise<Monitor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(10)

  if (error) {
    logger.error('Failed to get monitors by org', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getAllActiveMonitors(): Promise<Monitor[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('is_paused', false)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    logger.error('Failed to get all active monitors', { error: error.message })
    return []
  }
  return data ?? []
}

export async function updateMonitorStatus(
  id: string,
  updates: { status: string; last_checked_at: string; next_check_at: string }
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('monitors')
    .update(updates)
    .eq('id', id)

  if (error) {
    logger.error('Failed to update monitor status', { error: error.message, monitorId: id })
  }
}

export async function patchMonitorConfig(
  id: string,
  currentConfig: Record<string, unknown>,
  patch: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient()
  const merged = { ...currentConfig, ...patch }
  const { error } = await supabase
    .from('monitors')
    .update({ config: merged as import('@/lib/types/database.types').Json })
    .eq('id', id)

  if (error) {
    logger.error('Failed to patch monitor config', { error: error.message, monitorId: id })
  }
}

export async function incrementFlapCount(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('monitors').select('flap_count').eq('id', id).single()
  if (data) {
    await supabase.from('monitors').update({ flap_count: (data.flap_count || 0) + 1 }).eq('id', id)
  }
}

export async function createMonitor(data: {
  org_id: string
  workspace_id: string
  name: string
  type: string
  target: string
  target_domain?: string
  check_interval_seconds?: number
  timeout_ms?: number
  config?: Record<string, unknown>
  severity?: string
}): Promise<Monitor | null> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { data: monitor, error } = await supabase
    .from('monitors')
    .insert({
      org_id: data.org_id,
      workspace_id: data.workspace_id,
      name: data.name,
      type: data.type,
      target: data.target,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target_domain: data.target_domain as any,
      check_interval_seconds: data.check_interval_seconds,
      timeout_ms: data.timeout_ms,
      severity: data.severity,
      config: (data.config ?? {}) as import('@/lib/types/database.types').Json,
      next_check_at: now,
      status: 'unknown',
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create monitor', { error: error.message })
    return null
  }
  return monitor
}

// Monitor types that need only a domain to be meaningful — no keywords,
// port number, API method, or other input a customer must supply. These
// are the types auto-created for every website that pays for the
// ₹149/month plan. Deliberately excludes: keyword (needs search terms),
// api (needs method/headers), port (needs a port number), heartbeat
// (needs an expected interval), competitor (page-change detection is a
// different setup flow), wordpress (a distinct product, needs the plugin).
const AUTO_CREATE_MONITOR_TYPES = [
  'http', 'ssl', 'dns', 'domain', 'ping', 'security-headers', 'response-time',
  'robots-txt', 'ip-change', 'mx-health', 'whois-change', 'sitemap',
  'redirect-chain', 'spf-dmarc', 'blacklist', 'page-size', 'cookie-consent',
  'nameserver-change',
]

// Same URL-shaped-target list as app/(dashboard)/dashboard/monitors/actions.ts —
// these types get an https:// prefix, the rest use the bare domain.
const URL_TARGET_MONITOR_TYPES = new Set([
  'http', 'ssl', 'domain', 'robots-txt', 'security-headers', 'response-time',
  'sitemap', 'redirect-chain', 'page-size', 'cookie-consent',
])

/**
 * Auto-creates one monitor of every domain-only type (see
 * AUTO_CREATE_MONITOR_TYPES) for a newly-paid website. Called from the
 * Razorpay webhook right after a website_subscriptions row activates, so
 * every website on the ₹149/month plan gets full coverage immediately with
 * no manual setup. Skips any type that already has a monitor for this
 * exact target_domain (idempotent — safe to call again on a webhook
 * retry/duplicate delivery).
 */
export async function autoCreateMonitorsForDomain(params: {
  orgId: string
  workspaceId: string
  targetDomain: string
}): Promise<{ created: number; skipped: number }> {
  const supabase = createAdminClient()
  const { orgId, workspaceId, targetDomain } = params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingRows } = await (supabase as any)
    .from('monitors')
    .select('type')
    .eq('org_id', orgId)
    .eq('target_domain', targetDomain) as { data: Array<{ type: string }> | null }
  const existingTypes = new Set((existingRows ?? []).map(r => r.type))

  let created = 0
  let skipped = 0
  const now = new Date().toISOString()

  for (const type of AUTO_CREATE_MONITOR_TYPES) {
    if (existingTypes.has(type)) {
      skipped++
      continue
    }
    const target = URL_TARGET_MONITOR_TYPES.has(type) ? `https://${targetDomain}` : targetDomain

    const { error } = await supabase
      .from('monitors')
      .insert({
        org_id: orgId,
        workspace_id: workspaceId,
        name: `${targetDomain} — ${type}`,
        type,
        target,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        target_domain: targetDomain as any,
        severity: 'P2',
        config: {} as import('@/lib/types/database.types').Json,
        next_check_at: now,
        status: 'unknown',
      })

    if (error) {
      logger.error('Failed to auto-create monitor for paid website', { error: error.message, orgId, targetDomain, type })
    } else {
      created++
    }
  }

  logger.info('Auto-created monitors for paid website', { orgId, targetDomain, created, skipped })
  return { created, skipped }
}

export async function updateMonitor(
  id: string,
  updates: { name?: string; target?: string; check_interval_seconds?: number; timeout_ms?: number; severity?: string; config?: Record<string, unknown> }
): Promise<Monitor | null> {
  const supabase = createAdminClient()
  const updateData: Record<string, unknown> = {}
  if (updates.name) updateData.name = updates.name
  if (updates.target) updateData.target = updates.target
  if (updates.check_interval_seconds) updateData.check_interval_seconds = updates.check_interval_seconds
  if (updates.timeout_ms) updateData.timeout_ms = updates.timeout_ms
  if (updates.severity) updateData.severity = updates.severity
  if (updates.config) updateData.config = updates.config as import('@/lib/types/database.types').Json

  const { data, error } = await supabase
    .from('monitors')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update monitor', { error: error.message })
    return null
  }
  return data
}

export async function deleteMonitor(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('monitors').delete().eq('id', id)
  if (error) {
    logger.error('Failed to delete monitor', { error: error.message })
    return false
  }
  return true
}

export async function pauseMonitor(id: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('monitors').update({ is_paused: true, status: 'paused' }).eq('id', id)
}

export async function resumeMonitor(id: string): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  await supabase.from('monitors').update({ is_paused: false, status: 'unknown', next_check_at: now }).eq('id', id)
}

export async function bulkDeleteMonitors(ids: string[], orgId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('monitors')
    .delete()
    .in('id', ids)
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to bulk delete monitors', { error: error.message, count: ids.length })
    return false
  }
  logger.info('Bulk deleted monitors', { count: ids.length, orgId })
  return true
}

export async function bulkUpdateMonitorStatus(ids: string[], orgId: string, isPaused: boolean): Promise<boolean> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const updateData = isPaused
    ? { is_paused: true, status: 'paused' }
    : { is_paused: false, status: 'unknown', next_check_at: now }

  const { error } = await supabase
    .from('monitors')
    .update(updateData)
    .in('id', ids)
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to bulk update monitor status', { error: error.message, isPaused, count: ids.length })
    return false
  }
  logger.info('Bulk updated monitor status', { count: ids.length, isPaused, orgId })
  return true
}

export async function getMonitorsByWorkspacePaged(
  workspaceId: string,
  page: number,
  pageSize: number,
  filters?: { search?: string; status?: string; type?: string }
): Promise<{ data: Monitor[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('monitors')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)

  const search = filters?.search?.trim()
  if (search) {
    // Strip characters that would break PostgREST's `or` filter syntax.
    const term = search.replace(/[%,()]/g, ' ').trim()
    if (term) query = query.or(`name.ilike.%${term}%,target.ilike.%${term}%`)
  }
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.type) query = query.eq('type', filters.type)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    logger.error('Failed to get monitors paged', { error: error.message })
    return { data: [], total: 0 }
  }
  return { data: data ?? [], total: count ?? 0 }
}

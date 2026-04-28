import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { randomUUID } from 'crypto'

// New tables (wp_monitors, wp_snapshots, wp_findings) are not yet in database.types.ts.
// They will be after running migration 00080 against Supabase and regenerating types.
// Until then we use the any-cast pattern consistent with the rest of this codebase.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

export interface WpMonitor {
  id: string
  monitor_id: string
  org_id: string
  site_url: string
  api_token: string
  token_verified: boolean
  last_push_at: string | null
  check_interval_minutes: number
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface WpSnapshot {
  id: string
  wp_monitor_id: string
  org_id: string
  received_at: string
  wp_version: string | null
  php_version: string | null
  active_plugins: WpPlugin[]
  inactive_plugins: WpPlugin[]
  active_theme: WpTheme | null
  admin_users: WpUser[]
  recent_pages: WpPage[]
  file_scan: WpFileScan
  debug_mode: boolean | null
  memory_limit: string | null
  db_size_mb: number | null
  cron_last_run: string | null
  health_score: number | null
  created_at: string
}

export interface WpFinding {
  id: string
  wp_monitor_id: string
  org_id: string
  snapshot_id: string | null
  finding_type: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  detail: Record<string, unknown>
  status: 'open' | 'acknowledged' | 'resolved'
  first_detected_at: string
  resolved_at: string | null
  ai_explanation: string | null
  created_at: string
  updated_at: string
}

export interface WpPlugin {
  name: string
  slug: string
  version: string
  update_available: boolean
  new_version?: string
}

export interface WpTheme {
  name: string
  version: string
  update_available: boolean
}

export interface WpUser {
  id: number
  login: string
  email: string
  roles: string[]
  registered: string
}

export interface WpPage {
  id: number
  title: string
  slug: string
  status: string
  author_id: number
  created_at: string
  language?: string
}

export interface WpFileScan {
  php_in_uploads: string[]
  js_in_uploads: string[]
  htaccess_modified: boolean
  wpconfig_modified: boolean
  suspicious_files: string[]
  core_files_modified: string[]
  theme_files_modified: string[]
}

export function generateWpToken(): string {
  return `wpt_${randomUUID().replace(/-/g, '')}`
}

export async function createWpMonitor(data: {
  monitor_id: string
  org_id: string
  site_url: string
  api_token: string
  check_interval_minutes?: number
}): Promise<WpMonitor | null> {
  const { data: result, error } = await db()
    .from('wp_monitors')
    .insert({
      monitor_id: data.monitor_id,
      org_id: data.org_id,
      site_url: data.site_url,
      api_token: data.api_token,
      check_interval_minutes: data.check_interval_minutes ?? 120,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create wp_monitor', { error: error.message })
    return null
  }
  return result as WpMonitor
}

export async function getWpMonitorByMonitorId(monitorId: string): Promise<WpMonitor | null> {
  const { data, error } = await db()
    .from('wp_monitors')
    .select('*')
    .eq('monitor_id', monitorId)
    .maybeSingle()

  if (error) {
    logger.error('Failed to get wp_monitor by monitor_id', { error: error.message })
    return null
  }
  return data as WpMonitor | null
}

export async function getWpMonitorByToken(token: string): Promise<WpMonitor | null> {
  const { data, error } = await db()
    .from('wp_monitors')
    .select('*')
    .eq('api_token', token)
    .maybeSingle()

  if (error) return null
  return data as WpMonitor | null
}

export async function markWpMonitorVerified(wpMonitorId: string): Promise<void> {
  await db()
    .from('wp_monitors')
    .update({ token_verified: true, last_push_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', wpMonitorId)
}

export async function updateWpMonitorLastPush(wpMonitorId: string): Promise<void> {
  await db()
    .from('wp_monitors')
    .update({ last_push_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', wpMonitorId)
}

export async function saveWpSnapshot(data: {
  wp_monitor_id: string
  org_id: string
  wp_version?: string | null
  php_version?: string | null
  active_plugins?: unknown[]
  inactive_plugins?: unknown[]
  active_theme?: unknown
  admin_users?: unknown[]
  recent_pages?: unknown[]
  file_scan?: unknown
  debug_mode?: boolean | null
  memory_limit?: string | null
  db_size_mb?: number | null
  cron_last_run?: string | null
  health_score?: number | null
  raw_data?: unknown
}): Promise<WpSnapshot | null> {
  const { data: result, error } = await db()
    .from('wp_snapshots')
    .insert(data)
    .select()
    .single()

  if (error) {
    logger.error('Failed to save wp_snapshot', { error: error.message })
    return null
  }
  return result as WpSnapshot
}

export async function getLatestWpSnapshot(wpMonitorId: string): Promise<WpSnapshot | null> {
  const { data, error } = await db()
    .from('wp_snapshots')
    .select('*')
    .eq('wp_monitor_id', wpMonitorId)
    .order('received_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('Failed to get latest wp_snapshot', { error: error.message })
    return null
  }
  return data as WpSnapshot | null
}

export async function getWpSnapshotHistory(wpMonitorId: string, limit = 30): Promise<WpSnapshot[]> {
  const { data, error } = await db()
    .from('wp_snapshots')
    .select('id, wp_monitor_id, org_id, received_at, health_score, wp_version, php_version, created_at')
    .eq('wp_monitor_id', wpMonitorId)
    .order('received_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Failed to get wp_snapshot history', { error: error.message })
    return []
  }
  return (data ?? []) as WpSnapshot[]
}

export async function createWpFinding(data: {
  wp_monitor_id: string
  org_id: string
  snapshot_id?: string
  finding_type: string
  severity: WpFinding['severity']
  title: string
  detail?: Record<string, unknown>
}): Promise<WpFinding | null> {
  const { data: result, error } = await db()
    .from('wp_findings')
    .insert({ ...data, detail: data.detail ?? {} })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create wp_finding', { error: error.message })
    return null
  }
  return result as WpFinding
}

export async function getWpFindings(
  wpMonitorId: string,
  status?: WpFinding['status'],
  limit = 100,
): Promise<WpFinding[]> {
  let query = db()
    .from('wp_findings')
    .select('*')
    .eq('wp_monitor_id', wpMonitorId)
    .order('first_detected_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) {
    logger.error('Failed to get wp_findings', { error: error.message })
    return []
  }
  return (data ?? []) as WpFinding[]
}

export async function getOpenWpFindingByType(
  wpMonitorId: string,
  findingType: string,
): Promise<WpFinding | null> {
  const { data } = await db()
    .from('wp_findings')
    .select('*')
    .eq('wp_monitor_id', wpMonitorId)
    .eq('finding_type', findingType)
    .in('status', ['open', 'acknowledged'])
    .maybeSingle()

  return data as WpFinding | null
}

export async function resolveWpFinding(findingId: string): Promise<void> {
  await db()
    .from('wp_findings')
    .update({ status: 'resolved', resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', findingId)
}

export async function acknowledgeWpFinding(findingId: string, orgId: string): Promise<void> {
  await db()
    .from('wp_findings')
    .update({ status: 'acknowledged', updated_at: new Date().toISOString() })
    .eq('id', findingId)
    .eq('org_id', orgId)
}

export async function saveAiExplanation(findingId: string, explanation: string): Promise<void> {
  await db()
    .from('wp_findings')
    .update({ ai_explanation: explanation })
    .eq('id', findingId)
}

export async function getWpMonitorCountByOrg(orgId: string): Promise<number> {
  const { count } = await db()
    .from('wp_monitors')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  return count ?? 0
}

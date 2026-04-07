import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// competitor_check_results and competitor_incidents are new tables added in
// migration 00048 — not yet in the generated Supabase type definitions.
// Using this helper until types are regenerated after running the migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untyped(client: unknown): any { return client }

// ============================================================
// Types
// ============================================================

export interface CompetitorMonitor {
  id: string
  org_id: string
  domain: string
  display_name: string
  last_status: 'up' | 'down' | 'degraded' | 'unknown'
  last_response_time_ms: number | null
  last_checked_at: string | null
  uptime_30d: number | null
  ai_summary: string | null
  ai_summary_at: string | null
  keywords_enabled: boolean
  created_at: string
  updated_at: string
}

export interface CompetitorCheckResult {
  id: string
  competitor_id: string
  org_id: string
  status: 'up' | 'down' | 'degraded'
  response_time_ms: number | null
  status_code: number | null
  keyword_matched: string | null
  keyword_category: string | null
  error_message: string | null
  checked_at: string
}

export interface CompetitorIncident {
  id: string
  competitor_id: string
  org_id: string
  status: 'open' | 'resolved'
  cause: string | null
  started_at: string
  resolved_at: string | null
}

// ============================================================
// Read queries (scoped by org_id — RLS is additional safety net)
// ============================================================

export async function getCompetitorsByOrg(orgId: string): Promise<CompetitorMonitor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('competitor_monitors')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get competitor monitors', { error: error.message, orgId })
    return []
  }
  return (data ?? []) as unknown as CompetitorMonitor[]
}

export async function getCompetitorById(
  id: string,
  orgId: string
): Promise<CompetitorMonitor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('competitor_monitors')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) {
    logger.error('Failed to get competitor monitor', { error: error.message, id })
    return null
  }
  return data as unknown as CompetitorMonitor
}

export async function getCompetitorCountByOrg(orgId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('competitor_monitors')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to count competitor monitors', { error: error.message, orgId })
    return 0
  }
  return count ?? 0
}

/** Get recent check results for a competitor (for analytics). */
export async function getCompetitorCheckResults(
  competitorId: string,
  orgId: string,
  limitDays = 30
): Promise<CompetitorCheckResult[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - limitDays * 86400000).toISOString()

  const { data, error } = await untyped(supabase)
    .from('competitor_check_results')
    .select('*')
    .eq('competitor_id', competitorId)
    .eq('org_id', orgId)
    .gte('checked_at', since)
    .order('checked_at', { ascending: false })
    .limit(500)

  if (error) {
    logger.error('Failed to get competitor check results', { error: error.message, competitorId })
    return []
  }
  return (data ?? []) as CompetitorCheckResult[]
}

/** Get open incident for a competitor (for dedup — cron only). */
export async function getOpenIncidentForCompetitor(
  competitorId: string
): Promise<CompetitorIncident | null> {
  const supabase = createAdminClient()
  const { data, error } = await untyped(supabase)
    .from('competitor_incidents')
    .select('*')
    .eq('competitor_id', competitorId)
    .eq('status', 'open')
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('Failed to get open competitor incident', { error: error.message, competitorId })
    return null
  }
  return data as CompetitorIncident | null
}

// ============================================================
// Write queries (admin client for cron operations)
// ============================================================

export async function createCompetitorMonitor(data: {
  org_id: string
  domain: string
  display_name: string
}): Promise<CompetitorMonitor | null> {
  const supabase = createAdminClient()
  const { data: monitor, error } = await supabase
    .from('competitor_monitors')
    .insert({
      org_id: data.org_id,
      domain: data.domain,
      display_name: data.display_name,
      last_status: 'unknown',
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create competitor monitor', { error: error.message, code: error.code, domain: data.domain })
    return null
  }
  return monitor as unknown as CompetitorMonitor
}

export async function deleteCompetitorMonitor(id: string, orgId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('competitor_monitors')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to delete competitor monitor', { error: error.message, id })
    return false
  }
  return true
}

export async function updateCompetitorStatus(
  id: string,
  updates: {
    last_status: string
    last_response_time_ms: number | null
    last_checked_at: string
    uptime_30d?: number | null
  }
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('competitor_monitors')
    .update(updates)
    .eq('id', id)

  if (error) {
    logger.error('Failed to update competitor status', { error: error.message, id })
  }
}

/** Store one check result row. Called from cron after each check. */
export async function writeCompetitorCheckResult(data: {
  competitor_id: string
  org_id: string
  status: 'up' | 'down' | 'degraded'
  response_time_ms: number | null
  status_code?: number | null
  keyword_matched?: string | null
  keyword_category?: string | null
  error_message?: string | null
}): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await untyped(supabase).from('competitor_check_results').insert({
    competitor_id: data.competitor_id,
    org_id: data.org_id,
    status: data.status,
    response_time_ms: data.response_time_ms ?? null,
    status_code: data.status_code ?? null,
    keyword_matched: data.keyword_matched ?? null,
    keyword_category: data.keyword_category ?? null,
    error_message: data.error_message ?? null,
  })
  if (error) {
    logger.error('Failed to write competitor check result', { error: error.message })
  }
}

/** Open a new incident. Returns the new incident id. */
export async function createCompetitorIncident(data: {
  competitor_id: string
  org_id: string
  cause: string
}): Promise<string | null> {
  const supabase = createAdminClient()
  const { data: row, error } = await untyped(supabase)
    .from('competitor_incidents')
    .insert({
      competitor_id: data.competitor_id,
      org_id: data.org_id,
      cause: data.cause,
      status: 'open',
    })
    .select('id')
    .single()

  if (error) {
    logger.error('Failed to create competitor incident', { error: error.message })
    return null
  }
  return (row as { id: string }).id
}

/** Resolve an open incident. */
export async function resolveCompetitorIncident(incidentId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await untyped(supabase)
    .from('competitor_incidents')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', incidentId)

  if (error) {
    logger.error('Failed to resolve competitor incident', { error: error.message, incidentId })
  }
}

/**
 * Calculate 30-day uptime % from recent check results.
 * Returns 0–100 or null if no data yet.
 */
export async function calculateCompetitorUptime30d(
  competitorId: string
): Promise<number | null> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - 30 * 86400000).toISOString()

  const { data, error } = await untyped(supabase)
    .from('competitor_check_results')
    .select('status')
    .eq('competitor_id', competitorId)
    .gte('checked_at', since)

  if (error || !data || data.length === 0) return null

  const rows = data as { status: string }[]
  const upCount = rows.filter(r => r.status === 'up').length
  return Math.round((upCount / rows.length) * 10000) / 100
}

/**
 * Get all competitor monitors for the cron sweep.
 * Ordered by oldest-checked-first so stale monitors are prioritised.
 */
export async function getAllCompetitorMonitors(): Promise<CompetitorMonitor[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('competitor_monitors')
    .select('*')
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(200)

  if (error) {
    logger.error('Failed to get all competitor monitors', { error: error.message })
    return []
  }
  return (data ?? []) as unknown as CompetitorMonitor[]
}

/**
 * Get all active user IDs for an org — used to send in-app notifications.
 */
export async function getOrgUserIds(orgId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('org_id', orgId)
    .eq('is_active', true)

  if (error) return []
  return (data ?? []).map((u: { id: string }) => u.id)
}

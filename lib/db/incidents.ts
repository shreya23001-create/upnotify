import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Incident } from '@/lib/types'

export async function getIncidentsByWorkspace(
  workspaceId: string,
  options?: { status?: string; limit?: number }
): Promise<Incident[]> {
  const supabase = await createClient()
  let query = supabase
    .from('incidents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('started_at', { ascending: false })

  if (options?.status) query = query.eq('status', options.status)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) {
    logger.error('Failed to get incidents', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getOpenIncidentCount(orgId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('incidents')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .neq('status', 'resolved')

  if (error) {
    logger.error('Failed to get open incident count', { error: error.message })
    return 0
  }
  return count ?? 0
}

export async function getOpenIncidents(orgId: string): Promise<Incident[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('org_id', orgId)
    .neq('status', 'resolved')
    .order('started_at', { ascending: false })

  if (error) {
    logger.error('Failed to get open incidents', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getRecentIncidents(
  orgId: string,
  limit: number = 10,
  workspaceId?: string
): Promise<Incident[]> {
  const supabase = await createClient()
  // Join with monitors to filter out incidents from deleted monitors (prevent orphaned rows)
  let query = supabase
    .from('incidents')
    .select('*, monitors!inner(id)')
    .eq('org_id', orgId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) {
    logger.error('Failed to get recent incidents', { error: error.message })
    return []
  }
  // Strip the joined monitors field before returning
  return (data ?? []).map(({ monitors: _m, ...rest }) => rest as Incident)
}

export async function updateIncidentStatus(
  incidentId: string,
  orgId: string,
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved',
  message?: string
): Promise<boolean> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { status }

  if (status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
  }

  if (message) {
    updateData.root_cause = message
  }

  const { error } = await supabase
    .from('incidents')
    .update(updateData)
    .eq('id', incidentId)
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to update incident status', { error: error.message })
    return false
  }
  return true
}

export type IncidentWithMonitor = Incident & {
  monitor_name?: string | null
}

export interface WebsiteIncidentGroup {
  /** Normalized website domain (see lib/utils/validate-domain.ts
   *  targetToWebsiteDomain) all these incidents' monitors share. Monitors
   *  created before target_domain existed group under the empty string. */
  domain: string
  incidents: IncidentWithMonitor[]
}

/**
 * Every incident for the org, grouped by which website its monitor
 * belongs to — one section per website instead of one flat undifferentiated
 * list. No pagination: loads everything so a website's incidents are never
 * split across pages. Sections are ordered by their most recent incident
 * first; incidents within a section are newest-first.
 */
export async function getAllIncidentsGroupedByWebsite(
  orgId: string, statusFilter?: 'open' | 'resolved'
): Promise<{ groups: WebsiteIncidentGroup[]; openTotal: number; resolvedTotal: number }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('incidents')
    .select('*, monitors(name, target_domain)')
    .eq('org_id', orgId)
    .order('started_at', { ascending: false })
    .order('id', { ascending: false })

  if (statusFilter === 'open') query = query.neq('status', 'resolved')
  else if (statusFilter === 'resolved') query = query.eq('status', 'resolved')

  const [{ data, error }, { count: openCount }, { count: resolvedCount }] = await Promise.all([
    query as Promise<{ data: unknown[] | null; error: { message: string } | null }>,
    supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('org_id', orgId).neq('status', 'resolved'),
    supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'resolved'),
  ])

  if (error) {
    logger.error('Failed to get incidents grouped by website', { error: error.message, orgId })
    return { groups: [], openTotal: 0, resolvedTotal: 0 }
  }

  const byDomain = new Map<string, IncidentWithMonitor[]>()
  for (const row of data ?? []) {
    const r = row as Record<string, unknown> & { monitors: { name: string; target_domain: string | null } | null }
    const { monitors, ...rest } = r
    const domain = monitors?.target_domain ?? ''
    const incident = { ...rest, monitor_name: monitors?.name ?? null } as unknown as IncidentWithMonitor
    const existing = byDomain.get(domain)
    if (existing) existing.push(incident)
    else byDomain.set(domain, [incident])
  }

  // Order groups by their most recent incident (incidents within each
  // group are already newest-first from the query's order()).
  const groups: WebsiteIncidentGroup[] = Array.from(byDomain.entries())
    .map(([domain, incidents]) => ({ domain, incidents }))
    .sort((a, b) => {
      const aLatest = a.incidents[0]?.started_at ?? ''
      const bLatest = b.incidents[0]?.started_at ?? ''
      return bLatest.localeCompare(aLatest)
    })

  return { groups, openTotal: openCount ?? 0, resolvedTotal: resolvedCount ?? 0 }
}

export async function getAllIncidentsByOrg(orgId: string, limit = 50): Promise<IncidentWithMonitor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('incidents')
    .select('*, monitors(name)')
    .eq('org_id', orgId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []).map(row => {
    const { monitors, ...rest } = row as typeof row & { monitors: { name: string } | null }
    return { ...rest, monitor_name: monitors?.name ?? null }
  })
}

// --- Admin client functions (for cron jobs and background tasks) ---

export async function createIncident(data: {
  org_id: string
  workspace_id: string
  monitor_id: string
  title: string
  severity: string
}): Promise<Incident | null> {
  const supabase = createAdminClient()

  // Guard: if an open incident already exists for this monitor, return it
  // rather than creating a duplicate. This handles monitor flapping.
  //
  // Uses .maybeSingle() — NOT .single() — because "no open incident" (zero
  // rows) is the normal, common case here, not an error condition. .single()
  // treats zero rows as a PostgREST error (PGRST116), which was previously
  // indistinguishable from a real transient DB error and got silently
  // swallowed either way. That made incident creation intermittently no-op
  // on any transient read hiccup, with nothing logged to explain why.
  const { data: existing, error: lookupError } = await supabase
    .from('incidents')
    .select('*')
    .eq('monitor_id', data.monitor_id)
    .neq('status', 'resolved')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lookupError) {
    logger.error('createIncident: failed to check for existing open incident — aborting to avoid a possible duplicate', {
      monitorId: data.monitor_id,
      error: lookupError.message,
    })
    return null
  }

  if (existing) {
    logger.info('Open incident already exists for monitor — skipping duplicate creation', {
      monitorId: data.monitor_id,
      existingIncidentId: existing.id,
    })
    return existing as Incident
  }

  const { data: incident, error } = await supabase
    .from('incidents')
    .insert({
      ...data,
      status: 'investigating',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create incident', { error: error.message, monitorId: data.monitor_id })
    return null
  }
  return incident
}

/**
 * Resolves the monitor's open incident (if any) and returns it with the
 * resolved fields applied, so callers who need to alert on the recovery
 * don't have to run their own separate lookup — a second independent query
 * for "the same" incident was the previous pattern, and if that second
 * query hit a transient error it silently skipped the recovery alert even
 * though the incident itself had already been resolved successfully.
 */
export async function resolveIncident(monitorId: string): Promise<Incident | null> {
  const supabase = createAdminClient()
  const now = new Date()

  const { data: incident, error: lookupError } = await supabase
    .from('incidents')
    .select('*')
    .eq('monitor_id', monitorId)
    .neq('status', 'resolved')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lookupError) {
    logger.error('resolveIncident: failed to look up open incident — recovery not recorded', {
      monitorId,
      error: lookupError.message,
    })
    return null
  }

  if (!incident) return null

  const startedAt = new Date(incident.started_at)
  const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
  const resolvedAt = now.toISOString()

  const { error: updateError } = await supabase
    .from('incidents')
    .update({
      status: 'resolved',
      resolved_at: resolvedAt,
      duration_seconds: durationSeconds,
    })
    .eq('id', incident.id)

  if (updateError) {
    logger.error('resolveIncident: failed to mark incident resolved', {
      monitorId,
      incidentId: incident.id,
      error: updateError.message,
    })
    return null
  }

  return { ...incident, status: 'resolved', resolved_at: resolvedAt, duration_seconds: durationSeconds } as Incident
}

export async function getOpenIncidentForMonitor(monitorId: string): Promise<Incident | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('monitor_id', monitorId)
    .neq('status', 'resolved')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('getOpenIncidentForMonitor: query failed', { monitorId, error: error.message })
    return null
  }
  return data
}

/**
 * How many incidents this monitor has opened in the last `sinceMinutes`.
 * Used for flap suppression: a monitor opening many incidents per hour is
 * flapping, and we suppress its alerts to stop digest-buffer flooding
 * (the "1000 events" email-storm). The incident is still recorded; only the
 * alert/email is skipped.
 */
export async function countRecentIncidentsForMonitor(monitorId: string, sinceMinutes: number): Promise<number> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString()
  const { count, error } = await supabase
    .from('incidents')
    .select('id', { count: 'exact', head: true })
    .eq('monitor_id', monitorId)
    .gte('started_at', since)

  if (error) return 0 // fail open — don't suppress real alerts on a count error
  return count ?? 0
}

export async function getAllIncidentsByOrgPaged(
  orgId: string, page: number, pageSize: number, statusFilter?: 'open' | 'resolved'
): Promise<{ data: IncidentWithMonitor[]; total: number; openTotal: number; resolvedTotal: number }> {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('incidents')
    .select('*, monitors(name)', { count: 'exact' })
    .eq('org_id', orgId)
    .order('started_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to)

  if (statusFilter === 'open') query = query.neq('status', 'resolved')
  else if (statusFilter === 'resolved') query = query.eq('status', 'resolved')

  const { data, error, count } = await query

  // Fetch open/resolved totals for tab counts
  const [{ count: openCount }, { count: resolvedCount }] = await Promise.all([
    supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('org_id', orgId).neq('status', 'resolved'),
    supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'resolved'),
  ])

  if (error) return { data: [], total: 0, openTotal: 0, resolvedTotal: 0 }
  const mapped = (data ?? []).map(row => {
    const { monitors, ...rest } = row as typeof row & { monitors: { name: string } | null }
    return { ...rest, monitor_name: monitors?.name ?? null }
  })
  return { data: mapped, total: count ?? 0, openTotal: openCount ?? 0, resolvedTotal: resolvedCount ?? 0 }
}

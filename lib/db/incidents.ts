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
  let query = supabase
    .from('incidents')
    .select('*')
    .eq('org_id', orgId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) {
    logger.error('Failed to get recent incidents', { error: error.message })
    return []
  }
  return data ?? []
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
    logger.error('Failed to create incident', { error: error.message })
    return null
  }
  return incident
}

export async function resolveIncident(monitorId: string): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date()

  const { data: incident } = await supabase
    .from('incidents')
    .select('*')
    .eq('monitor_id', monitorId)
    .neq('status', 'resolved')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (incident) {
    const startedAt = new Date(incident.started_at)
    const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)

    await supabase
      .from('incidents')
      .update({
        status: 'resolved',
        resolved_at: now.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', incident.id)
  }
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
    .single()

  if (error) return null
  return data
}

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// ============================================================
// Types for competitor_monitors table
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
  created_at: string
  updated_at: string
}

// ============================================================
// Read queries (scoped by org_id — double protection with RLS)
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
    logger.error('Failed to create competitor monitor', { error: error.message, domain: data.domain })
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

/** Fetch all active competitor monitors for the cron check sweep */
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

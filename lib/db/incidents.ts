import { createClient } from '@/lib/supabase/server'
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

export async function getRecentIncidents(orgId: string, limit: number = 10): Promise<Incident[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('org_id', orgId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Failed to get recent incidents', { error: error.message })
    return []
  }
  return data ?? []
}

import { createClient } from '@/lib/supabase/server'
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

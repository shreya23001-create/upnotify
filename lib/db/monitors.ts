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

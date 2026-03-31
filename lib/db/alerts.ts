import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Alert, AlertChannel } from '@/lib/types'

export async function getAlertChannelsByWorkspace(workspaceId: string): Promise<AlertChannel[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('alert_channels')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get alert channels', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getAlertChannelsByOrg(orgId: string): Promise<AlertChannel[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('alert_channels')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get alert channels by org', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getAlertsByIncident(incidentId: string): Promise<Alert[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get alerts by incident', { error: error.message })
    return []
  }
  return data ?? []
}

export async function createAlertChannel(channelData: {
  org_id: string
  workspace_id?: string
  type: string
  name: string
  config: Record<string, unknown>
  severity_filter?: string[]
}): Promise<AlertChannel | null> {
  const supabase = createAdminClient()
  const { data: channel, error } = await supabase
    .from('alert_channels')
    .insert({
      ...channelData,
      config: channelData.config as import('@/lib/types/database.types').Json,
      severity_filter: channelData.severity_filter || ['P1', 'P2', 'P3', 'P4'],
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create alert channel', { error: error.message })
    return null
  }
  return channel
}

export async function deleteAlertChannel(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('alert_channels').delete().eq('id', id)
  if (error) {
    logger.error('Failed to delete alert channel', { error: error.message })
    return false
  }
  return true
}

export async function getAlertChannelById(id: string): Promise<AlertChannel | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('alert_channels')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Failed to get alert channel', { error: error.message })
    return null
  }
  return data
}

export async function updateAlertChannel(
  id: string,
  updates: { name?: string; config?: Record<string, unknown>; severity_filter?: string[] }
): Promise<AlertChannel | null> {
  const supabase = createAdminClient()
  const updateData: Record<string, unknown> = {}
  if (updates.name) updateData.name = updates.name
  if (updates.config) updateData.config = updates.config as import('@/lib/types/database.types').Json
  if (updates.severity_filter) updateData.severity_filter = updates.severity_filter

  const { data, error } = await supabase
    .from('alert_channels')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update alert channel', { error: error.message })
    return null
  }
  return data
}

export async function toggleAlertChannel(id: string, enabled: boolean): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('alert_channels')
    .update({ is_enabled: enabled })
    .eq('id', id)
  if (error) {
    logger.error('Failed to toggle alert channel', { error: error.message })
    return false
  }
  return true
}

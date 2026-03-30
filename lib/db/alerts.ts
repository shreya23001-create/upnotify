import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { AlertChannel } from '@/lib/types'

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

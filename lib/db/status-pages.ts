import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { StatusPage } from '@/lib/types'

export async function getStatusPagesByWorkspace(workspaceId: string): Promise<StatusPage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('status_pages')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get status pages', { error: error.message })
    return []
  }
  return data ?? []
}

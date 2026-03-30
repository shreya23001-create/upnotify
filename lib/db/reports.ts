import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { Report } from '@/lib/types'

export async function getReportsByWorkspace(workspaceId: string): Promise<Report[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('generated_at', { ascending: false })

  if (error) {
    logger.error('Failed to get reports', { error: error.message })
    return []
  }
  return data ?? []
}

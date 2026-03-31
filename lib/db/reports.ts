import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function getReportById(id: string): Promise<Report | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Failed to get report', { error: error.message })
    return null
  }
  return data
}

export async function getReportsForOrg(orgId: string, limit: number = 20): Promise<Report[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('org_id', orgId)
    .order('generated_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Failed to get reports for org', { error: error.message })
    return []
  }
  return data ?? []
}

export async function deleteReport(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Failed to delete report', { error: error.message })
    return false
  }
  return true
}

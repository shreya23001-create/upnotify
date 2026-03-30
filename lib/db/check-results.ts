import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { CheckResult } from '@/lib/types'
import type { Json } from '@/lib/types/database.types'

export async function writeCheckResult(data: {
  org_id: string
  monitor_id: string
  status: string
  response_time_ms?: number
  status_code?: number
  region?: string
  error_message?: string
  metadata?: Record<string, unknown>
}): Promise<CheckResult | null> {
  const supabase = createAdminClient()
  const { data: result, error } = await supabase
    .from('check_results')
    .insert({ ...data, metadata: (data.metadata ?? {}) as Json })
    .select()
    .single()

  if (error) {
    logger.error('Failed to write check result', { error: error.message })
    return null
  }
  return result
}

export async function getCheckResultsByMonitor(monitorId: string, limit: number = 50): Promise<CheckResult[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('check_results')
    .select('*')
    .eq('monitor_id', monitorId)
    .order('checked_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Failed to get check results', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getLatestCheckResult(monitorId: string): Promise<CheckResult | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('check_results')
    .select('*')
    .eq('monitor_id', monitorId)
    .order('checked_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    logger.error('Failed to get latest check result', { error: error.message })
    return null
  }
  return data
}

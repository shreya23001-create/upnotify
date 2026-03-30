import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { MaintenanceWindow } from '@/lib/types'

export async function getActiveMaintenanceWindows(orgId: string): Promise<MaintenanceWindow[]> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('maintenance_windows')
    .select('*')
    .eq('org_id', orgId)
    .lte('starts_at', now)
    .gte('ends_at', now)

  if (error) {
    logger.error('Failed to get maintenance windows', { error: error.message })
    return []
  }
  return data ?? []
}

export async function isMonitorInMaintenance(monitorId: string, orgId: string): Promise<boolean> {
  const windows = await getActiveMaintenanceWindows(orgId)
  return windows.some(w => {
    const affectedIds = w.affected_monitor_ids as string[]
    return affectedIds.length === 0 || affectedIds.includes(monitorId)
  })
}

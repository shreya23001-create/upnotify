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

/**
 * Batch version — fetches all active maintenance windows for the given monitors
 * in a single DB query and returns a Set of monitor IDs currently in maintenance.
 * Use this in the check-runner instead of calling isMonitorInMaintenance per monitor.
 */
export async function getMaintenanceSetForMonitors(
  monitors: Array<{ id: string; org_id: string }>
): Promise<Set<string>> {
  if (monitors.length === 0) return new Set()

  const orgIds = [...new Set(monitors.map(m => m.org_id))]
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('maintenance_windows')
    .select('org_id, affected_monitor_ids')
    .in('org_id', orgIds)
    .lte('starts_at', now)
    .gte('ends_at', now)

  if (error) {
    logger.error('Failed to get maintenance windows (batch)', { error: error.message })
    return new Set()
  }

  const inMaintenance = new Set<string>()
  for (const w of data ?? []) {
    const affectedIds = w.affected_monitor_ids as string[]
    if (affectedIds.length === 0) {
      // Entire org is in maintenance — mark all its monitors
      monitors.filter(m => m.org_id === w.org_id).forEach(m => inMaintenance.add(m.id))
    } else {
      affectedIds.forEach(id => inMaintenance.add(id))
    }
  }
  return inMaintenance
}

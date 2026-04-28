import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'
import { getWpMonitorByMonitorId } from '@/lib/db/wp-monitors'

// WordPress monitors are agent-based push — the plugin pushes data on a schedule.
// We detect staleness: if no push within 3× the configured interval, mark degraded.
export async function check(monitor: Monitor): Promise<CheckerResult> {
  const wpMonitor = await getWpMonitorByMonitorId(monitor.id)

  if (!wpMonitor || !wpMonitor.token_verified || !wpMonitor.last_push_at) {
    return { status: 'up' }
  }

  const minutesSince = (Date.now() - new Date(wpMonitor.last_push_at).getTime()) / 60000
  const staleThreshold = wpMonitor.check_interval_minutes * 3

  if (minutesSince > staleThreshold) {
    return {
      status: 'degraded',
      errorMessage: `Plugin has not pushed in ${Math.floor(minutesSince)} min (expected every ${wpMonitor.check_interval_minutes}m)`,
    }
  }

  return { status: 'up' }
}

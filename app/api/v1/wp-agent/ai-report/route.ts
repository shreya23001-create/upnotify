import { getCurrentUser } from '@/lib/db/users'
import { getMonitorById } from '@/lib/db/monitors'
import {
  getWpMonitorByMonitorId,
  getWpFindings,
  getLatestWpSnapshot,
  saveWpAiReport,
} from '@/lib/db/wp-monitors'
import { generateWpAiReport } from '@/lib/services/wp-ai-report'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(request: Request): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const monitorId = searchParams.get('monitor_id')
  if (!monitorId) return Response.json({ error: 'monitor_id required' }, { status: 400 })

  const monitor = await getMonitorById(monitorId)
  if (!monitor || monitor.org_id !== user.org_id) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const wpMonitor = await getWpMonitorByMonitorId(monitorId)
  if (!wpMonitor) return Response.json({ error: 'Not found' }, { status: 404 })

  // Rate limit: once per 7 days
  const settings = (wpMonitor.settings ?? {}) as Record<string, unknown>
  const lastReportAt = settings.last_ai_report_at as string | undefined
  if (lastReportAt) {
    const msAgo = Date.now() - new Date(lastReportAt).getTime()
    if (msAgo < SEVEN_DAYS_MS) {
      const nextAvailable = new Date(new Date(lastReportAt).getTime() + SEVEN_DAYS_MS)
      return Response.json({
        error: 'rate_limited',
        message: `AI report can only be generated once per week. Next available: ${nextAvailable.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        next_available_at: nextAvailable.toISOString(),
      }, { status: 429 })
    }
  }

  const [findings, snapshot] = await Promise.all([
    getWpFindings(wpMonitor.id, 'open'),
    getLatestWpSnapshot(wpMonitor.id),
  ])

  const report = await generateWpAiReport({ monitor, snapshot, findings })
  await saveWpAiReport(wpMonitor.id, report)

  return Response.json({ report, generated_at: new Date().toISOString() })
}

import { getCurrentUser } from '@/lib/db/users'
import { getMonitorById } from '@/lib/db/monitors'
import { getWpMonitorByMonitorId, getWpFindings, getLatestWpSnapshot } from '@/lib/db/wp-monitors'
import { generateWpAiReport } from '@/lib/services/wp-ai-report'

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

  const [findings, snapshot] = await Promise.all([
    getWpFindings(wpMonitor.id, 'open'),
    getLatestWpSnapshot(wpMonitor.id),
  ])

  const report = await generateWpAiReport({ monitor, snapshot, findings })
  return Response.json({ report })
}

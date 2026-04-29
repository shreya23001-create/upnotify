import { getWpMonitorByMonitorId } from '@/lib/db/wp-monitors'

// Called by the setup wizard step 3 to poll for first push received
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const monitorId = searchParams.get('monitor_id')

  if (!monitorId) {
    return Response.json({ error: 'monitor_id required' }, { status: 400 })
  }

  const wpMonitor = await getWpMonitorByMonitorId(monitorId)
  if (!wpMonitor) {
    return Response.json({ verified: false, reason: 'monitor_not_found' })
  }

  return Response.json({
    verified: wpMonitor.token_verified,
    last_push_at: wpMonitor.last_push_at,
  })
}

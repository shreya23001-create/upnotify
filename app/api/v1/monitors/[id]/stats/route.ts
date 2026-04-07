import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorById } from '@/lib/db/monitors'
import { getMonitorUptimePercentage } from '@/lib/db/check-results'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { id } = await params
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') ?? '30', 10)
    const safeDays = [7, 30, 90].includes(days) ? days : 30

    const monitor = await getMonitorById(id)
    if (!monitor || monitor.org_id !== user.org_id) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 })
    }

    // Average response time over the period
    const supabase = await createClient()
    const since = new Date(Date.now() - safeDays * 86400000).toISOString()
    const { data: checkData } = await supabase
      .from('check_results')
      .select('response_time_ms, status')
      .eq('monitor_id', id)
      .gte('checked_at', since)
      .eq('status', 'up')

    const responseTimes = (checkData ?? [])
      .map(r => r.response_time_ms)
      .filter((v): v is number => v !== null && v !== undefined)

    const avgResponseMs = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null

    const uptimePct = await getMonitorUptimePercentage(id, safeDays)

    return NextResponse.json({
      success: true,
      monitor: {
        id: monitor.id,
        name: monitor.name,
        target: monitor.target,
        status: monitor.status,
      },
      stats: {
        uptimePct,
        avgResponseMs,
        days: safeDays,
      },
    })
  } catch (err) {
    logger.error('GET /api/v1/monitors/[id]/stats failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

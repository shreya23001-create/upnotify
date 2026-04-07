import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import {
  getCompetitorById,
  getCompetitorCheckResults,
  getCompetitorDailyStats,
} from '@/lib/db/competitor-monitors'
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
    const period = parseInt(url.searchParams.get('period') ?? '30', 10)
    const safePeriod = [7, 30, 90].includes(period) ? period : 30

    const [competitor, checkResults, dailyStats] = await Promise.all([
      getCompetitorById(id, user.org_id),
      getCompetitorCheckResults(id, user.org_id, safePeriod),
      getCompetitorDailyStats(id, user.org_id, 90),
    ])

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
    }

    // Compute stat cards from check results for the selected period
    const upCount = checkResults.filter(r => r.status === 'up').length
    const downCount = checkResults.filter(r => r.status === 'down').length
    const degradedCount = checkResults.filter(r => r.status === 'degraded').length
    const total = checkResults.length

    const uptimePct = total > 0 ? Math.round(((upCount) / total) * 10000) / 100 : null

    const responseTimes = checkResults
      .filter(r => r.response_time_ms !== null && r.status === 'up')
      .map(r => r.response_time_ms as number)
    const avgResponseMs = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null

    // Total downtime: count hours where at least one check was down
    const downHours = dailyStats.reduce((acc, day) => {
      // Rough estimate: (down checks / total checks) * 24 hours
      if (day.total === 0) return acc
      return acc + (day.down / day.total) * 24
    }, 0)

    const stats = {
      uptimePct,
      avgResponseMs,
      totalChecks: total,
      upCount,
      downCount,
      degradedCount,
      downHoursApprox: Math.round(downHours * 10) / 10,
    }

    // Status log: last 50 check results (already ordered desc from DB)
    const statusLog = checkResults.slice(0, 50)

    // Response time series: all results with a timestamp + response time
    const responseSeries = checkResults
      .filter(r => r.response_time_ms !== null)
      .map(r => ({ t: r.checked_at, ms: r.response_time_ms as number, status: r.status }))
      .reverse() // ascending for chart

    return NextResponse.json({
      success: true,
      competitor,
      stats,
      dailyStats,
      statusLog,
      responseSeries,
      period: safePeriod,
    })
  } catch (err) {
    logger.error('GET /api/v1/competitors/[id] failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

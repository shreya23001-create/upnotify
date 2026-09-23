import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorsGroupedByWebsite } from '@/lib/db/monitors'
import { getWebsiteReportMetrics, type ReportPeriod } from '@/lib/services/report-metrics'

const VALID_PERIODS: ReportPeriod[] = ['daily', 'weekly', 'monthly', 'yearly']

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const url = new URL(request.url)
  const domain = url.searchParams.get('domain') ?? ''
  const period = (url.searchParams.get('period') ?? 'daily') as ReportPeriod

  if (!domain) {
    return NextResponse.json({ error: 'Missing domain' }, { status: 400 })
  }
  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
  }

  // getMonitorsGroupedByWebsite is already org-scoped — no separate
  // ownership check needed since we only ever look up domains that come
  // back from this same org-scoped query.
  const groups = await getMonitorsGroupedByWebsite(user.org_id)
  const group = groups.find(g => g.domain === domain)
  if (!group || group.monitors.length === 0) {
    return NextResponse.json({ error: 'Website not found' }, { status: 404 })
  }

  const monitors = group.monitors.filter(m => m.type !== 'wordpress')
  if (monitors.length === 0) {
    return NextResponse.json({ error: 'No reportable monitors for this website' }, { status: 404 })
  }

  const metrics = await getWebsiteReportMetrics(domain, monitors, period)
  return NextResponse.json({ success: true, metrics })
}

import { getUptimePercentageForRange, getCheckCountsForRange, getCheckResultsForMonitorInRange, type ReportCheckResult } from '@/lib/db/check-results'
import { getIncidentsForMonitorInRange } from '@/lib/db/incidents'
import type { Monitor, Incident } from '@/lib/types'
import { HEALTH_STATUS_LABEL, type ReportPeriod, type ReportHealthStatus } from './report-metrics-shared'

export type { ReportPeriod, ReportHealthStatus }
export { HEALTH_STATUS_LABEL }

export interface ReportRange {
  period: ReportPeriod
  start: Date
  until: Date // exclusive
  label: string // e.g. "September 1 – September 30, 2026"
}

const DAY_MS = 24 * 60 * 60 * 1000

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/** Fixed, deterministic date ranges — no "last month" vagueness, always
 *  real calendar boundaries ending at the start of today. */
export function getReportRange(period: ReportPeriod, now: Date = new Date()): ReportRange {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === 'daily') {
    // Most recently completed calendar day (yesterday) — "today" is still
    // in progress and would show an artificially low check count.
    const start = new Date(todayStart.getTime() - DAY_MS)
    return { period, start, until: todayStart, label: fmtDate(start) }
  }

  if (period === 'weekly') {
    const start = new Date(todayStart.getTime() - 7 * DAY_MS)
    const untilInclusive = new Date(todayStart.getTime() - DAY_MS)
    return { period, start, until: todayStart, label: `${fmtDate(start)} – ${fmtDate(untilInclusive)}` }
  }

  if (period === 'monthly') {
    // Most recently completed calendar month.
    const monthEndExclusive = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthStart = new Date(monthEndExclusive.getFullYear(), monthEndExclusive.getMonth() - 1, 1)
    const untilInclusive = new Date(monthEndExclusive.getTime() - DAY_MS)
    return { period, start: monthStart, until: monthEndExclusive, label: `${fmtDate(monthStart)} – ${fmtDate(untilInclusive)}` }
  }

  // yearly — trailing 12 full calendar months, most recently completed.
  const yearEndExclusive = new Date(now.getFullYear(), now.getMonth(), 1)
  const yearStart = new Date(yearEndExclusive.getFullYear() - 1, yearEndExclusive.getMonth(), 1)
  const untilInclusive = new Date(yearEndExclusive.getTime() - DAY_MS)
  return { period: 'yearly', start: yearStart, until: yearEndExclusive, label: `${fmtDate(yearStart)} – ${fmtDate(untilInclusive)}` }
}

/** Business rule reused from lib/utils/monitor-aggregation.ts's worstStatus
 *  philosophy: current live status takes precedence (an ongoing incident
 *  always shows "Incident"), then the period's own history. Not an
 *  arbitrary new score — derived from the same up/down/degraded vocabulary
 *  and the same 99.9%/99% thresholds already used everywhere else in the
 *  app (monitor detail page, uptime bars, status pages). */
export function computeHealthStatus(params: { currentStatus: string; isPaused: boolean; uptimePct: number | null; incidentCount: number }): ReportHealthStatus {
  const { currentStatus, isPaused, uptimePct, incidentCount } = params
  if (!isPaused && currentStatus === 'down') return 'incident'
  if (incidentCount > 0 && uptimePct !== null && uptimePct < 99) return 'incident'
  if (!isPaused && currentStatus === 'degraded') return 'attention'
  if (incidentCount > 0) return 'attention'
  if (uptimePct !== null && uptimePct < 99.9) return 'attention'
  return 'operational'
}


export interface TrendPoint { label: string; value: number }

export interface ReportIncidentSummary {
  count: number
  totalDowntimeSeconds: number
  items: Array<{ id: string; startedAt: string; resolvedAt: string | null; durationSeconds: number | null; title: string }>
}

async function buildIncidentSummary(monitorId: string, range: ReportRange): Promise<ReportIncidentSummary> {
  const incidents = await getIncidentsForMonitorInRange(monitorId, range.start, range.until)
  const totalDowntimeSeconds = incidents.reduce((sum: number, inc: Incident) => sum + (inc.duration_seconds ?? 0), 0)
  return {
    count: incidents.length,
    totalDowntimeSeconds,
    items: incidents.slice(0, 5).map(inc => ({
      id: inc.id,
      startedAt: inc.started_at,
      resolvedAt: inc.resolved_at,
      durationSeconds: inc.duration_seconds,
      title: inc.title,
    })),
  }
}

/** Buckets a range into a small number of trend points — hourly for daily,
 *  daily for weekly/monthly (capped), monthly for yearly — so the chart
 *  never grows wider than the single-page layout allows. */
function bucketBoundaries(range: ReportRange): { label: string; start: Date; end: Date }[] {
  const buckets: { label: string; start: Date; end: Date }[] = []
  if (range.period === 'daily') {
    let cursor = new Date(range.start)
    while (cursor < range.until) {
      const end = new Date(cursor.getTime() + 60 * 60 * 1000)
      buckets.push({ label: cursor.toLocaleTimeString('en-US', { hour: 'numeric' }), start: cursor, end: end < range.until ? end : range.until })
      cursor = end
    }
    return buckets
  }
  if (range.period === 'yearly') {
    let cursor = new Date(range.start)
    while (cursor < range.until) {
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      buckets.push({ label: cursor.toLocaleDateString('en-US', { month: 'short' }), start: cursor, end: end < range.until ? end : range.until })
      cursor = end
    }
    return buckets
  }
  // weekly (7 buckets) / monthly (up to 31 buckets) — one bucket per day.
  let cursor = new Date(range.start)
  while (cursor < range.until) {
    const end = new Date(cursor.getTime() + DAY_MS)
    buckets.push({ label: cursor.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), start: cursor, end: end < range.until ? end : range.until })
    cursor = end
  }
  return buckets
}

function buildResponseTimeTrend(range: ReportRange, rows: ReportCheckResult[]): TrendPoint[] {
  const buckets = bucketBoundaries(range)
  return buckets.map(b => {
    const inBucket = rows.filter(r => {
      const t = new Date(r.checked_at).getTime()
      return t >= b.start.getTime() && t < b.end.getTime() && typeof r.response_time_ms === 'number'
    })
    const avg = inBucket.length > 0
      ? Math.round(inBucket.reduce((s, r) => s + (r.response_time_ms ?? 0), 0) / inBucket.length)
      : 0
    return { label: b.label, value: avg }
  }).filter(p => p.value > 0)
}

function buildUptimeTrend(range: ReportRange, rows: ReportCheckResult[]): TrendPoint[] {
  const buckets = bucketBoundaries(range)
  return buckets.map(b => {
    const inBucket = rows.filter(r => {
      const t = new Date(r.checked_at).getTime()
      return t >= b.start.getTime() && t < b.end.getTime()
    })
    if (inBucket.length === 0) return { label: b.label, value: 0 }
    const up = inBucket.filter(r => r.status === 'up').length
    return { label: b.label, value: Math.round((up / inBucket.length) * 1000) / 10 }
  }).filter(p => p.value > 0 || true)
}

interface BaseMetrics {
  monitorType: string
  range: ReportRange
  health: ReportHealthStatus
  uptimePct: number | null
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  degradedChecks: number
  incidents: ReportIncidentSummary
  hasEnoughData: boolean
  daysWithData: number
}

export interface HttpReportMetrics extends BaseMetrics {
  kind: 'availability'
  avgResponseMs: number | null
  fastestMs: number | null
  slowestMs: number | null
  trend: TrendPoint[]
  trendUnit: 'ms'
}

export interface SslReportMetrics extends BaseMetrics {
  kind: 'ssl'
  daysUntilExpiry: number | null
  validTo: string | null
  issuer: string | null
  chainValid: boolean | null
  expiryWarning: boolean
}

export interface DnsReportMetrics extends BaseMetrics {
  kind: 'dns'
  changeCount: number
  trend: TrendPoint[]
  trendUnit: 'ms'
  avgResolutionMs: number | null
}

export interface KeywordReportMetrics extends BaseMetrics {
  kind: 'keyword'
  lastMissingKeywords: string[]
  lastFoundNegativeKeywords: string[]
  detectionIncidents: number
}

export interface GenericReportMetrics extends BaseMetrics {
  kind: 'generic'
  avgResponseMs: number | null
  fastestMs: number | null
  slowestMs: number | null
  trend: TrendPoint[]
  trendUnit: 'ms'
}

export type ReportMetrics = HttpReportMetrics | SslReportMetrics | DnsReportMetrics | KeywordReportMetrics | GenericReportMetrics

const AVAILABILITY_TIMING_TYPES = new Set(['http', 'ping', 'api', 'port', 'response-time'])

export async function getReportMetrics(monitor: Monitor, period: ReportPeriod): Promise<ReportMetrics> {
  const range = getReportRange(period)
  const [uptimePct, counts, incidents, rows] = await Promise.all([
    getUptimePercentageForRange(monitor.id, range.start, range.until),
    getCheckCountsForRange(monitor.id, range.start, range.until),
    buildIncidentSummary(monitor.id, range),
    getCheckResultsForMonitorInRange(monitor.id, range.start, range.until),
  ])

  const totalChecks = counts?.total ?? 0
  const successfulChecks = counts?.up ?? 0
  const failedChecks = counts?.down ?? 0
  const degradedChecks = counts?.degraded ?? 0

  const daysWithData = new Set(rows.map(r => new Date(r.checked_at).toDateString())).size
  const expectedDays = Math.max(1, Math.round((range.until.getTime() - range.start.getTime()) / DAY_MS))
  const hasEnoughData = totalChecks > 0 && daysWithData >= Math.min(2, expectedDays)

  const health = computeHealthStatus({
    currentStatus: monitor.status,
    isPaused: monitor.is_paused,
    uptimePct,
    incidentCount: incidents.count,
  })

  const base: BaseMetrics = {
    monitorType: monitor.type,
    range,
    health,
    uptimePct,
    totalChecks,
    successfulChecks,
    failedChecks,
    degradedChecks,
    incidents,
    hasEnoughData,
    daysWithData,
  }

  if (monitor.type === 'ssl') {
    const latest = [...rows].reverse().find(r => r.metadata && typeof (r.metadata as Record<string, unknown>).daysUntilExpiry === 'number')
    const meta = (latest?.metadata ?? {}) as Record<string, unknown>
    const daysUntilExpiry = typeof meta.daysUntilExpiry === 'number' ? meta.daysUntilExpiry : null
    return {
      ...base,
      kind: 'ssl',
      daysUntilExpiry,
      validTo: typeof meta.validTo === 'string' ? meta.validTo : null,
      issuer: typeof meta.issuer === 'string' ? meta.issuer : null,
      chainValid: typeof meta.chainValid === 'boolean' ? meta.chainValid : null,
      expiryWarning: daysUntilExpiry !== null && daysUntilExpiry < 30,
    }
  }

  if (monitor.type === 'dns') {
    const changeCount = rows.filter(r => (r.metadata as Record<string, unknown> | null)?.changed === true).length
    const trend = buildResponseTimeTrend(range, rows)
    const timed = rows.filter((r): r is ReportCheckResult & { response_time_ms: number } => typeof r.response_time_ms === 'number')
    const avgResolutionMs = timed.length > 0 ? Math.round(timed.reduce((s, r) => s + r.response_time_ms, 0) / timed.length) : null
    return { ...base, kind: 'dns', changeCount, trend, trendUnit: 'ms', avgResolutionMs }
  }

  if (monitor.type === 'keyword') {
    const latest = [...rows].reverse().find(r => r.metadata && Array.isArray((r.metadata as Record<string, unknown>).missingPositive))
    const meta = (latest?.metadata ?? {}) as { missingPositive?: string[]; negativeResults?: { keyword: string; found: boolean }[] }
    const lastMissingKeywords = meta.missingPositive ?? []
    const lastFoundNegativeKeywords = (meta.negativeResults ?? []).filter(r => r.found).map(r => r.keyword)
    return {
      ...base,
      kind: 'keyword',
      lastMissingKeywords,
      lastFoundNegativeKeywords,
      detectionIncidents: incidents.count,
    }
  }

  if (AVAILABILITY_TIMING_TYPES.has(monitor.type)) {
    const timed = rows.filter((r): r is ReportCheckResult & { response_time_ms: number } => typeof r.response_time_ms === 'number')
    const avgResponseMs = timed.length > 0 ? Math.round(timed.reduce((s, r) => s + r.response_time_ms, 0) / timed.length) : null
    const fastestMs = timed.length > 0 ? Math.min(...timed.map(r => r.response_time_ms)) : null
    const slowestMs = timed.length > 0 ? Math.max(...timed.map(r => r.response_time_ms)) : null
    const trend = buildResponseTimeTrend(range, rows)
    return { ...base, kind: 'availability', avgResponseMs, fastestMs, slowestMs, trend, trendUnit: 'ms' }
  }

  // Every other type: a generic availability-style report using whatever
  // timing data exists, plus an uptime trend so the report is never empty.
  const timed = rows.filter((r): r is ReportCheckResult & { response_time_ms: number } => typeof r.response_time_ms === 'number')
  const avgResponseMs = timed.length > 0 ? Math.round(timed.reduce((s, r) => s + r.response_time_ms, 0) / timed.length) : null
  const fastestMs = timed.length > 0 ? Math.min(...timed.map(r => r.response_time_ms)) : null
  const slowestMs = timed.length > 0 ? Math.max(...timed.map(r => r.response_time_ms)) : null
  const trend = timed.length > 0 ? buildResponseTimeTrend(range, rows) : buildUptimeTrend(range, rows)
  return { ...base, kind: 'generic', avgResponseMs, fastestMs, slowestMs, trend, trendUnit: 'ms' }
}

// ── Website-level combined report (all monitors already configured for a
//    domain on the Monitors page — no per-monitor selection here). ──

export interface WebsiteMonitorBreakdown {
  monitorId: string
  monitorType: string
  monitorName: string
  uptimePct: number | null
  totalChecks: number
  failedChecks: number
  incidentCount: number
  health: ReportHealthStatus
}

export interface WebsiteReportMetrics {
  domain: string
  /** The period the user actually asked for (weekly/monthly/yearly) — always
   *  shown as the report's period label, even when the data itself only
   *  covers a shorter window (see availableRange/isPartial below). */
  range: ReportRange
  /** The window the numbers below were actually computed from. Equal to
   *  `range` unless retained history doesn't reach back far enough to cover
   *  the full requested period, in which case this is clamped to the real
   *  available data and `isPartial` is true. */
  availableRange: ReportRange
  isPartial: boolean
  health: ReportHealthStatus
  uptimePct: number | null
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  avgResponseMs: number | null
  incidents: ReportIncidentSummary
  trend: TrendPoint[]
  monitors: WebsiteMonitorBreakdown[]
  hasEnoughData: boolean
}

async function buildIncidentSummaryForMonitors(monitorIds: string[], range: ReportRange): Promise<ReportIncidentSummary> {
  const perMonitor = await Promise.all(monitorIds.map(id => getIncidentsForMonitorInRange(id, range.start, range.until)))
  const all = perMonitor.flat().sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
  const totalDowntimeSeconds = all.reduce((sum, inc) => sum + (inc.duration_seconds ?? 0), 0)
  return {
    count: all.length,
    totalDowntimeSeconds,
    // The report is no longer clamped to a single page, so every incident
    // in the period is included rather than capped to the first 5.
    items: all.map(inc => ({
      id: inc.id,
      startedAt: inc.started_at,
      resolvedAt: inc.resolved_at,
      durationSeconds: inc.duration_seconds,
      title: inc.title,
    })),
  }
}

/** Combined health report for every monitor already configured for a
 *  website — overall uptime/checks/incidents rolled up, plus a compact
 *  per-monitor-type breakdown so the report stays informative rather than
 *  a single blurred number. No monitor selection UI feeds this; it always
 *  covers the full current monitor set for the domain. */
export async function getWebsiteReportMetrics(domain: string, monitors: Monitor[], period: ReportPeriod): Promise<WebsiteReportMetrics> {
  const requestedRange = getReportRange(period)
  const monitorIds = monitors.map(m => m.id)

  // Retained check_results history can be shorter than the requested
  // period (e.g. a 7-day retention window on a Monthly/Yearly request).
  // Probe for the earliest real data point inside the requested range and,
  // if history doesn't reach back to the requested start, compute the
  // report from the real available window instead of returning a wall of
  // "insufficient data" — the UI surfaces this as a partial-period notice
  // with the originally-requested dates still shown.
  const probeRows = await Promise.all(
    monitorIds.map(id => getCheckResultsForMonitorInRange(id, requestedRange.start, requestedRange.until, 1))
  )
  const earliestAvailable = probeRows.flat().reduce<Date | null>((earliest, r) => {
    const t = new Date(r.checked_at)
    return !earliest || t < earliest ? t : earliest
  }, null)

  // Clamp to the start of the earliest available day, and compare at day
  // granularity — the earliest check within a day is almost never exactly
  // midnight, so comparing raw timestamps would flag every report as
  // "partial" even when the available range covers the same calendar days
  // as requested (the banner would then show two identical-looking dates).
  const earliestDayStart = earliestAvailable
    ? new Date(earliestAvailable.getFullYear(), earliestAvailable.getMonth(), earliestAvailable.getDate())
    : null
  const effectiveStart = earliestDayStart && earliestDayStart > requestedRange.start ? earliestDayStart : requestedRange.start
  const isPartial = effectiveStart.getTime() !== requestedRange.start.getTime()
  const availableRange: ReportRange = isPartial
    ? { period, start: effectiveStart, until: requestedRange.until, label: `${fmtDate(effectiveStart)} – ${fmtDate(new Date(requestedRange.until.getTime() - DAY_MS))}` }
    : requestedRange

  const [perMonitorCounts, perMonitorUptime, perMonitorRows, incidents] = await Promise.all([
    Promise.all(monitorIds.map(id => getCheckCountsForRange(id, availableRange.start, availableRange.until))),
    Promise.all(monitorIds.map(id => getUptimePercentageForRange(id, availableRange.start, availableRange.until))),
    Promise.all(monitorIds.map(id => getCheckResultsForMonitorInRange(id, availableRange.start, availableRange.until))),
    buildIncidentSummaryForMonitors(monitorIds, availableRange),
  ])

  const perMonitorIncidentCounts = await Promise.all(
    monitorIds.map(id => getIncidentsForMonitorInRange(id, availableRange.start, availableRange.until).then(rows => rows.length))
  )

  let totalChecks = 0, successfulChecks = 0, failedChecks = 0
  const allRows: ReportCheckResult[] = []
  const breakdown: WebsiteMonitorBreakdown[] = monitors.map((m, i) => {
    const counts = perMonitorCounts[i]
    totalChecks += counts?.total ?? 0
    successfulChecks += counts?.up ?? 0
    failedChecks += counts?.down ?? 0
    allRows.push(...perMonitorRows[i])
    const uptimePct = perMonitorUptime[i]
    const incidentCount = perMonitorIncidentCounts[i]
    return {
      monitorId: m.id,
      monitorType: m.type,
      monitorName: m.name,
      uptimePct,
      totalChecks: counts?.total ?? 0,
      failedChecks: counts?.down ?? 0,
      incidentCount,
      health: computeHealthStatus({ currentStatus: m.status, isPaused: m.is_paused, uptimePct, incidentCount }),
    }
  })

  const overallUptimePct = totalChecks > 0 ? Math.round((successfulChecks / totalChecks) * 10000) / 100 : null
  const worstMonitorHealth = breakdown.some(b => b.health === 'incident')
    ? 'incident'
    : breakdown.some(b => b.health === 'attention')
      ? 'attention'
      : breakdown.length > 0
        ? 'operational'
        : 'operational'

  const daysWithData = new Set(allRows.map(r => new Date(r.checked_at).toDateString())).size
  const expectedDays = Math.max(1, Math.round((availableRange.until.getTime() - availableRange.start.getTime()) / DAY_MS))
  const hasEnoughData = totalChecks > 0 && daysWithData >= Math.min(2, expectedDays)

  const timedRows = allRows.filter((r): r is ReportCheckResult & { response_time_ms: number } => typeof r.response_time_ms === 'number')
  const avgResponseMs = timedRows.length > 0 ? Math.round(timedRows.reduce((s, r) => s + r.response_time_ms, 0) / timedRows.length) : null

  const trend = buildUptimeTrend(availableRange, allRows)

  return {
    domain,
    range: requestedRange,
    availableRange,
    isPartial,
    health: worstMonitorHealth,
    uptimePct: overallUptimePct,
    totalChecks,
    successfulChecks,
    failedChecks,
    avgResponseMs,
    incidents,
    trend,
    monitors: breakdown,
    hasEnoughData,
  }
}

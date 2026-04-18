import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { generateReportSummary } from './ai'
import type { Report, Monitor } from '@/lib/types'
import type { Json } from '@/lib/types/database.types'

export type ReportType =
  | 'uptime' | 'performance' | 'incident' | 'sla'
  | 'site-health' | 'security-audit' | 'availability-summary' | 'change-digest' | 'response-trend'

interface MonitorMetrics {
  monitorId: string
  name: string
  type: string
  target: string
  uptimePercent: number
  avgResponseMs: number
  minResponseMs: number
  maxResponseMs: number
  totalChecks: number
  incidentCount: number
  status: string
}

interface LatestCheckResult {
  monitorId: string
  status: string
  metadata: Record<string, unknown>
  checkedAt: string
  errorMessage: string | null
}

interface ChangeEvent {
  monitorId: string
  monitorName: string
  type: string
  target: string
  detectedAt: string
  errorMessage: string | null
}

interface DailyTrend {
  date: string
  avgMs: number
  minMs: number
  maxMs: number
  checks: number
}

interface MonitorTrend {
  monitorId: string
  name: string
  type: string
  target: string
  daily: DailyTrend[]
  overallAvg: number
}

interface MonitorHealthEntry {
  type: string
  name: string
  status: string
  detail?: string
}

interface DomainGroup {
  domain: string
  healthScore: number
  overallStatus: string
  monitors: MonitorHealthEntry[]
}

interface SecurityMonitorResult {
  monitorId: string
  name: string
  type: string
  target: string
  status: string
  detail?: string
}

interface ReportData {
  reportType: ReportType
  overallUptime: number
  totalMonitors: number
  totalIncidents: number
  totalChecks: number
  meanResolutionMinutes: number
  monitors: MonitorMetrics[]
  previousMonthUptime: number | null
  // Site health + availability summary + security audit
  domainGroups?: DomainGroup[]
  // Security audit
  securityScore?: number
  securityMonitors?: SecurityMonitorResult[]
  // Change digest
  changes?: ChangeEvent[]
  // Response trend
  monitorTrends?: MonitorTrend[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function apexDomain(target: string): string {
  const host = target.replace(/^https?:\/\//, '').split('/')[0].toLowerCase()
  const parts = host.split('.')
  if (parts.length <= 2) return host
  return parts[parts.length - 2].length <= 3
    ? parts.slice(-3).join('.')
    : parts.slice(-2).join('.')
}

type SupabaseAdmin = ReturnType<typeof createAdminClient>

async function getLatestCheckResults(monitorIds: string[], supabase: SupabaseAdmin): Promise<LatestCheckResult[]> {
  if (monitorIds.length === 0) return []
  const { data } = await supabase
    .from('check_results')
    .select('monitor_id, status, metadata, checked_at, error_message')
    .in('monitor_id', monitorIds)
    .order('checked_at', { ascending: false })
    .limit(monitorIds.length * 3)

  const seen = new Set<string>()
  const latest: LatestCheckResult[] = []
  for (const r of (data ?? [])) {
    if (!seen.has(r.monitor_id)) {
      seen.add(r.monitor_id)
      latest.push({
        monitorId: r.monitor_id,
        status: r.status,
        metadata: (r.metadata as Record<string, unknown>) ?? {},
        checkedAt: r.checked_at,
        errorMessage: r.error_message,
      })
    }
  }
  return latest
}

const CHANGE_DETECTION_TYPES = new Set([
  'dns', 'robots-txt', 'whois-change', 'nameserver-change',
  'ip-change', 'redirect-chain', 'sitemap', 'competitor', 'cookie-consent', 'page-size',
])

const SECURITY_TYPES = new Set([
  'ssl', 'security-headers', 'blacklist', 'spf-dmarc', 'ip-change', 'whois-change', 'nameserver-change',
])

async function getChangeEvents(
  monitors: Monitor[], supabase: SupabaseAdmin, periodStart: string, periodEnd: string
): Promise<ChangeEvent[]> {
  const changeMonitors = monitors.filter(m => CHANGE_DETECTION_TYPES.has(m.type))
  if (changeMonitors.length === 0) return []

  const { data } = await supabase
    .from('check_results')
    .select('monitor_id, checked_at, error_message')
    .in('monitor_id', changeMonitors.map(m => m.id))
    .eq('status', 'degraded')
    .gte('checked_at', periodStart)
    .lte('checked_at', periodEnd)
    .order('checked_at', { ascending: false })
    .limit(200)

  const monitorMap = new Map(monitors.map(m => [m.id, m]))
  return (data ?? []).map(r => {
    const m = monitorMap.get(r.monitor_id)!
    return {
      monitorId: r.monitor_id,
      monitorName: m.name,
      type: m.type,
      target: m.target,
      detectedAt: r.checked_at,
      errorMessage: r.error_message,
    }
  })
}

async function getMonitorDailyTrends(
  monitors: Monitor[], supabase: SupabaseAdmin, periodStart: string, periodEnd: string
): Promise<MonitorTrend[]> {
  const responseMonitors = monitors.filter(m =>
    ['http', 'api', 'response-time', 'keyword', 'ping', 'port'].includes(m.type)
  )

  return await Promise.all(responseMonitors.map(async monitor => {
    const { data } = await supabase
      .from('check_results')
      .select('checked_at, response_time_ms')
      .eq('monitor_id', monitor.id)
      .gte('checked_at', periodStart)
      .lte('checked_at', periodEnd)
      .not('response_time_ms', 'is', null)
      .order('checked_at', { ascending: true })

    const byDay = new Map<string, number[]>()
    for (const c of (data ?? [])) {
      const day = c.checked_at.split('T')[0]
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day)!.push(c.response_time_ms as number)
    }

    const daily: DailyTrend[] = Array.from(byDay.entries()).map(([date, times]) => ({
      date,
      avgMs: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      minMs: Math.min(...times),
      maxMs: Math.max(...times),
      checks: times.length,
    }))

    const allTimes = (data ?? []).map(c => c.response_time_ms as number)
    const overallAvg = allTimes.length > 0
      ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length)
      : 0

    return { monitorId: monitor.id, name: monitor.name, type: monitor.type, target: monitor.target, daily, overallAvg }
  }))
}

function buildDomainGroups(monitors: Monitor[], latestResults: LatestCheckResult[]): DomainGroup[] {
  const resultMap = new Map(latestResults.map(r => [r.monitorId, r]))
  const domainMap = new Map<string, DomainGroup>()

  for (const m of monitors) {
    const domain = apexDomain(m.target)
    if (!domainMap.has(domain)) {
      domainMap.set(domain, { domain, healthScore: 0, overallStatus: 'unknown', monitors: [] })
    }
    const result = resultMap.get(m.id)
    const status = result?.status ?? m.status

    let detail: string | undefined
    if (result?.metadata) {
      const meta = result.metadata
      if (m.type === 'ssl' && meta.daysUntilExpiry != null) {
        detail = `Expires in ${meta.daysUntilExpiry} days`
      } else if (m.type === 'domain' && meta.daysUntilExpiry != null) {
        detail = `Domain expires in ${meta.daysUntilExpiry} days`
      } else if (m.type === 'security-headers' && meta.grade) {
        detail = `Grade: ${meta.grade}`
      } else if (m.type === 'blacklist') {
        const listed = meta.listed as string[] | undefined
        detail = listed && listed.length > 0 ? `Listed on ${listed.length} DNSBL(s)` : 'Clean'
      } else if (m.type === 'ip-change' && meta.currentIp) {
        detail = `IP: ${meta.currentIp}`
      } else if (result?.errorMessage) {
        detail = result.errorMessage.slice(0, 60)
      }
    }

    domainMap.get(domain)!.monitors.push({ type: m.type, name: m.name, status, detail })
  }

  for (const group of domainMap.values()) {
    const total = group.monitors.length
    const passing = group.monitors.filter(m => m.status === 'up').length
    group.healthScore = total > 0 ? Math.round((passing / total) * 100) : 100
    const hasDown = group.monitors.some(m => m.status === 'down')
    const hasDegraded = group.monitors.some(m => m.status === 'degraded')
    group.overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'up'
  }

  return Array.from(domainMap.values()).sort((a, b) => a.domain.localeCompare(b.domain))
}

function buildSecurityMonitors(monitors: Monitor[], latestResults: LatestCheckResult[]): SecurityMonitorResult[] {
  const resultMap = new Map(latestResults.map(r => [r.monitorId, r]))
  return monitors
    .filter(m => SECURITY_TYPES.has(m.type))
    .map(m => {
      const result = resultMap.get(m.id)
      const status = result?.status ?? m.status
      let detail: string | undefined = result?.errorMessage ?? undefined
      if (result?.metadata) {
        const meta = result.metadata
        if (m.type === 'ssl' && meta.daysUntilExpiry != null) detail = `Expires in ${meta.daysUntilExpiry} days`
        else if (m.type === 'security-headers' && meta.grade) detail = `Grade: ${meta.grade}`
        else if (m.type === 'blacklist') {
          const listed = meta.listed as string[] | undefined
          detail = listed && listed.length > 0 ? `Listed: ${listed.join(', ')}` : 'Not listed'
        }
      }
      return { monitorId: m.id, name: m.name, type: m.type, target: m.target, status, detail }
    })
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateReport(
  orgId: string,
  workspaceId: string,
  periodStart: string,
  periodEnd: string,
  type: 'monthly' | 'custom' | 'on_demand',
  reportType: ReportType = 'uptime'
): Promise<Report | null> {
  const supabase = createAdminClient()

  const { data: monitors } = await supabase
    .from('monitors')
    .select('*')
    .eq('workspace_id', workspaceId)

  if (!monitors || monitors.length === 0) {
    logger.warn('No monitors found for report', { workspaceId })
    return null
  }

  // Base metrics (shared by all report types)
  const monitorMetrics: MonitorMetrics[] = await Promise.all(
    monitors.map(async (monitor: Monitor) => {
      const { data: checks } = await supabase
        .from('check_results')
        .select('status, response_time_ms')
        .eq('monitor_id', monitor.id)
        .gte('checked_at', periodStart)
        .lte('checked_at', periodEnd)

      const results = checks ?? []
      const totalChecks = results.length
      const upChecks = results.filter(c => c.status === 'up').length
      const uptimePercent = totalChecks > 0 ? Math.round((upChecks / totalChecks) * 10000) / 100 : 100

      const responseTimes = results.filter(c => c.response_time_ms != null).map(c => c.response_time_ms!)
      const avgResponseMs = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0
      const minResponseMs = responseTimes.length > 0 ? Math.min(...responseTimes) : 0
      const maxResponseMs = responseTimes.length > 0 ? Math.max(...responseTimes) : 0

      const { data: incidents } = await supabase
        .from('incidents').select('id')
        .eq('monitor_id', monitor.id)
        .gte('started_at', periodStart).lte('started_at', periodEnd)

      return {
        monitorId: monitor.id, name: monitor.name, type: monitor.type, target: monitor.target,
        uptimePercent, avgResponseMs, minResponseMs, maxResponseMs,
        totalChecks, incidentCount: (incidents ?? []).length, status: monitor.status,
      }
    })
  )

  const totalChecks = monitorMetrics.reduce((sum, m) => sum + m.totalChecks, 0)
  const totalUp = monitorMetrics.reduce((sum, m) => sum + Math.round(m.totalChecks * m.uptimePercent / 100), 0)
  const overallUptime = totalChecks > 0 ? Math.round((totalUp / totalChecks) * 10000) / 100 : 100
  const totalIncidents = monitorMetrics.reduce((sum, m) => sum + m.incidentCount, 0)

  const { data: resolvedIncidents } = await supabase
    .from('incidents').select('duration_seconds')
    .eq('workspace_id', workspaceId).eq('status', 'resolved')
    .gte('started_at', periodStart).lte('started_at', periodEnd)
    .not('duration_seconds', 'is', null)

  const durations = (resolvedIncidents ?? []).map(i => i.duration_seconds!).filter(d => d > 0)
  const meanResolutionMinutes = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60) : 0

  // Previous month comparison
  const prevStart = new Date(periodStart); prevStart.setMonth(prevStart.getMonth() - 1)
  const prevEnd = new Date(periodStart)
  const { data: prevChecks } = await supabase
    .from('check_results').select('status')
    .eq('org_id', orgId)
    .gte('checked_at', prevStart.toISOString()).lt('checked_at', prevEnd.toISOString())
  const prevTotal = (prevChecks ?? []).length
  const prevUp = (prevChecks ?? []).filter(c => c.status === 'up').length
  const previousMonthUptime = prevTotal > 0 ? Math.round((prevUp / prevTotal) * 10000) / 100 : null

  // ── Extra data for new report types ──
  const monitorIds = monitors.map((m: Monitor) => m.id)

  let domainGroups: DomainGroup[] | undefined
  let securityScore: number | undefined
  let securityMonitors: SecurityMonitorResult[] | undefined
  let changes: ChangeEvent[] | undefined
  let monitorTrends: MonitorTrend[] | undefined

  if (['site-health', 'security-audit', 'availability-summary'].includes(reportType)) {
    const latestResults = await getLatestCheckResults(monitorIds, supabase)
    domainGroups = buildDomainGroups(monitors, latestResults)

    if (reportType === 'security-audit') {
      securityMonitors = buildSecurityMonitors(monitors, latestResults)
      const total = securityMonitors.length
      const passing = securityMonitors.filter(m => m.status === 'up').length
      securityScore = total > 0 ? Math.round((passing / total) * 100) : 100
    }
  }

  if (reportType === 'change-digest') {
    changes = await getChangeEvents(monitors, supabase, periodStart, periodEnd)
  }

  if (reportType === 'response-trend') {
    monitorTrends = await getMonitorDailyTrends(monitors, supabase, periodStart, periodEnd)
  }

  const reportData: ReportData = {
    reportType, overallUptime, totalMonitors: monitors.length,
    totalIncidents, totalChecks, meanResolutionMinutes,
    monitors: monitorMetrics, previousMonthUptime,
    ...(domainGroups !== undefined && { domainGroups }),
    ...(securityScore !== undefined && { securityScore }),
    ...(securityMonitors !== undefined && { securityMonitors }),
    ...(changes !== undefined && { changes }),
    ...(monitorTrends !== undefined && { monitorTrends }),
  }

  const aiSummary = await generateReportSummary({
    periodStart, periodEnd, overallUptime,
    totalMonitors: monitors.length, totalIncidents, meanResolutionMinutes,
    monitors: monitorMetrics.map(m => ({
      name: m.name, type: m.type, uptimePercent: m.uptimePercent,
      avgResponseMs: m.avgResponseMs, incidentCount: m.incidentCount,
    })),
    previousMonthUptime: previousMonthUptime ?? undefined,
  })

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      org_id: orgId, workspace_id: workspaceId, type,
      period_start: periodStart.split('T')[0], period_end: periodEnd.split('T')[0],
      data: reportData as unknown as Json,
      ai_summary: aiSummary, generated_at: new Date().toISOString(),
    })
    .select().single()

  if (error) {
    logger.error('Failed to insert report', { error: error.message })
    return null
  }

  logger.info('Report generated', { reportId: report.id, type, reportType, overallUptime })
  return report
}

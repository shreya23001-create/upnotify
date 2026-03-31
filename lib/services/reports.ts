import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { generateReportSummary } from './ai'
import type { Report, Monitor } from '@/lib/types'
import type { Json } from '@/lib/types/database.types'

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

interface ReportData {
  overallUptime: number
  totalMonitors: number
  totalIncidents: number
  totalChecks: number
  meanResolutionMinutes: number
  monitors: MonitorMetrics[]
  previousMonthUptime: number | null
}

export async function generateReport(
  orgId: string,
  workspaceId: string,
  periodStart: string,
  periodEnd: string,
  type: 'monthly' | 'custom' | 'on_demand'
): Promise<Report | null> {
  const supabase = createAdminClient()

  // 1. Fetch monitors for workspace
  const { data: monitors } = await supabase
    .from('monitors')
    .select('*')
    .eq('workspace_id', workspaceId)

  if (!monitors || monitors.length === 0) {
    logger.warn('No monitors found for report', { workspaceId })
    return null
  }

  // 2. Calculate per-monitor metrics
  const monitorMetrics: MonitorMetrics[] = await Promise.all(
    monitors.map(async (monitor: Monitor) => {
      // Get check results for period
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

      const responseTimes = results
        .filter(c => c.response_time_ms != null)
        .map(c => c.response_time_ms!)
      const avgResponseMs = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0
      const minResponseMs = responseTimes.length > 0 ? Math.min(...responseTimes) : 0
      const maxResponseMs = responseTimes.length > 0 ? Math.max(...responseTimes) : 0

      // Get incidents for this monitor in period
      const { data: incidents } = await supabase
        .from('incidents')
        .select('id')
        .eq('monitor_id', monitor.id)
        .gte('started_at', periodStart)
        .lte('started_at', periodEnd)

      return {
        monitorId: monitor.id,
        name: monitor.name,
        type: monitor.type,
        target: monitor.target,
        uptimePercent,
        avgResponseMs,
        minResponseMs,
        maxResponseMs,
        totalChecks,
        incidentCount: (incidents ?? []).length,
        status: monitor.status,
      }
    })
  )

  // 3. Aggregate overall stats
  const totalChecks = monitorMetrics.reduce((sum, m) => sum + m.totalChecks, 0)
  const totalUp = monitorMetrics.reduce(
    (sum, m) => sum + Math.round(m.totalChecks * m.uptimePercent / 100),
    0
  )
  const overallUptime = totalChecks > 0
    ? Math.round((totalUp / totalChecks) * 10000) / 100
    : 100
  const totalIncidents = monitorMetrics.reduce((sum, m) => sum + m.incidentCount, 0)

  // Get mean resolution time
  const { data: resolvedIncidents } = await supabase
    .from('incidents')
    .select('duration_seconds')
    .eq('workspace_id', workspaceId)
    .eq('status', 'resolved')
    .gte('started_at', periodStart)
    .lte('started_at', periodEnd)
    .not('duration_seconds', 'is', null)

  const durations = (resolvedIncidents ?? [])
    .map(i => i.duration_seconds!)
    .filter(d => d > 0)
  const meanResolutionMinutes = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60)
    : 0

  // 4. Previous month comparison
  const prevStart = new Date(periodStart)
  prevStart.setMonth(prevStart.getMonth() - 1)
  const prevEnd = new Date(periodStart)
  const { data: prevChecks } = await supabase
    .from('check_results')
    .select('status')
    .eq('org_id', orgId)
    .gte('checked_at', prevStart.toISOString())
    .lt('checked_at', prevEnd.toISOString())

  const prevTotal = (prevChecks ?? []).length
  const prevUp = (prevChecks ?? []).filter(c => c.status === 'up').length
  const previousMonthUptime = prevTotal > 0
    ? Math.round((prevUp / prevTotal) * 10000) / 100
    : null

  const reportData: ReportData = {
    overallUptime,
    totalMonitors: monitors.length,
    totalIncidents,
    totalChecks,
    meanResolutionMinutes,
    monitors: monitorMetrics,
    previousMonthUptime,
  }

  // 5. Generate AI summary
  const aiSummary = await generateReportSummary({
    periodStart,
    periodEnd,
    overallUptime,
    totalMonitors: monitors.length,
    totalIncidents,
    meanResolutionMinutes,
    monitors: monitorMetrics.map(m => ({
      name: m.name,
      type: m.type,
      uptimePercent: m.uptimePercent,
      avgResponseMs: m.avgResponseMs,
      incidentCount: m.incidentCount,
    })),
    previousMonthUptime: previousMonthUptime ?? undefined,
  })

  // 6. Insert report
  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      org_id: orgId,
      workspace_id: workspaceId,
      type,
      period_start: periodStart.split('T')[0],
      period_end: periodEnd.split('T')[0],
      data: reportData as unknown as Json,
      ai_summary: aiSummary,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to insert report', { error: error.message })
    return null
  }

  logger.info('Report generated', { reportId: report.id, type, overallUptime })
  return report
}

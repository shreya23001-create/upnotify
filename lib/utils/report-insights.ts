import type { WebsiteReportMetrics } from '@/lib/services/report-metrics'

export interface ReportInsight {
  text: string
  tone: 'positive' | 'neutral' | 'warning'
}

/** Predefined, rule-based insight sentences generated purely from the
 *  metrics already computed for the report — no AI call, no free-form
 *  generation. Each rule is a simple fact check against real numbers. */
export function buildReportInsights(metrics: WebsiteReportMetrics): ReportInsight[] {
  const insights: ReportInsight[] = []
  const periodLabel = metrics.range.period === 'daily' ? 'day' : metrics.range.period === 'weekly' ? 'week' : metrics.range.period === 'monthly' ? 'month' : 'year'

  if (metrics.uptimePct !== null) {
    if (metrics.uptimePct >= 99.9) {
      insights.push({ text: `Website maintained ${metrics.uptimePct.toFixed(2)}% uptime this ${periodLabel}.`, tone: 'positive' })
    } else if (metrics.uptimePct >= 99) {
      insights.push({ text: `Website maintained ${metrics.uptimePct.toFixed(2)}% uptime this ${periodLabel} — within acceptable range.`, tone: 'neutral' })
    } else {
      insights.push({ text: `Uptime dropped to ${metrics.uptimePct.toFixed(2)}% this ${periodLabel}, below the 99% target.`, tone: 'warning' })
    }
  }

  if (metrics.incidents.count === 0) {
    insights.push({ text: 'No downtime incidents were recorded during this period.', tone: 'positive' })
  } else {
    insights.push({
      text: `${metrics.incidents.count} downtime incident${metrics.incidents.count === 1 ? '' : 's'} recorded, totalling ${formatDuration(metrics.incidents.totalDowntimeSeconds)} of downtime.`,
      tone: metrics.incidents.count > 2 ? 'warning' : 'neutral',
    })
  }

  if (metrics.avgResponseMs !== null) {
    if (metrics.avgResponseMs < 500) {
      insights.push({ text: `Average response time was ${metrics.avgResponseMs}ms — fast and consistent.`, tone: 'positive' })
    } else if (metrics.avgResponseMs < 1500) {
      insights.push({ text: `Average response time was ${metrics.avgResponseMs}ms.`, tone: 'neutral' })
    } else {
      insights.push({ text: `Average response time was ${metrics.avgResponseMs}ms — slower than typical.`, tone: 'warning' })
    }
  }

  const attentionMonitors = metrics.monitors.filter(m => m.health !== 'operational')
  if (attentionMonitors.length === 0 && metrics.monitors.length > 0) {
    insights.push({ text: `All ${metrics.monitors.length} monitor${metrics.monitors.length === 1 ? '' : 's'} for this website completed checks successfully.`, tone: 'positive' })
  } else if (attentionMonitors.length > 0) {
    insights.push({
      text: `${attentionMonitors.length} of ${metrics.monitors.length} monitors need attention: ${attentionMonitors.slice(0, 3).map(m => m.monitorName).join(', ')}${attentionMonitors.length > 3 ? ', and more' : ''}.`,
      tone: 'warning',
    })
  }

  if (metrics.failedChecks > 0 && metrics.totalChecks > 0) {
    const failRate = (metrics.failedChecks / metrics.totalChecks) * 100
    if (failRate > 1) {
      insights.push({ text: `${metrics.failedChecks.toLocaleString()} of ${metrics.totalChecks.toLocaleString()} checks failed (${failRate.toFixed(1)}%).`, tone: 'warning' })
    }
  }

  return insights
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`
}

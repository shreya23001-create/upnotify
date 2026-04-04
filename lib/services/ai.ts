import Anthropic from '@anthropic-ai/sdk'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

const getClient = (): Anthropic | null => {
  const { anthropic } = getServerConfig()
  if (!anthropic.apiKey) {
    logger.warn('ANTHROPIC_API_KEY not set, AI summaries disabled')
    return null
  }
  return new Anthropic({ apiKey: anthropic.apiKey })
}

interface IncidentDetail {
  title: string
  severity: string
  status: string
  startedAt: string
  resolvedAt: string | null
  durationMinutes: number | null
  monitorName: string
}

interface ReportMetrics {
  periodStart: string
  periodEnd: string
  overallUptime: number
  totalMonitors: number
  totalIncidents: number
  meanResolutionMinutes: number
  monitors: Array<{
    name: string
    type: string
    uptimePercent: number
    avgResponseMs: number
    incidentCount: number
  }>
  previousMonthUptime?: number
  incidents?: IncidentDetail[]
}

function formatReportDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatReportTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export async function generateReportSummary(metrics: ReportMetrics): Promise<string> {
  const client = getClient()
  const startFormatted = formatReportDate(metrics.periodStart)
  const endFormatted = formatReportDate(metrics.periodEnd)

  if (!client) {
    let fallback = `Report for ${startFormatted} to ${endFormatted}. Overall uptime: ${metrics.overallUptime}%. ${metrics.totalIncidents} incidents recorded across ${metrics.totalMonitors} monitors.`
    if (metrics.incidents && metrics.incidents.length > 0) {
      fallback += '\n\nIncidents during this period:\n'
      for (const inc of metrics.incidents) {
        fallback += `- ${inc.title} (${inc.severity}) — ${inc.status}, started ${formatReportDate(inc.startedAt)} ${formatReportTime(inc.startedAt)}`
        if (inc.resolvedAt) fallback += `, resolved ${formatReportDate(inc.resolvedAt)} ${formatReportTime(inc.resolvedAt)}`
        if (inc.durationMinutes) fallback += ` (${inc.durationMinutes} min)`
        fallback += '\n'
      }
    }
    return fallback
  }

  try {
    const incidentSection = metrics.incidents && metrics.incidents.length > 0
      ? `\n\nIncident details:\n${metrics.incidents.map(inc =>
          `- ${inc.title} [${inc.severity}] on ${inc.monitorName}: ${inc.status}, started ${formatReportDate(inc.startedAt)} ${formatReportTime(inc.startedAt)}${inc.resolvedAt ? `, resolved ${formatReportDate(inc.resolvedAt)} ${formatReportTime(inc.resolvedAt)}` : ''}${inc.durationMinutes ? ` (${inc.durationMinutes} min)` : ''}`
        ).join('\n')}`
      : ''

    const prompt = `You are an uptime monitoring analyst. Generate a concise 2-3 paragraph executive summary for this monitoring report. Be professional, highlight key concerns, and mention any monitors that need attention. Include incident analysis.

IMPORTANT: Use DD/MMM/YYYY format for all dates and HH:MM format for all times. Do NOT use any other date format.

Data:
- Period: ${startFormatted} to ${endFormatted}
- Overall uptime: ${metrics.overallUptime}%
- Total monitors: ${metrics.totalMonitors}
- Total incidents: ${metrics.totalIncidents}
- Mean incident resolution time: ${metrics.meanResolutionMinutes} minutes
${metrics.previousMonthUptime != null ? `- Previous month uptime: ${metrics.previousMonthUptime}%` : ''}

Per-monitor breakdown:
${metrics.monitors.map(m => `- ${m.name} (${m.type}): ${m.uptimePercent}% uptime, ${m.avgResponseMs}ms avg response, ${m.incidentCount} incidents`).join('\n')}
${incidentSection}

Write the summary in plain English. Do not use markdown. Focus on actionable insights. Always use DD/MMM/YYYY dates and HH:MM times.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    return textBlock ? textBlock.text : 'Unable to generate summary.'
  } catch (error) {
    logger.error('AI summary generation failed', { error: error instanceof Error ? error.message : 'Unknown' })
    return `Report for ${startFormatted} to ${endFormatted}. Overall uptime: ${metrics.overallUptime}%. ${metrics.totalIncidents} incidents recorded. AI summary generation failed.`
  }
}

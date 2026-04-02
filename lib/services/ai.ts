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
}

export async function generateReportSummary(metrics: ReportMetrics): Promise<string> {
  const client = getClient()
  if (!client) {
    return `Report for ${metrics.periodStart} to ${metrics.periodEnd}. Overall uptime: ${metrics.overallUptime}%. ${metrics.totalIncidents} incidents recorded across ${metrics.totalMonitors} monitors.`
  }

  try {
    const prompt = `You are an uptime monitoring analyst. Generate a concise 2-3 paragraph executive summary for this monitoring report. Be professional, highlight key concerns, and mention any monitors that need attention.

Data:
- Period: ${metrics.periodStart} to ${metrics.periodEnd}
- Overall uptime: ${metrics.overallUptime}%
- Total monitors: ${metrics.totalMonitors}
- Total incidents: ${metrics.totalIncidents}
- Mean incident resolution time: ${metrics.meanResolutionMinutes} minutes
${metrics.previousMonthUptime != null ? `- Previous month uptime: ${metrics.previousMonthUptime}%` : ''}

Per-monitor breakdown:
${metrics.monitors.map(m => `- ${m.name} (${m.type}): ${m.uptimePercent}% uptime, ${m.avgResponseMs}ms avg response, ${m.incidentCount} incidents`).join('\n')}

Write the summary in plain English. Do not use markdown. Focus on actionable insights.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    return textBlock ? textBlock.text : 'Unable to generate summary.'
  } catch (error) {
    logger.error('AI summary generation failed', { error: error instanceof Error ? error.message : 'Unknown' })
    return `Report for ${metrics.periodStart} to ${metrics.periodEnd}. Overall uptime: ${metrics.overallUptime}%. ${metrics.totalIncidents} incidents recorded. AI summary generation failed.`
  }
}

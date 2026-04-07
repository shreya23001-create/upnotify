import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import {
  getCompetitorById,
  getCompetitorCheckResults,
  updateCompetitorAiSummary,
} from '@/lib/db/competitor-monitors'
import { logger } from '@/lib/utils/logger'
import Anthropic from '@anthropic-ai/sdk'
import { getServerConfig } from '@/lib/utils/config'

const COOLDOWN_HOURS = 24

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { id } = await params
    const competitor = await getCompetitorById(id, user.org_id)
    if (!competitor) return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })

    // Enforce 24h cooldown
    if (competitor.ai_summary_at) {
      const ageHours = (Date.now() - new Date(competitor.ai_summary_at).getTime()) / 3600000
      if (ageHours < COOLDOWN_HOURS) {
        const hoursLeft = Math.ceil(COOLDOWN_HOURS - ageHours)
        return NextResponse.json(
          { error: `Summary was generated recently. You can refresh again in ${hoursLeft}h.` },
          { status: 429 }
        )
      }
    }

    const { anthropic: { apiKey } } = getServerConfig()
    if (!apiKey) {
      return NextResponse.json({ error: 'AI summaries are not configured.' }, { status: 503 })
    }

    // Gather last 30 days of check data for context
    const results = await getCompetitorCheckResults(id, user.org_id, 30)
    const total = results.length
    if (total === 0) {
      return NextResponse.json({ error: 'Not enough monitoring data yet. Try again after the first check runs.' }, { status: 400 })
    }

    const upCount = results.filter(r => r.status === 'up').length
    const downCount = results.filter(r => r.status === 'down').length
    const degradedCount = results.filter(r => r.status === 'degraded').length
    const uptimePct = Math.round((upCount / total) * 10000) / 100

    const responseTimes = results.filter(r => r.response_time_ms !== null && r.status === 'up').map(r => r.response_time_ms as number)
    const avgMs = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : null

    const maintenanceHits = results.filter(r => r.keyword_category === 'maintenance').length
    const errorHits = results.filter(r => r.keyword_category === 'error').length

    const prompt = `You are an uptime monitoring analyst. Write a short, factual reliability summary for ${competitor.display_name} (${competitor.domain}) based purely on automated HTTP monitoring data.

Monitoring data (last 30 days, ${total} checks, hourly):
- Uptime: ${uptimePct}% (${upCount} up / ${downCount} down / ${degradedCount} degraded)
- Average response time: ${avgMs !== null ? `${avgMs}ms` : 'insufficient data'}
- Maintenance detections: ${maintenanceHits}
- Error page detections: ${errorHits}

Write 2–3 concise sentences. Be factual and neutral. Do not speculate about causes. Do not make quality judgements beyond what the data shows. Do not mention Uptrue by name.`

    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const summaryText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    if (!summaryText) {
      return NextResponse.json({ error: 'Failed to generate summary. Please try again.' }, { status: 500 })
    }

    await updateCompetitorAiSummary(id, summaryText)

    logger.info('Competitor AI summary generated', { orgId: user.org_id, competitorId: id })
    return NextResponse.json({ success: true, summary: summaryText, generatedAt: new Date().toISOString() })
  } catch (err) {
    logger.error('POST /api/v1/competitors/[id]/ai-summary failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

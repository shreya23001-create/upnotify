// =============================================================================
// Cron: autoblog/llm-detector
// Schedule: Daily 7am
// Purpose: Detect new LLM launches in feed items and queue them for generation
// Fast - no Claude API calls. post-generator handles generation.
// =============================================================================

import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import {
  getRecentFeedItems,
  getEnabledAutoblogSources,
  sourceKeyAlreadyProcessed,
  createQueuedAutoblogRun,
  getAutoblogChannelByKey,
} from '@/lib/db/autoblog'
import { detectLLMLaunches } from '@/lib/services/llm-detector'
import type { AutoblogFeedItem } from '@/lib/db/autoblog'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const { cron } = getServerConfig()

  if (cron.secret && authHeader !== `Bearer ${cron.secret}`) {
    const isVercelCron = request.headers.get('x-vercel-cron')
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/autoblog/llm-detector', getTriggeredBy(request))

  const channel = await getAutoblogChannelByKey('llm_launches')
  if (!channel?.is_enabled) {
    await endCronRun(runId, cronStart, 'ok', { summary: 'channel_disabled' })
    return NextResponse.json({ ok: true, skipped: 'channel_disabled' })
  }

  try {
    const rawItems = await getRecentFeedItems(48, 300)
    if (rawItems.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_feed_items' })
      return NextResponse.json({ ok: true, detected: 0, queued: 0 })
    }

    const sources = await getEnabledAutoblogSources()
    const sourceMap = new Map(sources.map(s => [s.id, s.category ?? 'community']))

    const annotatedItems = rawItems.map((item: AutoblogFeedItem) => ({
      title: item.title,
      url: item.url,
      summary: item.summary ?? null,
      publishedAt: item.published_at ?? null,
      sourceName: sources.find(s => s.id === item.source_id)?.name ?? 'Unknown',
      sourceCategory: sourceMap.get(item.source_id) ?? 'community',
    }))

    const launches = detectLLMLaunches(annotatedItems, new Set<string>())
    let queued = 0
    let skipped = 0

    for (const llm of launches) {
      const alreadyDone = await sourceKeyAlreadyProcessed(llm.sourceKey)
      if (alreadyDone) {
        skipped++
        continue
      }

      // Store everything the generator needs in the payload
      const id = await createQueuedAutoblogRun({
        channel_key: 'llm_launches',
        source_key: llm.sourceKey,
        post_to_social: channel.post_to_social,
        confidence_score: llm.confidence,
        sources_count: llm.sourceItems.length,
        payload: {
          type: 'llm_launch',
          llm: {
            name: llm.name,
            company: llm.company,
            sourceKey: llm.sourceKey,
            confidence: llm.confidence,
            summary: llm.summary,
            sourceItems: llm.sourceItems,
          },
          channelKey: 'llm_launches',
          postToSocial: channel.post_to_social,
          // Store feed item IDs to mark processed after generation
          feedItemIds: rawItems
            .filter((item: AutoblogFeedItem) =>
              llm.sourceItems.some(si => si.url === item.url)
            )
            .map((item: AutoblogFeedItem) => item.id),
        },
      })

      if (id) {
        queued++
        logger.info('LLM launch queued for generation', { llm: llm.name, runId: id })
      }
    }

    const summary = `detected: ${launches.length}, queued: ${queued}, skipped: ${skipped}`
    await endCronRun(runId, cronStart, 'ok', { summary })
    return NextResponse.json({ ok: true, detected: launches.length, queued, skipped })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('autoblog/llm-detector error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

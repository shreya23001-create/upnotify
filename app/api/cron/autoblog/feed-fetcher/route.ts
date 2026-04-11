// =============================================================================
// Cron: autoblog/feed-fetcher
// Schedule: Every 6 hours
// Purpose: Fetch all enabled RSS/API sources, store new items in autoblog_feed_items
// =============================================================================

import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { getEnabledAutoblogSources, upsertFeedItems, updateSourceFetchStats } from '@/lib/db/autoblog'
import { fetchFeeds } from '@/lib/services/feed-fetcher'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
  const runId = await startCronRun('/api/cron/autoblog/feed-fetcher', getTriggeredBy(request))

  let totalNew = 0
  let sourcesProcessed = 0
  let sourcesFailed = 0

  try {
    const sources = await getEnabledAutoblogSources()
    if (sources.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_enabled_sources' })
      return NextResponse.json({ ok: true, totalNew: 0, sourcesProcessed: 0 })
    }

    const fetchInput = sources.map(s => ({ id: s.id, url: s.url, name: s.name }))
    const results = await fetchFeeds(fetchInput, 5)

    for (const { sourceId, items } of results) {
      if (items.length === 0) {
        sourcesFailed++
        continue
      }

      const source = sources.find(s => s.id === sourceId)
      if (!source) continue

      const toInsert = items.map(item => ({
        source_id: sourceId,
        title: item.title,
        url: item.url,
        summary: item.summary ?? null,
        published_at: item.publishedAt ?? null,
      }))

      const newCount = await upsertFeedItems(toInsert)
      await updateSourceFetchStats(sourceId, items.length)

      totalNew += newCount
      sourcesProcessed++
    }

    const summary = `sources_processed: ${sourcesProcessed}, sources_failed: ${sourcesFailed}, new_items: ${totalNew}`
    logger.info('autoblog/feed-fetcher completed', { sourcesProcessed, sourcesFailed, totalNew })
    await endCronRun(runId, cronStart, 'ok', { summary })
    return NextResponse.json({ ok: true, totalNew, sourcesProcessed, sourcesFailed })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('autoblog/feed-fetcher error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

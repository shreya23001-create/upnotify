// =============================================================================
// Cron: autoblog/topic-runner
// Schedule: Every 2 hours
// Purpose: Check due custom topics and queue them for generation
// Fast - no Claude API calls. post-generator handles generation.
// =============================================================================

import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import {
  getEnabledAutoblogTopics,
  getRecentFeedItems,
  getEnabledAutoblogSources,
  createQueuedAutoblogRun,
  updateTopicLastRun,
} from '@/lib/db/autoblog'
import { getTrackerContext } from '@/lib/services/autoblog-generator'
import type { AutoblogTopic, AutoblogFeedItem } from '@/lib/db/autoblog'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function isTopicDue(topic: AutoblogTopic, now: Date): boolean {
  if (!topic.last_run_at) return true
  const last = new Date(topic.last_run_at)
  const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60)
  const dayOfWeek = now.getDay()
  const dayOfMonth = now.getDate()

  switch (topic.schedule) {
    case 'daily':       return hoursSince >= 23
    case 'weekly_mon':  return dayOfWeek === 1 && hoursSince >= 167
    case 'weekly_fri':  return dayOfWeek === 5 && hoursSince >= 167
    case 'monthly_1':   return dayOfMonth === 1 && hoursSince >= 672
    case 'monthly_15':  return dayOfMonth === 15 && hoursSince >= 672
    default:            return false
  }
}

function filterItemsByKeywords(
  items: Array<AutoblogFeedItem & { sourceName: string }>,
  keywords: string[]
): typeof items {
  if (keywords.length === 0) return items.slice(0, 15)
  const kwLower = keywords.map(k => k.toLowerCase())
  return items
    .filter(item => {
      const text = `${item.title} ${item.summary ?? ''}`.toLowerCase()
      return kwLower.some(kw => text.includes(kw))
    })
    .slice(0, 15)
}

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
  const runId = await startCronRun('/api/cron/autoblog/topic-runner', getTriggeredBy(request))

  const now = new Date()

  try {
    const topics = await getEnabledAutoblogTopics()
    const dueTopics = topics.filter(t => isTopicDue(t, now))

    if (dueTopics.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_topics_due' })
      return NextResponse.json({ ok: true, dueTopics: 0, queued: 0 })
    }

    logger.info('Due autoblog topics found', { count: dueTopics.length })

    // Fetch shared data once for all topics
    const [rawFeedItems, sources, trackerContext] = await Promise.all([
      getRecentFeedItems(72, 300),
      getEnabledAutoblogSources(),
      getTrackerContext(),
    ])

    const sourceMap = new Map(sources.map(s => [s.id, s.name]))
    const annotatedItems = rawFeedItems.map((item: AutoblogFeedItem) => ({
      ...item,
      sourceName: sourceMap.get(item.source_id) ?? 'Unknown',
    }))

    let queued = 0

    for (const topic of dueTopics) {
      // Stamp last_run_at immediately to prevent duplicate queuing on next cron tick
      await updateTopicLastRun(topic.id)

      const relevantItems = filterItemsByKeywords(annotatedItems, topic.keywords)
      const feedItems = relevantItems.map(item => ({
        title: item.title,
        url: item.url,
        summary: item.summary ?? null,
        publishedAt: item.published_at ?? null,
        sourceName: item.sourceName,
      }))

      const id = await createQueuedAutoblogRun({
        topic_id: topic.id,
        post_to_social: topic.post_to_social,
        sources_count: feedItems.length,
        payload: {
          type: 'custom_topic',
          topicId: topic.id,
          topicName: topic.name,
          topicPrompt: topic.prompt,
          feedItems,
          trackerContext,
          postToSocial: topic.post_to_social,
        },
      })

      if (id) {
        queued++
        logger.info('Topic queued for generation', { topic: topic.name, runId: id })
      }
    }

    const summary = `dueTopics: ${dueTopics.length}, queued: ${queued}`
    await endCronRun(runId, cronStart, 'ok', { summary })
    return NextResponse.json({ ok: true, dueTopics: dueTopics.length, queued })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('autoblog/topic-runner error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

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
  getAutoblogSources,
  getTopicSources,
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

function filterItemsBySourceIds(
  items: Array<AutoblogFeedItem & { sourceName: string }>,
  sourceIds: Set<string>
): typeof items {
  return items.filter(item => sourceIds.has(item.source_id)).slice(0, 15)
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
    const [rawFeedItems, allSources, trackerContext] = await Promise.all([
      getRecentFeedItems(168, 300), // 7-day window — topics run weekly/monthly so items must survive longer
      getAutoblogSources(),
      getTrackerContext(),
    ])

    const sourceMap = new Map(allSources.map(s => [s.id, s.name]))
    const annotatedItems = rawFeedItems.map((item: AutoblogFeedItem) => ({
      ...item,
      sourceName: sourceMap.get(item.source_id) ?? 'Unknown',
    }))

    let queued = 0

    for (const topic of dueTopics) {
      // Get this topic's assigned sources
      const topicSources = await getTopicSources(topic.id)
      if (topicSources.length === 0) {
        logger.warn('No sources assigned to topic — skipping', { topic: topic.name })
        continue
      }

      const assignedSourceIds = new Set(topicSources.map(s => s.id))
      const relevantItems = filterItemsBySourceIds(annotatedItems, assignedSourceIds)
      const feedItems = relevantItems.map(item => ({
        title: item.title,
        url: item.url,
        summary: item.summary ?? null,
        publishedAt: item.published_at ?? null,
        sourceName: item.sourceName,
      }))

      if (feedItems.length === 0) {
        logger.warn('No feed items from assigned sources — skipping', { topic: topic.name, assignedSources: topicSources.length })
        continue
      }

      // Stamp last_run_at only once we know we have content to queue
      await updateTopicLastRun(topic.id)

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

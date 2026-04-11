// =============================================================================
// Cron: autoblog/topic-runner
// Schedule: Every 2 hours
// Purpose: Check due custom topics and generate blog drafts
// =============================================================================

import { NextResponse } from 'next/server'
import { getServerConfig, getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import {
  getEnabledAutoblogTopics,
  getRecentFeedItems,
  getEnabledAutoblogSources,
  createAutoblogRun,
  updateTopicLastRun,
} from '@/lib/db/autoblog'
import { generateAutoblogPost, getTrackerContext } from '@/lib/services/autoblog-generator'
import { sendBlogApprovalEmail } from '@/lib/services/email'
import { sendBlogApprovalTelegram } from '@/lib/services/telegram'
import type { AutoblogTopic, AutoblogFeedItem } from '@/lib/db/autoblog'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// =============================================================================
// Due check - is this topic due for a run?
// =============================================================================

function isTopicDue(topic: AutoblogTopic, now: Date): boolean {
  if (!topic.last_run_at) return true

  const last = new Date(topic.last_run_at)
  const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60)
  const dayOfWeek = now.getDay()   // 0=Sun, 1=Mon, 5=Fri
  const dayOfMonth = now.getDate()

  switch (topic.schedule) {
    case 'daily':
      return hoursSince >= 23
    case 'weekly_mon':
      return dayOfWeek === 1 && hoursSince >= 167
    case 'weekly_fri':
      return dayOfWeek === 5 && hoursSince >= 167
    case 'monthly_1':
      return dayOfMonth === 1 && hoursSince >= 672
    case 'monthly_15':
      return dayOfMonth === 15 && hoursSince >= 672
    default:
      return false
  }
}

// =============================================================================
// Find feed items relevant to a topic by keywords
// =============================================================================

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

// =============================================================================
// Main handler
// =============================================================================

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
  let processed = 0
  let generated = 0
  let failed = 0
  let skipped = 0

  try {
    const topics = await getEnabledAutoblogTopics()
    const dueTopics = topics.filter(t => isTopicDue(t, now))

    if (dueTopics.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_topics_due' })
      return NextResponse.json({ ok: true, processed: 0, generated: 0 })
    }

    logger.info('Due autoblog topics found', { count: dueTopics.length })

    // Fetch shared resources once
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

    // Process topics one at a time to avoid Claude API rate limits
    for (const topic of dueTopics) {
      processed++

      // Mark last_run_at immediately to prevent concurrent runs
      await updateTopicLastRun(topic.id)

      try {
        const relevantItems = filterItemsByKeywords(annotatedItems, topic.keywords)
        const feedItems = relevantItems.map(item => ({
          title: item.title,
          url: item.url,
          summary: item.summary ?? null,
          publishedAt: item.published_at ?? null,
          sourceName: item.sourceName,
        }))

        const draft = await generateAutoblogPost({
          type: 'custom_topic',
          topicName: topic.name,
          topicPrompt: topic.prompt,
          topicId: topic.id,
          sourceItems: feedItems,
          trackerContext,
          postToSocial: topic.post_to_social,
        })

        if (!draft) {
          failed++
          await createAutoblogRun({
            topic_id: topic.id,
            title: `${topic.name} (failed)`,
            status: 'failed',
            sources_count: feedItems.length,
            post_to_social: topic.post_to_social,
            error_message: 'Draft generation returned null',
          })
          continue
        }

        await createAutoblogRun({
          topic_id: topic.id,
          blog_post_id: draft.blogPostId,
          title: draft.title,
          status: 'generated',
          confidence_score: draft.confidenceScore,
          sources_count: draft.sourcesCount,
          post_to_social: topic.post_to_social,
        })

        // Send approval notifications
        const { app, admin } = getConfig()
        const adminEmail = admin.emails[0]
        const approveUrl = `${app.url}/api/admin/blog-approve?token=${draft.approveToken}`
        const rejectUrl = `${app.url}/api/admin/blog-approve?token=${draft.rejectToken}`

        await Promise.allSettled([
          adminEmail ? sendBlogApprovalEmail({
            to: adminEmail,
            blogTitle: draft.title,
            blogSlug: draft.slug,
            siteDisplayName: `Topic: ${topic.name}`,
            excerpt: draft.excerpt,
            bodyMarkdown: draft.bodyMarkdown,
            sourcesCount: draft.sourcesCount,
            sources: [],
            approveUrl,
            rejectUrl,
          }) : Promise.resolve({ success: false }),
          sendBlogApprovalTelegram({
            blogTitle: draft.title,
            siteDisplayName: `Topic: ${topic.name}`,
            excerpt: draft.excerpt,
            sourcesCount: draft.sourcesCount,
            hasOfficialStatus: draft.sourcesCount > 0,
            approveUrl,
            rejectUrl,
          }),
        ])

        generated++
        logger.info('Custom topic blog generated', { topic: topic.name, blogId: draft.blogPostId })

      } catch (err) {
        failed++
        const msg = err instanceof Error ? err.message : 'Unknown'
        logger.error('Topic blog generation failed', { topic: topic.name, error: msg })
        await createAutoblogRun({
          topic_id: topic.id,
          title: `${topic.name} (error)`,
          status: 'failed',
          sources_count: 0,
          error_message: msg,
        })
      }
    }

    const summary = `processed: ${processed}, generated: ${generated}, skipped: ${skipped}, failed: ${failed}`
    logger.info('autoblog/topic-runner completed', { processed, generated, skipped, failed })
    await endCronRun(runId, cronStart, 'ok', { summary })
    return NextResponse.json({ ok: true, processed, generated, skipped, failed })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('autoblog/topic-runner error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

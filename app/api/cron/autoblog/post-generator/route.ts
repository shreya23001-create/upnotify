// =============================================================================
// Cron: autoblog/post-generator
// Schedule: Every 10 minutes
// Purpose: Pick one queued autoblog run and generate the post via Claude API
// Processes one item per invocation to stay within Vercel function timeout
// =============================================================================

import { NextResponse } from 'next/server'
import { getServerConfig, getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import {
  getNextQueuedRun,
  updateAutoblogRunResult,
  markFeedItemsProcessed,
} from '@/lib/db/autoblog'
import { generateAutoblogPost } from '@/lib/services/autoblog-generator'
import { sendBlogApprovalEmail } from '@/lib/services/email'
import { sendBlogApprovalTelegram } from '@/lib/services/telegram'
import type { DetectedLLM } from '@/lib/services/llm-detector'
import type { TrackerContext } from '@/lib/services/autoblog-generator'
import type { FeedItem } from '@/lib/services/feed-fetcher'

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
  const runId = await startCronRun('/api/cron/autoblog/post-generator', getTriggeredBy(request))

  try {
    // Claim the next queued run (also resets any stuck 'generating' runs)
    const queued = await getNextQueuedRun()

    if (!queued) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'queue_empty' })
      return NextResponse.json({ ok: true, processed: 0, reason: 'queue_empty' })
    }

    const payload = queued.payload
    const type = payload.type as string

    logger.info('Generating autoblog post', { runId: queued.id, type })

    let draft: Awaited<ReturnType<typeof generateAutoblogPost>> = null

    try {
      if (type === 'llm_launch') {
        draft = await generateAutoblogPost({
          type: 'llm_launch',
          llm: payload.llm as DetectedLLM,
          postToSocial: queued.post_to_social,
        })
      } else if (type === 'custom_topic') {
        draft = await generateAutoblogPost({
          type: 'custom_topic',
          topicName: payload.topicName as string,
          topicPrompt: payload.topicPrompt as string,
          topicId: payload.topicId as string,
          sourceItems: (payload.feedItems as FeedItem[]) ?? [],
          trackerContext: (payload.trackerContext as TrackerContext) ?? null,
          postToSocial: queued.post_to_social,
        })
      } else {
        throw new Error(`Unknown payload type: ${type}`)
      }
    } catch (genError) {
      const msg = genError instanceof Error ? genError.message : 'Unknown generation error'
      logger.error('Post generation failed', { runId: queued.id, error: msg })
      await updateAutoblogRunResult(queued.id, { status: 'failed', error_message: msg })
      await endCronRun(runId, cronStart, 'error', { errorMessage: msg })
      return NextResponse.json({ ok: false, error: msg })
    }

    if (!draft) {
      await updateAutoblogRunResult(queued.id, {
        status: 'failed',
        error_message: 'Generator returned null - likely missing API key',
      })
      await endCronRun(runId, cronStart, 'ok', { summary: 'generation_null' })
      return NextResponse.json({ ok: false, error: 'Draft was null' })
    }

    // Save result
    await updateAutoblogRunResult(queued.id, {
      status: 'generated',
      blog_post_id: draft.blogPostId,
      title: draft.title,
      confidence_score: draft.confidenceScore,
      sources_count: draft.sourcesCount,
    })

    // Mark feed items processed (LLM launch only)
    if (type === 'llm_launch' && Array.isArray(payload.feedItemIds)) {
      const ids = payload.feedItemIds as string[]
      if (ids.length > 0) await markFeedItemsProcessed(ids)
    }

    // Send approval notifications
    const { app, admin } = getConfig()
    const adminEmail = admin.emails[0]
    const approveUrl = `${app.url}/api/admin/blog-approve?token=${draft.approveToken}`
    const rejectUrl = `${app.url}/api/admin/blog-approve?token=${draft.rejectToken}`

    const displayName = type === 'llm_launch'
      ? `${(payload.llm as DetectedLLM).name} (LLM Launch)`
      : `Topic: ${payload.topicName as string}`

    await Promise.allSettled([
      adminEmail ? sendBlogApprovalEmail({
        to: adminEmail,
        blogTitle: draft.title,
        blogSlug: draft.slug,
        siteDisplayName: displayName,
        excerpt: draft.excerpt,
        bodyMarkdown: draft.bodyMarkdown,
        sourcesCount: draft.sourcesCount,
        sources: [],
        approveUrl,
        rejectUrl,
      }) : Promise.resolve({ success: false }),
      sendBlogApprovalTelegram({
        blogTitle: draft.title,
        siteDisplayName: displayName,
        excerpt: draft.excerpt,
        sourcesCount: draft.sourcesCount,
        hasOfficialStatus: draft.confidenceScore >= 70,
        approveUrl,
        rejectUrl,
      }),
    ])

    logger.info('Autoblog post generated', { runId: queued.id, title: draft.title })
    await endCronRun(runId, cronStart, 'ok', { summary: `generated: ${draft.title}` })
    return NextResponse.json({ ok: true, processed: 1, title: draft.title, blogPostId: draft.blogPostId })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('autoblog/post-generator error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

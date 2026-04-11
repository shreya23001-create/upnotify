// =============================================================================
// Cron: autoblog/llm-detector
// Schedule: Daily 7am
// Purpose: Scan recent feed items for new LLM launches, generate blog drafts
// =============================================================================

import { NextResponse } from 'next/server'
import { getServerConfig, getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import {
  getRecentFeedItems,
  getEnabledAutoblogSources,
  sourceKeyAlreadyProcessed,
  createAutoblogRun,
  markFeedItemsProcessed,
  getAutoblogChannelByKey,
} from '@/lib/db/autoblog'
import { detectLLMLaunches } from '@/lib/services/llm-detector'
import { generateAutoblogPost } from '@/lib/services/autoblog-generator'
import { sendBlogApprovalEmail } from '@/lib/services/email'
import { sendBlogApprovalTelegram } from '@/lib/services/telegram'
import type { AutoblogFeedItem } from '@/lib/db/autoblog'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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

  // Check if channel is enabled
  const channel = await getAutoblogChannelByKey('llm_launches')
  if (!channel?.is_enabled) {
    logger.info('LLM detector channel disabled — skipping')
    await endCronRun(runId, cronStart, 'ok', { summary: 'channel_disabled' })
    return NextResponse.json({ ok: true, skipped: 'channel_disabled' })
  }

  let detected = 0
  let generated = 0
  let failed = 0
  let skipped = 0

  try {
    // Get recent feed items (last 48 hours)
    const rawItems = await getRecentFeedItems(48, 300)
    if (rawItems.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_feed_items' })
      return NextResponse.json({ ok: true, detected: 0, generated: 0 })
    }

    // Get source categories for confidence scoring
    const sources = await getEnabledAutoblogSources()
    const sourceMap = new Map(sources.map(s => [s.id, s.category ?? 'community']))

    // Annotate items with source category
    const annotatedItems = rawItems.map((item: AutoblogFeedItem) => ({
      title: item.title,
      url: item.url,
      summary: item.summary ?? null,
      publishedAt: item.published_at ?? null,
      sourceName: sources.find(s => s.id === item.source_id)?.name ?? 'Unknown',
      sourceCategory: sourceMap.get(item.source_id) ?? 'community',
    }))

    // Check which source keys are already processed (deduplicate)
    const processedKeys = new Set<string>()
    // We'll check individually during detection loop

    const launches = detectLLMLaunches(annotatedItems, processedKeys)
    detected = launches.length

    logger.info('LLM launches detected', { count: detected })

    for (const llm of launches) {
      // Double-check dedup in DB
      const alreadyDone = await sourceKeyAlreadyProcessed(llm.sourceKey)
      if (alreadyDone) {
        skipped++
        logger.info('LLM already processed — skipping', { sourceKey: llm.sourceKey })
        continue
      }

      try {
        const draft = await generateAutoblogPost({
          type: 'llm_launch',
          llm,
          postToSocial: channel.post_to_social,
        })

        if (!draft) {
          failed++
          await createAutoblogRun({
            channel_key: 'llm_launches',
            title: `${llm.name} (failed)`,
            status: 'failed',
            confidence_score: llm.confidence,
            sources_count: llm.sourceItems.length,
            source_key: llm.sourceKey,
            post_to_social: channel.post_to_social,
            error_message: 'Draft generation returned null',
          })
          continue
        }

        // Log the run
        await createAutoblogRun({
          channel_key: 'llm_launches',
          blog_post_id: draft.blogPostId,
          title: draft.title,
          status: 'generated',
          confidence_score: draft.confidenceScore,
          sources_count: draft.sourcesCount,
          source_key: llm.sourceKey,
          post_to_social: channel.post_to_social,
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
            siteDisplayName: `${llm.name} (LLM Launch)`,
            excerpt: draft.excerpt,
            bodyMarkdown: draft.bodyMarkdown,
            sourcesCount: draft.sourcesCount,
            sources: [],
            approveUrl,
            rejectUrl,
          }) : Promise.resolve({ success: false }),
          sendBlogApprovalTelegram({
            blogTitle: draft.title,
            siteDisplayName: `${llm.name} (LLM Launch)`,
            excerpt: draft.excerpt,
            sourcesCount: draft.sourcesCount,
            hasOfficialStatus: llm.confidence >= 70,
            approveUrl,
            rejectUrl,
          }),
        ])

        // Mark source items as processed
        const sourceItemIds = rawItems
          .filter((item: AutoblogFeedItem) =>
            llm.sourceItems.some(si => si.url === item.url)
          )
          .map((item: AutoblogFeedItem) => item.id)
        if (sourceItemIds.length > 0) {
          await markFeedItemsProcessed(sourceItemIds)
        }

        generated++
        logger.info('LLM launch blog generated', { llm: llm.name, blogId: draft.blogPostId })

      } catch (err) {
        failed++
        const msg = err instanceof Error ? err.message : 'Unknown'
        logger.error('LLM blog generation failed', { llm: llm.name, error: msg })
        await createAutoblogRun({
          channel_key: 'llm_launches',
          title: `${llm.name} (error)`,
          status: 'failed',
          confidence_score: llm.confidence,
          sources_count: llm.sourceItems.length,
          source_key: llm.sourceKey,
          error_message: msg,
        })
      }
    }

    const summary = `detected: ${detected}, generated: ${generated}, skipped: ${skipped}, failed: ${failed}`
    logger.info('autoblog/llm-detector completed', { detected, generated, skipped, failed })
    await endCronRun(runId, cronStart, 'ok', { summary })
    return NextResponse.json({ ok: true, detected, generated, skipped, failed })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('autoblog/llm-detector error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

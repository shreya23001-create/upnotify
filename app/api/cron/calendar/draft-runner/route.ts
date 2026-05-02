// =============================================================================
// Cron: calendar/draft-runner
// Schedule: Every hour (configured in vercel.json — to be added)
// Purpose: Pick the next due calendar row and generate a draft via the
//          calendar-blog-generator. Saves to blog_posts with
//          delivery_method='digest'. Daily 07:00 boss-digest cron then
//          batches all pending drafts into a single email.
//
// Processes ONE row per invocation to stay within Vercel function timeout.
// =============================================================================

import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import {
  getNextDueCalendarRow,
  claimCalendarRow,
  resetStuckGeneratingRows,
} from '@/lib/db/content-calendar'
import { generateCalendarBlogPost } from '@/lib/services/calendar-blog-generator'

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
  const runId = await startCronRun('/api/cron/calendar/draft-runner', getTriggeredBy(request))

  try {
    // Reset any stuck rows from a previous crashed run
    const reset = await resetStuckGeneratingRows(30)
    if (reset > 0) {
      logger.info('calendar/draft-runner reset stuck rows', { reset })
    }

    const next = await getNextDueCalendarRow()
    if (!next) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_due_rows' })
      return NextResponse.json({ ok: true, processed: 0, reason: 'no_due_rows' })
    }

    const claimed = await claimCalendarRow(next.id)
    if (!claimed) {
      // Race — another worker grabbed it
      await endCronRun(runId, cronStart, 'ok', { summary: 'race_lost' })
      return NextResponse.json({ ok: true, processed: 0, reason: 'race_lost' })
    }

    logger.info('calendar/draft-runner processing', {
      rowId: claimed.id,
      postType: claimed.post_type,
      primaryKeyword: claimed.primary_keyword,
      publishDate: claimed.publish_date,
    })

    const draft = await generateCalendarBlogPost(claimed)

    if (!draft) {
      await endCronRun(runId, cronStart, 'error', { errorMessage: 'Generator returned null' })
      return NextResponse.json({ ok: false, error: 'Generator returned null' })
    }

    await endCronRun(runId, cronStart, 'ok', {
      summary: `drafted: ${draft.title}`,
    })

    return NextResponse.json({
      ok: true,
      processed: 1,
      blogPostId: draft.blogPostId,
      title: draft.title,
      slug: draft.slug,
      dodPass: draft.review.dodSummary.pass,
      hardFailCount: draft.review.dodSummary.hardFailCount,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('calendar/draft-runner error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

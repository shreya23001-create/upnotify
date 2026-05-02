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

    const generation = await generateCalendarBlogPost(claimed)

    if (!generation.ok) {
      await endCronRun(runId, cronStart, 'error', { errorMessage: generation.reason })
      return NextResponse.json({ ok: false, error: generation.reason, rowId: claimed.id })
    }

    const { result } = generation
    await endCronRun(runId, cronStart, 'ok', {
      summary: `drafted: ${result.title}`,
    })

    return NextResponse.json({
      ok: true,
      processed: 1,
      blogPostId: result.blogPostId,
      title: result.title,
      slug: result.slug,
      dodPass: result.review.dodSummary.pass,
      hardFailCount: result.review.dodSummary.hardFailCount,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('calendar/draft-runner error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
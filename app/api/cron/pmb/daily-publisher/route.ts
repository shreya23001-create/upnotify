// =============================================================================
// Cron: pmb/daily-publisher
// Schedule: Every 5 minutes (*/5 * * * *)
// Purpose: Pick up to 5 queued PMB runs for today and generate each post.
//          Runs are atomic — claimQueuedRunsForToday() prevents double-processing.
// =============================================================================

import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import {
  claimQueuedRunsForToday,
  updatePmbRunResult,
  isTodayQueueComplete,
} from '@/lib/db/pmb'
import { generatePmbPost, type PmbGenerateResult } from '@/lib/services/pmb-generator'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request): Promise<NextResponse> {
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/pmb/daily-publisher', getTriggeredBy(request))

  try {
    const batch = await claimQueuedRunsForToday(5)

    if (batch.length === 0) {
      const complete = await isTodayQueueComplete()
      await endCronRun(runId, cronStart, 'ok', {
        summary: complete ? 'queue_complete' : 'nothing_due_now',
      })
      return NextResponse.json({ ok: true, processed: 0, reason: 'queue_empty' })
    }

    logger.info('PMB daily-publisher: claimed batch', { count: batch.length, ids: batch.map(r => r.id) })

    const results = await Promise.allSettled(
      batch.map(async run => {
        try {
          const result: PmbGenerateResult = await generatePmbPost(run)

          if (!result.success) {
            await updatePmbRunResult(run.id, {
              status: 'failed',
              error_message: result.error ?? 'Generation failed',
            })
            logger.error('PMB run generation returned failure', { runId: run.id, error: result.error })
            return { id: run.id, ok: false, error: result.error }
          }

          await updatePmbRunResult(run.id, {
            status: 'generated',
            blog_post_id: result.blog_post_id,
            word_count: result.word_count,
            generated_at: new Date().toISOString(),
            error_message: null,
          })

          logger.info('PMB run generated', { runId: run.id, blogPostId: result.blog_post_id, type: run.post_type })
          return { id: run.id, ok: true }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          logger.error('PMB run failed', { runId: run.id, error: message })

          await updatePmbRunResult(run.id, {
            status: 'failed',
            error_message: message,
          })

          return { id: run.id, ok: false, error: message }
        }
      })
    )

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.ok).length
    const failed = results.length - succeeded

    const summary = `generated:${succeeded} failed:${failed} of ${batch.length}`
    logger.info('PMB daily-publisher: batch done', { succeeded, failed, total: batch.length })
    await endCronRun(runId, cronStart, failed > 0 ? 'error' : 'ok', { summary })

    return NextResponse.json({
      ok: true,
      processed: batch.length,
      succeeded,
      failed,
      results: results.map(r => (r.status === 'fulfilled' ? r.value : { ok: false, error: String(r.reason) })),
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('pmb/daily-publisher error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

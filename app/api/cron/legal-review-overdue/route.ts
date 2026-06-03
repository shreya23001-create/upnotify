import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { requireCronAuth } from '@/lib/auth/cron-auth'

// blog_posts columns from migration 00101 not yet in generated database.types.ts
function getRawClient(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const OVERDUE_DAYS = 90

export async function GET(request: Request): Promise<NextResponse> {
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/legal-review-overdue', getTriggeredBy(request))

  try {
    const supabase = getRawClient()

    const cutoff = new Date(Date.now() - OVERDUE_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { data: overdue, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, created_at')
      .eq('post_type', 'commercial')
      .is('legal_review_outcome', null)
      .lt('created_at', cutoff)

    if (error) {
      logger.error('legal-review-overdue: query failed', { error: error.message })
      await endCronRun(runId, cronStart, 'error', { errorMessage: error.message })
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    const count = overdue?.length ?? 0

    if (count === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_overdue' })
      return NextResponse.json({ ok: true, overdue: 0 })
    }

    // Log overdue posts — email alerting is handled by the Resend integration
    // when it is wired in Phase 2. For now, log loudly so Sentry catches it.
    logger.error('legal-review-overdue: commercial posts unreviewed for 90+ days', {
      count,
      posts: overdue!.map(p => ({ id: p.id, title: p.title, slug: p.slug, createdAt: p.created_at })),
    })

    await endCronRun(runId, cronStart, 'ok', { summary: `overdue_alert: ${count} post(s)` })
    return NextResponse.json({ ok: true, overdue: count })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('legal-review-overdue: unexpected error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

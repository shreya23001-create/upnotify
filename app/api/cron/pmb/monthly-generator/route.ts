// =============================================================================
// Cron: pmb/monthly-generator
// Schedule: 1st of every month at 07:00 UTC (0 7 1 * *)
// Purpose: Queue monthly category report runs — one leaderboard per category
//          covering the full previous calendar month.
// =============================================================================

import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import {
  getPmbEnabledMonitors,
  getPmbCategories,
  createPmbRuns,
} from '@/lib/db/pmb'
import type { CreatePmbRunInput } from '@/lib/db/pmb'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** First day of the previous calendar month (UTC) */
function getPreviousMonthStart(): string {
  const d = new Date()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() - 1)
  return d.toISOString().split('T')[0]
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
  const runId = await startCronRun('/api/cron/pmb/monthly-generator', getTriggeredBy(request))

  try {
    const periodStart = getPreviousMonthStart()
    const today = new Date().toISOString().split('T')[0]

    const [monitors, categories] = await Promise.all([
      getPmbEnabledMonitors(),
      getPmbCategories(),
    ])

    if (monitors.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_enabled_monitors' })
      return NextResponse.json({ ok: true, reason: 'no_enabled_monitors' })
    }

    const categoryMap = new Map(categories.map(c => [c.slug, c]))

    // Collect categories that have ≥2 enabled monitors
    const activeCategories = new Set<string>()
    for (const m of monitors) {
      const slug = m.pmb_category ?? m.category
      if (categoryMap.has(slug)) activeCategories.add(slug)
    }

    const runs: CreatePmbRunInput[] = []

    for (const slug of activeCategories) {
      const groupMonitors = monitors.filter(m => (m.pmb_category ?? m.category) === slug)
      if (groupMonitors.length < 2) continue

      runs.push({
        run_key: `lb:${slug}:monthly:${periodStart}`,
        post_type: 'leaderboard',
        category_slug: slug,
        monitor_id: null,
        compare_monitor_id: null,
        period_type: 'monthly',
        period_start: periodStart,
        scheduled_for: today,
      })
    }

    if (runs.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_categories_with_enough_monitors' })
      return NextResponse.json({ ok: true, reason: 'no_categories_eligible' })
    }

    const inserted = await createPmbRuns(runs)

    logger.info('PMB monthly runs queued', {
      periodStart,
      categories: runs.length,
      inserted,
      scheduledFor: today,
    })

    await endCronRun(runId, cronStart, 'ok', {
      summary: `monthly:${inserted}/${runs.length} queued for ${periodStart}`,
    })

    return NextResponse.json({
      ok: true,
      periodStart,
      scheduledFor: today,
      categories: runs.length,
      inserted,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('pmb/monthly-generator error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

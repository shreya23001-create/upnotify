// =============================================================================
// Cron: pmb/week-planner
// Schedule: Every Monday at 05:00 UTC (0 5 * * 1)
// Purpose: Plan the week's PMB posts and spread them Mon–Sun in pmb_runs table.
//          Idempotent — run_key unique constraint prevents duplicate rows.
// =============================================================================

import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import {
  getPmbEnabledMonitors,
  getPmbCategories,
  createPmbRuns,
  pmbWeekPlanExists,
} from '@/lib/db/pmb'
import type { CreatePmbRunInput } from '@/lib/db/pmb'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Monday of the current week (UTC) */
function getWeekStart(): string {
  const d = new Date()
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
  d.setUTCDate(diff)
  return d.toISOString().split('T')[0]
}

/** Add `days` calendar days to a YYYY-MM-DD string */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

/** Deterministic run_key for pairwise: lower domain first */
function pairwiseKey(monitorA: string, monitorB: string, periodStart: string): string {
  const [lo, hi] = [monitorA, monitorB].sort()
  return `pw:${lo}:${hi}:weekly:${periodStart}`
}

/** Deterministic run_key for leaderboard */
function leaderboardKey(categorySlug: string, periodStart: string): string {
  return `lb:${categorySlug}:weekly:${periodStart}`
}

export async function GET(request: Request): Promise<NextResponse> {
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/pmb/week-planner', getTriggeredBy(request))

  try {
    const weekStart = getWeekStart()

    // Idempotency: if plan already exists skip (but still return 200)
    const exists = await pmbWeekPlanExists(weekStart)
    if (exists) {
      await endCronRun(runId, cronStart, 'ok', { summary: `already_planned:${weekStart}` })
      return NextResponse.json({ ok: true, reason: 'already_planned', weekStart })
    }

    const [monitors, categories] = await Promise.all([
      getPmbEnabledMonitors(),
      getPmbCategories(),
    ])

    if (monitors.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_enabled_monitors' })
      return NextResponse.json({ ok: true, reason: 'no_enabled_monitors' })
    }

    // Build category slug → category map for quick lookup
    const categoryMap = new Map(categories.map(c => [c.slug, c]))

    // ── Build pairwise runs ──────────────────────────────────────────────────
    // Group monitors by PMB category. For each category, create all pairings.
    const byCategory = new Map<string, typeof monitors>()
    for (const m of monitors) {
      const slug = m.pmb_category ?? m.category
      if (!categoryMap.has(slug)) continue
      const group = byCategory.get(slug) ?? []
      group.push(m)
      byCategory.set(slug, group)
    }

    const allRuns: Omit<CreatePmbRunInput, 'scheduled_for'>[] = []

    for (const [slug, group] of byCategory.entries()) {
      // Pairwise: every unique pair in this category
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          allRuns.push({
            run_key: pairwiseKey(group[i].domain, group[j].domain, weekStart),
            post_type: 'pairwise',
            category_slug: slug,
            monitor_id: group[i].id,
            compare_monitor_id: group[j].id,
            period_type: 'weekly',
            period_start: weekStart,
          })
        }
      }

      // Leaderboard: one per category (needs ≥2 monitors)
      if (group.length >= 2) {
        allRuns.push({
          run_key: leaderboardKey(slug, weekStart),
          post_type: 'leaderboard',
          category_slug: slug,
          monitor_id: null,
          compare_monitor_id: null,
          period_type: 'weekly',
          period_start: weekStart,
        })
      }
    }

    const total = allRuns.length
    if (total === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_runs_to_plan' })
      return NextResponse.json({ ok: true, reason: 'no_runs_to_plan' })
    }

    // ── Spread across 7 days ──────────────────────────────────────────────────
    // Divide evenly; remainder goes to Monday (day 0)
    const perDay = Math.floor(total / 7)
    const remainder = total % 7

    const runsWithDates: CreatePmbRunInput[] = allRuns.map((run, idx) => {
      // First `remainder` slots get an extra item on day 0 (Monday)
      let dayOffset: number
      if (idx < remainder) {
        dayOffset = 0
      } else {
        const adjustedIdx = idx - remainder
        dayOffset = Math.floor(adjustedIdx / perDay)
        if (dayOffset > 6) dayOffset = 6 // cap at Sunday
      }
      return {
        ...run,
        scheduled_for: addDays(weekStart, dayOffset),
      }
    })

    const inserted = await createPmbRuns(runsWithDates)

    logger.info('PMB week plan created', {
      weekStart,
      total,
      perDay,
      remainder,
      inserted,
      monitors: monitors.length,
      categories: byCategory.size,
    })

    await endCronRun(runId, cronStart, 'ok', {
      summary: `planned:${inserted}/${total} runs across week ${weekStart}`,
    })

    return NextResponse.json({
      ok: true,
      weekStart,
      total,
      inserted,
      perDay,
      remainder,
      categories: byCategory.size,
      monitors: monitors.length,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('pmb/week-planner error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

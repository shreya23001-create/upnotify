/**
 * Health Score Cron — /api/cron/health-scores
 *
 * Runs weekly (or on-demand from admin panel).
 * Computes a 0–100 health score for every organisation using 8 bulk queries —
 * NOT one per org. Results are cached in organisations.health_score.
 *
 * Scoring rubric (total 100):
 *   Growth       0–20  monitor.created events in last 30 days (audit_log)
 *   Engagement   0–20  active monitors + alert channels + status pages
 *   Plan Fit     0–20  monitor count vs plan limit (headroom)
 *   Financial    0–20  lifetime spend + invoice count
 *   Stability    0–20  inverse of open incidents + down monitors
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function isAuthorised(req: Request): Promise<boolean> {
  // Accept cron secret header (used by cron-job.org / Vercel crons)
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true

  // Also accept logged-in super admins triggering from the admin UI
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

function scoreLabel(score: number): string {
  if (score >= 75) return 'Healthy'
  if (score >= 50) return 'Watch'
  if (score >= 25) return 'At Risk'
  return 'Critical'
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!(await isAuthorised(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/health-scores', getTriggeredBy(req))

  const supabase = createAdminClient()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  try {
    // 8 bulk queries — one per data type, across ALL orgs
    const [
      { data: orgsRaw },
      { data: monitorsRaw },
      { data: downMonitorsRaw },
      { data: alertsRaw },
      { data: statusPagesRaw },
      { data: subsRaw },
      { data: invoicesRaw },
      { data: recentMonitorCreatesRaw },
      { data: openIncidentsRaw },
    ] = await Promise.all([
      supabase.from('organisations').select('id'),
      supabase.from('monitors').select('org_id, status, is_paused'),
      supabase.from('monitors').select('org_id').eq('status', 'down').eq('is_paused', false),
      supabase.from('alert_channels').select('org_id').eq('is_enabled', true),
      supabase.from('status_pages').select('org_id'),
      supabase.from('subscriptions').select('org_id, status, plans(slug, monitor_limit)').eq('status', 'active'),
      supabase.from('invoices').select('org_id, amount_gbp, currency').eq('status', 'paid'),
      supabase.from('audit_log').select('org_id').eq('action', 'monitor.created').gte('created_at', thirtyDaysAgo),
      supabase.from('incidents').select('org_id').is('resolved_at', null),
    ])

    if (!orgsRaw || orgsRaw.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: no organisations found' })
      return NextResponse.json({ success: true, processed: 0 })
    }

    // ── Build lookup maps ──────────────────────────────────────────────────

    type MonRow = { org_id: string; status: string; is_paused: boolean }
    const monByOrg = new Map<string, { total: number; active: number }>()
    for (const m of (monitorsRaw ?? []) as MonRow[]) {
      const e = monByOrg.get(m.org_id) ?? { total: 0, active: 0 }
      e.total++
      if (!m.is_paused) e.active++
      monByOrg.set(m.org_id, e)
    }

    const downByOrg = new Map<string, number>()
    for (const m of (downMonitorsRaw ?? []) as { org_id: string }[]) {
      downByOrg.set(m.org_id, (downByOrg.get(m.org_id) ?? 0) + 1)
    }

    const alertsByOrg = new Map<string, number>()
    for (const a of (alertsRaw ?? []) as { org_id: string }[]) {
      alertsByOrg.set(a.org_id, (alertsByOrg.get(a.org_id) ?? 0) + 1)
    }

    const statusPagesByOrg = new Map<string, number>()
    for (const sp of (statusPagesRaw ?? []) as { org_id: string }[]) {
      statusPagesByOrg.set(sp.org_id, (statusPagesByOrg.get(sp.org_id) ?? 0) + 1)
    }

    type SubRow = { org_id: string; status: string; plans: { slug: string; monitor_limit: number | null } | null }
    const subByOrg = new Map<string, SubRow>()
    for (const s of (subsRaw ?? []) as unknown as SubRow[]) {
      subByOrg.set(s.org_id, s)
    }

    type InvRow = { org_id: string; amount_gbp: number; currency: string }
    const invoicesByOrg = new Map<string, { totalPence: number; count: number }>()
    for (const inv of (invoicesRaw ?? []) as InvRow[]) {
      const e = invoicesByOrg.get(inv.org_id) ?? { totalPence: 0, count: 0 }
      // INR invoices store paise — skip them here so the GBP-calibrated financial score isn't inflated
      if ((inv.currency ?? 'gbp').toLowerCase() !== 'inr') {
        e.totalPence += inv.amount_gbp ?? 0
      }
      e.count++
      invoicesByOrg.set(inv.org_id, e)
    }

    const recentCreatesByOrg = new Map<string, number>()
    for (const row of (recentMonitorCreatesRaw ?? []) as { org_id: string }[]) {
      if (row.org_id) {
        recentCreatesByOrg.set(row.org_id, (recentCreatesByOrg.get(row.org_id) ?? 0) + 1)
      }
    }

    const openIncidentsByOrg = new Map<string, number>()
    for (const inc of (openIncidentsRaw ?? []) as { org_id: string }[]) {
      openIncidentsByOrg.set(inc.org_id, (openIncidentsByOrg.get(inc.org_id) ?? 0) + 1)
    }

    // ── Score each org ─────────────────────────────────────────────────────

    const updates: Array<{ id: string; health_score: number; health_score_label: string; health_score_at: string }> = []
    const nowIso = now.toISOString()

    for (const org of orgsRaw as { id: string }[]) {
      const id = org.id
      const monitors = monByOrg.get(id) ?? { total: 0, active: 0 }
      const downCount = downByOrg.get(id) ?? 0
      const alertCount = alertsByOrg.get(id) ?? 0
      const statusPageCount = statusPagesByOrg.get(id) ?? 0
      const sub = subByOrg.get(id)
      const invoiceData = invoicesByOrg.get(id) ?? { totalPence: 0, count: 0 }
      const recentCreates = recentCreatesByOrg.get(id) ?? 0
      const openIncidents = openIncidentsByOrg.get(id) ?? 0

      // Growth score 0–20: monitors created in last 30 days
      // 1 = 5pts, 2 = 10pts, 3 = 15pts, 4+ = 20pts
      const growthScore = Math.min(20, recentCreates * 5)

      // Engagement score 0–20: active resources
      // active monitors (≥5=10pts), alert channels (≥1=5pts), status pages (≥1=5pts)
      const engagementScore = Math.min(10, Math.round((monitors.active / 5) * 10))
        + (alertCount >= 1 ? 5 : 0)
        + (statusPageCount >= 1 ? 5 : 0)

      // Plan fit score 0–20: headroom to limit (the more room, the better setup)
      // Free/no-sub = 0. Has sub with usage > 0 = starts scoring. Not maxed out = bonus.
      let planFitScore = 0
      if (sub) {
        const limit = sub.plans?.monitor_limit ?? undefined
        if (limit === null || limit === undefined) {
          // Unlimited plan — full points if they have monitors
          planFitScore = monitors.total > 0 ? 20 : 10
        } else if (limit > 0) {
          const usage = monitors.total / limit
          if (usage < 0.5) planFitScore = 10        // using < 50% — room to grow
          else if (usage < 0.8) planFitScore = 18   // using 50–80% — good fit
          else planFitScore = 20                     // using > 80% — nearing limit, upgrade candidate
        }
      }

      // Financial score 0–20: lifetime spend + invoice history
      const totalGbp = invoiceData.totalPence / 100
      const financialScore = Math.min(20, Math.round((totalGbp / 200) * 20))

      // Stability score 0–20: down monitors and open incidents are bad
      // Start at 20, subtract for issues
      const stabilityScore = Math.max(0, 20 - (downCount * 5) - (openIncidents * 3))

      const total = growthScore + engagementScore + planFitScore + financialScore + stabilityScore

      updates.push({
        id,
        health_score: Math.min(100, total),
        health_score_label: scoreLabel(Math.min(100, total)),
        health_score_at: nowIso,
      })
    }

    // ── Bulk update ────────────────────────────────────────────────────────
    // Run updates in parallel batches of 50
    const BATCH = 50
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as unknown as any
      await Promise.all(
        batch.map((u: { id: string; health_score: number; health_score_label: string; health_score_at: string }) =>
          // Cast required: health_score columns not yet in generated DB types
          (client.from('organisations') as ReturnType<typeof supabase.from>)
            .update({ health_score: u.health_score, health_score_label: u.health_score_label, health_score_at: u.health_score_at })
            .eq('id', u.id)
        )
      )
    }

    logger.info('Health scores computed', { count: updates.length })
    await endCronRun(runId, cronStart, 'ok', { summary: `processed: ${updates.length}` })
    return NextResponse.json({ success: true, processed: updates.length, at: nowIso })

  } catch (error) {
    const message = String(error)
    logger.error('Health score cron failed', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

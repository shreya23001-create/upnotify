import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Cron-internal log table: always use a fixed retention window
const CRON_LOG_RETENTION_DAYS = 14

// Tables where check results are stored, keyed by monitor ownership
const CHECK_TABLES = ['check_results', 'public_check_results'] as const

const BATCH_SIZE = 10000

export async function GET(request: Request): Promise<NextResponse> {
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/data-retention', getTriggeredBy(request))

  try {
    const supabase = createAdminClient()
    const totalDeleted: Record<string, number> = {}

    // ── 1. Per-org retention for check result tables ──────────────────────────
    // Fetch every org with its plan's data_retention_days.
    // Orgs without a paid subscription fall back to the Free plan's 7-day default.
    const { data: orgs, error: orgsError } = await supabase
      .from('organisations')
      .select(`
        id,
        subscriptions!inner(
          status,
          plans(data_retention_days)
        )
      `)
      .in('subscriptions.status', ['active', 'cancelling', 'paused', 'past_due'])

    if (orgsError) {
      logger.error('Data retention: failed to fetch org/plan data', { error: orgsError.message })
      await endCronRun(runId, cronStart, 'error', { errorMessage: orgsError.message })
      return NextResponse.json({ error: 'Failed to fetch org data' }, { status: 500 })
    }

    // Build org → retentionDays map. Orgs not in the paid list get FREE default (7 days).
    const FREE_RETENTION_DAYS = 7
    const orgRetentionMap = new Map<string, number>()

    for (const org of orgs ?? []) {
      const subs = (org as Record<string, unknown>).subscriptions as Array<{
        status: string
        plans: { data_retention_days: number | null } | null
      }>
      const activeSub = subs?.[0]
      const retentionDays = activeSub?.plans?.data_retention_days ?? FREE_RETENTION_DAYS
      orgRetentionMap.set(org.id as string, retentionDays)
    }

    // Fetch ALL org ids so we can apply FREE_RETENTION_DAYS to orgs with no paid sub
    const { data: allOrgs } = await supabase.from('organisations').select('id')
    for (const org of allOrgs ?? []) {
      if (!orgRetentionMap.has(org.id as string)) {
        orgRetentionMap.set(org.id as string, FREE_RETENTION_DAYS)
      }
    }

    for (const table of CHECK_TABLES) {
      let tableTotal = 0

      for (const [orgId, retentionDays] of orgRetentionMap) {
        const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()
        let batchDeleted = 0

        do {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: rows, error: selectError } = await (supabase as any)
            .from(table)
            .select('id')
            .eq('org_id', orgId)
            .lt('checked_at', cutoff)
            .limit(BATCH_SIZE)

          if (selectError) {
            logger.error('Data retention select failed', { table, orgId, error: selectError.message })
            break
          }

          if (!rows || rows.length === 0) {
            batchDeleted = 0
            break
          }

          const ids = (rows as Array<{ id: string }>).map(r => r.id)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: deleteError } = await (supabase as any)
            .from(table)
            .delete()
            .in('id', ids)

          if (deleteError) {
            logger.error('Data retention delete failed', { table, orgId, error: deleteError.message })
            break
          }

          batchDeleted = ids.length
          tableTotal += batchDeleted
        } while (batchDeleted === BATCH_SIZE)
      }

      totalDeleted[table] = tableTotal
      logger.info('Data retention complete for table', { table, deleted: tableTotal })
    }

    // ── 2. Fixed retention for cron log (not per-org) ─────────────────────────
    const cronCutoff = new Date(Date.now() - CRON_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    let cronLogDeleted = 0
    let batchDeleted = 0

    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows, error: selectError } = await (supabase as any)
        .from('cron_run_log')
        .select('id')
        .lt('ran_at', cronCutoff)
        .limit(BATCH_SIZE)

      if (selectError) {
        logger.error('Data retention select failed', { table: 'cron_run_log', error: selectError.message })
        break
      }

      if (!rows || rows.length === 0) {
        batchDeleted = 0
        break
      }

      const ids = (rows as Array<{ id: string }>).map(r => r.id)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from('cron_run_log')
        .delete()
        .in('id', ids)

      if (deleteError) {
        logger.error('Data retention delete failed', { table: 'cron_run_log', error: deleteError.message })
        break
      }

      batchDeleted = ids.length
      cronLogDeleted += batchDeleted
    } while (batchDeleted === BATCH_SIZE)

    totalDeleted['cron_run_log'] = cronLogDeleted

    const summary = Object.entries(totalDeleted).map(([t, n]) => `${t}:${n}`).join(', ')
    await endCronRun(runId, cronStart, 'ok', { summary })
    return NextResponse.json({ ok: true, deleted: totalDeleted })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown'
    logger.error('Data retention cron error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

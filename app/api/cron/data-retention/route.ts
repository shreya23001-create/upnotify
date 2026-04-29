import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const RETENTION_CONFIG: Array<{ table: string; dateColumn: string; days: number }> = [
  { table: 'check_results', dateColumn: 'checked_at', days: 30 },
  { table: 'public_check_results', dateColumn: 'checked_at', days: 30 },
  { table: 'cron_run_log', dateColumn: 'ran_at', days: 14 },
]

const BATCH_SIZE = 10000

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
  const runId = await startCronRun('/api/cron/data-retention', getTriggeredBy(request))

  try {
    const supabase = createAdminClient()
    const results: Record<string, number> = {}

    for (const { table, dateColumn, days } of RETENTION_CONFIG) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      let totalDeleted = 0
      let batchDeleted = 0

      do {
        // Select IDs first (PostgREST doesn't support LIMIT on DELETE directly)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rows, error: selectError } = await (supabase as any)
          .from(table)
          .select('id')
          .lt(dateColumn, cutoff)
          .limit(BATCH_SIZE)

        if (selectError) {
          logger.error('Data retention select failed', { table, error: selectError.message })
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
          logger.error('Data retention delete failed', { table, error: deleteError.message })
          break
        }

        batchDeleted = ids.length
        totalDeleted += batchDeleted
      } while (batchDeleted === BATCH_SIZE)

      results[table] = totalDeleted
      logger.info('Data retention complete for table', { table, deleted: totalDeleted, retentionDays: days })
    }

    const summary = Object.entries(results).map(([t, n]) => `${t}:${n}`).join(', ')
    await endCronRun(runId, cronStart, 'ok', { summary })
    return NextResponse.json({ ok: true, deleted: results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown'
    logger.error('Data retention cron error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { buildAndSendBossDigest } from '@/lib/services/boss-digest'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
  const runId = await startCronRun('/api/cron/boss-digest', getTriggeredBy(request))

  try {
    const result = await buildAndSendBossDigest()

    if (!result.ok) {
      await endCronRun(runId, cronStart, 'error', {
        errorMessage: result.errorMessage ?? 'Digest send failed',
      })
      return NextResponse.json({
        ok: false,
        draftCount: result.draftCount,
        error: result.errorMessage,
      })
    }

    await endCronRun(runId, cronStart, 'ok', {
      summary: result.draftCount === 0
        ? 'queue_empty'
        : `sent: ${result.draftCount} drafts to ${result.recipients.length} recipient(s)`,
    })

    logger.info('boss-digest cron completed', {
      draftCount: result.draftCount,
      recipients: result.recipients.length,
    })

    return NextResponse.json({
      ok: true,
      draftCount: result.draftCount,
      recipients: result.recipients.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('boss-digest cron error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
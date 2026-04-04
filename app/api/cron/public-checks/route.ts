import { NextResponse } from 'next/server'
import {
  getActivePublicMonitors,
  writePublicCheckResult,
  updatePublicMonitorStatus,
  getOpenPublicIncident,
  createPublicIncident,
  resolvePublicIncident,
} from '@/lib/db/public-monitors'
import type { PublicMonitor } from '@/lib/db/public-monitors'
import type { CheckerResult } from '@/lib/checkers/types'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface FirstCheckResult {
  monitor: PublicMonitor
  result: CheckerResult
}

/**
 * Run an HTTP check against a public monitor's domain.
 * Simplified version of the full checker — only does HTTP GET.
 */
async function runHttpCheck(monitor: PublicMonitor): Promise<CheckerResult> {
  const url = monitor.domain.startsWith('http')
    ? monitor.domain
    : `https://${monitor.domain}`

  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)
    const responseTimeMs = Date.now() - start

    if (response.status >= 500) {
      return { status: 'down', responseTimeMs, statusCode: response.status, errorMessage: `Server error: ${response.status}` }
    }

    if (response.status >= 400) {
      return { status: 'degraded', responseTimeMs, statusCode: response.status, errorMessage: `Client error: ${response.status}` }
    }

    return { status: 'up', responseTimeMs, statusCode: response.status }
  } catch (error) {
    const responseTimeMs = Date.now() - start
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('abort')) {
      return { status: 'down', responseTimeMs, errorMessage: 'Timeout after 15000ms' }
    }
    return { status: 'down', responseTimeMs, errorMessage: message }
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const { cron } = getServerConfig()
  const cronSecret = cron.secret

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const isVercelCron = request.headers.get('x-vercel-cron')
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const allMonitors = await getActivePublicMonitors()

    // In non-production, only check 15 random sites to avoid timeout on Hobby plan
    const isProduction = process.env.VERCEL_ENV === 'production'
    const monitors = isProduction
      ? allMonitors
      : allMonitors.sort(() => Math.random() - 0.5).slice(0, 15)

    logger.info('Public check runner started', { total: allMonitors.length, checking: monitors.length, isProduction })

    // Run checks in batches of 5 to avoid timeout
    const BATCH_SIZE = 5
    const allResults: PromiseSettledResult<FirstCheckResult>[] = []

    for (let i = 0; i < monitors.length; i += BATCH_SIZE) {
      const batch = monitors.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (monitor): Promise<FirstCheckResult> => {
          const result = await runHttpCheck(monitor)
          await writePublicCheckResult({
            monitor_id: monitor.id,
            status: result.status,
            response_time_ms: result.responseTimeMs,
            status_code: result.statusCode,
            error_message: result.errorMessage,
          })
          return { monitor, result }
        })
      )
      allResults.push(...batchResults)
    }

    const firstChecks = allResults

    // Separate into up and down
    const upResults: FirstCheckResult[] = []
    const downResults: FirstCheckResult[] = []

    for (const r of firstChecks) {
      if (r.status === 'fulfilled') {
        if (r.value.result.status === 'down') {
          downResults.push(r.value)
        } else {
          upResults.push(r.value)
        }
      }
    }

    // Phase 2: Handle UP monitors immediately
    await Promise.allSettled(
      upResults.map(async ({ monitor, result }) => {
        const now = new Date().toISOString()

        // If was previously down, resolve the incident
        if (monitor.last_status === 'down') {
          await resolvePublicIncident(monitor.id)
          logger.info('Public monitor recovered', { domain: monitor.domain })
        }

        await updatePublicMonitorStatus(monitor.id, {
          last_status: result.status,
          last_checked_at: now,
          last_response_time_ms: result.responseTimeMs ?? null,
        })
      })
    )

    // Phase 3: Wait 5 seconds, then confirm DOWN monitors
    if (downResults.length > 0) {
      await sleep(5000)

      await Promise.allSettled(
        downResults.map(async ({ monitor }) => {
          const confirmation = await runHttpCheck(monitor)
          const now = new Date().toISOString()

          await writePublicCheckResult({
            monitor_id: monitor.id,
            status: confirmation.status,
            response_time_ms: confirmation.responseTimeMs,
            status_code: confirmation.statusCode,
            error_message: confirmation.errorMessage,
          })

          if (confirmation.status === 'down') {
            // Two-confirmation: confirmed down
            const existingIncident = await getOpenPublicIncident(monitor.id)
            if (!existingIncident) {
              await createPublicIncident({
                monitor_id: monitor.id,
                cause: confirmation.errorMessage ?? 'Site unreachable',
                status_code: confirmation.statusCode,
              })
              logger.warn('Public monitor confirmed down', { domain: monitor.domain })
            }

            await updatePublicMonitorStatus(monitor.id, {
              last_status: 'down',
              last_checked_at: now,
              last_response_time_ms: confirmation.responseTimeMs ?? null,
            })
          } else {
            // Flap — first check failed, confirmation passed
            logger.info('Public monitor flapped', { domain: monitor.domain })
            await updatePublicMonitorStatus(monitor.id, {
              last_status: confirmation.status,
              last_checked_at: now,
              last_response_time_ms: confirmation.responseTimeMs ?? null,
            })
          }
        })
      )
    }

    logger.info('Public check runner completed', { total: monitors.length, down: downResults.length })
    return NextResponse.json({ ok: true, checked: monitors.length, down: downResults.length })
  } catch (error) {
    logger.error('Public check runner error', { error: error instanceof Error ? error.message : 'Unknown' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

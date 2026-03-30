import { NextResponse } from 'next/server'
import { getDueMonitors, getAllActiveMonitors, updateMonitorStatus, incrementFlapCount } from '@/lib/db/monitors'
import { writeCheckResult } from '@/lib/db/check-results'
import { createIncident, resolveIncident, getOpenIncidentForMonitor } from '@/lib/db/incidents'
import { isMonitorInMaintenance } from '@/lib/db/maintenance-windows'
import { dispatchChecker } from '@/lib/services/checker'
import { logger } from '@/lib/utils/logger'
import type { Monitor } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runCheck(monitor: Monitor): Promise<void> {
  // Skip if in maintenance
  const inMaintenance = await isMonitorInMaintenance(monitor.id, monitor.org_id)
  if (inMaintenance) {
    logger.info('Monitor in maintenance, skipping', { monitorId: monitor.id })
    const now = new Date()
    const nextCheck = new Date(now.getTime() + monitor.check_interval_seconds * 1000)
    await updateMonitorStatus(monitor.id, {
      status: monitor.status,
      last_checked_at: now.toISOString(),
      next_check_at: nextCheck.toISOString(),
    })
    return
  }

  // Run the check
  const result = await dispatchChecker(monitor)

  // Write check result
  await writeCheckResult({
    org_id: monitor.org_id,
    monitor_id: monitor.id,
    status: result.status,
    response_time_ms: result.responseTimeMs,
    status_code: result.statusCode,
    error_message: result.errorMessage,
    metadata: result.metadata,
  })

  const now = new Date()
  const nextCheck = new Date(now.getTime() + monitor.check_interval_seconds * 1000)

  if (result.status === 'down') {
    // Two-confirmation: wait 30s and check again
    logger.info('First check failed, waiting for confirmation', { monitorId: monitor.id })
    await sleep(30000)

    const confirmation = await dispatchChecker(monitor)

    // Write confirmation result
    await writeCheckResult({
      org_id: monitor.org_id,
      monitor_id: monitor.id,
      status: confirmation.status,
      response_time_ms: confirmation.responseTimeMs,
      status_code: confirmation.statusCode,
      error_message: confirmation.errorMessage,
      metadata: { ...confirmation.metadata, isConfirmationCheck: true },
    })

    if (confirmation.status === 'down') {
      // Confirmed down — create incident if not already open
      const existingIncident = await getOpenIncidentForMonitor(monitor.id)
      if (!existingIncident) {
        await createIncident({
          org_id: monitor.org_id,
          workspace_id: monitor.workspace_id,
          monitor_id: monitor.id,
          title: `${monitor.name} is down`,
          severity: monitor.severity,
        })
        logger.warn('Monitor confirmed down, incident created', { monitorId: monitor.id, name: monitor.name })
      }

      await updateMonitorStatus(monitor.id, {
        status: 'down',
        last_checked_at: now.toISOString(),
        next_check_at: nextCheck.toISOString(),
      })
    } else {
      // Flap — first check failed but second passed
      await incrementFlapCount(monitor.id)
      logger.info('Monitor flapped', { monitorId: monitor.id })

      await updateMonitorStatus(monitor.id, {
        status: 'up',
        last_checked_at: now.toISOString(),
        next_check_at: nextCheck.toISOString(),
      })
    }
  } else {
    // Check passed
    if (monitor.status === 'down') {
      // Was down, now up — resolve incident
      await resolveIncident(monitor.id)
      logger.info('Monitor recovered', { monitorId: monitor.id, name: monitor.name })
    }

    await updateMonitorStatus(monitor.id, {
      status: result.status,
      last_checked_at: now.toISOString(),
      next_check_at: nextCheck.toISOString(),
    })
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  // Verify cron authorization (Vercel sets this header)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also allow Vercel's internal cron header
    const isVercelCron = request.headers.get('x-vercel-cron')
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const monitors = force ? await getAllActiveMonitors() : await getDueMonitors()
    logger.info('Check runner started', { dueMonitors: monitors.length, force })

    const results = await Promise.allSettled(
      monitors.map(monitor => runCheck(monitor))
    )

    const failed = results.filter(r => r.status === 'rejected').length

    logger.info('Check runner completed', { total: monitors.length, failed })

    return NextResponse.json({ ok: true, checked: monitors.length, failed })
  } catch (error) {
    logger.error('Check runner error', { error: error instanceof Error ? error.message : 'Unknown' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

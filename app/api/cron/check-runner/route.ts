import { NextResponse } from 'next/server'
import { getDueMonitors, getAllActiveMonitors, updateMonitorStatus, incrementFlapCount, patchMonitorConfig } from '@/lib/db/monitors'
import { writeCheckResult } from '@/lib/db/check-results'
import { createIncident, resolveIncident, getOpenIncidentForMonitor } from '@/lib/db/incidents'
import { isMonitorInMaintenance } from '@/lib/db/maintenance-windows'
import { dispatchChecker } from '@/lib/services/checker'
import { dispatchAlerts, dispatchRecoveryAlerts } from '@/lib/services/alert-dispatcher'
import { getAlertCopy } from '@/lib/utils/alert-copy'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import type { Monitor } from '@/lib/types'
import type { CheckerResult } from '@/lib/checkers/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface FirstCheckResult {
  monitor: Monitor
  result: CheckerResult
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

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/check-runner', getTriggeredBy(request))

  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const allMonitors = force ? await getAllActiveMonitors() : await getDueMonitors()
    logger.info('Check runner started', { dueMonitors: allMonitors.length, force })

    // Filter out monitors in maintenance (parallel DB calls)
    const maintenanceChecks = await Promise.allSettled(
      allMonitors.map(async (m) => ({
        monitor: m,
        inMaintenance: await isMonitorInMaintenance(m.id, m.org_id),
      }))
    )

    const monitors: Monitor[] = []
    const maintenanceUpdates: Promise<void>[] = []

    for (const r of maintenanceChecks) {
      if (r.status !== 'fulfilled') continue
      const { monitor: m, inMaintenance } = r.value
      if (inMaintenance) {
        const now = new Date()
        maintenanceUpdates.push(updateMonitorStatus(m.id, {
          status: m.status,
          last_checked_at: now.toISOString(),
          next_check_at: new Date(now.getTime() + m.check_interval_seconds * 1000).toISOString(),
        }))
      } else {
        monitors.push(m)
      }
    }

    await Promise.allSettled(maintenanceUpdates)

    // Phase 1: Run ALL first checks in parallel
    const firstChecks = await Promise.allSettled(
      monitors.map(async (monitor): Promise<FirstCheckResult> => {
        const result = await dispatchChecker(monitor)
        await writeCheckResult({
          org_id: monitor.org_id,
          monitor_id: monitor.id,
          status: result.status,
          response_time_ms: result.responseTimeMs,
          status_code: result.statusCode,
          error_message: result.errorMessage,
          metadata: result.metadata,
        })
        // Persist baseline values for change-detection monitors (ip-change, dns, robots-txt, etc.)
        if (result.configUpdates && Object.keys(result.configUpdates).length > 0) {
          await patchMonitorConfig(
            monitor.id,
            (monitor.config as Record<string, unknown>) ?? {},
            result.configUpdates as Record<string, unknown>
          )
        }
        return { monitor, result }
      })
    )

    // Separate into up and down results
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

    // Phase 2: Handle UP monitors immediately (no waiting)
    await Promise.allSettled(
      upResults.map(async ({ monitor, result }) => {
        const now = new Date()
        const nextCheck = new Date(now.getTime() + monitor.check_interval_seconds * 1000)

        if (monitor.status === 'down') {
          const openIncident = await getOpenIncidentForMonitor(monitor.id)
          await resolveIncident(monitor.id)
          logger.info('Monitor recovered', { monitorId: monitor.id, name: monitor.name })

          if (openIncident) {
            await dispatchRecoveryAlerts(
              { ...openIncident, status: 'resolved' as const, resolved_at: now.toISOString() },
              monitor
            )
          }
        }

        await updateMonitorStatus(monitor.id, {
          status: result.status,
          last_checked_at: now.toISOString(),
          next_check_at: nextCheck.toISOString(),
        })
      })
    )

    // Phase 3: Wait 5 seconds, then confirm DOWN monitors in parallel
    if (downResults.length > 0) {
      await sleep(5000)

      await Promise.allSettled(
        downResults.map(async ({ monitor }) => {
          const confirmation = await dispatchChecker(monitor)
          const now = new Date()
          const nextCheck = new Date(now.getTime() + monitor.check_interval_seconds * 1000)

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
            const existingIncident = await getOpenIncidentForMonitor(monitor.id)
            if (!existingIncident) {
              const alertCopy = getAlertCopy(monitor, { severity: monitor.severity }, {
                variant: 'alert',
                metadata: confirmation.metadata as Record<string, unknown> | undefined,
              })
              const incidentTitle = alertCopy.headline

              const newIncident = await createIncident({
                org_id: monitor.org_id,
                workspace_id: monitor.workspace_id,
                monitor_id: monitor.id,
                title: incidentTitle,
                severity: monitor.severity,
              })
              logger.warn('Monitor confirmed down, incident created', { monitorId: monitor.id, name: monitor.name })

              if (newIncident) {
                await dispatchAlerts(newIncident, monitor)
              }
            }

            await updateMonitorStatus(monitor.id, {
              status: 'down',
              last_checked_at: now.toISOString(),
              next_check_at: nextCheck.toISOString(),
            })
          } else {
            await incrementFlapCount(monitor.id)
            logger.info('Monitor flapped', { monitorId: monitor.id })

            await updateMonitorStatus(monitor.id, {
              status: 'up',
              last_checked_at: now.toISOString(),
              next_check_at: nextCheck.toISOString(),
            })
          }
        })
      )
    }

    const total = monitors.length
    const down = downResults.length
    logger.info('Check runner completed', { total, down })

    await endCronRun(runId, cronStart, 'ok', { summary: `checked: ${total}, down: ${down}` })
    return NextResponse.json({ ok: true, checked: total, down })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown'
    logger.error('Check runner error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

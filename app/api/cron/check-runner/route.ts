import { NextResponse } from 'next/server'
import { getDueMonitors, getAllActiveMonitors, updateMonitorStatus, incrementFlapCount, patchMonitorConfig } from '@/lib/db/monitors'
import { writeCheckResult } from '@/lib/db/check-results'
import { createIncident, resolveIncident, getOpenIncidentForMonitor, countRecentIncidentsForMonitor } from '@/lib/db/incidents'
import { getMaintenanceSetForMonitors } from '@/lib/db/maintenance-windows'
import { dispatchChecker } from '@/lib/services/checker'
import { dispatchAlerts, dispatchRecoveryAlerts } from '@/lib/services/alert-dispatcher'
import { getAlertCopy } from '@/lib/utils/alert-copy'
import { getCurrentRegion } from '@/lib/config/regions'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import type { Monitor } from '@/lib/types'
import type { CheckerResult } from '@/lib/checkers/types'
import { requireCronAuth } from '@/lib/auth/cron-auth'
import { acquireCronLock, releaseCronLock } from '@/lib/utils/cron-lock'


export const dynamic = 'force-dynamic'
export const maxDuration = 300

// engineering-app#77 — name + TTL for the overlap lock. TTL slightly above
// maxDuration so a crashed run self-heals on the next cron tick.
const CRON_LOCK_NAME    = 'check-runner'
const CRON_LOCK_TTL_MS  = 6 * 60 * 1000 // 6 minutes

// Flap suppression — a monitor that opens more than FLAP_SUPPRESS_THRESHOLD
// incidents within FLAP_SUPPRESS_WINDOW_MIN minutes is flapping. We still RECORD
// the incident (dashboard/history), but skip the alert/email so the digest buffer
// doesn't flood (the "1000 events" email-storm). Applies to down AND recovery alerts.
const FLAP_SUPPRESS_WINDOW_MIN = 60
const FLAP_SUPPRESS_THRESHOLD  = 5

// Two-confirmation down detection — KB (PRODUCT-REQUIREMENTS §3 / FEATURES.md)
// specifies a 30-second wait before the confirming re-check. The previous 5s
// was too aggressive: a transient blip is still failing 5s later → false
// "confirmed down" → incident → flapping/email-storm. 30s lets brief blips
// recover (logged as flap, no alert). (Region-diverse re-check is still TODO —
// needs multi-region checker infra; tracked separately.)
const CONFIRMATION_DELAY_MS = 30_000

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface FirstCheckResult {
  monitor: Monitor
  result: CheckerResult
}

export async function GET(request: Request): Promise<NextResponse> {
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  // engineering-app#77 — refuse to start a parallel run while a previous
  // one is still in flight. The TTL-with-prune pattern means a crashed
  // run self-heals after CRON_LOCK_TTL_MS; we don't need a babysitter cron.
  const gotLock = await acquireCronLock(CRON_LOCK_NAME, CRON_LOCK_TTL_MS)
  if (!gotLock) {
    logger.warn('Check runner skipped — previous run still in progress')
    return NextResponse.json({ ok: true, skipped: 'lock_held' })
  }

  const cronStart = Date.now()
  const currentRegion = getCurrentRegion()
  // Round down to the cron fire minute so next_check_at lands exactly on the next cron boundary.
  // Without this, a 3s function startup delay shifts next_check_at past the next :00 mark and
  // causes monitors to be skipped for an entire minute (effectively 2× their configured interval).
  const scheduleBase = new Date(cronStart)
  scheduleBase.setSeconds(0, 0)
  const runId = await startCronRun('/api/cron/check-runner', getTriggeredBy(request))

  // Set once the lock is released early (before the confirmation wait) so
  // the `finally` block below doesn't try to release it a second time.
  let lockReleased = false

  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const allMonitors = force ? await getAllActiveMonitors() : await getDueMonitors()
    logger.info('Check runner started', { dueMonitors: allMonitors.length, force })

    // Batch the maintenance lookup into a single DB query rather than firing
    // one isMonitorInMaintenance() call per monitor — at 100+ monitors per
    // cron tick the per-monitor pattern produced a thundering herd on the
    // maintenance_windows table. engineering-app#58.
    const maintenanceSet = await getMaintenanceSetForMonitors(allMonitors)

    const monitors: Monitor[] = []
    const maintenanceUpdates: Promise<void>[] = []

    for (const m of allMonitors) {
      if (maintenanceSet.has(m.id)) {
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
          region: currentRegion,
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
        const nextCheck = new Date(scheduleBase.getTime() + monitor.check_interval_seconds * 1000)

        if (monitor.status === 'down') {
          // resolveIncident does its own lookup internally and returns the
          // resolved incident directly — previously this was two separate
          // queries (one here, one inside resolveIncident) for what should
          // be the same row; if the first one hit a transient error it
          // silently skipped the recovery alert even when the incident had
          // actually just been resolved successfully.
          const resolvedIncident = await resolveIncident(monitor.id)
          logger.info('Monitor recovered', { monitorId: monitor.id, name: monitor.name })

          if (resolvedIncident) {
            const recentIncidents = await countRecentIncidentsForMonitor(monitor.id, FLAP_SUPPRESS_WINDOW_MIN)
            if (recentIncidents > FLAP_SUPPRESS_THRESHOLD) {
              logger.warn('Recovery alert suppressed — monitor flapping', { monitorId: monitor.id, name: monitor.name, recentIncidents })
            } else {
              await dispatchRecoveryAlerts(resolvedIncident, monitor)
            }
          }
        }

        await updateMonitorStatus(monitor.id, {
          status: result.status,
          last_checked_at: now.toISOString(),
          next_check_at: nextCheck.toISOString(),
        })
      })
    )

    // Push down monitors' next_check_at past the confirmation window RIGHT
    // NOW, before the 30s wait — otherwise they're still "due" the whole
    // time they're awaiting confirmation, and get re-selected (and
    // re-confirmed concurrently) by the very next cron tick once the lock
    // below is released early.
    if (downResults.length > 0) {
      const provisionalNextCheck = new Date(cronStart + CONFIRMATION_DELAY_MS + 5_000)
      await Promise.allSettled(
        downResults.map(({ monitor }) =>
          updateMonitorStatus(monitor.id, {
            status: monitor.status,
            last_checked_at: new Date(cronStart).toISOString(),
            next_check_at: provisionalNextCheck.toISOString(),
          })
        )
      )
    }

    // engineering-app: release the overlap lock here, BEFORE the 30s
    // confirmation wait — not in `finally`. The lock exists to stop two
    // Phase-1 sweeps racing each other; it was never meant to stall the
    // *next* tick's entire due-monitor sweep behind one batch's 30s
    // confirmation wait. Holding it for the full run meant any tick with
    // down monitors (30s+ wait, often 60s+ with checker latency) could
    // make the NEXT scheduled tick skip outright ("lock_held"), and the
    // more monitors were down at once, the more ticks got skipped — down
    // detection got slower exactly when it mattered most. Down monitors
    // are already excluded from getDueMonitors() by the next_check_at bump
    // above, so it's safe for a new tick's Phase 1 to start immediately.
    await releaseCronLock(CRON_LOCK_NAME)
    lockReleased = true

    // Phase 3: Wait (KB-spec 30s), then confirm DOWN monitors in parallel
    if (downResults.length > 0) {
      await sleep(CONFIRMATION_DELAY_MS)

      await Promise.allSettled(
        downResults.map(async ({ monitor }) => {
          const confirmation = await dispatchChecker(monitor)
          const now = new Date()
          const nextCheck = new Date(scheduleBase.getTime() + monitor.check_interval_seconds * 1000)

          await writeCheckResult({
            org_id: monitor.org_id,
            monitor_id: monitor.id,
            status: confirmation.status,
            response_time_ms: confirmation.responseTimeMs,
            status_code: confirmation.statusCode,
            error_message: confirmation.errorMessage,
            metadata: { ...confirmation.metadata, isConfirmationCheck: true },
            region: currentRegion,
          })

          if (confirmation.status === 'down') {
            const existingIncident = await getOpenIncidentForMonitor(monitor.id)
            if (!existingIncident) {
              // A checker can escalate severity for a specific failure mode
              // (e.g. robots.txt blocking Googlebot → P1) above the monitor's
              // statically-configured severity.
              const incidentSeverity = confirmation.severityOverride ?? monitor.severity
              const alertCopy = getAlertCopy(monitor, { severity: incidentSeverity }, {
                variant: 'alert',
                metadata: confirmation.metadata as Record<string, unknown> | undefined,
              })
              const incidentTitle = alertCopy.headline

              const newIncident = await createIncident({
                org_id: monitor.org_id,
                workspace_id: monitor.workspace_id,
                monitor_id: monitor.id,
                title: incidentTitle,
                severity: incidentSeverity,
              })

              if (newIncident) {
                logger.warn('Monitor confirmed down, incident created', { monitorId: monitor.id, name: monitor.name })
                // Flap suppression: record the incident but skip the alert/email
                // if this monitor is opening incidents too frequently.
                const recentIncidents = await countRecentIncidentsForMonitor(monitor.id, FLAP_SUPPRESS_WINDOW_MIN)
                if (recentIncidents > FLAP_SUPPRESS_THRESHOLD) {
                  logger.warn('Alert suppressed — monitor flapping', { monitorId: monitor.id, name: monitor.name, recentIncidents })
                } else {
                  await dispatchAlerts(newIncident, monitor)
                }
              } else {
                logger.error('createIncident returned null — alert not dispatched', { monitorId: monitor.id, name: monitor.name })
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
  } finally {
    // engineering-app#77 — release on every exit path (success, throw,
    // explicit return). TTL would reclaim it eventually, but releasing
    // explicitly lets the next cron tick start without waiting. Guarded by
    // lockReleased since the success path now releases early, before the
    // confirmation wait — this only fires for the throw/early-error paths.
    if (!lockReleased) {
      await releaseCronLock(CRON_LOCK_NAME)
    }
  }
}

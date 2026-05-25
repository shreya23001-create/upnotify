/**
 * Cron: /api/cron/competitor-checks
 * Schedule: Every hour (0 * * * * in vercel.json)
 *
 * For each competitor monitor (oldest-checked first, up to 100 per run):
 *  1. Run HTTP + keyword check
 *  2. Write check result to competitor_check_results
 *  3. If newly down → open incident + send in-app alert to all org users
 *  4. If recovered → resolve incident + send recovery alert
 *  5. Update competitor_monitors.last_* fields and uptime_30d
 *
 * Phase 1 — April 2026. Harvey: GREEN.
 */

import { NextResponse } from 'next/server'
import { checkCompetitorDomain } from '@/lib/checkers/competitor'
import {
  getAllCompetitorMonitors,
  updateCompetitorStatus,
  writeCompetitorCheckResult,
  getOpenIncidentForCompetitor,
  createCompetitorIncident,
  resolveCompetitorIncident,
  calculateCompetitorUptime30d,
  getOrgUserIds,
} from '@/lib/db/competitor-monitors'
import { sendUserMessage } from '@/lib/db/user-messages'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BATCH_SIZE = 5

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function GET(request: Request): Promise<NextResponse> {
  // Auth: cron secret or Vercel platform header
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/competitor-checks', getTriggeredBy(request))

  try {
    const competitors = await getAllCompetitorMonitors()
    logger.info('Competitor checks cron started', { count: competitors.length })

    if (competitors.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: no competitor monitors' })
      return NextResponse.json({ ok: true, checked: 0 })
    }

    let checked = 0
    let alertsFired = 0
    let errors = 0

    // Process in small batches to stay within edge function limits
    for (let i = 0; i < competitors.length; i += BATCH_SIZE) {
      const batch = competitors.slice(i, i + BATCH_SIZE)

      await Promise.allSettled(batch.map(async (competitor) => {
        try {
          const result = await checkCompetitorDomain(
            competitor.domain,
            competitor.keywords_enabled
          )

          const now = new Date().toISOString()

          // 1. Write check result to history
          await writeCompetitorCheckResult({
            competitor_id: competitor.id,
            org_id: competitor.org_id,
            status: result.status,
            response_time_ms: result.responseTimeMs,
            status_code: result.statusCode ?? null,
            keyword_matched: result.keywordMatched ?? null,
            keyword_category: result.keywordCategory ?? null,
            error_message: result.errorMessage ?? null,
          })

          // 2. Incident management + in-app notifications
          const openIncident = await getOpenIncidentForCompetitor(competitor.id)

          if (result.status === 'down') {
            if (!openIncident) {
              // New incident — open it and alert org users
              await createCompetitorIncident({
                competitor_id: competitor.id,
                org_id: competitor.org_id,
                cause: 'down',
              })

              const userIds = await getOrgUserIds(competitor.org_id)
              await Promise.allSettled(userIds.map(userId =>
                sendUserMessage({
                  userId,
                  orgId: competitor.org_id,
                  title: `Competitor down: ${competitor.display_name}`,
                  body: `${competitor.domain} is not responding. ${result.errorMessage ?? ''}`.trim(),
                  type: 'warning',
                  category: 'general',
                  actionUrl: '/dashboard/watchdog',
                  actionLabel: 'View Watchdog',
                  metadata: { competitorId: competitor.id, domain: competitor.domain },
                })
              ))
              alertsFired++
            }
            // Already has an open incident — do nothing (no duplicate alerts)

          } else if (result.status === 'degraded' && result.keywordCategory === 'maintenance') {
            if (!openIncident) {
              // Maintenance mode detected — open incident, alert
              await createCompetitorIncident({
                competitor_id: competitor.id,
                org_id: competitor.org_id,
                cause: 'maintenance',
              })

              const userIds = await getOrgUserIds(competitor.org_id)
              await Promise.allSettled(userIds.map(userId =>
                sendUserMessage({
                  userId,
                  orgId: competitor.org_id,
                  title: `Competitor in maintenance: ${competitor.display_name}`,
                  body: `${competitor.domain} appears to be in maintenance mode ("${result.keywordMatched ?? ''}").`,
                  type: 'info',
                  category: 'general',
                  actionUrl: '/dashboard/watchdog',
                  actionLabel: 'View Watchdog',
                  metadata: { competitorId: competitor.id, domain: competitor.domain, keyword: result.keywordMatched },
                })
              ))
              alertsFired++
            }

          } else if (result.status === 'up') {
            if (openIncident) {
              // Recovery — resolve incident and send recovery notification
              await resolveCompetitorIncident(openIncident.id)

              const downtimeMs = Date.now() - new Date(openIncident.started_at).getTime()
              const downtimeMins = Math.round(downtimeMs / 60000)
              const downtimeStr = downtimeMins < 60
                ? `${downtimeMins}m`
                : `${Math.floor(downtimeMins / 60)}h ${downtimeMins % 60}m`

              const userIds = await getOrgUserIds(competitor.org_id)
              await Promise.allSettled(userIds.map(userId =>
                sendUserMessage({
                  userId,
                  orgId: competitor.org_id,
                  title: `Competitor recovered: ${competitor.display_name}`,
                  body: `${competitor.domain} is back up. Was ${openIncident.cause ?? 'down'} for ${downtimeStr}.`,
                  type: 'success',
                  category: 'general',
                  actionUrl: '/dashboard/watchdog',
                  actionLabel: 'View Watchdog',
                  metadata: { competitorId: competitor.id, domain: competitor.domain, downtimeMins },
                })
              ))
              alertsFired++
            }
          }

          // 3. Calculate uptime_30d and update monitor record
          const uptime30d = await calculateCompetitorUptime30d(competitor.id)

          await updateCompetitorStatus(competitor.id, {
            last_status: result.status,
            last_response_time_ms: result.responseTimeMs,
            last_checked_at: now,
            uptime_30d: uptime30d,
          })

          checked++
        } catch (err) {
          logger.error('Competitor check failed', {
            competitorId: competitor.id,
            domain: competitor.domain,
            error: err instanceof Error ? err.message : String(err),
          })
          errors++
        }
      }))

      // Small pause between batches to be polite to external servers
      if (i + BATCH_SIZE < competitors.length) {
        await sleep(500)
      }
    }

    logger.info('Competitor checks cron complete', { checked, alertsFired, errors })
    await endCronRun(runId, cronStart, 'ok', { summary: `checked: ${checked}, alertsFired: ${alertsFired}, errors: ${errors}` })
    return NextResponse.json({ ok: true, checked, alertsFired, errors })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('Competitor checks cron failed', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

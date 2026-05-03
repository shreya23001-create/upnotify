import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getOrgsReadyToFlush,
  getPendingEventsForOrg,
  markEventsDigested,
} from '@/lib/db/alert-buffer'
import { getOrgAlertSettings } from '@/lib/db/alert-settings'
import { buildDigestEmail } from '@/lib/services/alert-digest-builder'
import { sendEmail } from '@/lib/services/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

interface AlertChannelRow {
  id: string
  type: string
  is_enabled: boolean
  config: { email?: string }
  severity_filter: string[]
}

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
  const runId = await startCronRun('/api/cron/alert-digest-flusher', getTriggeredBy(request))

  try {
    const ready = await getOrgsReadyToFlush()
    if (ready.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'no_orgs_ready' })
      return NextResponse.json({ ok: true, processed: 0, reason: 'no_orgs_ready' })
    }

    logger.info('alert-digest-flusher: orgs ready to flush', { count: ready.length })

    let totalSent = 0
    let totalFailed = 0
    const errors: Array<{ orgId: string; error: string }> = []

    for (const org of ready) {
      try {
        const result = await flushOrg(org.org_id)
        totalSent += result.sent
        totalFailed += result.failed
        if (result.error) errors.push({ orgId: org.org_id, error: result.error })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown flush error'
        errors.push({ orgId: org.org_id, error: msg })
        totalFailed += 1
      }
    }

    const errSummary = errors.length === 0
      ? ''
      : ` errors: ${errors.slice(0, 3).map(e => `${e.orgId}: ${e.error}`).join('; ')}`
    await endCronRun(runId, cronStart, errors.length === 0 ? 'ok' : 'error', {
      summary: `flushed ${totalSent} digest(s), ${totalFailed} failure(s)${errSummary}`,
    })
    return NextResponse.json({
      ok: errors.length === 0,
      processed: ready.length,
      sent: totalSent,
      failed: totalFailed,
      errors: errors.slice(0, 5),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logger.error('alert-digest-flusher error', { error: msg })
    await endCronRun(runId, cronStart, 'error', { errorMessage: msg })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function flushOrg(orgId: string): Promise<{ sent: number; failed: number; error?: string }> {
  const settings = await getOrgAlertSettings(orgId)

  // Defensive: if settings flipped to 'off' between buffering and flush,
  // events should not be turned into a digest. Mark them digested so they
  // don't hang around forever (they were already sent as per-event during
  // the brief window where mode was 'smart').
  if (settings.mode === 'off') {
    const events = await getPendingEventsForOrg(orgId)
    await markEventsDigested(events.map(e => e.id))
    logger.info('alert-digest-flusher: org switched to off mid-window, draining buffer', { orgId, drained: events.length })
    return { sent: 0, failed: 0 }
  }

  const events = await getPendingEventsForOrg(orgId)
  if (events.length === 0) return { sent: 0, failed: 0 }

  // Resolve email recipients — every enabled email channel for this org
  // whose severity filter matches at least one event in the buffer.
  const supabase = createAdminClient()
  const { data: channelData, error: channelErr } = await supabase
    .from('alert_channels')
    .select('id, type, is_enabled, config, severity_filter')
    .eq('org_id', orgId)
    .eq('is_enabled', true)
    .eq('type', 'email')

  if (channelErr) {
    logger.error('alert-digest-flusher: failed to load email channels', { orgId, error: channelErr.message })
    return { sent: 0, failed: 1, error: channelErr.message }
  }
  const channels = (channelData ?? []) as AlertChannelRow[]

  if (channels.length === 0) {
    // No email channels — events were never going to be emailed; mark digested.
    await markEventsDigested(events.map(e => e.id))
    return { sent: 0, failed: 0 }
  }

  const eventSeverities = new Set(events.map(e => e.severity))

  const digest = buildDigestEmail(events, {
    sameHostGrouping: settings.same_host_grouping,
    flapBadgeThreshold: settings.flap_badge_threshold,
  })

  let sent = 0
  let failed = 0
  let lastError: string | undefined

  for (const ch of channels) {
    // Channel-level severity filter: skip channels that don't match any
    // event's severity. Edge case: a channel set to 'critical only' should
    // not get a digest where everything is warning-only.
    const filter = ch.severity_filter ?? []
    const overlaps = filter.length === 0 || filter.some(f => eventSeverities.has(f))
    if (!overlaps) continue

    const to = ch.config?.email
    if (!to) {
      failed += 1
      lastError = `Channel ${ch.id} has no email address`
      continue
    }

    const result = await sendEmail(to, digest.subject, digest.bodyHtml, 'incident_notification')
    if (result.success) {
      sent += 1
    } else {
      failed += 1
      lastError = result.error
    }

    // Audit row in alerts table — one per channel per digest send. Use the
    // most recent event's incident_id as the representative (alerts.incident_id
    // is non-nullable; per-flush audit lives in cron-runs separately).
    const representativeIncidentId = events[events.length - 1]?.incident_id
    if (representativeIncidentId) {
      await supabase.from('alerts').insert({
        org_id: orgId,
        incident_id: representativeIncidentId,
        channel_id: ch.id,
        status: result.success ? 'sent' : 'failed',
        sent_at: result.success ? new Date().toISOString() : null,
        error_message: result.error || null,
      })
    }
  }

  // Mark all events digested even if some channels failed — we don't want
  // to re-digest the same events on the next flusher tick. Failed sends are
  // recorded in the alerts table for retry/inspection.
  await markEventsDigested(events.map(e => e.id))

  return { sent, failed, error: lastError }
}

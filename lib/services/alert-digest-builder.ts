import type { BufferedEvent } from '@/lib/db/alert-buffer'
import { getConfig } from '@/lib/utils/config'

export interface DigestEmail {
  subject: string
  bodyText: string
  bodyHtml: string
}

interface DigestOptions {
  sameHostGrouping: boolean
  flapBadgeThreshold: number // 0 = disable
}

/**
 * Build a single digest email from a buffer of events.
 *
 * Sections (in order, only rendered if non-empty):
 *   1. Critical (still down)
 *   2. Still down (warning + below)
 *   3. Recovered
 *
 * Within each section, when same-host grouping is enabled, events are
 * grouped by monitor_target. A monitor with ≥ flap_badge_threshold cycles
 * (open OR recovery counts as a cycle event) renders as a single
 * "flapped Nx" line instead of N separate lines, to keep the digest scannable.
 */
export function buildDigestEmail(events: BufferedEvent[], opts: DigestOptions): DigestEmail {
  const { app } = getConfig()

  if (events.length === 0) {
    // Caller should not invoke for empty buffers, but be defensive.
    return {
      subject: 'Upnotify digest — no new events',
      bodyText: 'No events to report.',
      bodyHtml: '<p>No events to report.</p>',
    }
  }

  // Tally event types per monitor for the flap badge.
  const monitorCycleCount = new Map<string, number>()
  for (const e of events) {
    monitorCycleCount.set(e.monitor_id, (monitorCycleCount.get(e.monitor_id) ?? 0) + 1)
  }
  const flappingMonitorIds = new Set<string>()
  if (opts.flapBadgeThreshold > 0) {
    for (const [id, n] of monitorCycleCount) {
      if (n >= opts.flapBadgeThreshold) flappingMonitorIds.add(id)
    }
  }

  // Latest event per (monitor_id) — determines whether the monitor is
  // "still down" or "recovered" at digest send time.
  const latestByMonitor = new Map<string, BufferedEvent>()
  for (const e of events) {
    const cur = latestByMonitor.get(e.monitor_id)
    if (!cur || e.created_at > cur.created_at) {
      latestByMonitor.set(e.monitor_id, e)
    }
  }

  // Bucketise.
  const stillDownCritical: BufferedEvent[] = []
  const stillDownOther: BufferedEvent[] = []
  const recovered: BufferedEvent[] = []
  for (const latest of latestByMonitor.values()) {
    if (latest.event_type === 'recovery') {
      recovered.push(latest)
    } else if (isCritical(latest.severity)) {
      stillDownCritical.push(latest)
    } else {
      stillDownOther.push(latest)
    }
  }

  const totalEvents = events.length
  const stillDownCount = stillDownCritical.length + stillDownOther.length
  const recoveredCount = recovered.length

  // ---- Subject ----
  const subjectParts: string[] = []
  if (stillDownCount > 0) subjectParts.push(`${stillDownCount} still down`)
  if (recoveredCount > 0) subjectParts.push(`${recoveredCount} recovered`)
  const subjectSummary = subjectParts.join(', ') || 'no active issues'
  const subject = `[Upnotify] ${totalEvents} ${totalEvents === 1 ? 'event' : 'events'} — ${subjectSummary}`

  // ---- Plain-text body ----
  const lines: string[] = []
  lines.push(`Upnotify digest — last window`)
  lines.push('')
  lines.push(`Events: ${totalEvents}   Still down: ${stillDownCount}   Recovered: ${recoveredCount}`)
  lines.push('')

  if (stillDownCritical.length > 0) {
    lines.push('🔴 CRITICAL — still down')
    lines.push(...renderSection(stillDownCritical, events, flappingMonitorIds, opts.sameHostGrouping))
    lines.push('')
  }
  if (stillDownOther.length > 0) {
    lines.push('🟡 Still down')
    lines.push(...renderSection(stillDownOther, events, flappingMonitorIds, opts.sameHostGrouping))
    lines.push('')
  }
  if (recovered.length > 0) {
    lines.push('✅ Recovered')
    lines.push(...renderSection(recovered, events, flappingMonitorIds, opts.sameHostGrouping))
    lines.push('')
  }

  lines.push(`Open dashboard: ${app.url}/dashboard/incidents`)
  lines.push(`Notification preferences: ${app.url}/dashboard/alerts/notifications`)

  const bodyText = lines.join('\n')

  // ---- HTML body ----
  const html = buildHtml({
    appUrl: app.url,
    totalEvents,
    stillDownCount,
    recoveredCount,
    stillDownCritical,
    stillDownOther,
    recovered,
    allEvents: events,
    flappingMonitorIds,
    sameHostGrouping: opts.sameHostGrouping,
  })

  return { subject, bodyText, bodyHtml: html }
}

function isCritical(severity: string): boolean {
  const s = (severity || '').toLowerCase()
  return s === 'critical' || s === 'p1'
}

/**
 * Render a section as plain-text bullet lines. Optionally groups by host.
 */
function renderSection(
  latestEventsInSection: BufferedEvent[],
  allEvents: BufferedEvent[],
  flappingIds: Set<string>,
  groupByHost: boolean
): string[] {
  if (!groupByHost) {
    return latestEventsInSection.map(e => `  ${formatLine(e, allEvents, flappingIds)}`)
  }

  // Group by monitor_target (host).
  const byHost = new Map<string, BufferedEvent[]>()
  for (const e of latestEventsInSection) {
    const list = byHost.get(e.monitor_target) ?? []
    list.push(e)
    byHost.set(e.monitor_target, list)
  }

  const out: string[] = []
  for (const [host, eventsForHost] of byHost) {
    if (eventsForHost.length === 1) {
      out.push(`  ${host}: ${formatLine(eventsForHost[0], allEvents, flappingIds)}`)
    } else {
      out.push(`  ${host}:`)
      for (const e of eventsForHost) {
        out.push(`    ${formatLine(e, allEvents, flappingIds)}`)
      }
    }
  }
  return out
}

function formatLine(latest: BufferedEvent, allEvents: BufferedEvent[], flappingIds: Set<string>): string {
  if (flappingIds.has(latest.monitor_id)) {
    const cycles = allEvents.filter(e => e.monitor_id === latest.monitor_id).length
    return `${latest.monitor_name} (${latest.monitor_type}) — flapped ${cycles}× in window 🔁`
  }
  return `${latest.monitor_name} (${latest.monitor_type}) — ${latest.headline}`
}

// --------------------------------------------------------------------------
// HTML rendering
// --------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface HtmlInput {
  appUrl: string
  totalEvents: number
  stillDownCount: number
  recoveredCount: number
  stillDownCritical: BufferedEvent[]
  stillDownOther: BufferedEvent[]
  recovered: BufferedEvent[]
  allEvents: BufferedEvent[]
  flappingMonitorIds: Set<string>
  sameHostGrouping: boolean
}

function buildHtml(input: HtmlInput): string {
  const sections: string[] = []
  if (input.stillDownCritical.length > 0) {
    sections.push(htmlSection('🔴 Critical — still down', '#dc2626', input.stillDownCritical, input))
  }
  if (input.stillDownOther.length > 0) {
    sections.push(htmlSection('🟡 Still down', '#d97706', input.stillDownOther, input))
  }
  if (input.recovered.length > 0) {
    sections.push(htmlSection('✅ Recovered', '#16a34a', input.recovered, input))
  }

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Upnotify digest</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
  <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px;">
    <div style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Upnotify digest</div>
    <div style="font-size: 18px; font-weight: 600; margin-top: 4px;">
      ${input.totalEvents} ${input.totalEvents === 1 ? 'event' : 'events'} —
      <span style="color:#dc2626;">${input.stillDownCount} still down</span>
      ${input.recoveredCount > 0 ? `· <span style="color:#16a34a;">${input.recoveredCount} recovered</span>` : ''}
    </div>
  </div>
  ${sections.join('\n')}
  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
    <a href="${input.appUrl}/dashboard/incidents" style="color: #2563eb; text-decoration: none; margin-right: 16px;">Open dashboard</a>
    <a href="${input.appUrl}/dashboard/alerts/notifications" style="color: #2563eb; text-decoration: none;">Notification preferences</a>
  </div>
</body></html>`.trim()
}

function htmlSection(label: string, color: string, latestEvents: BufferedEvent[], input: HtmlInput): string {
  const rows: string[] = []
  if (input.sameHostGrouping) {
    const byHost = new Map<string, BufferedEvent[]>()
    for (const e of latestEvents) {
      const list = byHost.get(e.monitor_target) ?? []
      list.push(e)
      byHost.set(e.monitor_target, list)
    }
    for (const [host, evs] of byHost) {
      rows.push(`<div style="margin-top: 12px;"><strong>${escapeHtml(host)}</strong></div>`)
      for (const e of evs) {
        rows.push(htmlRow(e, input))
      }
    }
  } else {
    for (const e of latestEvents) {
      rows.push(htmlRow(e, input))
    }
  }

  return `
<div style="margin-top: 16px;">
  <div style="font-size: 14px; font-weight: 600; color: ${color}; margin-bottom: 6px;">${escapeHtml(label)} (${latestEvents.length})</div>
  ${rows.join('\n')}
</div>`.trim()
}

function htmlRow(latest: BufferedEvent, input: HtmlInput): string {
  const isFlap = input.flappingMonitorIds.has(latest.monitor_id)
  const cycles = isFlap ? input.allEvents.filter(e => e.monitor_id === latest.monitor_id).length : 0
  const text = isFlap
    ? `${escapeHtml(latest.monitor_name)} (${escapeHtml(latest.monitor_type)}) — flapped ${cycles}× 🔁`
    : `${escapeHtml(latest.monitor_name)} (${escapeHtml(latest.monitor_type)}) — ${escapeHtml(latest.headline)}`
  const link = `${input.appUrl}/dashboard/monitors/${latest.monitor_id}`
  return `<div style="margin: 4px 0; font-size: 14px;"><a href="${link}" style="color:#111; text-decoration:none;">${text}</a></div>`
}

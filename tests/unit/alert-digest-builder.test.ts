import { describe, it, expect } from 'vitest'
import { buildDigestEmail } from '@/lib/services/alert-digest-builder'
import type { BufferedEvent } from '@/lib/db/alert-buffer'

function event(overrides: Partial<BufferedEvent>): BufferedEvent {
  return {
    id: 'ev-' + Math.random().toString(36).slice(2, 8),
    org_id: 'org-1',
    monitor_id: 'mon-1',
    incident_id: 'inc-1',
    event_type: 'open',
    severity: 'warning',
    subject: 'subject',
    headline: 'headline',
    detail: 'detail',
    monitor_name: 'Monitor A',
    monitor_target: 'example.com',
    monitor_type: 'http',
    metadata: {},
    instant_sent_at: null,
    digested_at: null,
    created_at: '2026-05-03T09:00:00Z',
    ...overrides,
  }
}

describe('buildDigestEmail — empty buffer', () => {
  it('returns a defensive placeholder rather than throwing', () => {
    const out = buildDigestEmail([], { sameHostGrouping: true, flapBadgeThreshold: 3 })
    expect(out.subject).toContain('no new events')
    expect(out.bodyText).toContain('No events')
    expect(out.bodyHtml).toContain('No events')
  })
})

describe('buildDigestEmail — single event', () => {
  it('renders one section with one row', () => {
    const events = [event({ event_type: 'open', severity: 'warning', monitor_name: 'API', monitor_target: 'api.example.com', headline: 'API endpoint is not responding correctly' })]
    const out = buildDigestEmail(events, { sameHostGrouping: true, flapBadgeThreshold: 3 })
    expect(out.subject).toContain('1 event')
    expect(out.subject).toContain('1 still down')
    expect(out.bodyText).toContain('Still down')
    expect(out.bodyText).toContain('api.example.com')
    expect(out.bodyText).toContain('API endpoint is not responding correctly')
    expect(out.bodyHtml).toContain('api.example.com')
  })
})

describe('buildDigestEmail — recovered after open (latest wins)', () => {
  it('treats the monitor as recovered when its latest event is recovery', () => {
    const events = [
      event({ id: 'a', monitor_id: 'mon-1', event_type: 'open', created_at: '2026-05-03T09:00:00Z', headline: 'down' }),
      event({ id: 'b', monitor_id: 'mon-1', event_type: 'recovery', created_at: '2026-05-03T09:05:00Z', headline: 'back up' }),
    ]
    const out = buildDigestEmail(events, { sameHostGrouping: true, flapBadgeThreshold: 3 })
    // 1 monitor latched on recovery → 0 still down, 1 recovered
    expect(out.subject).not.toContain('still down')
    expect(out.subject).toContain('1 recovered')
    expect(out.bodyText).toContain('✅ Recovered')
    // No "still down" SECTION (not the summary line "Still down: 0").
    expect(out.bodyText).not.toContain('🟡 Still down')
    expect(out.bodyText).not.toContain('🔴 CRITICAL')
  })
})

describe('buildDigestEmail — flap badge', () => {
  it('renders monitors with ≥ threshold cycles as a single flap line', () => {
    const monId = 'mon-flapper'
    const events = [
      event({ id: '1', monitor_id: monId, event_type: 'open', created_at: '2026-05-03T09:00:00Z' }),
      event({ id: '2', monitor_id: monId, event_type: 'recovery', created_at: '2026-05-03T09:05:00Z' }),
      event({ id: '3', monitor_id: monId, event_type: 'open', created_at: '2026-05-03T09:10:00Z' }),
      event({ id: '4', monitor_id: monId, event_type: 'recovery', created_at: '2026-05-03T09:15:00Z' }),
    ]
    const out = buildDigestEmail(events, { sameHostGrouping: true, flapBadgeThreshold: 3 })
    expect(out.bodyText).toContain('flapped 4×')
    expect(out.bodyHtml).toContain('flapped 4×')
  })

  it('does not apply flap badge when threshold is 0 (disabled)', () => {
    const monId = 'mon-flapper'
    const events = [
      event({ id: '1', monitor_id: monId, event_type: 'open', headline: 'down', created_at: '2026-05-03T09:00:00Z' }),
      event({ id: '2', monitor_id: monId, event_type: 'recovery', headline: 'recovered', created_at: '2026-05-03T09:05:00Z' }),
      event({ id: '3', monitor_id: monId, event_type: 'open', headline: 'down', created_at: '2026-05-03T09:10:00Z' }),
    ]
    const out = buildDigestEmail(events, { sameHostGrouping: true, flapBadgeThreshold: 0 })
    expect(out.bodyText).not.toContain('flapped')
    expect(out.bodyText).toContain('down')
  })

  it('does not apply flap badge when monitor is below threshold', () => {
    const events = [
      event({ id: '1', monitor_id: 'a', event_type: 'open', monitor_name: 'A', headline: 'A is down', created_at: '2026-05-03T09:00:00Z' }),
      event({ id: '2', monitor_id: 'a', event_type: 'recovery', monitor_name: 'A', headline: 'A back up', created_at: '2026-05-03T09:05:00Z' }),
    ]
    const out = buildDigestEmail(events, { sameHostGrouping: true, flapBadgeThreshold: 3 })
    expect(out.bodyText).not.toContain('flapped')
  })
})

describe('buildDigestEmail — same-host grouping', () => {
  it('groups multiple monitors under their shared host', () => {
    const events = [
      event({ id: '1', monitor_id: 'http', monitor_name: 'HTTP probe', monitor_target: 'newquay.co.uk', headline: 'down', monitor_type: 'http', created_at: '2026-05-03T09:00:00Z' }),
      event({ id: '2', monitor_id: 'ping', monitor_name: 'Ping probe', monitor_target: 'newquay.co.uk', headline: 'unreachable', monitor_type: 'ping', created_at: '2026-05-03T09:00:30Z' }),
      event({ id: '3', monitor_id: 'rt',   monitor_name: 'Response time', monitor_target: 'newquay.co.uk', headline: 'slow', monitor_type: 'response-time', created_at: '2026-05-03T09:01:00Z' }),
    ]
    const out = buildDigestEmail(events, { sameHostGrouping: true, flapBadgeThreshold: 3 })
    expect(out.bodyText).toContain('newquay.co.uk:')
    expect(out.bodyText).toMatch(/HTTP probe[\s\S]*Ping probe[\s\S]*Response time/)
  })

  it('renders flat (no per-host header) when grouping disabled', () => {
    const events = [
      event({ id: '1', monitor_id: 'a', monitor_target: 'x.com', headline: 'down x', created_at: '2026-05-03T09:00:00Z' }),
      event({ id: '2', monitor_id: 'b', monitor_target: 'y.com', headline: 'down y', created_at: '2026-05-03T09:01:00Z' }),
    ]
    const out = buildDigestEmail(events, { sameHostGrouping: false, flapBadgeThreshold: 3 })
    expect(out.bodyText).not.toMatch(/x\.com:/)
    expect(out.bodyText).toContain('down x')
    expect(out.bodyText).toContain('down y')
  })
})

describe('buildDigestEmail — sections by severity', () => {
  it('puts critical events in the critical section, others in still-down', () => {
    const events = [
      event({ id: '1', monitor_id: 'crit', severity: 'critical', monitor_name: 'Crit', monitor_target: 'a.com', headline: 'crit-down', created_at: '2026-05-03T09:00:00Z' }),
      event({ id: '2', monitor_id: 'warn', severity: 'warning', monitor_name: 'Warn', monitor_target: 'b.com', headline: 'warn-down', created_at: '2026-05-03T09:01:00Z' }),
    ]
    const out = buildDigestEmail(events, { sameHostGrouping: true, flapBadgeThreshold: 3 })
    expect(out.bodyText).toContain('CRITICAL')
    expect(out.bodyText).toMatch(/CRITICAL[\s\S]*Crit/)
    expect(out.bodyText).toMatch(/Still down[\s\S]*Warn/)
  })
})

describe('buildDigestEmail — links + html safety', () => {
  it('escapes HTML in monitor names and targets', () => {
    const events = [
      event({
        id: 'x',
        monitor_id: 'mon-x',
        monitor_name: '<script>alert(1)</script>',
        monitor_target: 'evil&host',
        headline: 'down "now"',
      }),
    ]
    const out = buildDigestEmail(events, { sameHostGrouping: true, flapBadgeThreshold: 3 })
    expect(out.bodyHtml).not.toContain('<script>alert(1)</script>')
    expect(out.bodyHtml).toContain('&lt;script&gt;')
    expect(out.bodyHtml).toContain('evil&amp;host')
  })

  it('includes dashboard link', () => {
    const events = [event({})]
    const out = buildDigestEmail(events, { sameHostGrouping: true, flapBadgeThreshold: 3 })
    expect(out.bodyHtml).toContain('/dashboard/incidents')
    expect(out.bodyHtml).toContain('/dashboard/alerts/notifications')
    expect(out.bodyText).toContain('/dashboard/incidents')
  })
})

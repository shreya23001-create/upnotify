import { describe, it, expect } from 'vitest'
import { decideEmailRouting } from '@/lib/services/alert-dispatcher'
import { severityAtOrAboveFloor, type OrgAlertSettings } from '@/lib/db/alert-settings'

function settings(overrides: Partial<OrgAlertSettings> = {}): OrgAlertSettings {
  return {
    org_id: 'org-1',
    mode: 'smart',
    digest_window_minutes: 30,
    instant_severity_floor: 'critical',
    same_host_grouping: true,
    flap_badge_threshold: 3,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('severityAtOrAboveFloor', () => {
  it('critical severity is at or above critical floor', () => {
    expect(severityAtOrAboveFloor('critical', 'critical')).toBe(true)
    expect(severityAtOrAboveFloor('p1', 'critical')).toBe(true)
    expect(severityAtOrAboveFloor('CRITICAL', 'critical')).toBe(true)
  })

  it('warning severity is below critical floor', () => {
    expect(severityAtOrAboveFloor('warning', 'critical')).toBe(false)
    expect(severityAtOrAboveFloor('p2', 'critical')).toBe(false)
  })

  it('warning severity is at or above warning floor', () => {
    expect(severityAtOrAboveFloor('warning', 'warning')).toBe(true)
    expect(severityAtOrAboveFloor('critical', 'warning')).toBe(true)
  })

  it('info severity is below warning floor', () => {
    expect(severityAtOrAboveFloor('info', 'warning')).toBe(false)
  })

  it('all floor accepts everything', () => {
    expect(severityAtOrAboveFloor('info', 'all')).toBe(true)
    expect(severityAtOrAboveFloor('warning', 'all')).toBe(true)
    expect(severityAtOrAboveFloor('critical', 'all')).toBe(true)
  })

  it('unknown severities are treated as below all floors', () => {
    expect(severityAtOrAboveFloor('chaos', 'critical')).toBe(false)
    expect(severityAtOrAboveFloor('chaos', 'warning')).toBe(false)
    expect(severityAtOrAboveFloor('chaos', 'all')).toBe(true)
  })
})

describe('decideEmailRouting — mode=off (legacy)', () => {
  it('always sends instant, never buffers', () => {
    const s = settings({ mode: 'off' })
    expect(decideEmailRouting(s, 'critical', false)).toEqual({ sendInstant: true, alsoBuffer: false })
    expect(decideEmailRouting(s, 'warning', true)).toEqual({ sendInstant: true, alsoBuffer: false })
    expect(decideEmailRouting(s, 'info', false)).toEqual({ sendInstant: true, alsoBuffer: false })
  })
})

describe('decideEmailRouting — mode=smart, floor=critical (default)', () => {
  it('critical severity: instant + buffer (digest still shows context)', () => {
    const s = settings({ mode: 'smart', instant_severity_floor: 'critical' })
    expect(decideEmailRouting(s, 'critical', false)).toEqual({ sendInstant: true, alsoBuffer: true })
    expect(decideEmailRouting(s, 'critical', true)).toEqual({ sendInstant: true, alsoBuffer: true })
    expect(decideEmailRouting(s, 'p1', true)).toEqual({ sendInstant: true, alsoBuffer: true })
  })

  it('warning severity, NO pending events: instant + buffer (first in window)', () => {
    const s = settings({ mode: 'smart', instant_severity_floor: 'critical' })
    expect(decideEmailRouting(s, 'warning', false)).toEqual({ sendInstant: true, alsoBuffer: true })
    expect(decideEmailRouting(s, 'p2', false)).toEqual({ sendInstant: true, alsoBuffer: true })
  })

  it('warning severity, has pending events: buffer only (mid-window)', () => {
    const s = settings({ mode: 'smart', instant_severity_floor: 'critical' })
    expect(decideEmailRouting(s, 'warning', true)).toEqual({ sendInstant: false, alsoBuffer: true })
    expect(decideEmailRouting(s, 'p2', true)).toEqual({ sendInstant: false, alsoBuffer: true })
  })
})

describe('decideEmailRouting — mode=smart, floor=warning', () => {
  it('critical: instant + buffer (above floor)', () => {
    const s = settings({ mode: 'smart', instant_severity_floor: 'warning' })
    expect(decideEmailRouting(s, 'critical', true)).toEqual({ sendInstant: true, alsoBuffer: true })
  })

  it('warning: instant + buffer (at floor)', () => {
    const s = settings({ mode: 'smart', instant_severity_floor: 'warning' })
    expect(decideEmailRouting(s, 'warning', true)).toEqual({ sendInstant: true, alsoBuffer: true })
    expect(decideEmailRouting(s, 'p2', true)).toEqual({ sendInstant: true, alsoBuffer: true })
  })

  it('info, has pending: buffer only (below floor, mid-window)', () => {
    const s = settings({ mode: 'smart', instant_severity_floor: 'warning' })
    expect(decideEmailRouting(s, 'info', true)).toEqual({ sendInstant: false, alsoBuffer: true })
  })

  it('info, no pending: instant + buffer (below floor, first in window)', () => {
    const s = settings({ mode: 'smart', instant_severity_floor: 'warning' })
    expect(decideEmailRouting(s, 'info', false)).toEqual({ sendInstant: true, alsoBuffer: true })
  })
})

describe('decideEmailRouting — mode=smart, floor=all', () => {
  it('all severities: instant + buffer (effectively turns Smart Digest off)', () => {
    const s = settings({ mode: 'smart', instant_severity_floor: 'all' })
    expect(decideEmailRouting(s, 'critical', true)).toEqual({ sendInstant: true, alsoBuffer: true })
    expect(decideEmailRouting(s, 'warning', true)).toEqual({ sendInstant: true, alsoBuffer: true })
    expect(decideEmailRouting(s, 'info', true)).toEqual({ sendInstant: true, alsoBuffer: true })
  })
})

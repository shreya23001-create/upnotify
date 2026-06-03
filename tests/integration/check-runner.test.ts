import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CheckerResult } from '@/lib/checkers/types'

// ---------------------------------------------------------------------------
// Mocks — declare before importing the module under test
// ---------------------------------------------------------------------------

const mockGetDueMonitors = vi.fn()
const mockGetAllActiveMonitors = vi.fn()
const mockUpdateMonitorStatus = vi.fn()
const mockIncrementFlapCount = vi.fn()

vi.mock('@/lib/db/monitors', () => ({
  getDueMonitors: (...args: unknown[]) => mockGetDueMonitors(...args),
  getAllActiveMonitors: (...args: unknown[]) => mockGetAllActiveMonitors(...args),
  updateMonitorStatus: (...args: unknown[]) => mockUpdateMonitorStatus(...args),
  incrementFlapCount: (...args: unknown[]) => mockIncrementFlapCount(...args),
}))

const mockWriteCheckResult = vi.fn()
vi.mock('@/lib/db/check-results', () => ({
  writeCheckResult: (...args: unknown[]) => mockWriteCheckResult(...args),
}))

const mockCreateIncident = vi.fn()
const mockResolveIncident = vi.fn()
const mockGetOpenIncidentForMonitor = vi.fn()

vi.mock('@/lib/db/incidents', () => ({
  createIncident: (...args: unknown[]) => mockCreateIncident(...args),
  resolveIncident: (...args: unknown[]) => mockResolveIncident(...args),
  getOpenIncidentForMonitor: (...args: unknown[]) => mockGetOpenIncidentForMonitor(...args),
}))

// engineering-app#58 — the check-runner used to call isMonitorInMaintenance
// per monitor; it now calls getMaintenanceSetForMonitors once with the full
// monitor list and gets back a Set of in-maintenance IDs. The test mock
// returns a Set built from whatever IDs the per-test setup wants treated as
// in-maintenance, defaulting to empty.
const mockMaintenanceSet = vi.fn<(monitors: Array<{ id: string }>) => Promise<Set<string>>>(async () => new Set<string>())
vi.mock('@/lib/db/maintenance-windows', () => ({
  getMaintenanceSetForMonitors: (...args: unknown[]) =>
    mockMaintenanceSet(...(args as [Array<{ id: string }>])),
}))

const mockDispatchChecker = vi.fn()
vi.mock('@/lib/services/checker', () => ({
  dispatchChecker: (...args: unknown[]) => mockDispatchChecker(...args),
}))

const mockDispatchAlerts = vi.fn()
const mockDispatchRecoveryAlerts = vi.fn()

vi.mock('@/lib/services/alert-dispatcher', () => ({
  dispatchAlerts: (...args: unknown[]) => mockDispatchAlerts(...args),
  dispatchRecoveryAlerts: (...args: unknown[]) => mockDispatchRecoveryAlerts(...args),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/utils/config', () => ({
  getConfig: () => ({
    supabase: { url: 'http://localhost:54321', anonKey: 'test-anon-key' },
    app: { url: 'http://localhost:3000' },
    admin: { emails: [] },
    analytics: { gaMeasurementId: '' },
  }),
  getServerConfig: () => ({
    supabase: { serviceRoleKey: 'test-service-key' },
    stripe: { secretKey: 'sk_test_xxx', webhookSecret: 'whsec_test' },
    resend: { apiKey: '', fromEmail: 'test@test.com', fromName: 'Test' },
    anthropic: { apiKey: 'test-key' },
    cron: { secret: 'test-cron-secret' },
  }),
}))

// engineering-app#77 — the cron-lock helper touches Supabase. Mock it to
// always return acquired so the unit-level check-runner tests aren't
// gated on a real DB. The lock-held / release behaviour is exercised
// separately in tests/unit/cron-lock.test.ts.
vi.mock('@/lib/utils/cron-lock', () => ({
  acquireCronLock: vi.fn().mockResolvedValue(true),
  releaseCronLock: vi.fn().mockResolvedValue(undefined),
}))

// ---------------------------------------------------------------------------
// Import module under test (AFTER mocks are set up)
// ---------------------------------------------------------------------------

import { GET } from '@/app/api/cron/check-runner/route'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeMonitor(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'mon-001',
    org_id: 'org-001',
    workspace_id: 'ws-001',
    name: 'Test Monitor',
    type: 'http',
    target: 'https://example.com',
    status: 'up',
    severity: 'high',
    check_interval_seconds: 60,
    timeout_ms: 10000,
    config: {},
    ...overrides,
  }
}

function makeRequest(url: string = 'https://uptrue.io/api/cron/check-runner', headers: Record<string, string> = {}): Request {
  // Cron auth contract (engineering-app#60): Vercel sends Authorization with
  // the real CRON_SECRET when invoking each scheduled URL. Tests mirror that
  // by injecting the config-mock's secret. The legacy `x-vercel-cron` header
  // bypass was removed because it was server-spoofable.
  return new Request(url, {
    method: 'GET',
    headers: {
      authorization: 'Bearer test-cron-secret',
      ...headers,
    },
  })
}

function upResult(): CheckerResult {
  return { status: 'up', responseTimeMs: 120, statusCode: 200 }
}

function downResult(): CheckerResult {
  return { status: 'down', responseTimeMs: 5000, errorMessage: 'Connection refused' }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('check-runner cron route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMaintenanceSet.mockResolvedValue(new Set())
    mockUpdateMonitorStatus.mockResolvedValue(undefined)
    mockWriteCheckResult.mockResolvedValue(undefined)
    mockGetOpenIncidentForMonitor.mockResolvedValue(null)
    mockCreateIncident.mockResolvedValue(null)
    mockResolveIncident.mockResolvedValue(undefined)
    mockDispatchAlerts.mockResolvedValue(undefined)
    mockDispatchRecoveryAlerts.mockResolvedValue(undefined)
    mockIncrementFlapCount.mockResolvedValue(undefined)
  })

  // ── Auth ───────────────────────────────────────────────────────────

  it('returns 401 when cron secret is set and auth header is wrong', async () => {
    // Config mock returns cron.secret = 'test-cron-secret'
    const req = new Request('https://uptrue.io/api/cron/check-runner', {
      method: 'GET',
      headers: { authorization: 'Bearer wrong' },
    })

    const response = await GET(req)
    expect(response.status).toBe(401)
    delete process.env.CRON_SECRET
  })

  it('rejects request with X-Vercel-Cron header but no valid Bearer token (regression for engineering-app#60)', async () => {
    // The legacy bypass — `X-Vercel-Cron: true` without a valid Authorization
    // header — must now return 401. Any attacker could spoof this header, so
    // the route can no longer treat it as proof of a real Vercel invocation.
    const req = new Request('https://uptrue.io/api/cron/check-runner', {
      method: 'GET',
      headers: { 'x-vercel-cron': 'true' },
    })
    const response = await GET(req)
    expect(response.status).toBe(401)
  })

  // ── Happy path — monitors fetched and checked ──────────────────────

  it('fetches due monitors and runs checks', async () => {
    const monitor = makeMonitor()
    mockGetDueMonitors.mockResolvedValue([monitor])
    mockDispatchChecker.mockResolvedValue(upResult())

    const response = await GET(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.checked).toBe(1)
    expect(mockDispatchChecker).toHaveBeenCalledTimes(1)
    expect(mockWriteCheckResult).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-001',
        monitor_id: 'mon-001',
        status: 'up',
      })
    )
  })

  it('uses getAllActiveMonitors when force=true', async () => {
    mockGetAllActiveMonitors.mockResolvedValue([])
    const req = makeRequest('https://uptrue.io/api/cron/check-runner?force=true')

    await GET(req)
    expect(mockGetAllActiveMonitors).toHaveBeenCalled()
    expect(mockGetDueMonitors).not.toHaveBeenCalled()
  })

  // ── Maintenance window skip ────────────────────────────────────────

  it('skips monitors in maintenance window', async () => {
    const monitor = makeMonitor()
    mockGetDueMonitors.mockResolvedValue([monitor])
    // Return a set containing the monitor's id so the check-runner treats it
    // as in maintenance and skips dispatch.
    mockMaintenanceSet.mockResolvedValueOnce(new Set<string>([monitor.id as string]))

    const response = await GET(makeRequest())
    const body = await response.json()

    expect(body.ok).toBe(true)
    expect(body.checked).toBe(0)
    expect(mockDispatchChecker).not.toHaveBeenCalled()
    // Status should still be updated (next_check_at advanced)
    expect(mockUpdateMonitorStatus).toHaveBeenCalled()
  })

  // ── Two-confirmation flow ─────────────────────────────────────────

  it('confirms down with second check and creates incident', { timeout: 15000 }, async () => {
    const monitor = makeMonitor()
    mockGetDueMonitors.mockResolvedValue([monitor])
    // First check: down. Confirmation check: also down.
    mockDispatchChecker
      .mockResolvedValueOnce(downResult())
      .mockResolvedValueOnce(downResult())
    const incident = { id: 'inc-001', org_id: 'org-001', title: 'Test Monitor is down', severity: 'high' }
    mockCreateIncident.mockResolvedValue(incident)

    const response = await GET(makeRequest())
    const body = await response.json()

    expect(body.ok).toBe(true)
    expect(mockDispatchChecker).toHaveBeenCalledTimes(2)
    expect(mockCreateIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-001',
        monitor_id: 'mon-001',
        title: 'Test Monitor is not responding',
        severity: 'high',
      })
    )
    expect(mockDispatchAlerts).toHaveBeenCalledWith(incident, expect.anything())
    expect(mockUpdateMonitorStatus).toHaveBeenCalledWith(
      'mon-001',
      expect.objectContaining({ status: 'down' })
    )
  })

  it('does not create a duplicate incident if one is already open', { timeout: 15000 }, async () => {
    const monitor = makeMonitor({ status: 'down' })
    mockGetDueMonitors.mockResolvedValue([monitor])
    mockDispatchChecker
      .mockResolvedValueOnce(downResult())
      .mockResolvedValueOnce(downResult())
    // Existing open incident
    mockGetOpenIncidentForMonitor.mockResolvedValue({ id: 'inc-existing' })

    await GET(makeRequest())

    expect(mockCreateIncident).not.toHaveBeenCalled()
    expect(mockDispatchAlerts).not.toHaveBeenCalled()
  })

  // ── Flap detection ────────────────────────────────────────────────

  it('detects a flap when first check is down but confirmation is up', { timeout: 15000 }, async () => {
    const monitor = makeMonitor()
    mockGetDueMonitors.mockResolvedValue([monitor])
    // First check: down. Confirmation: back up.
    mockDispatchChecker
      .mockResolvedValueOnce(downResult())
      .mockResolvedValueOnce(upResult())

    await GET(makeRequest())

    expect(mockIncrementFlapCount).toHaveBeenCalledWith('mon-001')
    expect(mockCreateIncident).not.toHaveBeenCalled()
    expect(mockUpdateMonitorStatus).toHaveBeenCalledWith(
      'mon-001',
      expect.objectContaining({ status: 'up' })
    )
  })

  // ── Recovery flow ─────────────────────────────────────────────────

  it('resolves incident when a previously-down monitor is now up', async () => {
    const monitor = makeMonitor({ status: 'down' })
    mockGetDueMonitors.mockResolvedValue([monitor])
    mockDispatchChecker.mockResolvedValue(upResult())
    const openIncident = {
      id: 'inc-001',
      org_id: 'org-001',
      title: 'Test Monitor is down',
      status: 'open',
    }
    mockGetOpenIncidentForMonitor.mockResolvedValue(openIncident)

    await GET(makeRequest())

    expect(mockResolveIncident).toHaveBeenCalledWith('mon-001')
    expect(mockDispatchRecoveryAlerts).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'resolved' }),
      expect.anything()
    )
    expect(mockUpdateMonitorStatus).toHaveBeenCalledWith(
      'mon-001',
      expect.objectContaining({ status: 'up' })
    )
  })

  it('does not dispatch recovery alerts if no open incident exists', async () => {
    const monitor = makeMonitor({ status: 'down' })
    mockGetDueMonitors.mockResolvedValue([monitor])
    mockDispatchChecker.mockResolvedValue(upResult())
    mockGetOpenIncidentForMonitor.mockResolvedValue(null)

    await GET(makeRequest())

    expect(mockResolveIncident).toHaveBeenCalledWith('mon-001')
    expect(mockDispatchRecoveryAlerts).not.toHaveBeenCalled()
  })

  // ── Error handling ────────────────────────────────────────────────

  it('returns 500 when getDueMonitors throws', async () => {
    mockGetDueMonitors.mockRejectedValue(new Error('Database unreachable'))

    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Internal error')
  })

  it('continues checking other monitors when one check throws', async () => {
    const mon1 = makeMonitor({ id: 'mon-001' })
    const mon2 = makeMonitor({ id: 'mon-002' })
    mockGetDueMonitors.mockResolvedValue([mon1, mon2])

    mockDispatchChecker
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(upResult())

    const response = await GET(makeRequest())
    // The route uses Promise.allSettled so one failure does not crash the batch
    expect(response.status).toBe(200)
  })
})

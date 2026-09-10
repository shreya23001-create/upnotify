import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CheckerResult } from '@/lib/checkers/types'

// ---------------------------------------------------------------------------
// Mocks — declare before importing the module under test
// ---------------------------------------------------------------------------

const mockGetActivePublicMonitors = vi.fn()
const mockWritePublicCheckResult = vi.fn()
const mockUpdatePublicMonitorStatus = vi.fn()
const mockGetOpenPublicIncident = vi.fn()
const mockCreatePublicIncident = vi.fn()
const mockResolvePublicIncident = vi.fn()

vi.mock('@/lib/db/public-monitors', () => ({
  getActivePublicMonitors: (...args: unknown[]) => mockGetActivePublicMonitors(...args),
  writePublicCheckResult: (...args: unknown[]) => mockWritePublicCheckResult(...args),
  updatePublicMonitorStatus: (...args: unknown[]) => mockUpdatePublicMonitorStatus(...args),
  getOpenPublicIncident: (...args: unknown[]) => mockGetOpenPublicIncident(...args),
  createPublicIncident: (...args: unknown[]) => mockCreatePublicIncident(...args),
  resolvePublicIncident: (...args: unknown[]) => mockResolvePublicIncident(...args),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/utils/config', () => ({
  getConfig: () => ({
    supabase: { url: 'http://localhost:54321', anonKey: 'test-anon-key' },
    app: { url: 'http://localhost:3000' },
    admin: { emails: [] },
    analytics: { gaMeasurementId: '' },
  }),
  getServerConfig: () => ({
    supabase: { url: 'http://localhost:54321', anonKey: 'test-anon-key', serviceRoleKey: 'test-service-key' },
    stripe: { secretKey: 'sk_test_xxx', webhookSecret: 'whsec_test' },
    resend: { apiKey: '', fromEmail: 'test@test.com', fromName: 'Test' },
    anthropic: { apiKey: 'test-key' },
    cron: { secret: 'test-cron-secret' },
  }),
}))

// Mock fetch for the HTTP check runner inside the route
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ---------------------------------------------------------------------------
// Import module under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { GET } from '@/app/api/cron/public-checks/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(options: {
  authorization?: string
  vercelCron?: boolean
} = {}): Request {
  const headers = new Headers()
  if (options.authorization) {
    headers.set('authorization', options.authorization)
  }
  if (options.vercelCron) {
    headers.set('x-vercel-cron', '1')
  }
  return new Request('https://upnotify-monitoring.vercel.app/api/cron/public-checks', {
    method: 'GET',
    headers,
  })
}

function createMockMonitor(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mon-1',
    domain: 'https://example.com',
    display_name: 'Example',
    category: 'saas',
    check_interval_seconds: 300,
    is_active: true,
    last_checked_at: null,
    last_status: 'up',
    last_response_time_ms: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/cron/public-checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWritePublicCheckResult.mockResolvedValue({ id: 'cr-1' })
    mockUpdatePublicMonitorStatus.mockResolvedValue(undefined)
    mockCreatePublicIncident.mockResolvedValue({ id: 'inc-1' })
    mockResolvePublicIncident.mockResolvedValue(undefined)
  })

  describe('authentication', () => {
    it('returns 401 when CRON_SECRET is set but no auth header provided', async () => {
      const request = createRequest()
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 401 when wrong bearer token provided', async () => {
      const request = createRequest({ authorization: 'Bearer wrong-secret' })
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('succeeds with correct bearer token', async () => {
      mockGetActivePublicMonitors.mockResolvedValue([])
      const request = createRequest({ authorization: 'Bearer test-cron-secret' })
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
    })

    it('rejects request with X-Vercel-Cron header but no valid Bearer token (regression for engineering-app#60)', async () => {
      // engineering-app#60: the X-Vercel-Cron header is plain HTTP — any
      // attacker can spoof it. The route must require a real Authorization
      // Bearer token, even if X-Vercel-Cron is also set.
      mockGetActivePublicMonitors.mockResolvedValue([])
      const request = createRequest({ vercelCron: true })
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('fetches and checks active monitors', () => {
    it('returns ok with zero monitors', async () => {
      mockGetActivePublicMonitors.mockResolvedValue([])
      const request = createRequest({ authorization: 'Bearer test-cron-secret' })
      const response = await GET(request)
      const body = await response.json()

      expect(body.ok).toBe(true)
      expect(body.checked).toBe(0)
      expect(body.down).toBe(0)
    })

    it('runs checks on all active monitors and writes results', async () => {
      const monitor = createMockMonitor()
      mockGetActivePublicMonitors.mockResolvedValue([monitor])

      // Mock fetch to return a healthy response
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as Response)

      const request = createRequest({ authorization: 'Bearer test-cron-secret' })
      const response = await GET(request)
      const body = await response.json()

      expect(body.ok).toBe(true)
      expect(body.checked).toBe(1)
      expect(mockWritePublicCheckResult).toHaveBeenCalled()
      expect(mockUpdatePublicMonitorStatus).toHaveBeenCalled()
    })
  })

  describe('two-confirmation down detection', () => {
    it('creates incident when both checks confirm down', async () => {
      const monitor = createMockMonitor({ last_status: 'up' })
      mockGetActivePublicMonitors.mockResolvedValue([monitor])
      mockGetOpenPublicIncident.mockResolvedValue(null)

      // Both checks return server error
      mockFetch.mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
      } as Response)

      const request = createRequest({ authorization: 'Bearer test-cron-secret' })
      const response = await GET(request)
      const body = await response.json()

      expect(body.ok).toBe(true)
      expect(body.down).toBe(1)
      // Should write 2 check results (first + confirmation)
      expect(mockWritePublicCheckResult).toHaveBeenCalledTimes(2)
      // Should create an incident
      expect(mockCreatePublicIncident).toHaveBeenCalledWith(
        expect.objectContaining({
          monitor_id: 'mon-1',
        })
      )
    }, 15000)

    it('does not create duplicate incident if one already exists', async () => {
      const monitor = createMockMonitor({ last_status: 'down' })
      mockGetActivePublicMonitors.mockResolvedValue([monitor])
      mockGetOpenPublicIncident.mockResolvedValue({ id: 'existing-inc' })

      mockFetch.mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
      } as Response)

      const request = createRequest({ authorization: 'Bearer test-cron-secret' })
      await GET(request)

      expect(mockCreatePublicIncident).not.toHaveBeenCalled()
    }, 15000)

    it('does not create incident on flap (first down, confirmation up)', async () => {
      const monitor = createMockMonitor()
      mockGetActivePublicMonitors.mockResolvedValue([monitor])

      // First call returns 500, second call returns 200
      mockFetch
        .mockResolvedValueOnce({
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers(),
        } as Response)
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
        } as Response)

      const request = createRequest({ authorization: 'Bearer test-cron-secret' })
      await GET(request)

      expect(mockCreatePublicIncident).not.toHaveBeenCalled()
    }, 15000)
  })

  describe('incident resolution on recovery', () => {
    it('resolves open incident when monitor recovers', async () => {
      const monitor = createMockMonitor({ last_status: 'down' })
      mockGetActivePublicMonitors.mockResolvedValue([monitor])

      // Returns healthy
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as Response)

      const request = createRequest({ authorization: 'Bearer test-cron-secret' })
      await GET(request)

      expect(mockResolvePublicIncident).toHaveBeenCalledWith('mon-1')
    })

    it('does not call resolve when monitor was already up', async () => {
      const monitor = createMockMonitor({ last_status: 'up' })
      mockGetActivePublicMonitors.mockResolvedValue([monitor])

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as Response)

      const request = createRequest({ authorization: 'Bearer test-cron-secret' })
      await GET(request)

      expect(mockResolvePublicIncident).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('returns 500 on unexpected error', async () => {
      mockGetActivePublicMonitors.mockRejectedValue(new Error('DB connection lost'))

      const request = createRequest({ authorization: 'Bearer test-cron-secret' })
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.error).toBe('Internal error')
    })

    it('handles individual monitor check failure gracefully', async () => {
      const monitors = [
        createMockMonitor({ id: 'mon-1' }),
        createMockMonitor({ id: 'mon-2', domain: 'https://other.com' }),
      ]
      mockGetActivePublicMonitors.mockResolvedValue(monitors)

      // First monitor fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
        } as Response)

      const request = createRequest({ authorization: 'Bearer test-cron-secret' })
      const response = await GET(request)
      const body = await response.json()

      // Should still return 200 — individual failures handled
      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
    }, 15000)
  })
})

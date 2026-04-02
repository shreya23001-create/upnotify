import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSubscribeToPublicMonitor = vi.fn()
const mockGetPublicMonitorById = vi.fn()

vi.mock('@/lib/db/public-monitors', () => ({
  subscribeToPublicMonitor: (...args: unknown[]) => mockSubscribeToPublicMonitor(...args),
  getPublicMonitorById: (...args: unknown[]) => mockGetPublicMonitorById(...args),
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

// ---------------------------------------------------------------------------
// Import module under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/v1/tracker/subscribe/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(body: Record<string, unknown>, ip?: string): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (ip) {
    headers.set('x-forwarded-for', ip)
  }
  return new Request('https://uptrue.io/api/v1/tracker/subscribe', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

const mockMonitor = {
  id: 'mon-1',
  domain: 'example.com',
  display_name: 'Example',
  category: 'saas',
  is_active: true,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/tracker/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPublicMonitorById.mockResolvedValue(mockMonitor)
    mockSubscribeToPublicMonitor.mockResolvedValue({ success: true })
  })

  describe('valid email succeeds', () => {
    it('subscribes with valid email and monitor ID', async () => {
      const request = createRequest(
        { monitorId: 'mon-1', email: 'user@example.com' },
        `valid-${Date.now()}`
      )
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(mockSubscribeToPublicMonitor).toHaveBeenCalledWith('mon-1', 'user@example.com')
    })

    it('sanitises email — trims and lowercases', async () => {
      const request = createRequest(
        { monitorId: 'mon-1', email: '  USER@Example.COM  ' },
        `sanitise-${Date.now()}`
      )
      await POST(request)

      expect(mockSubscribeToPublicMonitor).toHaveBeenCalledWith('mon-1', 'user@example.com')
    })
  })

  describe('invalid email rejected', () => {
    it('returns 400 when email is missing', async () => {
      const request = createRequest(
        { monitorId: 'mon-1' },
        `no-email-${Date.now()}`
      )
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.success).toBe(false)
      expect(body.error).toContain('email')
    })

    it('returns 400 when email has no @', async () => {
      const request = createRequest(
        { monitorId: 'mon-1', email: 'notanemail' },
        `bad-email-1-${Date.now()}`
      )
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.success).toBe(false)
    })

    it('returns 400 when email has no dot', async () => {
      const request = createRequest(
        { monitorId: 'mon-1', email: 'user@example' },
        `bad-email-2-${Date.now()}`
      )
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
    })

    it('returns 400 when email is not a string', async () => {
      const request = createRequest(
        { monitorId: 'mon-1', email: 12345 },
        `bad-email-3-${Date.now()}`
      )
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 when monitorId is missing', async () => {
      const request = createRequest(
        { email: 'user@example.com' },
        `no-monitorid-${Date.now()}`
      )
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('Monitor ID')
    })
  })

  describe('rate limiting', () => {
    it('allows up to 5 requests per minute per IP', async () => {
      const ip = `rl-allow-${Date.now()}`
      for (let i = 0; i < 5; i++) {
        const request = createRequest(
          { monitorId: 'mon-1', email: `user${i}@example.com` },
          ip
        )
        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    it('returns 429 after exceeding 5 requests per minute', async () => {
      const ip = `rl-exceed-${Date.now()}`

      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const request = createRequest(
          { monitorId: 'mon-1', email: `user${i}@example.com` },
          ip
        )
        await POST(request)
      }

      // 6th request should be rate limited
      const request = createRequest(
        { monitorId: 'mon-1', email: 'extra@example.com' },
        ip
      )
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(429)
      expect(body.success).toBe(false)
      expect(body.error).toContain('Too many requests')
    })
  })

  describe('duplicate email handled', () => {
    it('returns success when email is already subscribed', async () => {
      mockSubscribeToPublicMonitor.mockResolvedValue({ success: true }) // silently succeeds

      const request = createRequest(
        { monitorId: 'mon-1', email: 'existing@example.com' },
        `dup-${Date.now()}`
      )
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })

  describe('monitor not found', () => {
    it('returns 404 when monitor does not exist', async () => {
      mockGetPublicMonitorById.mockResolvedValue(null)

      const request = createRequest(
        { monitorId: 'nonexistent', email: 'user@example.com' },
        `notfound-${Date.now()}`
      )
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body.error).toContain('Monitor not found')
    })
  })

  describe('subscription failure', () => {
    it('returns 500 when subscription DB call fails', async () => {
      mockSubscribeToPublicMonitor.mockResolvedValue({
        success: false,
        error: 'Failed to subscribe. Please try again.',
      })

      const request = createRequest(
        { monitorId: 'mon-1', email: 'user@example.com' },
        `fail-${Date.now()}`
      )
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.success).toBe(false)
    })
  })

  describe('error handling', () => {
    it('returns 500 on unexpected error', async () => {
      mockGetPublicMonitorById.mockRejectedValue(new Error('DB connection failed'))

      const request = createRequest(
        { monitorId: 'mon-1', email: 'user@example.com' },
        `err-${Date.now()}`
      )
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.error).toContain('Something went wrong')
    })
  })
})

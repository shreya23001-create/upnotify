import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCalculateScore = vi.fn()
vi.mock('@/lib/services/score', () => ({
  calculateScore: (...args: unknown[]) => mockCalculateScore(...args),
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

import { GET } from '@/app/api/badge/score/[domain]/route'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(domain: string, ip?: string): {
  request: NextRequest
  params: Promise<{ domain: string }>
} {
  const headers = new Headers()
  if (ip) {
    headers.set('x-forwarded-for', ip)
  }
  const request = new NextRequest(`https://upnotify-monitoring.vercel.app/api/badge/score/${encodeURIComponent(domain)}`, {
    method: 'GET',
    headers,
  })
  return {
    request,
    params: Promise.resolve({ domain: encodeURIComponent(domain) }),
  }
}

const mockScoreResult = {
  domain: 'example.com',
  url: 'https://example.com',
  totalScore: 92,
  grade: 'A',
  gradeColor: '#059669',
  categories: [],
  scannedAt: '2026-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/badge/score/[domain]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCalculateScore.mockResolvedValue(mockScoreResult)
  })

  describe('successful badge generation', () => {
    it('returns valid SVG content type', async () => {
      const { request, params } = createRequest('example.com', '1.2.3.4')
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml')
    })

    it('returns SVG body containing the grade', async () => {
      const { request, params } = createRequest('example.com', '1.2.3.5')
      const response = await GET(request, { params })
      const body = await response.text()

      expect(body).toContain('<svg')
      expect(body).toContain('</svg>')
      expect(body).toContain('Uptrue score')
      expect(body).toContain('A')
    })

    it('sets cache control headers', async () => {
      const { request, params } = createRequest('example.com', '1.2.3.6')
      const response = await GET(request, { params })

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toContain('public')
      expect(cacheControl).toContain('max-age=3600')
    })

    it('includes score and grade in custom headers', async () => {
      const { request, params } = createRequest('example.com', '1.2.3.7')
      const response = await GET(request, { params })

      expect(response.headers.get('X-Uptrue-Score')).toBe('92')
      expect(response.headers.get('X-Uptrue-Grade')).toBe('A')
    })

    it('decodes URL-encoded domain', async () => {
      const { request, params } = createRequest('test.example.com', '1.2.3.8')
      await GET(request, { params })

      expect(mockCalculateScore).toHaveBeenCalledWith('test.example.com')
    })
  })

  describe('rate limiting', () => {
    it('allows up to 10 requests per minute per IP', async () => {
      const uniqueIp = `rate-test-${Date.now()}`

      for (let i = 0; i < 10; i++) {
        const { request, params } = createRequest('example.com', uniqueIp)
        const response = await GET(request, { params })
        expect(response.status).toBe(200)
      }
    })

    it('returns 429 after exceeding 10 requests per minute', async () => {
      const uniqueIp = `rate-exceed-${Date.now()}`

      // Make 10 allowed requests
      for (let i = 0; i < 10; i++) {
        const { request, params } = createRequest('example.com', uniqueIp)
        await GET(request, { params })
      }

      // 11th request should be rate limited
      const { request, params } = createRequest('example.com', uniqueIp)
      const response = await GET(request, { params })

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
    })

    it('does not rate limit different IPs', async () => {
      const ip1 = `ip1-${Date.now()}`
      const ip2 = `ip2-${Date.now()}`

      const { request: req1, params: params1 } = createRequest('example.com', ip1)
      const response1 = await GET(req1, { params: params1 })

      const { request: req2, params: params2 } = createRequest('example.com', ip2)
      const response2 = await GET(req2, { params: params2 })

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })
  })

  describe('fallback badge on error', () => {
    it('returns fallback SVG with "?" grade on calculateScore failure', async () => {
      mockCalculateScore.mockRejectedValue(new Error('Score calculation failed'))

      const { request, params } = createRequest('broken.example', `fallback-${Date.now()}`)
      const response = await GET(request, { params })

      expect(response.status).toBe(200) // Still returns 200 with fallback
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml')

      const body = await response.text()
      expect(body).toContain('<svg')
      expect(body).toContain('?')
    })

    it('sets shorter cache on fallback badge', async () => {
      mockCalculateScore.mockRejectedValue(new Error('Timeout'))

      const { request, params } = createRequest('broken.example', `cache-${Date.now()}`)
      const response = await GET(request, { params })

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toContain('max-age=300')
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ---------------------------------------------------------------------------
// Import module under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { checkSecurityHeaders } from '@/lib/checkers/security-headers'
import type { SecurityHeadersResult } from '@/lib/checkers/security-headers'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockResponse(headers: Record<string, string>): Response {
  return {
    status: 200,
    statusText: 'OK',
    headers: new Headers(headers),
    ok: true,
  } as unknown as Response
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('checkSecurityHeaders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('all 5 headers present — score 20/20', () => {
    it('returns all flags true and score 20', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
          'content-security-policy': "default-src 'self'",
          'x-frame-options': 'DENY',
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'strict-origin-when-cross-origin',
        })
      )

      const result: SecurityHeadersResult = await checkSecurityHeaders('https://example.com')

      expect(result.hasHSTS).toBe(true)
      expect(result.hasCSP).toBe(true)
      expect(result.hasXFrameOptions).toBe(true)
      expect(result.hasXContentTypeOptions).toBe(true)
      expect(result.hasReferrerPolicy).toBe(true)
      expect(result.score).toBe(20)
    })

    it('stores header values in the headers map', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          'strict-transport-security': 'max-age=31536000',
          'content-security-policy': "default-src 'self'",
          'x-frame-options': 'SAMEORIGIN',
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'no-referrer',
        })
      )

      const result = await checkSecurityHeaders('https://example.com')

      expect(result.headers['strict-transport-security']).toBe('max-age=31536000')
      expect(result.headers['content-security-policy']).toBe("default-src 'self'")
      expect(result.headers['x-frame-options']).toBe('SAMEORIGIN')
      expect(result.headers['x-content-type-options']).toBe('nosniff')
      expect(result.headers['referrer-policy']).toBe('no-referrer')
    })
  })

  describe('no headers present — score 0/20', () => {
    it('returns all flags false and score 0', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}))

      const result = await checkSecurityHeaders('https://example.com')

      expect(result.hasHSTS).toBe(false)
      expect(result.hasCSP).toBe(false)
      expect(result.hasXFrameOptions).toBe(false)
      expect(result.hasXContentTypeOptions).toBe(false)
      expect(result.hasReferrerPolicy).toBe(false)
      expect(result.score).toBe(0)
      expect(Object.keys(result.headers)).toHaveLength(0)
    })
  })

  describe('partial headers — mixed scores', () => {
    it('returns 4 points per header (1 header = 4)', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          'strict-transport-security': 'max-age=31536000',
        })
      )

      const result = await checkSecurityHeaders('https://example.com')

      expect(result.hasHSTS).toBe(true)
      expect(result.hasCSP).toBe(false)
      expect(result.hasXFrameOptions).toBe(false)
      expect(result.hasXContentTypeOptions).toBe(false)
      expect(result.hasReferrerPolicy).toBe(false)
      expect(result.score).toBe(4)
    })

    it('returns 8 points for 2 headers', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          'x-frame-options': 'DENY',
          'x-content-type-options': 'nosniff',
        })
      )

      const result = await checkSecurityHeaders('https://example.com')

      expect(result.hasHSTS).toBe(false)
      expect(result.hasCSP).toBe(false)
      expect(result.hasXFrameOptions).toBe(true)
      expect(result.hasXContentTypeOptions).toBe(true)
      expect(result.hasReferrerPolicy).toBe(false)
      expect(result.score).toBe(8)
    })

    it('returns 12 points for 3 headers', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          'strict-transport-security': 'max-age=31536000',
          'content-security-policy': "default-src 'self'",
          'referrer-policy': 'no-referrer',
        })
      )

      const result = await checkSecurityHeaders('https://example.com')

      expect(result.hasHSTS).toBe(true)
      expect(result.hasCSP).toBe(true)
      expect(result.hasXFrameOptions).toBe(false)
      expect(result.hasXContentTypeOptions).toBe(false)
      expect(result.hasReferrerPolicy).toBe(true)
      expect(result.score).toBe(12)
    })

    it('returns 16 points for 4 headers', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          'strict-transport-security': 'max-age=31536000',
          'content-security-policy': "default-src 'self'",
          'x-frame-options': 'DENY',
          'x-content-type-options': 'nosniff',
        })
      )

      const result = await checkSecurityHeaders('https://example.com')
      expect(result.score).toBe(16)
      expect(result.hasReferrerPolicy).toBe(false)
    })
  })

  describe('error handling', () => {
    it('returns all false and score 0 on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await checkSecurityHeaders('https://unreachable.example')

      expect(result.hasHSTS).toBe(false)
      expect(result.hasCSP).toBe(false)
      expect(result.hasXFrameOptions).toBe(false)
      expect(result.hasXContentTypeOptions).toBe(false)
      expect(result.hasReferrerPolicy).toBe(false)
      expect(result.score).toBe(0)
    })

    it('returns all false on timeout (abort)', async () => {
      mockFetch.mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))

      const result = await checkSecurityHeaders('https://slow.example')

      expect(result.score).toBe(0)
      expect(result.hasHSTS).toBe(false)
    })
  })

  describe('fetch called correctly', () => {
    it('passes the URL to fetch with GET and redirect follow', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}))

      await checkSecurityHeaders('https://example.com')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://example.com')
      expect(options.method).toBe('GET')
      expect(options.redirect).toBe('follow')
      expect(options.signal).toBeDefined()
    })
  })
})

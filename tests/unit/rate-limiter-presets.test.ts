import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import {
  checkRateLimit,
  PUBLIC_SUBSCRIBE_RATE_LIMIT,
  PUBLIC_UNSUBSCRIBE_RATE_LIMIT,
} from '@/lib/utils/rate-limiter'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(ip: string): Request {
  return new Request('https://uptrue.io/api/test', {
    headers: { 'x-forwarded-for': ip },
  })
}

// ---------------------------------------------------------------------------
// Tests — new presets added for public subscribe/unsubscribe
// ---------------------------------------------------------------------------

describe('rate-limiter new presets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── PUBLIC_SUBSCRIBE_RATE_LIMIT preset config ────────────────────────

  describe('PUBLIC_SUBSCRIBE_RATE_LIMIT', () => {
    it('is configured for 5 requests per minute', () => {
      expect(PUBLIC_SUBSCRIBE_RATE_LIMIT.maxRequests).toBe(5)
      expect(PUBLIC_SUBSCRIBE_RATE_LIMIT.windowMs).toBe(60 * 1000)
    })

    it('allows 5 requests within the window', () => {
      const ip = '172.16.0.1'
      const routeKey = 'test-sub-allow'

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(makeRequest(ip), PUBLIC_SUBSCRIBE_RATE_LIMIT, routeKey)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(4 - i)
      }
    })

    it('blocks the 6th request within the window', () => {
      const ip = '172.16.0.2'
      const routeKey = 'test-sub-block'

      // Use up all 5
      for (let i = 0; i < 5; i++) {
        checkRateLimit(makeRequest(ip), PUBLIC_SUBSCRIBE_RATE_LIMIT, routeKey)
      }

      // 6th should be blocked
      const blocked = checkRateLimit(makeRequest(ip), PUBLIC_SUBSCRIBE_RATE_LIMIT, routeKey)
      expect(blocked.allowed).toBe(false)
      expect(blocked.remaining).toBe(0)
      expect(blocked.resetAt).toBeGreaterThan(Date.now())
    })
  })

  // ── PUBLIC_UNSUBSCRIBE_RATE_LIMIT preset config ──────────────────────

  describe('PUBLIC_UNSUBSCRIBE_RATE_LIMIT', () => {
    it('is configured for 10 requests per minute', () => {
      expect(PUBLIC_UNSUBSCRIBE_RATE_LIMIT.maxRequests).toBe(10)
      expect(PUBLIC_UNSUBSCRIBE_RATE_LIMIT.windowMs).toBe(60 * 1000)
    })

    it('allows 10 requests within the window', () => {
      const ip = '172.16.0.3'
      const routeKey = 'test-unsub-allow'

      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(makeRequest(ip), PUBLIC_UNSUBSCRIBE_RATE_LIMIT, routeKey)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(9 - i)
      }
    })

    it('blocks the 11th request within the window', () => {
      const ip = '172.16.0.4'
      const routeKey = 'test-unsub-block'

      // Use up all 10
      for (let i = 0; i < 10; i++) {
        checkRateLimit(makeRequest(ip), PUBLIC_UNSUBSCRIBE_RATE_LIMIT, routeKey)
      }

      // 11th should be blocked
      const blocked = checkRateLimit(makeRequest(ip), PUBLIC_UNSUBSCRIBE_RATE_LIMIT, routeKey)
      expect(blocked.allowed).toBe(false)
      expect(blocked.remaining).toBe(0)
      expect(blocked.resetAt).toBeGreaterThan(Date.now())
    })
  })
})

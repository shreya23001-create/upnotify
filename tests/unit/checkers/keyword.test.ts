import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Monitor } from '@/lib/types'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Import after mocking
const { check } = await import('@/lib/checkers/keyword')

function createMonitor(config: Record<string, unknown>, target = 'https://example.com'): Monitor {
  return {
    id: 'test-monitor-1',
    org_id: 'org-1',
    workspace_id: 'ws-1',
    name: 'Test Keyword Monitor',
    type: 'keyword',
    target,
    status: 'up',
    check_interval_seconds: 60,
    timeout_ms: 10000,
    severity: 'P1',
    is_paused: false,
    flap_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_checked_at: null,
    next_check_at: null,
    config,
  } as Monitor
}

function mockResponse(body: string, status = 200): void {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Keyword Checker', () => {
  describe('Multiple positive keywords — all found', () => {
    it('returns up when all positive keywords are found on the page', async () => {
      const monitor = createMonitor({
        positiveKeywords: ['Place Order', 'Checkout', 'Secure Payment'],
        negativeKeywords: [],
      })
      mockResponse('<html><body>Place Order here. Checkout now. Secure Payment guaranteed.</body></html>')

      const result = await check(monitor)

      expect(result.status).toBe('up')
      expect(result.metadata).toBeDefined()
      const meta = result.metadata as Record<string, unknown>
      expect((meta.missingPositive as string[]).length).toBe(0)
      expect((meta.foundNegative as string[]).length).toBe(0)
    })
  })

  describe('Missing positive keyword', () => {
    it('returns down when a positive keyword is missing', async () => {
      const monitor = createMonitor({
        positiveKeywords: ['Place Order', 'Checkout', 'Secure Payment'],
        negativeKeywords: [],
      })
      mockResponse('<html><body>Checkout now. Secure Payment guaranteed.</body></html>')

      const result = await check(monitor)

      expect(result.status).toBe('down')
      expect(result.errorMessage).toContain("'Place Order'")
      const meta = result.metadata as Record<string, unknown>
      expect(meta.missingPositive).toEqual(['Place Order'])
    })
  })

  describe('Negative keyword found', () => {
    it('returns down when a negative keyword is found on the page', async () => {
      const monitor = createMonitor({
        positiveKeywords: [],
        negativeKeywords: ['error', 'failed', 'out of stock'],
      })
      mockResponse('<html><body>Sorry, an error occurred while processing your request.</body></html>')

      const result = await check(monitor)

      expect(result.status).toBe('down')
      expect(result.errorMessage).toContain("'error'")
      const meta = result.metadata as Record<string, unknown>
      expect((meta.foundNegative as string[])).toContain('error')
    })
  })

  describe('Mixed — missing positive and found negative', () => {
    it('returns down with both missing positive and found negative', async () => {
      const monitor = createMonitor({
        positiveKeywords: ['Place Order', 'Checkout'],
        negativeKeywords: ['error', 'maintenance'],
      })
      mockResponse('<html><body>Checkout is under maintenance.</body></html>')

      const result = await check(monitor)

      expect(result.status).toBe('down')
      expect(result.errorMessage).toContain("'Place Order'")
      expect(result.errorMessage).toContain("'maintenance'")
      const meta = result.metadata as Record<string, unknown>
      expect(meta.missingPositive).toEqual(['Place Order'])
      expect((meta.foundNegative as string[])).toContain('maintenance')
    })
  })

  describe('All good — positive found, negative not found', () => {
    it('returns up when all positive found and no negative found', async () => {
      const monitor = createMonitor({
        positiveKeywords: ['Welcome'],
        negativeKeywords: ['error', 'casino'],
      })
      mockResponse('<html><body>Welcome to our website!</body></html>')

      const result = await check(monitor)

      expect(result.status).toBe('up')
      const meta = result.metadata as Record<string, unknown>
      expect((meta.missingPositive as string[]).length).toBe(0)
      expect((meta.foundNegative as string[]).length).toBe(0)
    })
  })

  describe('Backward compatibility — legacy single keyword (shouldExist: true)', () => {
    it('treats legacy keyword as positive keyword', async () => {
      const monitor = createMonitor({
        keyword: 'Add to Cart',
        shouldExist: true,
      })
      mockResponse('<html><body>Add to Cart button here.</body></html>')

      const result = await check(monitor)

      expect(result.status).toBe('up')
    })

    it('returns down when legacy positive keyword is missing', async () => {
      const monitor = createMonitor({
        keyword: 'Add to Cart',
        shouldExist: true,
      })
      mockResponse('<html><body>Product page without the button.</body></html>')

      const result = await check(monitor)

      expect(result.status).toBe('down')
      expect(result.errorMessage).toContain("'Add to Cart'")
    })
  })

  describe('Backward compatibility — legacy single keyword (shouldExist: false)', () => {
    it('treats legacy keyword with shouldExist=false as negative keyword', async () => {
      const monitor = createMonitor({
        keyword: 'error',
        shouldExist: false,
      })
      mockResponse('<html><body>Everything is fine here.</body></html>')

      const result = await check(monitor)

      expect(result.status).toBe('up')
    })

    it('returns down when legacy negative keyword is found', async () => {
      const monitor = createMonitor({
        keyword: 'error',
        shouldExist: false,
      })
      mockResponse('<html><body>An error occurred.</body></html>')

      const result = await check(monitor)

      expect(result.status).toBe('down')
      expect(result.errorMessage).toContain("'error'")
    })
  })

  describe('No keywords configured', () => {
    it('returns down when no keywords are set', async () => {
      const monitor = createMonitor({
        positiveKeywords: [],
        negativeKeywords: [],
      })

      const result = await check(monitor)

      expect(result.status).toBe('down')
      expect(result.errorMessage).toBe('No keywords configured')
    })
  })

  describe('Case insensitivity', () => {
    it('finds keywords regardless of case', async () => {
      const monitor = createMonitor({
        positiveKeywords: ['Place Order'],
        negativeKeywords: ['ERROR'],
      })
      mockResponse('<html><body>place order is here, no problems</body></html>')

      const result = await check(monitor)

      expect(result.status).toBe('up')
    })
  })

  describe('HTTP error response', () => {
    it('returns down when HTTP status is not ok', async () => {
      const monitor = createMonitor({
        positiveKeywords: ['Welcome'],
        negativeKeywords: [],
      })
      mockResponse('Server Error', 500)

      const result = await check(monitor)

      expect(result.status).toBe('down')
      expect(result.statusCode).toBe(500)
      expect(result.errorMessage).toBe('HTTP 500')
    })
  })

  describe('Network failure', () => {
    it('returns down when fetch throws', async () => {
      const monitor = createMonitor({
        positiveKeywords: ['Welcome'],
        negativeKeywords: [],
      })
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      const result = await check(monitor)

      expect(result.status).toBe('down')
      expect(result.errorMessage).toBe('Network timeout')
    })
  })
})

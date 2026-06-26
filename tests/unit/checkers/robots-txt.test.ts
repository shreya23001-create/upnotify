import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Monitor } from '@/lib/types'

vi.mock('@/lib/checkers/ssrf-guard', () => ({
  isSafeUrl: vi.fn().mockReturnValue(true),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { check } = await import('@/lib/checkers/robots-txt')

function createMonitor(configOverride: Record<string, unknown> = {}): Monitor {
  return {
    id: 'test-1',
    org_id: 'org-1',
    workspace_id: 'ws-1',
    name: 'Robots Monitor',
    type: 'robots-txt',
    target: 'https://example.com',
    status: 'up',
    check_interval_seconds: 60,
    timeout_ms: 10000,
    severity: 'P2',
    is_paused: false,
    flap_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_checked_at: null,
    next_check_at: null,
    config: configOverride,
  } as Monitor
}

function mockFetchResponse(body: string, status = 200): void {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Googlebot-blocked detection (#164 fix)
// ---------------------------------------------------------------------------

describe('robots-txt checker — Googlebot detection', () => {
  it('returns status=down when Googlebot is explicitly disallowed', async () => {
    mockFetchResponse('User-agent: Googlebot\nDisallow: /')
    const result = await check(createMonitor())
    expect(result.status).toBe('down')
    expect(result.errorMessage).toContain('Googlebot')
    expect(result.errorMessage).toContain('SEO critical')
  })

  it('returns status=down when wildcard disallows all (blocks Googlebot by implication)', async () => {
    mockFetchResponse('User-agent: *\nDisallow: /')
    const result = await check(createMonitor())
    expect(result.status).toBe('down')
  })

  it('does NOT flag status=down when only non-Googlebot agents are blocked', async () => {
    mockFetchResponse('User-agent: Baiduspider\nDisallow: /\n\nUser-agent: *\nAllow: /')
    const result = await check(createMonitor())
    expect(result.status).not.toBe('down')
  })

  it('returns status=down when Googlebot block uses comments in the file', async () => {
    const robotsTxt = [
      '# block Googlebot',
      'User-agent: Googlebot',
      'Disallow: /',
    ].join('\n')
    mockFetchResponse(robotsTxt)
    const result = await check(createMonitor())
    expect(result.status).toBe('down')
    expect(result.metadata?.googlebotBlocked).toBe(true)
  })

  it('returns status=up when Googlebot is allowed', async () => {
    mockFetchResponse('User-agent: *\nAllow: /')
    const result = await check(createMonitor())
    expect(result.status).toBe('up')
    expect(result.metadata?.googlebotBlocked).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Change detection
// ---------------------------------------------------------------------------

describe('robots-txt checker — change detection', () => {
  it('returns status=up when robots.txt hash matches stored hash (no change)', async () => {
    const body = 'User-agent: *\nAllow: /'
    const crypto = await import('crypto')
    const hash = crypto.createHash('sha256').update(body).digest('hex')
    mockFetchResponse(body)
    const result = await check(createMonitor({ lastRobotsHash: hash }))
    expect(result.status).toBe('up')
    expect(result.metadata?.changed).toBe(false)
  })

  it('returns status=degraded when robots.txt content has changed', async () => {
    mockFetchResponse('User-agent: *\nAllow: /')
    const result = await check(createMonitor({ lastRobotsHash: 'old-hash' }))
    expect(result.status).toBe('degraded')
    expect(result.metadata?.changed).toBe(true)
    expect(result.errorMessage).toContain('changed')
  })

  it('does not flag change on first check (no stored hash)', async () => {
    mockFetchResponse('User-agent: *\nAllow: /')
    const result = await check(createMonitor({}))
    expect(result.metadata?.changed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// HTTP error handling
// ---------------------------------------------------------------------------

describe('robots-txt checker — error handling', () => {
  it('returns status=degraded when server returns 4xx', async () => {
    mockFetchResponse('Not found', 404)
    const result = await check(createMonitor())
    expect(result.status).toBe('degraded')
    expect(result.statusCode).toBe(404)
  })

  it('returns status=down on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const result = await check(createMonitor())
    expect(result.status).toBe('down')
    expect(result.errorMessage).toContain('ECONNREFUSED')
  })
})

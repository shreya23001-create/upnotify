import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be defined before imports
// ---------------------------------------------------------------------------

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
    supabase: { serviceRoleKey: 'test-service-key' },
    stripe: { secretKey: 'sk_test_xxx', webhookSecret: 'whsec_test' },
    resend: { apiKey: '', fromEmail: 'test@test.com', fromName: 'Test' },
    anthropic: { apiKey: 'test-key' },
    cron: { secret: 'test-cron-secret' },
  }),
}))

vi.mock('@/lib/utils/rate-limiter', () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 }),
  AUTH_RATE_LIMIT: { maxRequests: 10, windowMs: 900000 },
}))

const mockExchangeCode = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({
    auth: {
      exchangeCodeForSession: mockExchangeCode,
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com', created_at: new Date().toISOString() } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
    }),
  }),
}))

vi.mock('@/lib/supabase/admin', () => {
  function buildChain(): Record<string, unknown> {
    const terminal = { data: null, error: null }
    const chain: Record<string, unknown> = {
      ...terminal,
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
      eq: () => chain,
      gte: () => chain,
      lte: () => chain,
      order: () => chain,
      limit: () => chain,
      single: () => terminal,
    }
    return chain
  }
  return {
    createAdminClient: () => ({
      from: () => buildChain(),
    }),
  }
})

vi.mock('@/lib/db/subscriptions', () => ({
  createTrialSubscription: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/db/team', () => ({
  acceptTeamInvite: vi.fn().mockResolvedValue({ success: true }),
  getInviteByToken: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/db/referrals', () => ({
  recordReferralSignup: vi.fn().mockResolvedValue(undefined),
}))

// Mock next/server — NextResponse.redirect and NextResponse.json
vi.mock('next/server', () => {
  class MockNextResponse extends Response {
    static redirect(url: string | URL): MockNextResponse {
      const urlStr = typeof url === 'string' ? url : url.toString()
      return new MockNextResponse(null, {
        status: 307,
        headers: { location: urlStr },
      })
    }
    static json(body: unknown, init?: ResponseInit): MockNextResponse {
      return new MockNextResponse(JSON.stringify(body), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers ?? {}),
        },
      })
    }
  }
  return { NextResponse: MockNextResponse }
})

import { GET } from '@/app/auth/callback/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCallbackRequest(params: Record<string, string>): Request {
  const url = new URL('https://upnotify-monitoring.vercel.app/auth/callback')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new Request(url.toString(), {
    headers: { 'x-forwarded-for': '127.0.0.1' },
  })
}

function getRedirectUrl(response: Response): string {
  return response.headers.get('location') ?? ''
}

// ---------------------------------------------------------------------------
// Direct unit test of isValidRedirectPath logic
// (function is not exported, so we replicate the exact implementation)
// ---------------------------------------------------------------------------

function isValidRedirectPath(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.includes('://')) return false
  return true
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('isValidRedirectPath (direct logic test)', () => {
  // Valid paths
  it('accepts /dashboard', () => {
    expect(isValidRedirectPath('/dashboard')).toBe(true)
  })

  it('accepts /settings/billing', () => {
    expect(isValidRedirectPath('/settings/billing')).toBe(true)
  })

  it('accepts /', () => {
    expect(isValidRedirectPath('/')).toBe(true)
  })

  it('accepts /monitors/123/edit', () => {
    expect(isValidRedirectPath('/monitors/123/edit')).toBe(true)
  })

  // Attack vectors
  it('rejects //evil.com (protocol-relative)', () => {
    expect(isValidRedirectPath('//evil.com')).toBe(false)
  })

  it('rejects https://evil.com (absolute URL)', () => {
    expect(isValidRedirectPath('https://evil.com')).toBe(false)
  })

  it('rejects http://evil.com', () => {
    expect(isValidRedirectPath('http://evil.com')).toBe(false)
  })

  it('rejects javascript:alert(1)', () => {
    expect(isValidRedirectPath('javascript:alert(1)')).toBe(false)
  })

  it('rejects /foo://bar (embedded protocol)', () => {
    expect(isValidRedirectPath('/foo://bar')).toBe(false)
  })

  // Edge cases
  it('rejects empty string', () => {
    expect(isValidRedirectPath('')).toBe(false)
  })

  it('rejects relative path without leading slash', () => {
    expect(isValidRedirectPath('dashboard')).toBe(false)
  })

  it('rejects data: URI', () => {
    expect(isValidRedirectPath('data:text/html,<h1>evil</h1>')).toBe(false)
  })
})

describe('auth callback — redirect path validation (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExchangeCode.mockResolvedValue({ error: null })
  })

  // ── Valid redirect paths ─────────────────────────────────────────────

  it('redirects to /dashboard when next=/dashboard', async () => {
    const response = await GET(makeCallbackRequest({ code: 'valid-code', next: '/dashboard' }))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/dashboard')
  })

  it('redirects to /settings/billing when next=/settings/billing', async () => {
    const response = await GET(makeCallbackRequest({ code: 'valid-code', next: '/settings/billing' }))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/settings/billing')
  })

  it('redirects to / when next=/', async () => {
    const response = await GET(makeCallbackRequest({ code: 'valid-code', next: '/' }))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/')
  })

  // ── Open redirect attacks — all should fallback to /dashboard ────────

  it('rejects protocol-relative URL //evil.com and defaults to /dashboard', async () => {
    const response = await GET(makeCallbackRequest({ code: 'valid-code', next: '//evil.com' }))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/dashboard')
  })

  it('rejects absolute URL https://evil.com and defaults to /dashboard', async () => {
    const response = await GET(makeCallbackRequest({ code: 'valid-code', next: 'https://evil.com' }))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/dashboard')
  })

  it('rejects javascript: URI and defaults to /dashboard', async () => {
    const response = await GET(makeCallbackRequest({ code: 'valid-code', next: 'javascript:alert(1)' }))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/dashboard')
  })

  it('rejects http://evil.com and defaults to /dashboard', async () => {
    const response = await GET(makeCallbackRequest({ code: 'valid-code', next: 'http://evil.com' }))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/dashboard')
  })

  it('rejects path with embedded :// and defaults to /dashboard', async () => {
    const response = await GET(makeCallbackRequest({ code: 'valid-code', next: '/foo://bar' }))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/dashboard')
  })

  // ── Edge cases ──────────────────────────────────────────────────────

  it('defaults to /dashboard when next param is empty string', async () => {
    const response = await GET(makeCallbackRequest({ code: 'valid-code', next: '' }))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/dashboard')
  })

  it('defaults to /dashboard when no next param is provided', async () => {
    const response = await GET(makeCallbackRequest({ code: 'valid-code' }))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/dashboard')
  })

  // ── No code provided ───────────────────────────────────────────────

  it('redirects to /login?error=no_code when code is missing', async () => {
    const response = await GET(makeCallbackRequest({}))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/login?error=no_code')
  })

  // ── Auth error ──────────────────────────────────────────────────────

  it('redirects to /login?error=auth_error when exchange fails', async () => {
    mockExchangeCode.mockResolvedValue({ error: { message: 'invalid code' } })
    const response = await GET(makeCallbackRequest({ code: 'bad-code' }))
    expect(getRedirectUrl(response)).toBe('https://upnotify-monitoring.vercel.app/login?error=auth_error')
  })
})

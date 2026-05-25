/**
 * Regression coverage for engineering-app#80 — the process-run auth check
 * accepted an empty `x-internal-secret` header when CRON_SECRET was unset
 * (both read as the empty string and `'' === ''` is true).
 *
 * These tests exercise the handler through HTTP rather than the private
 * `isAuthorised` helper, so future refactors of the auth shape still
 * have to pass.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/services/citation-processor', () => ({
  processCitationRun: vi.fn().mockResolvedValue({ ok: true }),
}))

// The rate limiter shares state across calls within a process, so each test
// uses a distinct IP to avoid bleeding into the next.
let nextIpOctet = 1
function freshIpHeaders(): Record<string, string> {
  nextIpOctet += 1
  return { 'x-forwarded-for': `10.0.0.${nextIpOctet}` }
}

const ORIG_SECRET = process.env.CRON_SECRET

describe('POST /api/ai-visibility/process-run — auth (engineering-app#80)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (ORIG_SECRET === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = ORIG_SECRET
  })

  it('rejects with 403 when CRON_SECRET is unset and header is missing', async () => {
    delete process.env.CRON_SECRET
    const { POST } = await import('@/app/api/ai-visibility/process-run/route')
    const req = new Request('https://uptrue.io/api/ai-visibility/process-run', {
      method: 'POST',
      headers: { ...freshIpHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ runId: 'foo' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })

  it('rejects with 403 when CRON_SECRET is unset and header is an empty string', async () => {
    delete process.env.CRON_SECRET
    const { POST } = await import('@/app/api/ai-visibility/process-run/route')
    const req = new Request('https://uptrue.io/api/ai-visibility/process-run', {
      method: 'POST',
      headers: {
        ...freshIpHeaders(),
        'content-type': 'application/json',
        'x-internal-secret': '',
      },
      body: JSON.stringify({ runId: 'foo' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })

  it('rejects with 403 when CRON_SECRET is set but header is missing', async () => {
    process.env.CRON_SECRET = 'real-secret'
    const { POST } = await import('@/app/api/ai-visibility/process-run/route')
    const req = new Request('https://uptrue.io/api/ai-visibility/process-run', {
      method: 'POST',
      headers: { ...freshIpHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ runId: 'foo' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })

  it('rejects with 403 when CRON_SECRET is set but header is empty', async () => {
    process.env.CRON_SECRET = 'real-secret'
    const { POST } = await import('@/app/api/ai-visibility/process-run/route')
    const req = new Request('https://uptrue.io/api/ai-visibility/process-run', {
      method: 'POST',
      headers: {
        ...freshIpHeaders(),
        'content-type': 'application/json',
        'x-internal-secret': '',
      },
      body: JSON.stringify({ runId: 'foo' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })

  it('rejects with 403 when CRON_SECRET is set but header value is wrong', async () => {
    process.env.CRON_SECRET = 'real-secret'
    const { POST } = await import('@/app/api/ai-visibility/process-run/route')
    const req = new Request('https://uptrue.io/api/ai-visibility/process-run', {
      method: 'POST',
      headers: {
        ...freshIpHeaders(),
        'content-type': 'application/json',
        'x-internal-secret': 'wrong-secret',
      },
      body: JSON.stringify({ runId: 'foo' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })

  it('proceeds when CRON_SECRET matches the header value', async () => {
    process.env.CRON_SECRET = 'real-secret'
    const { POST } = await import('@/app/api/ai-visibility/process-run/route')
    const req = new Request('https://uptrue.io/api/ai-visibility/process-run', {
      method: 'POST',
      headers: {
        ...freshIpHeaders(),
        'content-type': 'application/json',
        'x-internal-secret': 'real-secret',
      },
      body: JSON.stringify({ runId: 'foo' }),
    })
    const res = await POST(req as never)
    // 200 from the mocked processor — anything other than 403 proves auth passed.
    expect(res.status).toBe(200)
  })
})

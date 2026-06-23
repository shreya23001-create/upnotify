import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/utils/config', () => ({
  getServerConfig: () => ({
    stripe: { webhookSecret: 'whsec_test_secret', secretKey: 'sk_test_fake' },
    razorpay: { keyId: '', keySecret: '', webhookSecret: '' },
    appUrl: 'http://localhost:3000',
    cron: { secret: '' },
    supabase: { url: '', anonKey: '', serviceRoleKey: '' },
    resend: { apiKey: '', fromEmail: '', fromName: '' },
    anthropic: { apiKey: '' },
    adminEmails: [],
    support: { apiKey: '', webhookUrl: '', webhookSecret: '' },
    twitter: { consumerKey: '', consumerSecret: '', accessToken: '', accessTokenSecret: '', bearerToken: '' },
    linkedin: { accessToken: '', memberId: '', organizationId: '' },
    telegram: { botToken: '', chatId: '' },
    blogApproval: { secret: '' },
  }),
}))

vi.mock('@/lib/services/plan-enforcement', () => ({
  enforceDowngradeLimits: vi.fn().mockResolvedValue(undefined),
  notifyPlanChange: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/db/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}))

// Track all DB update calls so we can assert past_due was/wasn't written
interface UpdateCall { table: string; data: Record<string, unknown> }
const updateCalls: UpdateCall[] = []

// Stripe event injected per-test (synchronous constructEvent, not async)
let mockStripeEvent: unknown = null

vi.mock('@/lib/services/stripe', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: vi.fn().mockImplementation(() => mockStripeEvent),
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        id: 'sub_test',
        items: { data: [{ current_period_start: 0, current_period_end: 0 }] },
        current_period_start: 0,
        current_period_end: 0,
        cancel_at_period_end: false,
        status: 'active',
      }),
    },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      update: (data: Record<string, unknown>) => {
        updateCalls.push({ table, data })
        return { eq: (_col: string, _val: unknown) => ({ error: null }) }
      },
      select: () => ({
        eq: () => ({
          maybeSingle: () => ({ data: null, error: null }),
          single: () => ({ data: null, error: null }),
          in: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => ({ data: null, error: null }),
              }),
            }),
          }),
        }),
        in: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: () => ({ data: null, error: null }),
            }),
          }),
        }),
      }),
      insert: () => ({ error: null }),
      upsert: () => ({ error: null }),
    }),
  }),
}))

import { POST } from '@/app/api/webhooks/stripe/route'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWebhookRequest() {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'stripe-signature': 'test-sig',
      'content-type': 'application/json',
    },
    body: JSON.stringify({}),
  })
}

function makeInvoiceFailedEvent(attemptCount: number | null, subId = 'sub_123') {
  return {
    type: 'invoice.payment_failed',
    data: {
      object: {
        subscription: subId,
        attempt_count: attemptCount,
        id: `inv_${Date.now()}`,
        amount_due: 2000,
        currency: 'gbp',
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Tests — Bug #110: past_due only set after 2+ failed attempts
// ---------------------------------------------------------------------------

describe('Stripe webhook — invoice.payment_failed (bug #110)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateCalls.length = 0
  })

  it('does NOT mark past_due on first payment failure (attempt_count=1)', async () => {
    mockStripeEvent = makeInvoiceFailedEvent(1)
    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)

    const pastDueUpdate = updateCalls.find(
      c => c.table === 'subscriptions' && c.data.status === 'past_due'
    )
    expect(pastDueUpdate).toBeUndefined()
  })

  it('marks past_due on second payment failure (attempt_count=2)', async () => {
    mockStripeEvent = makeInvoiceFailedEvent(2)
    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)

    const pastDueUpdate = updateCalls.find(
      c => c.table === 'subscriptions' && c.data.status === 'past_due'
    )
    expect(pastDueUpdate).toBeDefined()
  })

  it('marks past_due on third payment failure (attempt_count=3)', async () => {
    mockStripeEvent = makeInvoiceFailedEvent(3)
    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)

    const pastDueUpdate = updateCalls.find(
      c => c.table === 'subscriptions' && c.data.status === 'past_due'
    )
    expect(pastDueUpdate).toBeDefined()
  })

  it('defaults attempt_count to 1 when null — does NOT mark past_due', async () => {
    // Stripe may omit attempt_count in rare cases — we default to 1 (most lenient)
    mockStripeEvent = makeInvoiceFailedEvent(null)
    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)

    const pastDueUpdate = updateCalls.find(
      c => c.table === 'subscriptions' && c.data.status === 'past_due'
    )
    expect(pastDueUpdate).toBeUndefined()
  })

  it('does nothing when invoice has no associated subscription', async () => {
    mockStripeEvent = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          subscription: null,
          attempt_count: 3,
          id: 'inv_no_sub',
          amount_due: 1000,
          currency: 'gbp',
        },
      },
    }
    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)

    const pastDueUpdate = updateCalls.find(
      c => c.table === 'subscriptions' && c.data.status === 'past_due'
    )
    expect(pastDueUpdate).toBeUndefined()
  })
})

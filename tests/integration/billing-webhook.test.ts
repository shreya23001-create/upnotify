import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockConstructEvent = vi.fn()
const mockSubscriptionsRetrieve = vi.fn()

vi.mock('@/lib/services/stripe', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    subscriptions: {
      retrieve: (...args: unknown[]) => mockSubscriptionsRetrieve(...args),
    },
  }),
}))

// Track all Supabase operations
interface MockChain {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

const mockDbOps: Record<string, MockChain> = {}
const mockInsertData: Array<{ table: string; data: unknown }> = []
const mockUpdateData: Array<{ table: string; data: unknown }> = []

function createMockChain(table: string): MockChain {
  const chain: MockChain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  }

  // Default return values
  chain.single.mockReturnValue({ data: null, error: null })

  // Fluent returns
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)

  chain.insert.mockImplementation((data: unknown) => {
    mockInsertData.push({ table, data })
    return { error: null }
  })

  chain.update.mockImplementation((data: unknown) => {
    mockUpdateData.push({ table, data })
    return chain
  })

  return chain
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (!mockDbOps[table]) {
        mockDbOps[table] = createMockChain(table)
      }
      return mockDbOps[table]
    },
  }),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

let mockIsProductionValue = false
vi.mock('@/lib/utils/environment', () => ({
  isProduction: () => mockIsProductionValue,
}))

let mockWebhookSecret: string | undefined = 'whsec_test_secret'
vi.mock('@/lib/utils/config', () => ({
  getConfig: () => ({
    supabase: { url: 'http://localhost:54321', anonKey: 'test-anon-key' },
    app: { url: 'http://localhost:3000' },
    admin: { emails: [] },
    analytics: { gaMeasurementId: '' },
  }),
  getServerConfig: () => ({
    supabase: { serviceRoleKey: 'test-service-key' },
    stripe: { secretKey: 'sk_test_xxx', webhookSecret: mockWebhookSecret },
    resend: { apiKey: '', fromEmail: 'test@test.com', fromName: 'Test' },
    anthropic: { apiKey: 'test-key' },
    cron: { secret: 'test-cron-secret' },
  }),
}))

// ---------------------------------------------------------------------------
// Import module under test
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/webhooks/stripe/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStripeRequest(
  body: Record<string, unknown>,
  signature: string = 'sig_test_valid'
): Request {
  return new Request('https://uptrue.io/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Stripe webhook handler', () => {
  const savedEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInsertData.length = 0
    mockUpdateData.length = 0
    mockIsProductionValue = false

    // Reset DB mock chains
    for (const key of Object.keys(mockDbOps)) {
      delete mockDbOps[key]
    }

    mockWebhookSecret = 'whsec_test'
  })

  afterEach(() => {
    process.env = { ...savedEnv }
  })

  // ── checkout.session.completed ─────────────────────────────────────

  it('creates subscription on checkout.session.completed', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { org_id: 'org-001', plan_slug: 'pro' },
          subscription: 'sub_123',
          customer: 'cus_456',
        },
      },
    }

    mockConstructEvent.mockReturnValue(event)

    // Plan lookup returns a plan
    const planChain = createMockChain('plans')
    planChain.single.mockReturnValue({ data: { id: 'plan-uuid' }, error: null })
    mockDbOps['plans'] = planChain

    // Subscription retrieve returns sub object
    mockSubscriptionsRetrieve.mockResolvedValue({
      items: { data: [{ price: { recurring: { interval: 'month' } } }] },
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
    })

    // Org chain for customer update
    const orgChain = createMockChain('organisations')
    mockDbOps['organisations'] = orgChain

    // Subscriptions chain for insert
    const subChain = createMockChain('subscriptions')
    mockDbOps['subscriptions'] = subChain

    const response = await POST(makeStripeRequest(event))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.received).toBe(true)

    // Verify subscription was inserted
    const subInsert = mockInsertData.find((d) => d.table === 'subscriptions')
    expect(subInsert).toBeDefined()
    expect(subInsert?.data).toEqual(
      expect.objectContaining({
        org_id: 'org-001',
        plan_id: 'plan-uuid',
        stripe_subscription_id: 'sub_123',
        status: 'active',
        billing_cycle: 'monthly',
      })
    )
  })

  it('stores stripe_customer_id on the organisation', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { org_id: 'org-001', plan_slug: 'pro' },
          subscription: 'sub_123',
          customer: 'cus_456',
        },
      },
    }

    mockConstructEvent.mockReturnValue(event)

    const planChain = createMockChain('plans')
    planChain.single.mockReturnValue({ data: { id: 'plan-uuid' }, error: null })
    mockDbOps['plans'] = planChain

    mockSubscriptionsRetrieve.mockResolvedValue({
      items: { data: [{ price: { recurring: { interval: 'year' } } }] },
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 365 * 86400,
    })

    const orgChain = createMockChain('organisations')
    mockDbOps['organisations'] = orgChain
    mockDbOps['subscriptions'] = createMockChain('subscriptions')

    await POST(makeStripeRequest(event))

    // Verify org was updated with customer ID
    const orgUpdate = mockUpdateData.find((d) => d.table === 'organisations')
    expect(orgUpdate).toBeDefined()
    expect(orgUpdate?.data).toEqual({ stripe_customer_id: 'cus_456' })
  })

  // ── invoice.payment_failed ─────────────────────────────────────────

  it('marks subscription as past_due on invoice.payment_failed', async () => {
    const event = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          subscription: 'sub_123',
          customer: 'cus_456',
        },
      },
    }

    mockConstructEvent.mockReturnValue(event)
    mockDbOps['subscriptions'] = createMockChain('subscriptions')

    const response = await POST(makeStripeRequest(event))
    expect(response.status).toBe(200)

    const subUpdate = mockUpdateData.find((d) => d.table === 'subscriptions')
    expect(subUpdate).toBeDefined()
    expect(subUpdate?.data).toEqual({ status: 'past_due' })
  })

  // ── customer.subscription.updated ──────────────────────────────────

  it('updates subscription status on customer.subscription.updated', async () => {
    const now = Math.floor(Date.now() / 1000)
    const event = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          status: 'active',
          current_period_start: now,
          current_period_end: now + 30 * 86400,
          canceled_at: null,
        },
      },
    }

    mockConstructEvent.mockReturnValue(event)
    mockDbOps['subscriptions'] = createMockChain('subscriptions')

    const response = await POST(makeStripeRequest(event))
    expect(response.status).toBe(200)

    const subUpdate = mockUpdateData.find((d) => d.table === 'subscriptions')
    expect(subUpdate).toBeDefined()
    expect(subUpdate?.data).toEqual(
      expect.objectContaining({
        status: 'active',
        canceled_at: null,
      })
    )
  })

  it('maps canceled status correctly', async () => {
    const now = Math.floor(Date.now() / 1000)
    const event = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          status: 'canceled',
          current_period_start: now,
          current_period_end: now + 30 * 86400,
          canceled_at: now,
        },
      },
    }

    mockConstructEvent.mockReturnValue(event)
    mockDbOps['subscriptions'] = createMockChain('subscriptions')

    await POST(makeStripeRequest(event))

    const subUpdate = mockUpdateData.find((d) => d.table === 'subscriptions')
    expect(subUpdate?.data).toEqual(
      expect.objectContaining({
        status: 'canceled',
        canceled_at: expect.any(String),
      })
    )
  })

  // ── Signature verification ─────────────────────────────────────────

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Signature verification failed')
    })

    const response = await POST(makeStripeRequest({ type: 'test' }, 'bad_sig'))
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('Invalid signature')
  })

  // ── Production mode rejects missing webhook secret ─────────────────

  it('returns 500 when webhook secret is not set in production', async () => {
    mockIsProductionValue = true
    mockWebhookSecret = undefined

    const response = await POST(makeStripeRequest({ type: 'test' }))
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toBe('Webhook configuration error')
  })

  it('returns 400 when signature is missing in production', async () => {
    mockIsProductionValue = true
    mockWebhookSecret = 'whsec_test'

    // Request without stripe-signature header
    const req = new Request('https://uptrue.io/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test' }),
    })

    // constructEvent will throw because signature is null
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signature')
    })

    const response = await POST(req)
    // With webhook secret set but constructEvent throwing, it returns 400
    expect(response.status).toBe(400)
  })

  // ── Allows unverified parsing in development ───────────────────────

  it('allows unverified event parsing in non-production mode', async () => {
    mockIsProductionValue = false
    mockWebhookSecret = undefined

    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: {},
          customer: null,
        },
      },
    }

    // No signature header
    const req = new Request('https://uptrue.io/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
  })

  // ── Processing error does not crash the handler ────────────────────

  it('returns 200 even if event processing throws', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { org_id: 'org-001', plan_slug: 'pro' },
          subscription: 'sub_123',
          customer: 'cus_456',
        },
      },
    }

    mockConstructEvent.mockReturnValue(event)

    // Make plan lookup throw
    const planChain = createMockChain('plans')
    planChain.single.mockImplementation(() => {
      throw new Error('Database timeout')
    })
    mockDbOps['plans'] = planChain

    const response = await POST(makeStripeRequest(event))
    // The route catches processing errors and still returns 200
    expect(response.status).toBe(200)
  })
})

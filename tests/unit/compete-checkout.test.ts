import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

let mockCurrentUser: unknown = null
vi.mock('@/lib/db/users', () => ({
  getCurrentUser: () => mockCurrentUser,
}))

let mockBaseSub: unknown = null
vi.mock('@/lib/db/subscriptions', () => ({
  getSubscriptionWithPlan: () => mockBaseSub,
}))

let mockExistingCompete: unknown = null
let mockCompetePlan: unknown = null
vi.mock('@/lib/db/compete-plans', () => ({
  getCompeteSubscription: () => mockExistingCompete,
  getCompetePlanBySlug: () => mockCompetePlan,
}))

vi.mock('@/lib/utils/config', () => ({
  getServerConfig: () => ({
    appUrl: 'http://localhost:3000',
    stripeSecretKey: 'sk_test_fake',
  }),
}))

// Mock Stripe — we only care about gates before Stripe is called
vi.mock('@/lib/services/stripe', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/fake' }),
      },
    },
    customers: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn().mockResolvedValue({ id: 'cus_test' }),
    },
  }),
}))

// Mock supabase admin (used for Stripe customer lookup after gates pass)
vi.mock('@/lib/supabase/admin', async () => {
  return {
    createAdminClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => ({ data: { stripe_customer_id: null }, error: null }),
            maybeSingle: () => ({ data: null, error: null }),
          }),
        }),
        update: () => ({ eq: () => ({ error: null }) }),
      }),
    }),
  }
})

import { POST } from '@/app/api/v1/compete/checkout/route'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown = { planSlug: 'compete-starter', billingCycle: 'monthly' }) {
  return new NextRequest('http://localhost/api/v1/compete/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Tests — Bug #107: Compete must be Builder+ only
// ---------------------------------------------------------------------------

describe('POST /api/v1/compete/checkout — Builder+ gate (bug #107)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentUser = { id: 'user-1', org_id: 'org-1', email: 'test@test.com' }
    mockBaseSub = null
    mockExistingCompete = null
    mockCompetePlan = null
  })

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser = null
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/not authenticated/i)
  })

  it('returns 403 when org has no active base subscription (Free tier)', async () => {
    mockBaseSub = null
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/active paid plan/i)
  })

  it('returns 403 when base subscription is not active (e.g. canceled)', async () => {
    mockBaseSub = {
      subscription: { status: 'canceled', id: 'sub_1' },
      plan: { slug: 'lite', id: 'plan-lite' },
    }
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/active paid plan/i)
  })

  it('returns 403 for Lite plan — Compete is Builder+ only (bug #107)', async () => {
    mockBaseSub = {
      subscription: { status: 'active', id: 'sub_1' },
      plan: { slug: 'lite', id: 'plan-lite' },
    }
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/Builder plan and above/i)
  })

  it('returns 403 for Starter/unknown plan slug (bug #107)', async () => {
    mockBaseSub = {
      subscription: { status: 'active', id: 'sub_1' },
      plan: { slug: 'starter', id: 'plan-starter' },
    }
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/Builder plan and above/i)
  })

  it('passes the Builder+ gate for Builder plan', async () => {
    mockBaseSub = {
      subscription: { status: 'active', id: 'sub_1' },
      plan: { slug: 'builder', id: 'plan-builder' },
    }
    // After the gate, it checks for existing compete sub — none found
    mockExistingCompete = null
    // Then it tries to load the compete plan — make it valid so it reaches Stripe
    mockCompetePlan = {
      id: 'cp-1',
      slug: 'compete-starter',
      is_active: true,
      stripe_monthly_price_id: 'price_monthly_test',
      has_yearly_discount: false,
      stripe_yearly_price_id: null,
    }

    const res = await POST(makeRequest())
    // Should NOT be 403 from the Builder+ gate.
    // It will reach Stripe checkout (or fail for another reason — not the gate).
    expect(res.status).not.toBe(403)
    // The gate error specifically says "Builder plan and above"
    if (res.status === 403) {
      const body = await res.json()
      expect(body.error).not.toMatch(/Builder plan and above/i)
    }
  })

  it('passes the Builder+ gate for Scale plan', async () => {
    mockBaseSub = {
      subscription: { status: 'active', id: 'sub_1' },
      plan: { slug: 'scale', id: 'plan-scale' },
    }
    mockExistingCompete = null
    mockCompetePlan = {
      id: 'cp-1',
      slug: 'compete-starter',
      is_active: true,
      stripe_monthly_price_id: 'price_monthly_test',
      has_yearly_discount: false,
      stripe_yearly_price_id: null,
    }

    const res = await POST(makeRequest())
    expect(res.status).not.toBe(403)
    if (res.status === 403) {
      const body = await res.json()
      expect(body.error).not.toMatch(/Builder plan and above/i)
    }
  })

  it('returns 400 when already subscribed to Compete', async () => {
    mockBaseSub = {
      subscription: { status: 'active', id: 'sub_1' },
      plan: { slug: 'builder', id: 'plan-builder' },
    }
    mockExistingCompete = { id: 'cs-1', status: 'active' }
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/already have an active Compete/i)
  })
})

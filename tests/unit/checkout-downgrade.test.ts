import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/utils/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, resetAt: Date.now() + 60000 }),
  API_V1_RATE_LIMIT: {},
}))

vi.mock('@/lib/db/users', () => ({
  getCurrentUser: () => mockUser,
}))

vi.mock('@/lib/db/organisations', () => ({
  getCurrentOrganisation: () => mockOrg,
}))

vi.mock('@/lib/validations/schemas', () => ({
  billingCheckoutSchema: { safeParse: (d: unknown) => ({ success: true, data: d }) },
}))

vi.mock('@/lib/validations/validate', () => ({
  validateInput: (_schema: unknown, data: unknown, _ctx: string) => ({
    success: true,
    data: data as { planSlug: string; billingCycle: string },
  }),
}))

vi.mock('@/lib/utils/config', () => ({
  getConfig: () => ({ appUrl: 'http://localhost:3000' }),
  getServerConfig: () => ({
    stripe: { secretKey: 'sk_test_fake', webhookSecret: '' },
    appUrl: 'http://localhost:3000',
  }),
}))

vi.mock('@/lib/services/stripe', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/fake', id: 'cs_test' }),
      },
    },
  }),
  ensureStripeCustomer: vi.fn().mockResolvedValue('cus_test'),
}))

vi.mock('@/lib/db/subscriptions', () => ({
  getPlanBySlug: (_slug: string) => mockPlan,
}))

vi.mock('@/lib/services/payments-razorpay', () => ({
  ensureRazorpayCustomer: vi.fn().mockResolvedValue('rzp_cust_test'),
  createRazorpaySubscription: vi.fn().mockResolvedValue({ id: 'sub_rzp_test' }),
}))

// Supabase mock — table-aware so plans lookup and subscriptions lookup return different data
let mockActiveSubResult: unknown = null

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      // Razorpay checkout reads the plans table directly via supabase
      if (table === 'plans') {
        return {
          select: () => ({
            eq: () => ({
              single: () => ({ data: mockPlan, error: mockPlan ? null : { message: 'Not found' } }),
              maybeSingle: () => ({ data: mockPlan, error: null }),
            }),
          }),
        }
      }
      // subscriptions, organisations, and everything else
      return {
        select: () => ({
          eq: () => ({
            in: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: () => ({ data: mockActiveSubResult, error: null }),
                  single: () => ({ data: mockActiveSubResult, error: null }),
                }),
              }),
            }),
            maybeSingle: () => ({ data: mockActiveSubResult, error: null }),
            single: () => ({ data: mockActiveSubResult, error: null }),
          }),
        }),
        update: () => ({ eq: () => ({ error: null }) }),
      }
    },
  }),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let mockUser: unknown = { id: 'user-1', org_id: 'org-1', email: 'user@test.com' }
let mockOrg: unknown = {
  id: 'org-1',
  name: 'Test Org',
  razorpay_customer_id: null,
  stripe_customer_id: 'cus_existing',
}
let mockPlan: unknown = null

function makePlan(slug: string, overrides: Record<string, unknown> = {}) {
  const prices: Record<string, Record<string, unknown>> = {
    free:    { price_monthly_gbp: 0, price_annual_gbp: 0, onboarding_fee_gbp: 0, stripe_price_id_monthly: null, stripe_price_id_annual: null },
    lite:    { price_monthly_gbp: 100, price_annual_gbp: 1000, onboarding_fee_gbp: 0, stripe_price_id_monthly: 'price_lite_mo', stripe_price_id_annual: 'price_lite_yr' },
    builder: { price_monthly_gbp: 1500, price_annual_gbp: 14400, onboarding_fee_gbp: 0, stripe_price_id_monthly: 'price_bld_mo', stripe_price_id_annual: 'price_bld_yr' },
    scale:   { price_monthly_gbp: 3900, price_annual_gbp: 37400, onboarding_fee_gbp: 0, stripe_price_id_monthly: 'price_scl_mo', stripe_price_id_annual: 'price_scl_yr' },
  }
  return {
    id: `plan-${slug}`,
    slug,
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    ...prices[slug],
    price_monthly_inr: 0,
    price_annual_inr: 0,
    razorpay_monthly_plan_id: `rzp_plan_${slug}_mo`,
    razorpay_annual_plan_id: `rzp_plan_${slug}_yr`,
    ...overrides,
  }
}

import { POST as stripePost } from '@/app/api/v1/billing/checkout/route'
import { POST as razorpayPost } from '@/app/api/v1/billing/razorpay/checkout/route'
import { NextRequest } from 'next/server'

function makeStripeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/v1/billing/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeRazorpayRequest(body: unknown) {
  return new NextRequest('http://localhost/api/v1/billing/razorpay/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Tests — Bug #118/#119: Server-side downgrade prevention
// ---------------------------------------------------------------------------

describe('Stripe checkout — server-side downgrade prevention (bug #119)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { id: 'user-1', org_id: 'org-1', email: 'user@test.com' }
    mockOrg = { id: 'org-1', name: 'Test Org', stripe_customer_id: 'cus_existing' }
    mockActiveSubResult = null
  })

  it('allows upgrade from Lite to Builder', async () => {
    mockActiveSubResult = { plans: { slug: 'lite' } }
    mockPlan = makePlan('builder')
    const res = await stripePost(makeStripeRequest({ planSlug: 'builder', billingCycle: 'monthly' }))
    expect(res.status).not.toBe(403)
  })

  it('allows upgrade from Builder to Scale', async () => {
    mockActiveSubResult = { plans: { slug: 'builder' } }
    mockPlan = makePlan('scale')
    const res = await stripePost(makeStripeRequest({ planSlug: 'scale', billingCycle: 'monthly' }))
    expect(res.status).not.toBe(403)
  })

  it('allows first-time signup (no active sub)', async () => {
    mockActiveSubResult = null
    mockPlan = makePlan('lite')
    const res = await stripePost(makeStripeRequest({ planSlug: 'lite', billingCycle: 'monthly' }))
    expect(res.status).not.toBe(403)
  })

  it('blocks Scale → Builder downgrade (bug #119)', async () => {
    mockActiveSubResult = { plans: { slug: 'scale' } }
    mockPlan = makePlan('builder')
    const res = await stripePost(makeStripeRequest({ planSlug: 'builder', billingCycle: 'monthly' }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/downgrade is not available/i)
  })

  it('blocks Scale → Lite downgrade (bug #119)', async () => {
    mockActiveSubResult = { plans: { slug: 'scale' } }
    mockPlan = makePlan('lite')
    const res = await stripePost(makeStripeRequest({ planSlug: 'lite', billingCycle: 'monthly' }))
    expect(res.status).toBe(403)
  })

  it('blocks Builder → Lite downgrade (bug #119)', async () => {
    mockActiveSubResult = { plans: { slug: 'builder' } }
    mockPlan = makePlan('lite')
    const res = await stripePost(makeStripeRequest({ planSlug: 'lite', billingCycle: 'annual' }))
    expect(res.status).toBe(403)
  })

  it('allows same plan (re-subscribe or billing cycle change)', async () => {
    mockActiveSubResult = { plans: { slug: 'builder' } }
    mockPlan = makePlan('builder')
    const res = await stripePost(makeStripeRequest({ planSlug: 'builder', billingCycle: 'annual' }))
    expect(res.status).not.toBe(403)
  })
})

describe('Razorpay checkout — server-side downgrade prevention (bug #118)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { id: 'user-1', org_id: 'org-1', email: 'user@test.com' }
    mockOrg = { id: 'org-1', name: 'Test Org', razorpay_customer_id: 'rzp_cust_1' }
    mockActiveSubResult = null
  })

  it('allows upgrade from Lite to Builder', async () => {
    mockActiveSubResult = { plans: { slug: 'lite' } }
    mockPlan = makePlan('builder')
    const res = await razorpayPost(makeRazorpayRequest({ planSlug: 'builder', billingCycle: 'monthly' }))
    expect(res.status).not.toBe(403)
  })

  it('allows first-time INR signup', async () => {
    mockActiveSubResult = null
    mockPlan = makePlan('lite')
    const res = await razorpayPost(makeRazorpayRequest({ planSlug: 'lite', billingCycle: 'monthly' }))
    expect(res.status).not.toBe(403)
  })

  it('blocks Scale → Lite downgrade via direct API call (bug #118)', async () => {
    mockActiveSubResult = { plans: { slug: 'scale' } }
    mockPlan = makePlan('lite')
    const res = await razorpayPost(makeRazorpayRequest({ planSlug: 'lite', billingCycle: 'monthly' }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/downgrade is not available/i)
  })

  it('blocks Builder → Lite downgrade via direct API call (bug #118)', async () => {
    mockActiveSubResult = { plans: { slug: 'builder' } }
    mockPlan = makePlan('lite')
    const res = await razorpayPost(makeRazorpayRequest({ planSlug: 'lite', billingCycle: 'monthly' }))
    expect(res.status).toBe(403)
  })

  it('allows same plan re-subscription', async () => {
    mockActiveSubResult = { plans: { slug: 'builder' } }
    mockPlan = makePlan('builder')
    const res = await razorpayPost(makeRazorpayRequest({ planSlug: 'builder', billingCycle: 'monthly' }))
    expect(res.status).not.toBe(403)
  })
})

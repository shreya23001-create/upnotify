import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { getStripe, ensureStripeCustomer } from '@/lib/services/stripe'
import { getPlanBySlug } from '@/lib/db/subscriptions'
import { getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { billingCheckoutSchema } from '@/lib/validations/schemas'
import { validateInput } from '@/lib/validations/validate'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rateLimit = checkRateLimit(request, API_V1_RATE_LIMIT, 'billing-checkout')
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Block payment changes during impersonation
    if ('_impersonatedBy' in user && user._impersonatedBy) {
      return NextResponse.json({ error: 'Payment changes are not allowed during impersonation.' }, { status: 403 })
    }

    const org = await getCurrentOrganisation()
    if (!org) {
      return NextResponse.json(
        { error: 'No organisation found' },
        { status: 400 }
      )
    }

    const body: unknown = await request.json()
    const parsed = validateInput(billingCheckoutSchema, body, 'billing-checkout')
    if (!parsed.success) return parsed.response

    const { planSlug, billingCycle } = parsed.data

    const plan = await getPlanBySlug(planSlug)
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Guard: Free plan should never go to Stripe checkout
    if (plan.slug === 'free' || (plan.price_monthly_gbp === 0 && (!plan.price_annual_gbp || plan.price_annual_gbp === 0) && plan.onboarding_fee_gbp === 0)) {
      logger.warn('Checkout attempted for free plan', { orgId: org.id, planSlug })
      return NextResponse.json(
        { error: 'The Free plan does not require payment. You are already on this plan.' },
        { status: 400 }
      )
    }

    // Use the pre-configured Stripe price IDs from the DB
    const stripePriceId = billingCycle === 'annual' && plan.stripe_price_id_annual
      ? plan.stripe_price_id_annual
      : plan.stripe_price_id_monthly

    if (!stripePriceId) {
      logger.error('No Stripe price ID configured for plan', { planSlug, billingCycle })
      return NextResponse.json(
        { error: 'Stripe pricing not configured for this plan. Please contact support.' },
        { status: 500 }
      )
    }

    const requestOrigin = new URL(request.url).origin
    const config = getConfig()
    const appUrl = config.app.url !== 'http://localhost:3000' ? config.app.url : requestOrigin
    const stripe = getStripe()
    const customerId = await ensureStripeCustomer(org.id, user.email, org.name)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      metadata: { org_id: org.id, plan_slug: plan.slug },
      subscription_data: {
        metadata: { org_id: org.id, plan_slug: plan.slug },
      },
      success_url: `${appUrl}/dashboard/settings?billing=success`,
      cancel_url: `${appUrl}/dashboard/settings?billing=canceled`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
    }

    const url = session.url

    return NextResponse.json({ url })
  } catch (error) {
    logger.error('Checkout error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    const errorMsg = error instanceof Error ? error.message : 'Unknown'
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMsg}` },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { getStripe, ensureStripeCustomer } from '@/lib/services/stripe'
import { getPlanBySlug } from '@/lib/db/subscriptions'
import { createAdminClient } from '@/lib/supabase/admin'
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

    // Server-side downgrade prevention (V1 billing rule: upgrades only).
    // Frontend already blocks this, but direct API calls must also be rejected.
    const PLAN_TIER: Record<string, number> = { free: 0, lite: 1, builder: 2, scale: 3 }
    const supabase = createAdminClient()
    const { data: activeSub } = await supabase
      .from('subscriptions')
      .select('plans!inner(slug)')
      .eq('org_id', org.id)
      .in('status', ['active', 'cancelling', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeSub) {
      const currentSlug = (activeSub as unknown as { plans: { slug: string } }).plans?.slug ?? ''
      const currentTier = PLAN_TIER[currentSlug] ?? 0
      const requestedTier = PLAN_TIER[plan.slug] ?? 0
      if (requestedTier < currentTier) {
        logger.warn('Checkout downgrade attempt blocked', { orgId: org.id, currentSlug, requestedSlug: plan.slug })
        return NextResponse.json(
          { error: 'Plan downgrade is not available. Please contact support if you need to change plans.' },
          { status: 403 }
        )
      }
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

    const appUrl = new URL(request.url).origin
    const stripe = getStripe()
    const customerId = await ensureStripeCustomer(org.id, user.email, org.name)

    // NOTE: do NOT cancel existing subscriptions here. If the user abandons checkout after
    // this point, their current plan would be gone. The webhook (checkout.session.completed)
    // handles cancelling the old sub after the new one is confirmed.

    logger.info('Creating checkout session', { appUrl, stripePriceId, customerId, orgId: org.id, planSlug: plan.slug })

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      metadata: { org_id: org.id, plan_slug: plan.slug },
      subscription_data: {
        metadata: { org_id: org.id, plan_slug: plan.slug },
      },
      // Automatically calculate and collect VAT/tax based on customer location
      automatic_tax: { enabled: true },
      // Save the billing address entered in checkout to the Customer — required for automatic tax
      customer_update: { address: 'auto', name: 'auto' },
      // Allow customers to enter their VAT number for B2B reverse charge
      tax_id_collection: { enabled: true },
      success_url: `${appUrl}/dashboard/settings?tab=billing&billing=success`,
      cancel_url: `${appUrl}/dashboard/settings?tab=billing&billing=canceled`,
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

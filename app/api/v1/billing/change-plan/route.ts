import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { getStripe } from '@/lib/services/stripe'
import { getPlanBySlug, getSubscription } from '@/lib/db/subscriptions'
import { logger } from '@/lib/utils/logger'
import { billingCheckoutSchema } from '@/lib/validations/schemas'
import { validateInput } from '@/lib/validations/validate'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/billing/change-plan — swap an existing Stripe subscription to
 * a different plan/price in place (upgrade or downgrade), with proration.
 * Unlike /billing/checkout (which starts a brand new subscription), this
 * updates the customer's current subscription directly — no redirect, no
 * new checkout session, and Stripe prorates the difference automatically.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rateLimit = checkRateLimit(request, API_V1_RATE_LIMIT, 'billing-change-plan')
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

    if ('_impersonatedBy' in user && user._impersonatedBy) {
      return NextResponse.json({ error: 'Payment changes are not allowed during impersonation.' }, { status: 403 })
    }

    const org = await getCurrentOrganisation()
    if (!org) {
      return NextResponse.json({ error: 'No organisation found' }, { status: 400 })
    }

    const body: unknown = await request.json()
    const parsed = validateInput(billingCheckoutSchema, body, 'billing-change-plan')
    if (!parsed.success) return parsed.response

    const { planSlug, billingCycle } = parsed.data

    const plan = await getPlanBySlug(planSlug)
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const currentSub = await getSubscription(org.id)
    if (!currentSub || !currentSub.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active Stripe subscription to change. Use checkout to subscribe instead.' },
        { status: 400 }
      )
    }

    // Free has no Stripe price — changing to Free means cancelling, not updating
    if (plan.slug === 'free') {
      return NextResponse.json(
        { error: 'To move to the Free plan, cancel your current subscription instead.' },
        { status: 400 }
      )
    }

    const stripePriceId = billingCycle === 'annual' && plan.stripe_price_id_annual
      ? plan.stripe_price_id_annual
      : plan.stripe_price_id_monthly

    if (!stripePriceId) {
      logger.error('No Stripe price ID configured for plan change', { planSlug, billingCycle })
      return NextResponse.json(
        { error: 'Stripe pricing not configured for this plan. Please contact support.' },
        { status: 500 }
      )
    }

    const stripe = getStripe()
    const stripeSub = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id)
    const currentItemId = stripeSub.items.data[0]?.id
    if (!currentItemId) {
      return NextResponse.json({ error: 'Could not read current subscription item.' }, { status: 500 })
    }

    if (stripeSub.items.data[0]?.price?.id === stripePriceId) {
      return NextResponse.json({ error: 'You are already on this plan.' }, { status: 400 })
    }

    // If cancellation was scheduled, changing plans implies the user wants to
    // stay — clear cancel_at_period_end at the same time as the price swap.
    await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
      items: [{ id: currentItemId, price: stripePriceId }],
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false,
      metadata: { org_id: org.id, plan_slug: plan.slug },
    })

    logger.info('Plan changed in place', {
      orgId: org.id,
      stripeSubscriptionId: currentSub.stripe_subscription_id,
      newPlanSlug: plan.slug,
      billingCycle,
    })

    // The DB row is updated by the customer.subscription.updated webhook,
    // which fires immediately as a result of this API call.
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Change plan error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    const errorMsg = error instanceof Error ? error.message : 'Unknown'
    return NextResponse.json(
      { error: `Failed to change plan: ${errorMsg}` },
      { status: 500 }
    )
  }
}

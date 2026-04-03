import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { createCheckoutSession } from '@/lib/services/stripe'
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

    // Determine the correct amount based on billing cycle and plan type
    const amount =
      billingCycle === 'annual' && plan.price_annual_gbp
        ? plan.price_annual_gbp
        : plan.onboarding_fee_gbp > 0
          ? plan.onboarding_fee_gbp
          : plan.price_monthly_gbp

    const cycle: 'monthly' | 'annual' | 'one_time' =
      plan.onboarding_fee_gbp > 0
        ? 'one_time'
        : ((billingCycle || 'monthly') as 'monthly' | 'annual')

    // Use the request origin so the Stripe redirect returns the user to the
    // same domain they started from. This prevents cookie/session loss when
    // config.app.url differs from the actual domain (e.g. Vercel preview).
    const requestOrigin = new URL(request.url).origin
    const config = getConfig()
    const appUrl = requestOrigin || config.app.url
    const url = await createCheckoutSession(
      org.id,
      user.email,
      org.name,
      plan.slug,
      plan.name,
      amount,
      cycle,
      appUrl
    )

    return NextResponse.json({ url })
  } catch (error) {
    logger.error('Checkout error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { getServerConfig } from '@/lib/utils/config'
import {
  ensureRazorpayCustomer,
  createRazorpaySubscription,
  razorpayErrorMessage,
} from '@/lib/services/payments-razorpay'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

const ADDON_PLAN_SLUG = 'lite' // "Pre Plan" — every Add On Plan grants Pre Plan's limits

/**
 * POST /api/v1/billing/razorpay/addon-checkout
 *
 * Creates a Razorpay subscription for an "Add On Plan" purchase — always
 * priced/limited like Pre Plan (slug 'lite'), billed annually on its own
 * cycle starting from purchase date, stacked additively on top of whatever
 * base plan the org already has. Requires an active paid base subscription;
 * unlike the main checkout route, there is no downgrade-prevention check
 * here since an add-on is never a plan change.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rateLimit = checkRateLimit(request, API_V1_RATE_LIMIT, 'razorpay-addon-checkout')
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      })
    }

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if ('_impersonatedBy' in user && user._impersonatedBy) {
      return NextResponse.json({ error: 'Payment changes are not allowed during impersonation.' }, { status: 403 })
    }

    const org = await getCurrentOrganisation()
    if (!org) return NextResponse.json({ error: 'No organisation found' }, { status: 400 })

    const supabase = createAdminClient()

    // An Add On Plan requires an existing active paid base subscription.
    const { data: baseSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('org_id', org.id)
      .in('status', ['active', 'cancelling', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!baseSub) {
      return NextResponse.json(
        { error: 'An Add On Plan requires an active paid subscription. Please subscribe to a plan first.' },
        { status: 403 }
      )
    }

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, slug, price_annual_inr, razorpay_annual_plan_id')
      .eq('slug', ADDON_PLAN_SLUG)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Add-on plan not found' }, { status: 404 })
    }

    const p = plan as unknown as Record<string, unknown>
    const razorpayPlanId = p.razorpay_annual_plan_id as string | null

    const { razorpay } = getServerConfig()
    const isMockMode = !razorpay.keyId || razorpay.keyId === 'rzp_test_placeholder'

    if (isMockMode) {
      const amountPaise = (plan as unknown as Record<string, number>).price_annual_inr ?? 0
      return NextResponse.json({
        mockMode: true,
        subscriptionId: `mock_addon_sub_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`,
        planName: `Add On Plan (${plan.name})`,
        billingCycle: 'annual',
        amountPaise,
        userEmail: user.email,
        orgName: org.name,
      })
    }

    if (!razorpayPlanId) {
      logger.error('Razorpay add-on plan ID not configured', { planSlug: ADDON_PLAN_SLUG })
      return NextResponse.json(
        { error: 'Add-on billing is not configured yet. Please contact support.' },
        { status: 400 }
      )
    }

    const orgRecord = org as unknown as Record<string, unknown>
    let razorpayCustomerId = orgRecord.razorpay_customer_id as string | null

    if (!razorpayCustomerId) {
      razorpayCustomerId = await ensureRazorpayCustomer(user.email, org.name)
      await supabase
        .from('organisations')
        .update({ razorpay_customer_id: razorpayCustomerId } as Record<string, unknown>)
        .eq('id', org.id)
    }

    const rzpSub = await createRazorpaySubscription({
      razorpayPlanId,
      customerId: razorpayCustomerId,
      orgId: org.id,
      planSlug: ADDON_PLAN_SLUG,
      billingCycle: 'annual',
      userEmail: user.email,
      isAddon: true,
    })

    const amountPaise = (plan as unknown as Record<string, number>).price_annual_inr ?? 0

    return NextResponse.json({
      subscriptionId: rzpSub.id,
      keyId: razorpay.keyId,
      planName: `Add On Plan (${plan.name})`,
      billingCycle: 'annual',
      amountPaise,
      userEmail: user.email,
      orgName: org.name,
    })
  } catch (error) {
    logger.error('Razorpay add-on checkout error', {
      error: error instanceof Error ? error.message : razorpayErrorMessage(error),
    })
    return NextResponse.json(
      { error: 'Failed to create Add On Plan checkout. Please try again.' },
      { status: 500 }
    )
  }
}

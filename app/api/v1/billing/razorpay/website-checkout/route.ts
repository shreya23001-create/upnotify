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
  createRazorpayPlan,
  razorpayErrorMessage,
} from '@/lib/services/payments-razorpay'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

const WEBSITE_PLAN_SLUG = 'website' // "Pro Plan" — ₹999/website/year (discounted from ₹1,788), all monitor types included
const GST_RATE = 0.18
const MAX_WEBSITES_PER_CHECKOUT = 50

/**
 * POST /api/v1/billing/razorpay/website-checkout
 *
 * Creates ONE combined Razorpay subscription (billed yearly, auto-renewing)
 * covering every SELECTED pending website — ₹999/website/year + 18% GST,
 * one invoice. Body: { websiteSubscriptionIds: string[] } — ids of the
 * pending ('incomplete') website_subscriptions rows the user selected on
 * the Plans page (each holds exactly one domain — see addPendingWebsites).
 *
 * Adding more websites later, in a SEPARATE checkout, creates a new
 * combined subscription — batches are never merged.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rateLimit = checkRateLimit(request, API_V1_RATE_LIMIT, 'razorpay-website-checkout')
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

    const body = await request.json().catch(() => ({})) as { websiteSubscriptionIds?: unknown }
    const ids = Array.isArray(body.websiteSubscriptionIds)
      ? body.websiteSubscriptionIds.filter((v): v is string => typeof v === 'string')
      : []

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Select at least one website' }, { status: 400 })
    }
    if (ids.length > MAX_WEBSITES_PER_CHECKOUT) {
      return NextResponse.json({ error: `You can subscribe up to ${MAX_WEBSITES_PER_CHECKOUT} websites at once.` }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Only pending ('incomplete'), org-owned rows can be paid for — never
    // trust client-supplied domains directly, only ids the org actually owns.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingRows } = await (supabase as any)
      .from('website_subscriptions')
      .select('id, domains')
      .eq('org_id', org.id)
      .eq('status', 'incomplete')
      .in('id', ids) as { data: Array<{ id: string; domains: string[] }> | null }

    if (!pendingRows || pendingRows.length === 0) {
      return NextResponse.json({ error: 'Selected websites are no longer available. Please refresh and try again.' }, { status: 409 })
    }

    const domains = pendingRows.flatMap(r => r.domains ?? [])
    const websiteCount = domains.length

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, slug, price_annual_inr, razorpay_annual_plan_id')
      .eq('slug', WEBSITE_PLAN_SLUG)
      .single()

    if (planError || !plan) {
      logger.error('Website plan row not found', { slug: WEBSITE_PLAN_SLUG })
      return NextResponse.json({ error: 'Website billing is not configured yet. Please contact support.' }, { status: 500 })
    }

    const p = plan as unknown as Record<string, unknown>
    let razorpayPlanId = p.razorpay_annual_plan_id as string | null
    const discountedPerUnitPaise = (p.price_annual_inr as number) ?? 99900 // ₹999
    // Razorpay charges plan.amount × quantity — so the per-unit price must
    // already be GST-inclusive for the total to come out to
    // (discounted × count) + 18% GST, matching the UI breakdown exactly.
    const gstInclusivePerUnitPaise = Math.round(discountedPerUnitPaise * (1 + GST_RATE))
    const amountPaise = gstInclusivePerUnitPaise * websiteCount

    const { razorpay } = getServerConfig()
    const isMockMode = !razorpay.keyId || razorpay.keyId === 'rzp_test_placeholder'

    if (isMockMode) {
      return NextResponse.json({
        mockMode: true,
        subscriptionId: `mock_website_sub_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`,
        planName: `Pro Plan (${websiteCount} website${websiteCount > 1 ? 's' : ''})`,
        billingCycle: 'annual',
        amountPaise,
        userEmail: user.email,
        orgName: org.name,
      })
    }

    // Lazily create the Razorpay plan (GST-inclusive per-unit price) on
    // first real use and cache it — is_visible=false, never touched by the
    // admin bulk-sync route.
    if (!razorpayPlanId) {
      try {
        const rzpPlan = await createRazorpayPlan({
          name: 'Pro Plan Annual (incl. GST)',
          amountPaise: gstInclusivePerUnitPaise,
          period: 'yearly',
          planSlug: WEBSITE_PLAN_SLUG,
          billingCycle: 'annual',
        })
        razorpayPlanId = rzpPlan.id
        await supabase.from('plans').update({ razorpay_annual_plan_id: razorpayPlanId }).eq('id', plan.id)
      } catch (err) {
        logger.error('Failed to create Razorpay website plan', { error: razorpayErrorMessage(err) })
        return NextResponse.json({ error: 'Failed to set up website billing. Please try again.' }, { status: 500 })
      }
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
      planSlug: WEBSITE_PLAN_SLUG,
      billingCycle: 'annual',
      userEmail: user.email,
      isWebsiteSub: true,
      websiteDomains: domains,
      quantity: websiteCount,
    })

    // The webhook (subscription.activated) deletes these pending rows and
    // inserts one merged active row once payment actually succeeds — don't
    // mutate them here, since the payment isn't confirmed yet at this point.

    return NextResponse.json({
      subscriptionId: rzpSub.id,
      keyId: razorpay.keyId,
      planName: `Pro Plan (${websiteCount} website${websiteCount > 1 ? 's' : ''})`,
      billingCycle: 'annual',
      amountPaise,
      userEmail: user.email,
      orgName: org.name,
      // Returned so the client's checkout success handler can call
      // /api/v1/billing/razorpay/website-confirm right away — the primary
      // activation path is still the webhook, but that requires
      // RAZORPAY_WEBHOOK_SECRET to be configured (only possible once this
      // app is on a real domain Razorpay's dashboard can register a
      // webhook against). This client-verified path uses Razorpay's
      // payment signature (HMAC with RAZORPAY_KEY_SECRET) so it's not
      // trusting an unverified client claim.
      pendingWebsiteIds: pendingRows.map(r => r.id),
    })
  } catch (error) {
    logger.error('Razorpay website checkout error', {
      error: error instanceof Error ? error.message : razorpayErrorMessage(error),
    })
    return NextResponse.json(
      { error: 'Failed to create website checkout. Please try again.' },
      { status: 500 }
    )
  }
}

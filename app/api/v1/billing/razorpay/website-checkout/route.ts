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
import { targetToWebsiteDomain } from '@/lib/utils/validate-domain'

export const dynamic = 'force-dynamic'

const WEBSITE_PLAN_SLUG = 'website' // ₹149/month per monitored website, all monitor types included
const MAX_WEBSITES_PER_CHECKOUT = 50

/**
 * POST /api/v1/billing/razorpay/website-checkout
 *
 * Creates ONE combined Razorpay subscription covering every website added
 * in this checkout session — ₹149/month × domain count, one invoice.
 * Body: { targets: string[] } — raw monitor targets the customer wants to
 * pay for, normalized to target_domains the same way monitor creation does.
 *
 * Adding more websites in a LATER, separate checkout creates a SEPARATE
 * combined subscription — batches are never merged. Already-paid domains
 * in the request are silently dropped rather than double-charged; if that
 * leaves nothing to charge for, the whole request is rejected.
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

    const body = await request.json().catch(() => ({})) as { targets?: unknown }
    const rawTargets = Array.isArray(body.targets) ? body.targets.filter((t): t is string => typeof t === 'string') : []
    if (rawTargets.length === 0) {
      return NextResponse.json({ error: 'At least one website is required' }, { status: 400 })
    }
    if (rawTargets.length > MAX_WEBSITES_PER_CHECKOUT) {
      return NextResponse.json({ error: `You can add up to ${MAX_WEBSITES_PER_CHECKOUT} websites at once.` }, { status: 400 })
    }

    const domains = Array.from(new Set(
      rawTargets.map(t => targetToWebsiteDomain(t.trim())).filter(Boolean)
    ))
    if (domains.length === 0) {
      return NextResponse.json({ error: 'Please enter at least one valid website (e.g. example.com)' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Drop any domain already covered by an active subscription — never
    // double-charge for a website that's already paid for.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activeRows } = await (supabase as any)
      .from('website_subscriptions')
      .select('domains')
      .eq('org_id', org.id)
      .in('status', ['active', 'cancelling', 'past_due'])
    const alreadyPaid = new Set((activeRows ?? []).flatMap((r: { domains: string[] }) => r.domains ?? []))
    const billableDomains = domains.filter(d => !alreadyPaid.has(d))

    if (billableDomains.length === 0) {
      return NextResponse.json({ error: 'All of these websites are already paid for.' }, { status: 409 })
    }

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, slug, price_monthly_inr, razorpay_monthly_plan_id')
      .eq('slug', WEBSITE_PLAN_SLUG)
      .single()

    if (planError || !plan) {
      logger.error('Website plan row not found', { slug: WEBSITE_PLAN_SLUG })
      return NextResponse.json({ error: 'Website billing is not configured yet. Please contact support.' }, { status: 500 })
    }

    const p = plan as unknown as Record<string, unknown>
    let razorpayPlanId = p.razorpay_monthly_plan_id as string | null
    const perUnitPaise = (p.price_monthly_inr as number) ?? 14900
    const amountPaise = perUnitPaise * billableDomains.length

    const { razorpay } = getServerConfig()
    const isMockMode = !razorpay.keyId || razorpay.keyId === 'rzp_test_placeholder'

    if (isMockMode) {
      return NextResponse.json({
        mockMode: true,
        subscriptionId: `mock_website_sub_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`,
        planName: `Website Plan (${billableDomains.length} website${billableDomains.length > 1 ? 's' : ''})`,
        billingCycle: 'monthly',
        amountPaise,
        userEmail: user.email,
        orgName: org.name,
      })
    }

    // Lazily create the Razorpay plan on first real use and cache it —
    // this plan is intentionally is_visible=false (never shown on any
    // pricing picker) so it's never touched by the admin bulk-sync route.
    if (!razorpayPlanId) {
      try {
        const rzpPlan = await createRazorpayPlan({
          name: 'Website Plan Monthly',
          amountPaise: perUnitPaise,
          period: 'monthly',
          planSlug: WEBSITE_PLAN_SLUG,
          billingCycle: 'monthly',
        })
        razorpayPlanId = rzpPlan.id
        await supabase.from('plans').update({ razorpay_monthly_plan_id: razorpayPlanId }).eq('id', plan.id)
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
      billingCycle: 'monthly',
      userEmail: user.email,
      isWebsiteSub: true,
      websiteDomains: billableDomains,
      quantity: billableDomains.length,
    })

    return NextResponse.json({
      subscriptionId: rzpSub.id,
      keyId: razorpay.keyId,
      planName: `Website Plan (${billableDomains.length} website${billableDomains.length > 1 ? 's' : ''})`,
      billingCycle: 'monthly',
      amountPaise,
      userEmail: user.email,
      orgName: org.name,
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

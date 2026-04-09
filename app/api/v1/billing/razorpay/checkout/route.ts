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
} from '@/lib/services/payments-razorpay'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rateLimit = checkRateLimit(request, API_V1_RATE_LIMIT, 'razorpay-checkout')
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

    const body = await request.json() as { planSlug?: string; billingCycle?: string }
    const { planSlug, billingCycle } = body

    if (!planSlug || !billingCycle) {
      return NextResponse.json({ error: 'planSlug and billingCycle are required' }, { status: 400 })
    }
    if (billingCycle !== 'monthly' && billingCycle !== 'annual') {
      return NextResponse.json({ error: 'Invalid billingCycle' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Load plan with Razorpay plan IDs
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, slug, price_monthly_inr, price_annual_inr, razorpay_monthly_plan_id, razorpay_annual_plan_id')
      .eq('slug', planSlug)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const p = plan as unknown as Record<string, unknown>

    if (plan.slug === 'free') {
      return NextResponse.json({ error: 'Free plan does not require payment.' }, { status: 400 })
    }

    const razorpayPlanId = billingCycle === 'annual'
      ? (p.razorpay_annual_plan_id as string | null)
      : (p.razorpay_monthly_plan_id as string | null)

    const { razorpay } = getServerConfig()
    const isMockMode = !razorpay.keyId || razorpay.keyId === 'rzp_test_placeholder'

    // ── MOCK MODE — no real Razorpay keys configured ──────────────────────────
    // Returns a fake subscription ID so the frontend can show a test modal.
    // Remove this block once real keys are added.
    if (isMockMode || !razorpayPlanId) {
      const amountPaise = billingCycle === 'annual'
        ? ((plan as unknown as Record<string, number>).price_annual_inr ?? 0)
        : ((plan as unknown as Record<string, number>).price_monthly_inr ?? 0)
      return NextResponse.json({
        mockMode: true,
        subscriptionId: `mock_sub_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`,
        planSlug: plan.slug,
        planName: plan.name as string,
        billingCycle,
        amountPaise,
        userEmail: user.email,
        orgName: org.name,
      })
    }

    // Ensure Razorpay customer exists for this org
    const orgRecord = org as unknown as Record<string, unknown>
    let razorpayCustomerId = orgRecord.razorpay_customer_id as string | null

    if (!razorpayCustomerId) {
      razorpayCustomerId = await ensureRazorpayCustomer(user.email, org.name)
      await supabase
        .from('organisations')
        .update({ razorpay_customer_id: razorpayCustomerId } as Record<string, unknown>)
        .eq('id', org.id)
    }

    // Create Razorpay subscription (status: 'created' until payment)
    const rzpSub = await createRazorpaySubscription({
      razorpayPlanId,
      customerId: razorpayCustomerId,
      orgId: org.id,
      planSlug: plan.slug,
      billingCycle: billingCycle as 'monthly' | 'annual',
      userEmail: user.email,
    })

    const amountPaise = billingCycle === 'annual'
      ? ((plan as unknown as Record<string, number>).price_annual_inr ?? 0)
      : ((plan as unknown as Record<string, number>).price_monthly_inr ?? 0)

    return NextResponse.json({
      subscriptionId: rzpSub.id,
      keyId: razorpay.keyId,
      planName: plan.name as string,
      billingCycle,
      amountPaise,
      userEmail: user.email,
      orgName: org.name,
    })
  } catch (error) {
    logger.error('Razorpay checkout error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to create Razorpay checkout. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dev/razorpay/simulate
 *
 * DEV / STAGING ONLY — blocked in production.
 *
 * Simulates a Razorpay subscription.activated + subscription.charged event
 * so the full billing flow can be tested without real Razorpay keys.
 *
 * ╔══════════════════════════════════════════════════════╗
 * ║  REMOVE THIS FILE once real Razorpay keys are set   ║
 * ╚══════════════════════════════════════════════════════╝
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { isProduction } from '@/lib/utils/environment'
import { enforceDowngradeLimits, notifyPlanChange } from '@/lib/services/plan-enforcement'
import { activateWebsiteSubscription } from '@/lib/services/website-subscription-activation'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  // Hard block in production
  if (isProduction()) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await getCurrentOrganisation()
  if (!org) return NextResponse.json({ error: 'No organisation found' }, { status: 400 })

  const body = await request.json() as {
    subscriptionId: string
    planSlug: string
    billingCycle: 'monthly' | 'annual'
    amountPaise: number
    quantity?: number
    outcome: 'success' | 'fail'
  }

  const { subscriptionId, planSlug, billingCycle, amountPaise, quantity, outcome } = body

  if (!subscriptionId || !planSlug || !billingCycle) {
    return NextResponse.json({ error: 'subscriptionId, planSlug, billingCycle are required' }, { status: 400 })
  }

  if (outcome === 'fail') {
    logger.info('Razorpay simulate: payment failure selected', { orgId: org.id, planSlug })
    return NextResponse.json({ success: false, message: 'Payment failed (simulated).' })
  }

  // The quantity-first Pro Plan (per-website) purchase flow is a completely
  // separate model from the legacy org-wide `subscriptions` table below —
  // it lives in `website_subscriptions` and is activated via
  // activateWebsiteSubscription, exactly like the real webhook/confirm
  // paths, so mock-mode testing exercises the same code as production.
  if (planSlug === 'website') {
    const result = await activateWebsiteSubscription({
      orgId: org.id,
      domains: [],
      razorpaySubscriptionId: subscriptionId,
      source: 'client_verified',
      amountPaise,
      purchasedQuantity: quantity ?? 1,
    })
    if (!result.activated) {
      return NextResponse.json({ error: 'Failed to activate website subscription (simulated)' }, { status: 500 })
    }
    logger.info('Razorpay simulate: website subscription activated', { orgId: org.id, subscriptionId, quantity })
    return NextResponse.json({ success: true, message: 'Website subscription activated (simulated).' })
  }

  const supabase = createAdminClient()

  // Find the plan
  const { data: plan } = await supabase
    .from('plans')
    .select('id, name')
    .eq('slug', planSlug)
    .single()

  if (!plan) {
    return NextResponse.json({ error: `Plan '${planSlug}' not found` }, { status: 404 })
  }

  // Idempotency guard
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('razorpay_subscription_id', subscriptionId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, message: 'Already activated (idempotent).' })
  }

  // Cancel any existing active Razorpay subscriptions for this org
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', canceled_at: new Date().toISOString() })
    .eq('org_id', org.id)
    .eq('status', 'active')
    .not('razorpay_subscription_id', 'is', null)

  const now          = new Date()
  const periodStart  = now.toISOString()
  const periodEndMs  = billingCycle === 'annual'
    ? now.getTime() + 365 * 24 * 60 * 60 * 1000
    : now.getTime() +  30 * 24 * 60 * 60 * 1000
  const periodEnd    = new Date(periodEndMs).toISOString()

  // ── simulate subscription.activated ──────────────────────────────────────────
  const { data: newSub, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      org_id:                    org.id,
      plan_id:                   plan.id,
      razorpay_subscription_id:  subscriptionId,
      status:                    'active',
      billing_cycle:             billingCycle,
      current_period_start:      periodStart,
      current_period_end:        periodEnd,
    })
    .select('id')
    .single()

  if (subError || !newSub) {
    logger.error('Razorpay simulate: failed to create subscription', { error: String(subError) })
    return NextResponse.json({ error: 'Failed to create subscription record' }, { status: 500 })
  }

  // ── simulate subscription.charged ────────────────────────────────────────────
  const mockPaymentId = `mock_pay_${Date.now()}`

  await supabase.from('invoices').insert({
    org_id:            org.id,
    subscription_id:   newSub.id,
    stripe_invoice_id: `rzp_${mockPaymentId}`,
    amount_gbp:        amountPaise,   // stored in smallest unit, same as pence
    currency:          'inr',
    status:            'paid',
    invoice_pdf_url:   null,
    period_start:      periodStart,
    period_end:        periodEnd,
  })

  await enforceDowngradeLimits(org.id)
  await notifyPlanChange(org.id, plan.name ?? planSlug, 'upgraded')

  logger.info('Razorpay simulate: subscription activated + charged', {
    orgId:          org.id,
    subscriptionId,
    planSlug,
    billingCycle,
    amountPaise,
  })

  return NextResponse.json({
    success: true,
    message: `Subscription activated (simulated). Plan: ${plan.name}`,
  })
}

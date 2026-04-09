/**
 * Razorpay Webhook Handler
 *
 * Events handled:
 *   subscription.activated   → create subscription record + mark active
 *   subscription.charged     → record invoice (payment captured)
 *   subscription.cancelled   → mark subscription canceled in DB
 *   subscription.halted      → payment failed too many times → mark past_due
 *   subscription.resumed     → re-activate after halt
 *   subscription.pending     → created, awaiting first payment (no action)
 *   payment.failed           → log failed payment attempt
 *
 * Register this URL in Razorpay Dashboard → Settings → Webhooks:
 *   https://dev.uptrue.io/api/webhooks/razorpay  (dev)
 *   https://uptrue.io/api/webhooks/razorpay      (prod)
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { verifyRazorpayWebhook } from '@/lib/services/payments-razorpay'
import { isProduction } from '@/lib/utils/environment'
import { enforceDowngradeLimits, notifyPlanChange } from '@/lib/services/plan-enforcement'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RzpSubscription {
  id: string
  plan_id: string
  customer_id: string | null
  status: string
  current_start: number | null
  current_end: number | null
  charge_at: number | null
  notes: Record<string, string>
}

interface RzpPayment {
  id: string
  subscription_id: string | null
  amount: number
  currency: string
  status: string
  invoice_id: string | null
  error_code: string | null
  error_description: string | null
}

interface RzpWebhookEvent {
  event: string
  payload: {
    subscription?: { entity: RzpSubscription }
    payment?: { entity: RzpPayment }
  }
  created_at: number
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleSubscriptionActivated(sub: RzpSubscription): Promise<void> {
  const supabase = createAdminClient()
  const orgId    = sub.notes?.org_id
  const planSlug = sub.notes?.plan_slug
  const cycle    = sub.notes?.billing_cycle as 'monthly' | 'annual' | undefined

  if (!orgId || !planSlug) {
    logger.error('Razorpay webhook: missing org_id or plan_slug in subscription notes', { subId: sub.id })
    return
  }

  // Idempotency: skip if already recorded
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('razorpay_subscription_id', sub.id)
    .maybeSingle()

  if (existing) {
    logger.info('Razorpay: subscription already recorded, skipping', { subId: sub.id })
    return
  }

  const { data: plan } = await supabase
    .from('plans')
    .select('id, name')
    .eq('slug', planSlug)
    .single()

  if (!plan) {
    logger.error('Razorpay: plan not found in DB', { planSlug })
    return
  }

  // Cancel any existing active Razorpay subscriptions for this org to avoid double-billing
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', canceled_at: new Date().toISOString() })
    .eq('org_id', orgId)
    .eq('status', 'active')
    .not('razorpay_subscription_id', 'is', null)

  const periodStart = sub.current_start ? new Date(sub.current_start * 1000).toISOString() : new Date().toISOString()
  const periodEnd   = sub.current_end   ? new Date(sub.current_end   * 1000).toISOString() : null

  await supabase.from('subscriptions').insert({
    org_id: orgId,
    plan_id: plan.id,
    razorpay_subscription_id: sub.id,
    status: 'active',
    billing_cycle: cycle ?? 'monthly',
    current_period_start: periodStart,
    current_period_end:   periodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })

  // Store razorpay customer_id on org if present
  if (sub.customer_id) {
    await supabase
      .from('organisations')
      .update({ razorpay_customer_id: sub.customer_id } as Record<string, unknown>)
      .eq('id', orgId)
  }

  await enforceDowngradeLimits(orgId)
  await notifyPlanChange(orgId, plan.name ?? planSlug, 'upgraded')

  logger.info('Razorpay: subscription activated', { subId: sub.id, orgId, planSlug })
}

async function handleSubscriptionCharged(sub: RzpSubscription, payment: RzpPayment | null): Promise<void> {
  const supabase = createAdminClient()
  const orgId    = sub.notes?.org_id

  if (!orgId || !payment) return

  // Find our subscription record
  const { data: subRecord } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('razorpay_subscription_id', sub.id)
    .maybeSingle()

  // Update period dates
  if (sub.current_start && sub.current_end && subRecord) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date(sub.current_start * 1000).toISOString(),
        current_period_end:   new Date(sub.current_end   * 1000).toISOString(),
      })
      .eq('id', subRecord.id)
  }

  // Idempotency: skip if invoice already recorded
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('stripe_invoice_id', `rzp_${payment.id}`)
    .maybeSingle()

  if (existingInvoice) {
    logger.info('Razorpay: invoice already recorded', { paymentId: payment.id })
    return
  }

  await supabase.from('invoices').insert({
    org_id:          orgId,
    subscription_id: subRecord?.id ?? null,
    stripe_invoice_id: `rzp_${payment.id}`,  // re-use stripe_invoice_id field as unique invoice ref
    amount_gbp:      payment.amount,          // paise — same as how Stripe pence is stored
    currency:        'inr',
    status:          'paid',
    invoice_pdf_url: null,                    // Razorpay generates GST invoice in their dashboard
    period_start:    sub.current_start ? new Date(sub.current_start * 1000).toISOString() : null,
    period_end:      sub.current_end   ? new Date(sub.current_end   * 1000).toISOString() : null,
  })

  logger.info('Razorpay: payment charged + invoice recorded', {
    paymentId: payment.id,
    orgId,
    amountPaise: payment.amount,
  })
}

async function handleSubscriptionCancelled(sub: RzpSubscription): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', canceled_at: new Date().toISOString() })
    .eq('razorpay_subscription_id', sub.id)

  const orgId = sub.notes?.org_id
  if (orgId) await enforceDowngradeLimits(orgId)

  logger.info('Razorpay: subscription cancelled', { subId: sub.id, orgId })
}

async function handleSubscriptionHalted(sub: RzpSubscription): Promise<void> {
  // Halted = all retry attempts failed. Mark past_due.
  const supabase = createAdminClient()

  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('razorpay_subscription_id', sub.id)

  logger.warn('Razorpay: subscription halted (all payment retries failed)', {
    subId: sub.id,
    orgId: sub.notes?.org_id,
  })
}

async function handleSubscriptionResumed(sub: RzpSubscription): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: sub.current_start ? new Date(sub.current_start * 1000).toISOString() : undefined,
      current_period_end:   sub.current_end   ? new Date(sub.current_end   * 1000).toISOString() : undefined,
    })
    .eq('razorpay_subscription_id', sub.id)

  logger.info('Razorpay: subscription resumed', { subId: sub.id })
}

async function handlePaymentFailed(payment: RzpPayment): Promise<void> {
  logger.warn('Razorpay: payment failed', {
    paymentId: payment.id,
    subscriptionId: payment.subscription_id,
    errorCode: payment.error_code,
    errorDescription: payment.error_description,
  })
  // Razorpay retries automatically according to its retry schedule.
  // No DB update here — subscription remains active until halted.
}

// ─── POST /api/webhooks/razorpay ──────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  const body      = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  // Verify signature (required in production; skipped locally if no secret set)
  if (isProduction()) {
    if (!verifyRazorpayWebhook(body, signature)) {
      logger.error('Razorpay webhook: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  } else if (signature) {
    // In dev/staging, verify if secret is set; otherwise allow unverified for testing
    if (!verifyRazorpayWebhook(body, signature)) {
      logger.warn('Razorpay webhook: signature mismatch (non-production — continuing)')
    }
  }

  let event: RzpWebhookEvent
  try {
    event = JSON.parse(body) as RzpWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sub     = event.payload?.subscription?.entity ?? null
  const payment = event.payload?.payment?.entity ?? null

  try {
    switch (event.event) {
      case 'subscription.activated':
        if (sub) await handleSubscriptionActivated(sub)
        break

      case 'subscription.charged':
        if (sub) await handleSubscriptionCharged(sub, payment)
        break

      case 'subscription.cancelled':
        if (sub) await handleSubscriptionCancelled(sub)
        break

      case 'subscription.halted':
        if (sub) await handleSubscriptionHalted(sub)
        break

      case 'subscription.resumed':
        if (sub) await handleSubscriptionResumed(sub)
        break

      case 'payment.failed':
        if (payment) await handlePaymentFailed(payment)
        break

      case 'subscription.pending':
        // Subscription created but awaiting first payment — no action needed
        logger.info('Razorpay: subscription pending', { subId: sub?.id })
        break

      default:
        logger.info('Razorpay: unhandled webhook event', { event: event.event })
    }
  } catch (error) {
    logger.error('Razorpay webhook processing error', {
      event: event.event,
      error: error instanceof Error ? error.message : String(error),
    })
    // Return 200 so Razorpay doesn't retry — we log the error internally
  }

  return NextResponse.json({ received: true })
}

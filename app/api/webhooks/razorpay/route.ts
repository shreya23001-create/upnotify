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
import { verifyRazorpayWebhook, cancelRazorpaySubscription } from '@/lib/services/payments-razorpay'
import { getStripe } from '@/lib/services/stripe'
import { isProduction } from '@/lib/utils/environment'
import { getServerConfig } from '@/lib/utils/config'
import { enforceDowngradeLimits, notifyPlanChange } from '@/lib/services/plan-enforcement'
import { writeAuditLog } from '@/lib/db/audit'

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
  // Reject mock subscription IDs — they exist only for dev testing and must never
  // be processed by real webhook logic (idempotency guard would miss them otherwise)
  if (sub.id.startsWith('mock_')) {
    logger.info('Razorpay webhook: ignoring mock subscription ID', { subId: sub.id })
    return
  }

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

  // Cancel ALL existing active subscriptions for this org — both Razorpay and Stripe.
  // This prevents double-billing when a user switches payment providers or upgrades.
  const { data: existingActiveSubs } = await supabase
    .from('subscriptions')
    .select('id, stripe_subscription_id, razorpay_subscription_id, plan_id, billing_cycle, current_period_start, current_period_end')
    .eq('org_id', orgId)
    .in('status', ['active', 'cancelling'])

  for (const existingSub of existingActiveSubs ?? []) {
    // Cancel in Stripe if this was a Stripe subscription
    if (existingSub.stripe_subscription_id) {
      try {
        await getStripe().subscriptions.cancel(existingSub.stripe_subscription_id)
      } catch (err) {
        logger.warn('Razorpay activation: failed to cancel old Stripe sub', {
          stripeSubId: existingSub.stripe_subscription_id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
    // Cancel in Razorpay if this was a Razorpay subscription — must cancel via API
    // so Razorpay stops billing, not just update the DB.
    const oldRzpId = existingSub.razorpay_subscription_id as string | undefined
    if (oldRzpId && oldRzpId !== sub.id) {
      try {
        await cancelRazorpaySubscription(oldRzpId, false) // immediate — user has moved to new sub
      } catch (err) {
        logger.warn('Razorpay activation: failed to cancel old Razorpay sub via API', {
          oldRzpSubId: oldRzpId,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  // ── Detect annual upgrade and log credit record ──────────────────────────
  // An annual upgrade is: old sub was Razorpay + annual, new sub is also annual.
  // Log it non-fatally so it never blocks the main activation flow.
  if (cycle === 'annual') {
    const oldAnnualRzpSub = (existingActiveSubs ?? []).find(
      s => s.razorpay_subscription_id && s.billing_cycle === 'annual'
    )

    if (oldAnnualRzpSub?.plan_id && oldAnnualRzpSub.razorpay_subscription_id && oldAnnualRzpSub.current_period_start && oldAnnualRzpSub.current_period_end) {
      try {
        const now = new Date()
        const periodEnd = new Date(oldAnnualRzpSub.current_period_end)
        const msRemaining = Math.max(0, periodEnd.getTime() - now.getTime())
        const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24))

        const [oldPlanRes, newPlanRes, orgRes, userRes] = await Promise.all([
          supabase
            .from('plans')
            .select('id, name, slug, price_annual_inr')
            .eq('id', oldAnnualRzpSub.plan_id)
            .single(),
          supabase
            .from('plans')
            .select('id, name, slug, price_annual_inr')
            .eq('slug', planSlug)
            .single(),
          supabase
            .from('organisations')
            .select('name')
            .eq('id', orgId)
            .single(),
          supabase
            .from('users')
            .select('email')
            .eq('org_id', orgId)
            .order('created_at', { ascending: true })
            .limit(1)
            .single(),
        ])

        const oldPlan = oldPlanRes.data
        const newPlanData = newPlanRes.data
        const orgData = orgRes.data
        const userData = userRes.data

        if (oldPlan && newPlanData && orgData && userData && daysRemaining > 0) {
          const oldPriceInr  = oldPlan.price_annual_inr  ?? 0
          const newPriceInr  = newPlanData.price_annual_inr ?? 0
          const creditAmountInr = Math.floor((daysRemaining / 365) * oldPriceInr)

          // Use intermediate variable to avoid TS excess-property literal check on insert overload
          const upgradeLogEntry = {
            org_id:                       orgId,
            org_name:                     orgData.name,
            user_email:                   userData.email,
            old_razorpay_subscription_id: oldAnnualRzpSub.razorpay_subscription_id,
            old_plan_id:                  oldPlan.id,
            old_plan_name:                oldPlan.name,
            old_plan_slug:                oldPlan.slug,
            old_plan_price_annual_inr:    oldPriceInr,
            old_subscription_started_at:  oldAnnualRzpSub.current_period_start,
            old_subscription_period_end:  oldAnnualRzpSub.current_period_end,
            new_razorpay_subscription_id: sub.id,
            new_plan_id:                  newPlanData.id,
            new_plan_name:                newPlanData.name,
            new_plan_slug:                newPlanData.slug,
            new_plan_price_annual_inr:    newPriceInr,
            upgraded_at:                  now.toISOString(),
            days_remaining:               daysRemaining,
            credit_amount_inr:            creditAmountInr,
            refund_status:                'pending' as const,
          }
          await supabase.from('razorpay_annual_upgrade_log').insert(upgradeLogEntry)

          logger.info('Razorpay: annual upgrade credit logged', {
            orgId,
            oldPlan: oldPlan.slug,
            newPlan: newPlanData.slug,
            daysRemaining,
            creditAmountInr,
          })
        }
      } catch (logErr) {
        // Non-fatal — credit logging must never block the activation
        logger.error('Razorpay: failed to log annual upgrade credit (non-fatal)', {
          orgId,
          error: logErr instanceof Error ? logErr.message : String(logErr),
        })
      }
    }
  }

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', canceled_at: new Date().toISOString() })
    .eq('org_id', orgId)
    .in('status', ['active', 'cancelling'])

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

  await writeAuditLog({
    orgId,
    userId: null,
    action: 'subscription.created',
    resourceType: 'subscription',
    metadata: {
      razorpay_subscription_id: sub.id,
      plan_slug: planSlug,
      plan_name: plan.name,
      billing_cycle: cycle ?? 'monthly',
      currency: 'inr',
      source: 'razorpay_webhook',
    },
  })
}

async function handleSubscriptionCharged(sub: RzpSubscription, payment: RzpPayment | null): Promise<void> {
  const supabase = createAdminClient()
  const orgId    = sub.notes?.org_id

  if (!orgId || !payment) {
    logger.warn('Razorpay subscription.charged: missing orgId or payment entity — invoice not recorded', {
      subId: sub.id,
      hasOrgId: !!orgId,
      hasPayment: !!payment,
    })
    return
  }

  // Find our subscription record (include status to avoid overwriting cancelling → active)
  const { data: subRecord } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('razorpay_subscription_id', sub.id)
    .maybeSingle()

  // Update period dates. Only flip status to 'active' when recovering from 'past_due'.
  // Never overwrite 'cancelling' — user requested cancel-at-period-end and a renewal
  // charge mid-period must not undo that.
  if (sub.current_start && sub.current_end && subRecord) {
    const updatePayload: Record<string, unknown> = {
      current_period_start: new Date(sub.current_start * 1000).toISOString(),
      current_period_end:   new Date(sub.current_end   * 1000).toISOString(),
    }
    if (subRecord.status === 'past_due') {
      updatePayload.status = 'active'
    }
    await supabase
      .from('subscriptions')
      .update(updatePayload)
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

  await writeAuditLog({
    orgId,
    userId: null,
    action: 'invoice.paid',
    resourceType: 'invoice',
    metadata: {
      razorpay_payment_id: payment.id,
      razorpay_subscription_id: sub.id,
      amount_paid: payment.amount,
      currency: 'inr',
      source: 'razorpay_webhook',
    },
  })
}

async function handleSubscriptionCancelled(sub: RzpSubscription): Promise<void> {
  const supabase = createAdminClient()
  const orgId = sub.notes?.org_id

  // The cancel route already sets status='canceled' before this webhook arrives.
  // Skip if already canceled to avoid a race-condition overwrite.
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('razorpay_subscription_id', sub.id)
    .maybeSingle()

  if (existing?.status === 'canceled') {
    logger.info('Razorpay webhook: subscription already canceled in DB — skipping', { subId: sub.id })
    return
  }

  // Fallback: handle cancellations that arrive via webhook without going through our cancel route
  // (e.g. cancelled directly in Razorpay dashboard)
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', canceled_at: new Date().toISOString() })
    .eq('razorpay_subscription_id', sub.id)

  if (orgId) await enforceDowngradeLimits(orgId)

  logger.info('Razorpay: subscription cancelled via webhook', { subId: sub.id, orgId })

  if (orgId) {
    await writeAuditLog({
      orgId,
      userId: null,
      action: 'subscription.canceled',
      resourceType: 'subscription',
      metadata: {
        razorpay_subscription_id: sub.id,
        source: 'razorpay_webhook',
      },
    })
  }
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

  const orgId = sub.notes?.org_id
  if (orgId) {
    await writeAuditLog({
      orgId,
      userId: null,
      action: 'subscription.halted',
      resourceType: 'subscription',
      metadata: {
        razorpay_subscription_id: sub.id,
        reason: 'all_payment_retries_failed',
        source: 'razorpay_webhook',
      },
    })
  }
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

  const orgId = sub.notes?.org_id
  if (orgId) {
    await writeAuditLog({
      orgId,
      userId: null,
      action: 'subscription.resumed',
      resourceType: 'subscription',
      metadata: {
        razorpay_subscription_id: sub.id,
        source: 'razorpay_webhook',
      },
    })
  }
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

  // engineering-app#62 — verify signature in EVERY environment whenever the
  // webhook secret is configured. Previously dev/staging accepted unsigned
  // requests, which let anyone POST a fake subscription.activated event to
  // dev.uptrue.io and forge plan changes against any org id they could
  // guess. The env name is not the right signal; the presence of the secret
  // is. If the secret isn't set, the integration isn't wired up — return
  // 503 rather than silently accepting unsigned payloads.
  const { razorpay } = getServerConfig()
  if (!razorpay.webhookSecret) {
    logger.error('Razorpay webhook: RAZORPAY_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Razorpay webhook not configured' }, { status: 503 })
  }
  if (!verifyRazorpayWebhook(body, signature)) {
    logger.error('Razorpay webhook: invalid signature', { env: isProduction() ? 'prod' : 'non-prod' })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
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

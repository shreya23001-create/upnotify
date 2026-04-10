import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/services/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { getServerConfig } from '@/lib/utils/config'
import { enforceDowngradeLimits, notifyPlanChange } from '@/lib/services/plan-enforcement'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const supabase = createAdminClient()
  const orgId = session.metadata?.org_id
  const checkoutType = session.metadata?.type

  // Handle Compete add-on checkout
  if (checkoutType === 'compete_addon') {
    const competePlanSlug = session.metadata?.compete_plan_slug
    if (orgId && competePlanSlug && session.subscription) {
      const { data: competePlan } = await supabase
        .from('compete_plans')
        .select('id')
        .eq('slug', competePlanSlug)
        .single()

      if (competePlan) {
        const subResponse = await getStripe().subscriptions.retrieve(
          session.subscription as string
        )
        const subObj = subResponse as unknown as {
          items: { data: Array<{ price?: { recurring?: { interval?: string } }; current_period_start?: number; current_period_end?: number }> }
          current_period_start?: number
          current_period_end?: number
        }
        const competeItem = subObj.items.data[0]
        const competeStartTs = subObj.current_period_start ?? competeItem?.current_period_start
        const competeEndTs = subObj.current_period_end ?? competeItem?.current_period_end

        // Cancel any existing compete subscription for this org
        await supabase
          .from('compete_subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('org_id', orgId)
          .eq('status', 'active')

        await supabase.from('compete_subscriptions').insert({
          org_id: orgId,
          compete_plan_id: competePlan.id,
          stripe_subscription_id: session.subscription as string,
          status: 'active',
          billing_cycle: competeItem?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
          current_period_start: competeStartTs ? new Date(competeStartTs * 1000).toISOString() : new Date().toISOString(),
          current_period_end: competeEndTs ? new Date(competeEndTs * 1000).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        logger.info('Compete subscription created from checkout', {
          orgId,
          competePlanSlug,
        })
      }
    }
  } else {
    // Handle base plan checkout
    const planSlug = session.metadata?.plan_slug

    logger.info('checkout.session.completed: base plan', {
      orgId, planSlug,
      subscriptionId: session.subscription,
      sessionId: session.id,
    })

    if (!orgId) { logger.error('checkout: missing org_id in metadata', { sessionId: session.id }); return }
    if (!planSlug) { logger.error('checkout: missing plan_slug in metadata', { sessionId: session.id }); return }
    if (!session.subscription) { logger.error('checkout: missing subscription on session', { sessionId: session.id }); return }

    // Idempotency guard: Stripe may retry the webhook — skip if already recorded
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', session.subscription as string)
      .maybeSingle()

    if (existingSub) {
      logger.info('checkout: subscription already recorded — skipping duplicate webhook', {
        subscriptionId: session.subscription,
        orgId,
        sessionId: session.id,
      })
      return
    }

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name')
      .eq('slug', planSlug)
      .single()

    if (planError || !plan) {
      logger.error('checkout: plan not found in DB', { planSlug, error: planError?.message })
      return
    }

    logger.info('checkout: plan found', { planId: plan.id, planName: plan.name })

    // Cancel old subscriptions (active OR cancelling — both need cleanup now that new one exists)
    const { data: oldSubs } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('org_id', orgId)
      .in('status', ['active', 'cancelling'])

    for (const oldSub of (oldSubs ?? [])) {
      const oldStripeId = oldSub.stripe_subscription_id as string | null
      if (oldStripeId && oldStripeId !== (session.subscription as string)) {
        try {
          // For cancelling subs, cancel_at_period_end is already set — force cancel now
          // since the user has subscribed to a new plan
          await getStripe().subscriptions.cancel(oldStripeId)
          logger.info('checkout: cancelled old Stripe subscription', { oldStripeId, orgId })
        } catch (err) {
          logger.error('checkout: failed to cancel old Stripe sub', { oldStripeId, error: String(err) })
        }
      }
    }

    // Cancel old DB subscription rows (active and cancelling)
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .in('status', ['active', 'cancelling'])

    // Retrieve the new Stripe subscription for period dates.
    // Stripe API 2025-01-27.acacia moved current_period_start/end to the
    // subscription item level. We check both locations for compatibility.
    const subResponse = await getStripe().subscriptions.retrieve(session.subscription as string)
    const subObj = subResponse as unknown as {
      items: { data: Array<{ price?: { recurring?: { interval?: string } }; current_period_start?: number; current_period_end?: number }> }
      current_period_start?: number
      current_period_end?: number
    }
    const subItem = subObj.items.data[0]
    const startTs = subObj.current_period_start ?? subItem?.current_period_start
    const endTs = subObj.current_period_end ?? subItem?.current_period_end

    const insertPayload = {
      org_id: orgId,
      plan_id: plan.id,
      stripe_subscription_id: session.subscription as string,
      status: 'active',
      billing_cycle: subItem?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
      current_period_start: startTs ? new Date(startTs * 1000).toISOString() : new Date().toISOString(),
      current_period_end: endTs ? new Date(endTs * 1000).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }

    logger.info('checkout: inserting subscription', insertPayload)

    const { error: insertError } = await supabase.from('subscriptions').insert(insertPayload)

    if (insertError) {
      logger.error('checkout: FAILED to insert subscription', { error: insertError.message, code: insertError.code, details: insertError.details })
      return
    }

    logger.info('checkout: subscription inserted successfully', { orgId, planSlug })

    await enforceDowngradeLimits(orgId)
    await notifyPlanChange(orgId, plan.name ?? planSlug, 'upgraded')
  }

  // Ensure stripe_customer_id is stored on the org
  if (orgId && session.customer) {
    await supabase
      .from('organisations')
      .update({ stripe_customer_id: session.customer as string })
      .eq('id', orgId)
  }
}

async function handleInvoicePaid(
  invoiceObj: Stripe.Invoice
): Promise<void> {
  const supabase = createAdminClient()
  const invoice = invoiceObj as unknown as Record<string, unknown>
  const customerId = invoice.customer as string

  const { data: org } = await supabase
    .from('organisations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!org) return

  const subId = (invoice.subscription as string | null) ?? null
  let subscriptionRecordId: string | undefined

  // Fetch the Stripe subscription to get accurate billing period dates.
  // invoice.period_start/end is the invoice-creation timestamp for new subs
  // (both equal to "now"). The subscription's current_period_* is correct.
  let periodStart: string | null = null
  let periodEnd: string | null = null

  if (subId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subId)
      .single()
    subscriptionRecordId = data?.id

    try {
      const stripeSub = await getStripe().subscriptions.retrieve(subId)
      const sub = stripeSub as unknown as { current_period_start: number; current_period_end: number }
      periodStart = new Date(sub.current_period_start * 1000).toISOString()
      periodEnd = new Date(sub.current_period_end * 1000).toISOString()
    } catch {
      // Fall back to invoice-level period if subscription retrieval fails
      periodStart = invoice.period_start ? new Date((invoice.period_start as number) * 1000).toISOString() : null
      periodEnd = invoice.period_end ? new Date((invoice.period_end as number) * 1000).toISOString() : null
    }
  }

  // Avoid duplicate invoice records (Stripe may retry)
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('stripe_invoice_id', invoice.id as string)
    .maybeSingle()

  if (existing) {
    logger.info('Invoice already recorded, skipping', { invoiceId: invoice.id })
    return
  }

  await supabase.from('invoices').insert({
    org_id: org.id,
    subscription_id: subscriptionRecordId ?? null,
    stripe_invoice_id: invoice.id as string,
    amount_gbp: (invoice.amount_paid as number) ?? 0,
    currency: ((invoice.currency as string) ?? 'gbp').toLowerCase(),
    status: 'paid',
    invoice_pdf_url: (invoice.invoice_pdf as string) ?? null,
    period_start: periodStart,
    period_end: periodEnd,
  })

  logger.info('Invoice recorded', {
    orgId: org.id,
    invoiceId: invoice.id,
  })
}

async function handleInvoicePaymentFailed(
  invoiceObj: Stripe.Invoice
): Promise<void> {
  const supabase = createAdminClient()
  const invoice = invoiceObj as unknown as Record<string, unknown>
  const subId = (invoice.subscription as string | null) ?? null

  if (subId) {
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subId)

    logger.warn('Subscription payment failed', {
      subscriptionId: subId,
    })
  }
}

async function handleSubscriptionUpdated(
  subObj: Stripe.Subscription
): Promise<void> {
  const supabase = createAdminClient()
  const sub = subObj as unknown as Record<string, unknown>
  const items = (sub.items as { data: Array<{ current_period_start?: number; current_period_end?: number }> }).data
  const item = items?.[0]

  // Stripe API 2025+ moved current_period_* to subscription item level
  const periodStart = (sub.current_period_start as number | undefined) ?? item?.current_period_start
  const periodEnd   = (sub.current_period_end   as number | undefined) ?? item?.current_period_end

  // cancel_at_period_end=true means user cancelled but keeps access until period end
  const cancelAtPeriodEnd = sub.cancel_at_period_end as boolean | undefined

  const statusMap: Record<string, string> = {
    active:    cancelAtPeriodEnd ? 'cancelling' : 'active',
    past_due:  'past_due',
    canceled:  'canceled',
    paused:    'paused',
  }

  // Guard: don't overwrite past_due → active without payment confirmation.
  // If DB says past_due but Stripe says active, the customer.subscription.updated
  // event fires without a corresponding invoice.paid — skip the status update.
  const { data: existingRow } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('stripe_subscription_id', sub.id as string)
    .maybeSingle()

  const incomingStatus = statusMap[sub.status as string] ?? 'incomplete'
  const currentDbStatus = existingRow?.status ?? null
  const isSpuriousActivation = incomingStatus === 'active' && currentDbStatus === 'past_due'

  const updateData: Record<string, unknown> = {
    status: isSpuriousActivation ? 'past_due' : incomingStatus,
    ...(periodStart ? { current_period_start: new Date(periodStart * 1000).toISOString() } : {}),
    ...(periodEnd   ? { current_period_end:   new Date(periodEnd   * 1000).toISOString() } : {}),
    // Only set canceled_at when Stripe actually provides it — never clear it on unrelated events
    ...(sub.canceled_at ? { canceled_at: new Date((sub.canceled_at as number) * 1000).toISOString() } : {}),
  }

  // Update base subscription
  await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', sub.id as string)

  // Also update compete subscription if it matches
  await supabase
    .from('compete_subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', sub.id as string)
}

async function handleSubscriptionDeleted(
  subObj: Stripe.Subscription
): Promise<void> {
  const supabase = createAdminClient()
  const sub = subObj as unknown as Record<string, unknown>
  const cancelData = {
    status: 'canceled',
    canceled_at: new Date().toISOString(),
  }

  // Look up our subscription record to get org_id (needed for limit enforcement)
  const { data: subRecord } = await supabase
    .from('subscriptions')
    .select('id, org_id, plan_id')
    .eq('stripe_subscription_id', sub.id as string)
    .maybeSingle()

  // Cancel base subscription
  await supabase
    .from('subscriptions')
    .update(cancelData)
    .eq('stripe_subscription_id', sub.id as string)

  // Also cancel compete subscription if it matches
  await supabase
    .from('compete_subscriptions')
    .update(cancelData)
    .eq('stripe_subscription_id', sub.id as string)

  // Only enforce Free plan limits if the org has no other active/cancelling subscription.
  // If the user upgraded to a new plan, the new active sub already exists and downgrade
  // enforcement would incorrectly pause monitors on a paying customer.
  if (subRecord?.org_id) {
    const { count: otherActiveSubs } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', subRecord.org_id)
      .in('status', ['active', 'cancelling', 'trialing'])
      .neq('id', subRecord.id)

    if ((otherActiveSubs ?? 0) > 0) {
      logger.info('Subscription deleted but org has another active sub — skipping limit enforcement', {
        subscriptionId: sub.id,
        orgId: subRecord.org_id,
      })
      return
    }

    await enforceDowngradeLimits(subRecord.org_id)

    // Find plan name for notification
    let planName = 'Free'
    if (subRecord.plan_id) {
      const { data: plan } = await supabase
        .from('plans')
        .select('name')
        .eq('id', subRecord.plan_id)
        .single()
      if (plan) planName = plan.name
    }

    // Find org admin to notify
    const { data: owner } = await supabase
      .from('users')
      .select('id')
      .eq('org_id', subRecord.org_id)
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (owner) {
      await notifyPlanChange(subRecord.org_id, planName, 'downgraded')
    }
  }

  logger.info('Subscription canceled + limits enforced', { subscriptionId: sub.id, orgId: subRecord?.org_id })
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  const { stripe } = getServerConfig()
  const webhookSecret = stripe.webhookSecret

  // Signature verification is mandatory in all environments.
  // For local testing use: stripe listen --forward-to localhost:3000/api/webhooks/stripe
  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET is not configured — rejecting webhook')
    return NextResponse.json({ error: 'Webhook misconfigured' }, { status: 500 })
  }

  if (!signature) {
    logger.error('Stripe webhook missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', {
      error: err instanceof Error ? err.message : 'Unknown',
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        )
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
        )
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        )
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        )
        break
    }
  } catch (error) {
    logger.error('Stripe webhook processing error', {
      event: event.type,
      error: error instanceof Error ? error.message : 'Unknown',
    })
  }

  return NextResponse.json({ received: true })
}

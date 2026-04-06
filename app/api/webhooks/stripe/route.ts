import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/services/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { getServerConfig } from '@/lib/utils/config'
import { isProduction } from '@/lib/utils/environment'
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
        const sub = 'data' in subResponse ? subResponse.data : subResponse
        const subObj = sub as unknown as { items: { data: Array<{ price?: { recurring?: { interval?: string } } }> }; current_period_start: number; current_period_end: number }

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
          billing_cycle:
            subObj.items.data[0]?.price?.recurring?.interval === 'year'
              ? 'annual'
              : 'monthly',
          current_period_start: new Date(
            subObj.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subObj.current_period_end * 1000
          ).toISOString(),
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

    if (orgId && planSlug && session.subscription) {
      const { data: plan } = await supabase
        .from('plans')
        .select('id, name')
        .eq('slug', planSlug)
        .single()

      if (plan) {
        // Fetch old active subscriptions BEFORE canceling them in DB,
        // so we can cancel them in Stripe too (prevents double-billing on upgrade)
        const { data: oldSubs } = await supabase
          .from('subscriptions')
          .select('stripe_subscription_id')
          .eq('org_id', orgId)
          .eq('status', 'active')

        // Cancel old Stripe subscriptions to stop double-billing
        if (oldSubs && oldSubs.length > 0) {
          for (const oldSub of oldSubs) {
            const oldStripeId = oldSub.stripe_subscription_id as string | null
            if (oldStripeId && oldStripeId !== (session.subscription as string)) {
              try {
                await getStripe().subscriptions.cancel(oldStripeId)
                logger.info('Cancelled old Stripe subscription on upgrade', {
                  oldStripeSubId: oldStripeId,
                  newStripeSubId: session.subscription,
                  orgId,
                })
              } catch (err) {
                logger.error('Failed to cancel old Stripe subscription on upgrade', {
                  oldStripeSubId: oldStripeId,
                  orgId,
                  error: err instanceof Error ? err.message : 'Unknown',
                })
              }
            }
          }
        }

        // Cancel any existing base subscription for this org (upgrade/change scenario)
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('org_id', orgId)
          .eq('status', 'active')

        const subResponse = await getStripe().subscriptions.retrieve(
          session.subscription as string
        )
        const sub = 'data' in subResponse ? subResponse.data : subResponse
        const subObj = sub as unknown as { items: { data: Array<{ price?: { recurring?: { interval?: string } } }> }; current_period_start: number; current_period_end: number }
        await supabase.from('subscriptions').insert({
          org_id: orgId,
          plan_id: plan.id,
          stripe_subscription_id: session.subscription as string,
          status: 'active',
          billing_cycle:
            subObj.items.data[0]?.price?.recurring?.interval === 'year'
              ? 'annual'
              : 'monthly',
          current_period_start: new Date(
            subObj.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subObj.current_period_end * 1000
          ).toISOString(),
        })
        logger.info('Subscription created from checkout', {
          orgId,
          planSlug,
        })

        // Consequence 1: enforce downgrade limits (in case of plan change)
        await enforceDowngradeLimits(orgId)

        // Consequence 2: notify user
        await notifyPlanChange(orgId, plan.name ?? planSlug, 'upgraded')
      }
    }
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

  if (subId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subId)
      .single()
    subscriptionRecordId = data?.id
  }

  await supabase.from('invoices').insert({
    org_id: org.id,
    subscription_id: subscriptionRecordId ?? null,
    stripe_invoice_id: invoice.id as string,
    amount_gbp: (invoice.amount_paid as number) ?? 0,
    currency: ((invoice.currency as string) ?? 'gbp').toLowerCase(),
    status: 'paid',
    invoice_pdf_url: (invoice.invoice_pdf as string) ?? null,
    period_start: invoice.period_start
      ? new Date((invoice.period_start as number) * 1000).toISOString()
      : null,
    period_end: invoice.period_end
      ? new Date((invoice.period_end as number) * 1000).toISOString()
      : null,
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

  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
  }

  const updateData = {
    status: statusMap[sub.status as string] ?? 'incomplete',
    current_period_start: new Date(
      (sub.current_period_start as number) * 1000
    ).toISOString(),
    current_period_end: new Date(
      (sub.current_period_end as number) * 1000
    ).toISOString(),
    canceled_at: sub.canceled_at
      ? new Date((sub.canceled_at as number) * 1000).toISOString()
      : null,
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

  logger.info('Subscription canceled', { subscriptionId: sub.id })
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  const { stripe } = getServerConfig()
  const webhookSecret = stripe.webhookSecret

  // In production, webhook signature verification is mandatory
  if (isProduction() && !webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET is not configured in production — rejecting webhook')
    return NextResponse.json(
      { error: 'Webhook configuration error' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    if (webhookSecret && signature) {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } else if (!isProduction()) {
      // Development/staging only: allow unverified parsing for local testing
      logger.warn('Stripe webhook parsed without signature verification (non-production)')
      event = JSON.parse(body) as Stripe.Event
    } else {
      // Production with missing signature — reject
      logger.error('Stripe webhook missing signature in production')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', {
      error: err instanceof Error ? err.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
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

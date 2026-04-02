import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/services/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { getServerConfig } from '@/lib/utils/config'
import { isProduction } from '@/lib/utils/environment'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const supabase = createAdminClient()
  const orgId = session.metadata?.org_id
  const planSlug = session.metadata?.plan_slug

  if (orgId && planSlug && session.subscription) {
    const { data: plan } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', planSlug)
      .single()

    if (plan) {
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

  await supabase
    .from('subscriptions')
    .update({
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
    })
    .eq('stripe_subscription_id', sub.id as string)
}

async function handleSubscriptionDeleted(
  subObj: Stripe.Subscription
): Promise<void> {
  const supabase = createAdminClient()
  const sub = subObj as unknown as Record<string, unknown>

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
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

import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeClient) {
    const { stripe } = getServerConfig()
    if (!stripe.secretKey) throw new Error('STRIPE_SECRET_KEY not set')
    stripeClient = new Stripe(stripe.secretKey)
  }
  return stripeClient
}

/** Ensure a Stripe customer exists for this org — creates one if needed */
export async function ensureStripeCustomer(
  orgId: string,
  email: string,
  name: string
): Promise<string> {
  const supabase = createAdminClient()

  const { data: org } = await supabase
    .from('organisations')
    .select('stripe_customer_id')
    .eq('id', orgId)
    .single()

  if (org?.stripe_customer_id) return org.stripe_customer_id

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { org_id: orgId },
  })

  const { error: updateError } = await supabase
    .from('organisations')
    .update({ stripe_customer_id: customer.id })
    .eq('id', orgId)

  if (updateError) {
    logger.error('Failed to save Stripe customer ID to org', {
      orgId,
      customerId: customer.id,
      error: updateError.message,
    })
  }

  logger.info('Stripe customer created', { orgId, customerId: customer.id })
  return customer.id
}

/**
 * Get or create a Stripe Product + Price for a plan.
 * Products are matched by metadata.plan_slug so they are created only once.
 */
async function ensureStripePrice(
  planSlug: string,
  planName: string,
  amountPence: number,
  interval: 'month' | 'year' | null
): Promise<string> {
  const stripe = getStripe()

  // Search for existing product by metadata
  const products = await stripe.products.list({ limit: 10 })
  let product = products.data.find(
    (p) => p.metadata.plan_slug === planSlug
  )

  if (!product) {
    product = await stripe.products.create({
      name: `Uptrue ${planName}`,
      metadata: { plan_slug: planSlug },
    })
    logger.info('Stripe product created', {
      planSlug,
      productId: product.id,
    })
  }

  // Find or create price
  const priceKey = interval
    ? `${planSlug}_${interval}`
    : `${planSlug}_one_time`

  const prices = await stripe.prices.list({ product: product.id, limit: 10 })
  let price = prices.data.find(
    (p) => p.metadata.price_key === priceKey && p.active
  )

  if (!price) {
    const priceData: Stripe.PriceCreateParams = {
      product: product.id,
      unit_amount: amountPence,
      currency: 'gbp',
      metadata: { price_key: priceKey },
    }
    if (interval) {
      priceData.recurring = { interval }
    }
    price = await stripe.prices.create(priceData)
    logger.info('Stripe price created', { priceKey, priceId: price.id })
  }

  return price.id
}

/** Create a Stripe Checkout session for a plan subscription or one-time payment */
export async function createCheckoutSession(
  orgId: string,
  email: string,
  orgName: string,
  planSlug: string,
  planName: string,
  amountPence: number,
  billingCycle: 'monthly' | 'annual' | 'one_time',
  appUrl: string
): Promise<string> {
  const stripe = getStripe()
  const customerId = await ensureStripeCustomer(orgId, email, orgName)

  const interval: 'month' | 'year' | null =
    billingCycle === 'monthly'
      ? 'month'
      : billingCycle === 'annual'
        ? 'year'
        : null

  const priceId = await ensureStripePrice(
    planSlug,
    planName,
    amountPence,
    interval
  )

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: interval ? 'subscription' : 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings?billing=success`,
    cancel_url: `${appUrl}/dashboard/settings?billing=canceled`,
    metadata: { org_id: orgId, plan_slug: planSlug },
  }

  if (interval) {
    sessionParams.subscription_data = {
      metadata: { org_id: orgId, plan_slug: planSlug },
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  logger.info('Checkout session created', {
    orgId,
    planSlug,
    sessionId: session.id,
  })

  if (!session.url) {
    throw new Error('Stripe checkout session URL was not returned')
  }

  return session.url
}

/** Create a Stripe Customer Portal session so users can manage billing */
export async function createPortalSession(
  stripeCustomerId: string,
  appUrl: string
): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl}/dashboard/settings`,
  })
  return session.url
}

/** Create a Checkout session to charge £1 for a new monitor (usage-based plan) */
export async function createMonitorChargeSession(
  orgId: string,
  email: string,
  orgName: string,
  appUrl: string
): Promise<string> {
  const stripe = getStripe()
  const customerId = await ensureStripeCustomer(orgId, email, orgName)

  const priceId = await ensureStripePrice('usage-monitor', 'Monitor (Usage-based)', 100, null)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/monitors/new?paid=true`,
    cancel_url: `${appUrl}/dashboard/monitors/new?paid=canceled`,
    metadata: { org_id: orgId, type: 'monitor_creation' },
    payment_intent_data: {
      metadata: { org_id: orgId, type: 'monitor_creation' },
    },
  })

  logger.info('Monitor charge session created', { orgId, sessionId: session.id })

  if (!session.url) throw new Error('Stripe checkout session URL was not returned')
  return session.url
}

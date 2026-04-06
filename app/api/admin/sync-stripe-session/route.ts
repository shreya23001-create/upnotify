import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/services/stripe'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/admin/sync-stripe-session
 * Admin-only. Manually processes a Stripe checkout.session.completed event.
 * Use this when webhooks are not reaching the server (e.g. dev environment).
 *
 * Body: { sessionId: "cs_test_..." }
 */

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as { sessionId?: string }
  const { sessionId } = body

  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'sessionId is required and must be a Stripe checkout session ID (cs_...)' }, { status: 400 })
  }

  const stripe = getStripe()
  const supabase = createAdminClient()

  // Retrieve the session from Stripe
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    return NextResponse.json({ error: `Stripe error: ${err instanceof Error ? err.message : 'Unknown'}` }, { status: 400 })
  }

  if (session.status !== 'complete') {
    return NextResponse.json({ error: `Session status is '${session.status}' — only complete sessions can be synced` }, { status: 400 })
  }

  const orgId = session.metadata?.org_id
  const planSlug = session.metadata?.plan_slug

  if (!orgId || !planSlug || !session.subscription) {
    return NextResponse.json({
      error: 'Session is missing required metadata (org_id, plan_slug) or subscription ID',
      metadata: session.metadata,
      subscription: session.subscription,
    }, { status: 400 })
  }

  // Verify org exists
  const { data: org } = await supabase.from('organisations').select('id, name').eq('id', orgId).single()
  if (!org) {
    return NextResponse.json({ error: `Organisation not found: ${orgId}` }, { status: 404 })
  }

  // Find the plan
  const { data: plan } = await supabase.from('plans').select('id, name').eq('slug', planSlug).single()
  if (!plan) {
    return NextResponse.json({ error: `Plan not found: ${planSlug}` }, { status: 404 })
  }

  // Cancel any existing active subscriptions in DB
  const { data: oldSubs } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('org_id', orgId)
    .eq('status', 'active')

  // Cancel old Stripe subscriptions to prevent double-billing
  for (const oldSub of (oldSubs ?? [])) {
    const oldStripeId = oldSub.stripe_subscription_id as string | null
    if (oldStripeId && oldStripeId !== (session.subscription as string)) {
      try {
        await stripe.subscriptions.cancel(oldStripeId)
        logger.info('sync-stripe-session: cancelled old Stripe subscription', { oldStripeId })
      } catch (err) {
        logger.warn('sync-stripe-session: failed to cancel old Stripe subscription', { oldStripeId, error: String(err) })
      }
    }
  }

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', canceled_at: new Date().toISOString() })
    .eq('org_id', orgId)
    .eq('status', 'active')

  // Retrieve the Stripe subscription details
  const stripeSubRaw = await stripe.subscriptions.retrieve(session.subscription as string)
  const stripeSub = stripeSubRaw as unknown as { items: { data: Array<{ price?: { recurring?: { interval?: string } } }> }; current_period_start: number; current_period_end: number }
  const interval = stripeSub.items.data[0]?.price?.recurring?.interval
  const billingCycle = interval === 'year' ? 'annual' : 'monthly'

  // Insert the new subscription
  const { error: insertError } = await supabase.from('subscriptions').insert({
    org_id: orgId,
    plan_id: plan.id,
    stripe_subscription_id: session.subscription as string,
    status: 'active',
    billing_cycle: billingCycle,
    current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
  })

  if (insertError) {
    return NextResponse.json({ error: `Failed to insert subscription: ${insertError.message}` }, { status: 500 })
  }

  // Store stripe_customer_id on org
  if (session.customer) {
    await supabase
      .from('organisations')
      .update({ stripe_customer_id: session.customer as string })
      .eq('id', orgId)
  }

  logger.info('sync-stripe-session: subscription manually synced', { orgId, planSlug, sessionId })

  return NextResponse.json({
    success: true,
    orgId,
    orgName: org.name,
    planSlug,
    planName: plan.name,
    billingCycle,
    stripeSubscriptionId: session.subscription,
  })
}

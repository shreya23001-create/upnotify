import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getCompetePlanBySlug, getCompeteSubscription } from '@/lib/db/compete-plans'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { getStripe } from '@/lib/services/stripe'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user has a paid base plan (not free)
    const baseSub = await getSubscriptionWithPlan(user.org_id)
    if (!baseSub?.subscription || baseSub.subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'You need an active paid plan to add Compete. Upgrade from Settings > Billing first.' },
        { status: 403 }
      )
    }

    // Check not already subscribed to Compete
    const existingCompete = await getCompeteSubscription(user.org_id)
    if (existingCompete) {
      return NextResponse.json(
        { error: 'You already have an active Compete subscription. Manage it from Settings > Billing.' },
        { status: 400 }
      )
    }

    const body = await request.json() as { planSlug: string; billingCycle: 'monthly' | 'annual' }
    const { planSlug, billingCycle } = body

    if (!planSlug || !billingCycle) {
      return NextResponse.json({ error: 'planSlug and billingCycle are required' }, { status: 400 })
    }

    const plan = await getCompetePlanBySlug(planSlug)
    if (!plan || !plan.is_active) {
      return NextResponse.json({ error: 'Invalid Compete plan' }, { status: 400 })
    }

    // Determine which Stripe price to use
    let stripePriceId: string | null = null
    if (billingCycle === 'annual' && plan.has_yearly_discount && plan.stripe_yearly_price_id) {
      stripePriceId = plan.stripe_yearly_price_id
    } else if (plan.stripe_monthly_price_id) {
      stripePriceId = plan.stripe_monthly_price_id
    }

    if (!stripePriceId) {
      return NextResponse.json(
        { error: 'Stripe pricing not configured for this plan. Please contact support.' },
        { status: 500 }
      )
    }

    const config = getServerConfig()
    const stripe = getStripe()

    // Get or create Stripe customer
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    const { data: org } = await supabase
      .from('organisations')
      .select('stripe_customer_id, name')
      .eq('id', user.org_id)
      .single()

    let customerId = org?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: org?.name ?? undefined,
        metadata: { org_id: user.org_id },
      })
      customerId = customer.id
      await supabase
        .from('organisations')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.org_id)
    }

    // Create Checkout Session for the Compete add-on
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      metadata: {
        org_id: user.org_id,
        compete_plan_slug: planSlug,
        type: 'compete_addon',
      },
      subscription_data: {
        metadata: {
          org_id: user.org_id,
          compete_plan_slug: planSlug,
          type: 'compete_addon',
        },
      },
      success_url: `${config.app.url}/dashboard/compete?checkout=success`,
      cancel_url: `${config.app.url}/dashboard/compete?checkout=cancelled`,
    })

    logger.info('Compete checkout session created', {
      orgId: user.org_id,
      planSlug,
      billingCycle,
      sessionId: session.id,
    })

    return NextResponse.json({ success: true, url: session.url })
  } catch (error) {
    logger.error('Compete checkout error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

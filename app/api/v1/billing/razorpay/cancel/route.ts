import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { cancelRazorpaySubscription } from '@/lib/services/payments-razorpay'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rateLimit = checkRateLimit(request, API_V1_RATE_LIMIT, 'razorpay-cancel')
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if ('_impersonatedBy' in user && user._impersonatedBy) {
      return NextResponse.json({ error: 'Payment changes are not allowed during impersonation.' }, { status: 403 })
    }

    const org = await getCurrentOrganisation()
    if (!org) return NextResponse.json({ error: 'No organisation found' }, { status: 400 })

    const supabase = createAdminClient()

    // Find active Razorpay subscription for this org
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, razorpay_subscription_id, status')
      .eq('org_id', org.id)
      .eq('status', 'active')
      .not('razorpay_subscription_id', 'is', null)
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'No active Razorpay subscription found.' }, { status: 404 })
    }

    const sub = subscription as unknown as Record<string, unknown>
    const rzpSubId = sub.razorpay_subscription_id as string

    // Cancel at end of current billing cycle (not immediately)
    await cancelRazorpaySubscription(rzpSubId, true)

    // Mark subscription as cancelling in DB (webhook will set it to 'canceled' at period end)
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelling' } as Record<string, unknown>)
      .eq('id', subscription.id)

    logger.info('Razorpay subscription cancellation requested', {
      orgId: org.id,
      subscriptionId: subscription.id,
      rzpSubId,
    })

    return NextResponse.json({ success: true, message: 'Subscription will cancel at the end of the current billing period.' })
  } catch (error) {
    logger.error('Razorpay cancel error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to cancel subscription. Please try again or contact support.' },
      { status: 500 }
    )
  }
}

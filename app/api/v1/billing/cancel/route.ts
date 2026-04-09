import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { pauseSubscription, cancelSubscription, resumeSubscription, enforceDowngradeLimits } from '@/lib/services/plan-enforcement'
import { cancelRazorpaySubscription } from '@/lib/services/payments-razorpay'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Block impersonation
    if ('_impersonatedBy' in user && user._impersonatedBy) {
      return NextResponse.json({ error: 'Not allowed during impersonation.' }, { status: 403 })
    }

    const body = await request.json() as {
      action: 'cancel' | 'pause' | 'resume'
      reason?: string
      reasonDetail?: string
    }

    if (!body.action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    const subWithPlan = await getSubscriptionWithPlan(user.org_id)
    if (!subWithPlan?.subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    const sub = subWithPlan.subscription
    const plan = subWithPlan.plan

    if (body.action === 'pause') {
      if (!sub.stripe_subscription_id) {
        return NextResponse.json({ error: 'Cannot pause — no Stripe subscription linked' }, { status: 400 })
      }

      const result = await pauseSubscription(
        user.org_id,
        user.id,
        sub.stripe_subscription_id,
        body.reason ?? 'too_expensive',
        body.reasonDetail,
        plan?.slug
      )

      return NextResponse.json(result)
    }

    if (body.action === 'cancel') {
      if (!body.reason) {
        return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 })
      }

      const subRecord = sub as unknown as Record<string, unknown>
      const rzpSubId = subRecord.razorpay_subscription_id as string | null

      // Razorpay subscription — cancel via Razorpay API
      if (rzpSubId) {
        await cancelRazorpaySubscription(rzpSubId, true) // cancel at cycle end
        const supabase = createAdminClient()
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelling' } as Record<string, unknown>)
          .eq('id', sub.id)
        await enforceDowngradeLimits(user.org_id)
        return NextResponse.json({ success: true, message: 'Subscription will cancel at the end of the current billing period.' })
      }

      if (!sub.stripe_subscription_id) {
        return NextResponse.json({ error: 'Cannot cancel — no payment provider linked to subscription' }, { status: 400 })
      }

      const result = await cancelSubscription(
        user.org_id,
        user.id,
        sub.stripe_subscription_id,
        body.reason,
        body.reasonDetail,
        plan?.slug
      )

      return NextResponse.json(result)
    }

    if (body.action === 'resume') {
      if ((sub.status as string) !== 'paused') {
        return NextResponse.json({ error: 'Subscription is not paused' }, { status: 400 })
      }

      if (!sub.stripe_subscription_id) {
        return NextResponse.json({ error: 'Cannot resume — no Stripe subscription linked' }, { status: 400 })
      }

      const result = await resumeSubscription(
        user.org_id,
        user.id,
        sub.stripe_subscription_id
      )

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action. Use cancel, pause, or resume.' }, { status: 400 })
  } catch (error) {
    logger.error('Billing cancel/pause error', { error: error instanceof Error ? error.message : 'Unknown' })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

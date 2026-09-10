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

    const body = await request.json().catch(() => ({})) as { cancelAddons?: boolean }
    const cancelAddons = body.cancelAddons === true

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

    // Optionally cancel every active/cancelling/past_due Add-On Plan for this
    // org at the same time. Each add-on is cancelled independently — if one
    // fails to cancel via the Razorpay API, the others still proceed, and the
    // DB rows are still marked 'cancelling' so the webhook can settle them.
    let addonsCancelled = 0
    if (cancelAddons) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: activeAddons } = await (supabase as any)
        .from('org_addon_subscriptions')
        .select('id, razorpay_subscription_id')
        .eq('org_id', org.id)
        .in('status', ['active', 'cancelling', 'past_due'])
        .not('razorpay_subscription_id', 'is', null)

      for (const addon of (activeAddons ?? []) as Array<{ id: string; razorpay_subscription_id: string }>) {
        try {
          await cancelRazorpaySubscription(addon.razorpay_subscription_id, true)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('org_addon_subscriptions')
            .update({ status: 'cancelling' })
            .eq('id', addon.id)
          addonsCancelled += 1
        } catch (err) {
          logger.warn('Failed to cancel one add-on subscription during bulk cancel', {
            orgId: org.id,
            addonId: addon.id,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }

      logger.info('Razorpay add-on subscriptions cancellation requested', {
        orgId: org.id,
        addonsCancelled,
      })
    }

    return NextResponse.json({
      success: true,
      message: cancelAddons
        ? 'Subscription and add-ons will cancel at the end of their current billing periods.'
        : 'Subscription will cancel at the end of the current billing period.',
      addonsCancelled,
    })
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

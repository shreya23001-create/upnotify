/**
 * GET /api/cron/razorpay-recovery
 * Schedule: Daily at 10am IST (4:30am UTC)
 *
 * Finds Razorpay subscriptions in past_due status (payment failed / subscription halted)
 * and sends an in-app message + email nudging the user to update their payment method.
 *
 * Razorpay retries failed payments automatically on its own schedule.
 * This cron adds a human-readable nudge so the user knows what to do.
 *
 * A subscription is only notified once per 3 days to avoid spam.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendUserMessage } from '@/lib/db/user-messages'
import { sendAlertEmail } from '@/lib/services/email'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { enforceDowngradeLimits } from '@/lib/services/plan-enforcement'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const RAZORPAY_DASHBOARD_URL = 'https://dashboard.razorpay.com/app/subscriptions'
const NOTIFY_COOLDOWN_DAYS = 3  // don't re-notify within this many days

interface PastDueSub {
  id: string
  org_id: string
  razorpay_subscription_id: string
  updated_at: string
}

interface OrgOwner {
  id: string
  email: string
}

export async function GET(request: Request): Promise<NextResponse> {
  // Auth check
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/razorpay-recovery', getTriggeredBy(request))

  const supabase = createAdminClient()
  let notified = 0
  let skipped = 0
  let errors = 0

  try {
    // Find all Razorpay subscriptions in past_due (halted = payment failed repeatedly)
    const { data: pastDueSubs, error } = await supabase
      .from('subscriptions')
      .select('id, org_id, razorpay_subscription_id, updated_at')
      .eq('status', 'past_due')
      .not('razorpay_subscription_id', 'is', null)

    if (error) {
      logger.error('razorpay-recovery: failed to query past_due subs', { error: error.message })
      await endCronRun(runId, cronStart, 'error', { errorMessage: error.message })
      return NextResponse.json({ error: 'DB query failed' }, { status: 500 })
    }

    if (!pastDueSubs || pastDueSubs.length === 0) {
      logger.info('razorpay-recovery: no past_due Razorpay subscriptions found')
      await endCronRun(runId, cronStart, 'ok', { summary: 'No past_due Razorpay subscriptions' })
      return NextResponse.json({ success: true, notified: 0, skipped: 0 })
    }

    const cutoff = new Date(Date.now() - NOTIFY_COOLDOWN_DAYS * 86400000).toISOString()

    for (const sub of pastDueSubs as PastDueSub[]) {
      try {
        // Skip if we already notified recently (updated_at acts as our proxy —
        // we update it when we send the nudge below)
        if (sub.updated_at > cutoff) {
          skipped++
          continue
        }

        // Find org admin
        const { data: owner } = await supabase
          .from('users')
          .select('id, email')
          .eq('org_id', sub.org_id)
          .eq('role', 'admin')
          .eq('is_active', true)
          .limit(1)
          .single()

        if (!owner) {
          logger.warn('razorpay-recovery: no active admin found for org', { orgId: sub.org_id })
          skipped++
          continue
        }

        const ownerTyped = owner as unknown as OrgOwner

        // In-app message
        await sendUserMessage({
          userId: ownerTyped.id,
          orgId: sub.org_id,
          title: 'Action required: payment failed',
          body: 'Your Razorpay payment has failed and your subscription is on hold. Please update your payment method in the Razorpay dashboard to restore your monitors and alerts.',
          type: 'error',
          category: 'billing',
          actionUrl: RAZORPAY_DASHBOARD_URL,
          actionLabel: 'Update Payment Method',
        })

        // Email nudge
        if (ownerTyped.email) {
          await sendAlertEmail({
            to: ownerTyped.email,
            subject: '[Uptrue] Payment failed — action required',
            body: [
              'Your Uptrue subscription payment has failed.',
              '',
              'Razorpay will retry automatically, but you can also update your payment method directly:',
              RAZORPAY_DASHBOARD_URL,
              '',
              'If the payment is not resolved, your subscription will remain on hold and your monitors will not run.',
              '',
              'If you have any questions, reply to this email.',
            ].join('\n'),
          })
        }

        // Bump updated_at so we don't re-notify within cooldown period
        await supabase
          .from('subscriptions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sub.id)

        logger.info('razorpay-recovery: notified org of past_due sub', {
          orgId: sub.org_id,
          subscriptionId: sub.id,
          rzpSubId: sub.razorpay_subscription_id,
        })

        notified++
      } catch (err) {
        logger.error('razorpay-recovery: error processing sub', {
          subscriptionId: sub.id,
          error: err instanceof Error ? err.message : String(err),
        })
        errors++
      }
    }

    // ── Expire cancelling Razorpay subscriptions whose period has ended ────────
    // The webhook sets status='cancelling' when cancel_at_cycle_end=1 fires. This
    // sweep finalises them once current_period_end has passed.
    let expired = 0
    const { data: cancellingSubs } = await supabase
      .from('subscriptions')
      .select('id, org_id')
      .eq('status', 'cancelling')
      .not('razorpay_subscription_id', 'is', null)
      .lt('current_period_end', new Date().toISOString())

    for (const sub of cancellingSubs ?? []) {
      try {
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('id', sub.id)
        await enforceDowngradeLimits(sub.org_id)
        logger.info('razorpay-recovery: expired cancelling subscription', { subscriptionId: sub.id, orgId: sub.org_id })
        expired++
      } catch (err) {
        logger.error('razorpay-recovery: failed to expire cancelling sub', {
          subscriptionId: sub.id,
          error: err instanceof Error ? err.message : String(err),
        })
        errors++
      }
    }

    const summary = `Notified: ${notified}, Skipped: ${skipped}, Expired: ${expired}, Errors: ${errors}`
    await endCronRun(runId, cronStart, errors > 0 && notified === 0 ? 'error' : 'ok', { summary })

    return NextResponse.json({ success: true, notified, skipped, expired, errors })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('razorpay-recovery: cron failed', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}

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
 *
 * Also polls Razorpay directly for renewal charges (see pollRenewals below) —
 * this account has no dashboard access to register a webhook, so
 * app/api/webhooks/razorpay's subscription.charged handler never fires in
 * practice. Polling once a day is the only way renewals get recorded.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendUserMessage } from '@/lib/db/user-messages'
import { sendAlertEmail } from '@/lib/services/email'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { enforceDowngradeLimits } from '@/lib/services/plan-enforcement'
import { requireCronAuth } from '@/lib/auth/cron-auth'
import { fetchRazorpaySubscriptionState, fetchLatestRazorpayInvoiceForSubscription } from '@/lib/services/payments-razorpay'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

interface PollableSub {
  id: string
  org_id: string
  razorpay_subscription_id: string
  status: string
  current_period_end: string | null
}

/**
 * Polls Razorpay directly for each active/past_due/cancelling subscription
 * (base `subscriptions` and per-website `website_subscriptions`) and records
 * a renewal the same way the webhook's handleSubscriptionCharged would,
 * whenever Razorpay's current_end has moved past what we have stored.
 *
 * Detection is via current_end advancing rather than a payment-count field,
 * since neither table stores Razorpay's paid_count today — comparing period
 * end is sufficient and avoids a schema migration.
 */
async function pollRenewals(
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ checked: number; renewed: number; errors: number }> {
  let checked = 0
  let renewed = 0
  let errors = 0

  async function pollTable(
    table: 'subscriptions' | 'website_subscriptions'
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (supabase as any)
      .from(table)
      .select('id, org_id, razorpay_subscription_id, status, current_period_end')
      .in('status', ['active', 'past_due', 'cancelling'])
      .not('razorpay_subscription_id', 'is', null)

    for (const row of (rows ?? []) as PollableSub[]) {
      checked++
      try {
        const rzpSub = await fetchRazorpaySubscriptionState(row.razorpay_subscription_id)
        if (!rzpSub || !rzpSub.current_end) continue

        const rzpPeriodEnd = new Date(rzpSub.current_end * 1000).toISOString()
        const dbPeriodEnd = row.current_period_end

        // No renewal if Razorpay's period end hasn't moved past ours.
        if (dbPeriodEnd && rzpPeriodEnd <= dbPeriodEnd) continue

        const invoiceInfo = await fetchLatestRazorpayInvoiceForSubscription(row.razorpay_subscription_id)
        if (!invoiceInfo) {
          logger.warn('razorpay-recovery: renewal detected but no invoice found on Razorpay side', {
            table, subscriptionId: row.id, rzpSubId: row.razorpay_subscription_id,
          })
          continue
        }

        // Idempotency — matches the same key format handleSubscriptionCharged uses.
        const stripeInvoiceId = `rzp_${invoiceInfo.paymentId}`
        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('stripe_invoice_id', stripeInvoiceId)
          .maybeSingle()
        if (existingInvoice) continue

        const rzpPeriodStart = rzpSub.current_start ? new Date(rzpSub.current_start * 1000).toISOString() : null
        const updatePayload: Record<string, unknown> = {
          current_period_start: rzpPeriodStart,
          current_period_end: rzpPeriodEnd,
        }
        if (row.status === 'past_due') updatePayload.status = 'active'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from(table).update(updatePayload).eq('id', row.id)

        await supabase.from('invoices').insert({
          org_id: row.org_id,
          subscription_id: table === 'subscriptions' ? row.id : null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          website_subscription_id: (table === 'website_subscriptions' ? row.id : null) as any,
          stripe_invoice_id: stripeInvoiceId,
          amount_gbp: invoiceInfo.amountPaise,
          currency: 'inr',
          status: 'paid',
          invoice_pdf_url: null,
          period_start: rzpPeriodStart,
          period_end: rzpPeriodEnd,
        })

        logger.info('razorpay-recovery: renewal recorded via polling', {
          table, subscriptionId: row.id, orgId: row.org_id, rzpSubId: row.razorpay_subscription_id, paymentId: invoiceInfo.paymentId,
        })
        renewed++
      } catch (err) {
        logger.error('razorpay-recovery: error polling subscription for renewal', {
          table, subscriptionId: row.id, error: err instanceof Error ? err.message : String(err),
        })
        errors++
      }
    }
  }

  await pollTable('subscriptions')
  await pollTable('website_subscriptions')

  return { checked, renewed, errors }
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
            subject: '[Upnotify] Payment failed — action required',
            body: [
              'Your Upnotify subscription payment has failed.',
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

    // ── Poll Razorpay directly for renewals (no webhook access on this account) ──
    const { checked: renewalsChecked, renewed, errors: renewalErrors } = await pollRenewals(supabase)
    errors += renewalErrors

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

    const summary = `Notified: ${notified}, Skipped: ${skipped}, Expired: ${expired}, RenewalsChecked: ${renewalsChecked}, Renewed: ${renewed}, Errors: ${errors}`
    await endCronRun(runId, cronStart, errors > 0 && notified === 0 && renewed === 0 ? 'error' : 'ok', { summary })

    return NextResponse.json({ success: true, notified, skipped, expired, renewalsChecked, renewed, errors })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('razorpay-recovery: cron failed', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}

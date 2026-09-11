import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { writeAuditLog } from '@/lib/db/audit'
import { autoCreateMonitorsForDomain } from '@/lib/db/monitors'
import { getWorkspacesByOrgAdmin } from '@/lib/db/workspaces'

/**
 * Activates a per-website (Pro Plan) subscription: merges the pending
 * ('incomplete') single-domain rows into one active combined row, records
 * the invoice, and auto-creates the domain-only monitor set for every
 * newly-paid domain. Shared by BOTH activation paths:
 *   1. The Razorpay webhook (subscription.activated) — the primary,
 *      server-to-server source of truth, but only fires once
 *      RAZORPAY_WEBHOOK_SECRET is configured and a webhook is registered
 *      in Razorpay's dashboard against a real deployed domain.
 *   2. The client-verified confirm route
 *      (app/api/v1/billing/razorpay/website-confirm/route.ts) — used for
 *      local/Vercel-preview testing before a real domain exists, gated on
 *      Razorpay's own HMAC payment-signature verification so it isn't
 *      trusting an unverified client claim.
 * Idempotent: a repeat call for the same razorpaySubscriptionId is a no-op.
 */
export async function activateWebsiteSubscription(params: {
  orgId: string
  domains: string[]
  razorpaySubscriptionId: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  source: 'razorpay_webhook' | 'client_verified'
  /** Total amount charged, in paise (discounted price × website count, incl.
   *  18% GST) — known at checkout time. Used to record the first invoice for
   *  this subscription; omitted only when the caller doesn't have it handy
   *  (e.g. a legacy/backfill call), in which case no invoice is written. */
  amountPaise?: number
  /** Razorpay payment id for this charge, used as the invoice's unique
   *  reference so repeat activation calls don't create duplicate invoices. */
  razorpayPaymentId?: string
}): Promise<{ activated: boolean; websiteSubscriptionId?: string }> {
  const supabase = createAdminClient()
  const { orgId, domains, razorpaySubscriptionId, source } = params

  if (!orgId || domains.length === 0) {
    logger.error('activateWebsiteSubscription: missing orgId or domains', { razorpaySubscriptionId, source })
    return { activated: false }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('website_subscriptions')
    .select('id')
    .eq('razorpay_subscription_id', razorpaySubscriptionId)
    .maybeSingle()

  if (existing) {
    logger.info('activateWebsiteSubscription: already recorded, skipping', { razorpaySubscriptionId, source })
    return { activated: true, websiteSubscriptionId: existing.id }
  }

  const periodStart = params.currentPeriodStart ?? new Date().toISOString()
  const periodEnd = params.currentPeriodEnd ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

  // Remove the pending ('incomplete') single-domain rows this checkout was
  // for — they get merged into the one active row below, so a paid
  // website never shows up twice.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('website_subscriptions')
    .delete()
    .eq('org_id', orgId)
    .eq('status', 'incomplete')
    .overlaps('domains', domains)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted } = await (supabase as any)
    .from('website_subscriptions')
    .insert({
      org_id: orgId,
      domains,
      razorpay_subscription_id: razorpaySubscriptionId,
      status: 'active',
      current_period_start: periodStart,
      current_period_end: periodEnd,
    })
    .select('id')
    .single()

  logger.info('Website subscription activated', { razorpaySubscriptionId, orgId, domains, source })

  // Record the invoice for this checkout so it shows up on the Plans page
  // and can be downloaded — the webhook's subscription.charged handler only
  // covers renewals, so the very first payment must be recorded here.
  if (params.amountPaise && inserted?.id) {
    const invoiceRef = params.razorpayPaymentId
      ? `rzp_${params.razorpayPaymentId}`
      : `rzp_${razorpaySubscriptionId}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingInvoice } = await (supabase as any)
      .from('invoices')
      .select('id')
      .eq('stripe_invoice_id', invoiceRef)
      .maybeSingle()

    if (!existingInvoice) {
      const { error: invoiceError } = await supabase.from('invoices').insert({
        org_id: orgId,
        subscription_id: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        website_subscription_id: inserted.id as any,
        stripe_invoice_id: invoiceRef,
        amount_gbp: params.amountPaise,
        currency: 'inr',
        status: 'paid',
        invoice_pdf_url: null,
        period_start: periodStart,
        period_end: periodEnd,
      })
      if (invoiceError) {
        logger.error('activateWebsiteSubscription: failed to record invoice', { error: invoiceError.message, orgId, razorpaySubscriptionId })
      }
    }
  }

  // Every paid website gets full monitor coverage immediately — no manual
  // setup required. Non-fatal: if this fails, the subscription itself is
  // still recorded correctly; the customer can add monitors manually.
  try {
    const workspaces = await getWorkspacesByOrgAdmin(orgId)
    const workspaceId = workspaces[0]?.id
    if (workspaceId) {
      for (const domain of domains) {
        await autoCreateMonitorsForDomain({ orgId, workspaceId, targetDomain: domain })
      }
    } else {
      logger.error('activateWebsiteSubscription: no workspace found, skipping monitor auto-create', { orgId })
    }
  } catch (err) {
    logger.error('activateWebsiteSubscription: monitor auto-create failed (non-fatal)', {
      orgId, domains, error: err instanceof Error ? err.message : String(err),
    })
  }

  await writeAuditLog({
    orgId,
    userId: null,
    action: 'website_subscription.created',
    resourceType: 'website_subscription',
    metadata: {
      razorpay_subscription_id: razorpaySubscriptionId,
      domains,
      currency: 'inr',
      source,
    },
  })

  return { activated: true, websiteSubscriptionId: inserted?.id }
}

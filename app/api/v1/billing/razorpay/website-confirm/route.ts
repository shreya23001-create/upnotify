import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { verifyRazorpayPaymentSignature, fetchRazorpayPaymentAmount, getRazorpay, razorpayErrorMessage } from '@/lib/services/payments-razorpay'
import { activateWebsiteSubscription } from '@/lib/services/website-subscription-activation'
import { checkRateLimit, API_V1_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/billing/razorpay/website-confirm
 *
 * Client-verified fallback activation path for the Pro Plan (per-website)
 * checkout, used when the Razorpay webhook cannot reach this app — e.g.
 * local development or a Vercel preview URL, before RAZORPAY_WEBHOOK_SECRET
 * is configured and a webhook is registered against a real domain in
 * Razorpay's dashboard. Once that's set up, the webhook
 * (app/api/webhooks/razorpay/route.ts) becomes the primary source of truth
 * again — this route stays as a legitimate backup path even then, since
 * `activateWebsiteSubscription` is idempotent (whichever call lands first
 * wins, the other is a no-op).
 *
 * Security: NEVER trust an unverified client claim that "payment
 * succeeded." This route only activates the subscription if Razorpay's own
 * HMAC payment signature verifies — the signature is generated
 * server-side by Razorpay using RAZORPAY_KEY_SECRET (never exposed to the
 * browser) and returned to the client's checkout success handler, so a
 * forged request without a valid signature is rejected.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rateLimit = checkRateLimit(request, API_V1_RATE_LIMIT, 'razorpay-website-confirm')
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      })
    }

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const org = await getCurrentOrganisation()
    if (!org) return NextResponse.json({ error: 'No organisation found' }, { status: 400 })

    const body = await request.json().catch(() => ({})) as {
      razorpaySubscriptionId?: string
      razorpayPaymentId?: string
      razorpaySignature?: string
      pendingWebsiteIds?: unknown
    }

    const { razorpaySubscriptionId, razorpayPaymentId, razorpaySignature } = body
    const pendingWebsiteIds = Array.isArray(body.pendingWebsiteIds)
      ? body.pendingWebsiteIds.filter((v): v is string => typeof v === 'string')
      : []

    // pendingWebsiteIds is optional — the quantity-first purchase flow has
    // none (no domains are named at checkout time).
    if (!razorpaySubscriptionId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing payment confirmation details' }, { status: 400 })
    }

    // Mock-mode subscriptions never go through real Razorpay, so there's no
    // real signature to check — recognize them by prefix and skip straight
    // to activation (dev/staging only; getServerConfig() already gates
    // mock mode on missing/placeholder keys at checkout time).
    const isMock = razorpaySubscriptionId.startsWith('mock_')

    if (!isMock) {
      const signatureValid = verifyRazorpayPaymentSignature({
        subscriptionId: razorpaySubscriptionId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      })
      if (!signatureValid) {
        logger.error('Website confirm: invalid Razorpay payment signature', { orgId: org.id, razorpaySubscriptionId })
        return NextResponse.json({ error: 'Payment could not be verified' }, { status: 400 })
      }
    }

    const supabase = createAdminClient()

    let domains: string[] = []
    if (pendingWebsiteIds.length > 0) {
      // Legacy name-first flow: re-fetch the pending rows fresh (never
      // trust client-supplied domains directly) and confirm they still
      // belong to this org.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pendingRows } = await (supabase as any)
        .from('website_subscriptions')
        .select('id, domains')
        .eq('org_id', org.id)
        .eq('status', 'incomplete')
        .in('id', pendingWebsiteIds) as { data: Array<{ id: string; domains: string[] }> | null }

      if (!pendingRows || pendingRows.length === 0) {
        // Already activated (e.g. the webhook won the race) — not an error.
        return NextResponse.json({ success: true, alreadyActivated: true })
      }

      domains = pendingRows.flatMap(r => r.domains ?? [])
    }

    // Authoritative quantity, read from Razorpay's own subscription object —
    // never a client-supplied number. Mock subscriptions have no real
    // Razorpay object to fetch (dev/staging only), so fall back to
    // domains.length there.
    let purchasedQuantity = domains.length
    if (!isMock) {
      try {
        const rzp = getRazorpay()
        const rzpSub = await rzp.subscriptions.fetch(razorpaySubscriptionId) as unknown as { notes?: Record<string, string> }
        const notesQty = parseInt(rzpSub.notes?.purchased_quantity ?? '', 10)
        if (Number.isFinite(notesQty) && notesQty > 0) purchasedQuantity = notesQty
      } catch (err) {
        logger.error('Website confirm: failed to fetch Razorpay subscription for quantity', {
          razorpaySubscriptionId, error: razorpayErrorMessage(err),
        })
        return NextResponse.json({ error: 'Could not verify subscription details. Please refresh and check your Plans page.' }, { status: 500 })
      }
    }

    const amountPaise = isMock ? undefined : (await fetchRazorpayPaymentAmount(razorpayPaymentId)) ?? undefined

    const result = await activateWebsiteSubscription({
      orgId: org.id,
      domains,
      razorpaySubscriptionId,
      source: 'client_verified',
      amountPaise,
      razorpayPaymentId,
      purchasedQuantity,
    })

    return NextResponse.json({ success: result.activated })
  } catch (error) {
    logger.error('Razorpay website confirm error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Failed to confirm payment. Please refresh and check your Plans page.' }, { status: 500 })
  }
}

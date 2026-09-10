/**
 * Razorpay service wrapper — server only.
 * Handles customers, subscriptions, plan creation, and cancellation.
 * All amounts are in paise (1 INR = 100 paise).
 */

import Razorpay from 'razorpay'
import crypto from 'crypto'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

// Razorpay's SDK throws structured objects (not Error instances), so
// String(err)/err.message yield "[object Object]" everywhere they're caught.
// Extract the real description so logs and API responses are useful.
export function razorpayErrorMessage(err: unknown): string {
  const e = err as { statusCode?: number; error?: { code?: string; description?: string; field?: string } }
  if (e?.error?.description) {
    return `[${e.statusCode ?? '?'}] ${e.error.code ?? ''} ${e.error.description}${e.error.field ? ` (field: ${e.error.field})` : ''}`.trim()
  }
  if (e?.statusCode) {
    return `[${e.statusCode}] Razorpay request failed with no error description (check API key validity/permissions)`
  }
  if (err instanceof Error) return err.message
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

// ─── Client singleton ─────────────────────────────────────────────────────────

let _client: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (_client) return _client
  const { razorpay } = getServerConfig()
  _client = new Razorpay({
    key_id: razorpay.keyId || 'rzp_test_placeholder',
    key_secret: razorpay.keySecret || 'placeholder',
  })
  return _client
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RazorpayPlanResult {
  id: string
  name: string
  interval: number
  period: string
  item: { amount: number; currency: string }
}

export interface RazorpaySubscriptionResult {
  id: string
  plan_id: string
  customer_id: string | null
  status: string
  current_start: number | null
  current_end: number | null
  charge_at: number | null
  notes: Record<string, string>
}

export interface RazorpayCustomerResult {
  id: string
  name: string
  email: string
}

// ─── Customer ─────────────────────────────────────────────────────────────────

/**
 * Create or retrieve a Razorpay customer for an org.
 * `fail_existing: 0` is documented to make Razorpay return the existing
 * customer instead of erroring, but in practice it still throws a 400
 * "Customer already exists" — so on that specific error we fall back to
 * looking the customer up by email instead.
 */
export async function ensureRazorpayCustomer(
  email: string,
  name: string
): Promise<string> {
  try {
    const rzp = getRazorpay()
    const customer = await rzp.customers.create({
      email,
      name,
      fail_existing: 0,
    }) as unknown as RazorpayCustomerResult
    return customer.id
  } catch (err) {
    const e = err as { statusCode?: number; error?: { description?: string } }
    const alreadyExists = e?.statusCode === 400 && e?.error?.description?.toLowerCase().includes('already exists')

    if (alreadyExists) {
      try {
        const rzp = getRazorpay()
        const existing = await rzp.customers.all({ count: 100 }) as unknown as { items: RazorpayCustomerResult[] }
        const match = existing.items?.find(c => c.email?.toLowerCase() === email.toLowerCase())
        if (match) {
          logger.info('Razorpay: reused existing customer', { email, customerId: match.id })
          return match.id
        }
      } catch (lookupErr) {
        logger.error('Razorpay: failed to look up existing customer after "already exists" error', {
          email,
          error: razorpayErrorMessage(lookupErr),
        })
      }
    }

    const msg = razorpayErrorMessage(err)
    logger.error('Razorpay: failed to create customer', { email, error: msg })
    throw new Error(`Razorpay customer creation failed: ${msg}`)
  }
}

// ─── Plans ────────────────────────────────────────────────────────────────────

/**
 * Create a Razorpay plan for a given billing cycle.
 * Called once during setup via the admin sync endpoint.
 */
export async function createRazorpayPlan(params: {
  name: string
  amountPaise: number
  period: 'monthly' | 'yearly'
  planSlug: string
  billingCycle: 'monthly' | 'annual'
}): Promise<RazorpayPlanResult> {
  const rzp = getRazorpay()
  const plan = await rzp.plans.create({
    period: params.period,
    interval: 1,
    item: {
      name: params.name,
      amount: params.amountPaise,
      currency: 'INR',
      description: `Uptrue ${params.name}`,
    },
    notes: {
      plan_slug: params.planSlug,
      billing_cycle: params.billingCycle,
    },
  }) as unknown as RazorpayPlanResult
  logger.info('Razorpay: plan created', { planId: plan.id, name: params.name })
  return plan
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

/**
 * Create a Razorpay subscription.
 * Returns the subscription ID which the frontend uses to open checkout.
 * total_count: monthly = 120 (10-year rolling), annual = 10 (10 years)
 */
export async function createRazorpaySubscription(params: {
  razorpayPlanId: string
  customerId: string
  orgId: string
  planSlug: string
  billingCycle: 'monthly' | 'annual'
  userEmail: string
  isAddon?: boolean
  isWebsiteSub?: boolean
  targetDomain?: string
  /** Every domain covered by this one combined website subscription (comma-joined into notes.domains — Razorpay note values must be strings). */
  websiteDomains?: string[]
  /** Multiplies the plan's per-unit price — used for "N websites × ₹149/month" combined checkout. Defaults to 1 (every other checkout type). */
  quantity?: number
}): Promise<RazorpaySubscriptionResult> {
  const rzp = getRazorpay()
  const totalCount = params.billingCycle === 'annual' ? 10 : 120

  const createBody = {
    plan_id: params.razorpayPlanId,
    customer_id: params.customerId,
    total_count: totalCount,
    quantity: params.quantity ?? 1,
    customer_notify: 1,
    notes: {
      org_id: params.orgId,
      plan_slug: params.planSlug,
      billing_cycle: params.billingCycle,
      ...(params.isAddon ? { is_addon: 'true' } : {}),
      ...(params.isWebsiteSub ? {
        is_website_sub: 'true',
        target_domain: params.targetDomain ?? '',
        domains: (params.websiteDomains ?? []).join(','),
      } : {}),
    },
    notify_info: {
      notify_phone: '',
      notify_email: params.userEmail,
    },
  }
  const subscription = await rzp.subscriptions.create(
    createBody as Parameters<typeof rzp.subscriptions.create>[0]
  ) as unknown as RazorpaySubscriptionResult

  logger.info('Razorpay: subscription created', {
    subscriptionId: subscription.id,
    orgId: params.orgId,
    planSlug: params.planSlug,
  })
  return subscription
}

/**
 * Cancel a Razorpay subscription at the end of the current billing cycle.
 * cancel_at_cycle_end = 1 means it stays active until period end.
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd = true
): Promise<void> {
  // Skip real API call for mock subscriptions (dev/staging testing only)
  if (subscriptionId.startsWith('mock_')) {
    logger.info('Razorpay: mock subscription — skipping API cancel', { subscriptionId })
    return
  }
  const rzp = getRazorpay()
  await rzp.subscriptions.cancel(subscriptionId, cancelAtCycleEnd)
  logger.info('Razorpay: subscription cancel requested', {
    subscriptionId,
    cancelAtCycleEnd,
  })
}

// ─── Webhook signature verification ──────────────────────────────────────────

/**
 * Verify that an incoming webhook request is genuinely from Razorpay.
 * Razorpay signs the body with HMAC-SHA256 using the webhook secret.
 */
export function verifyRazorpayWebhook(body: string, signature: string): boolean {
  const { razorpay } = getServerConfig()
  if (!razorpay.webhookSecret) return false
  if (!signature) return false
  const expected = crypto
    .createHmac('sha256', razorpay.webhookSecret)
    .update(body)
    .digest('hex')
  // crypto.timingSafeEqual throws on length mismatch. Guard with an equal-
  // length check first so a malformed/missing signature returns false
  // cleanly rather than 500-ing the webhook route.
  const sigBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, expectedBuf)
}

/**
 * Verify a payment signature returned by Razorpay checkout.
 * Used to validate that payment.razorpay_payment_id + subscription_id
 * weren't tampered with on the client.
 */
export function verifyRazorpayPaymentSignature(params: {
  subscriptionId: string
  paymentId: string
  signature: string
}): boolean {
  const { razorpay } = getServerConfig()
  const payload = `${params.paymentId}|${params.subscriptionId}`
  const expected = crypto
    .createHmac('sha256', razorpay.keySecret || '')
    .update(payload)
    .digest('hex')
  return expected === params.signature
}

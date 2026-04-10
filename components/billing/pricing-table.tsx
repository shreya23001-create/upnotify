'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Plan, Subscription } from '@/lib/types'
import type { SupportedCurrency } from '@/lib/utils/currency'
import { getPlanFeatures, formatPlanPrice } from '@/lib/utils/plan-display'
import type { PlanDisplayData } from '@/lib/utils/plan-display'
import { CancelPlanModal } from './cancel-plan-modal'

// ─── Mock Razorpay Modal (dev/staging only — remove when real keys are set) ────

interface MockCheckoutData {
  subscriptionId: string
  planSlug: string
  planName: string
  billingCycle: 'monthly' | 'annual'
  amountPaise: number
  userEmail: string
  orgName: string
}

function MockRazorpayModal({
  data,
  onClose,
}: {
  data: MockCheckoutData
  onClose: () => void
}): React.ReactElement {
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountInr = (data.amountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })
  const label = data.billingCycle === 'annual' ? 'year' : 'month'

  async function handlePay(outcome: 'success' | 'fail'): Promise<void> {
    setIsPaying(true)
    setError(null)
    try {
      const res = await fetch('/api/dev/razorpay/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: data.subscriptionId,
          planSlug:       data.planSlug,
          billingCycle:   data.billingCycle,
          amountPaise:    data.amountPaise,
          outcome,
        }),
      })
      const result = await res.json() as { success: boolean; message?: string; error?: string }
      if (result.success) {
        window.location.href = '/dashboard/settings?tab=billing&billing=success'
      } else {
        setError(result.message ?? result.error ?? 'Payment failed (simulated)')
        setIsPaying(false)
      }
    } catch {
      setError('Something went wrong')
      setIsPaying(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 8, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
      }}>
        {/* Header — Razorpay orange */}
        <div style={{ background: '#528FF0', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              background: '#fff', borderRadius: 4, padding: '3px 8px',
              fontSize: 11, fontWeight: 700, color: '#528FF0', letterSpacing: 0.5,
            }}>
              TEST MODE
            </div>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              Razorpay checkout simulation
            </span>
          </div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
            ₹{amountInr}
            <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>/ {label}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>
            {data.planName} · {data.billingCycle === 'annual' ? 'Annual' : 'Monthly'} · incl. 18% GST
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16, fontSize: 13, color: '#555' }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: '#222' }}>Payment details</div>
            <div style={{ padding: '10px 12px', background: '#f5f7fa', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Email: <strong>{data.userEmail}</strong></div>
              <div>Organisation: <strong>{data.orgName}</strong></div>
              <div>Subscription ID: <code style={{ fontSize: 11 }}>{data.subscriptionId}</code></div>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
              padding: '10px 12px', fontSize: 13, color: '#dc2626', marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <button
            onClick={() => void handlePay('success')}
            disabled={isPaying}
            style={{
              width: '100%', padding: '12px 0', background: '#528FF0',
              color: '#fff', border: 'none', borderRadius: 6,
              fontSize: 15, fontWeight: 600, cursor: isPaying ? 'not-allowed' : 'pointer',
              opacity: isPaying ? 0.7 : 1, marginBottom: 8,
            }}
          >
            {isPaying ? 'Processing…' : `Pay ₹${amountInr} (Simulated)`}
          </button>

          <button
            onClick={() => void handlePay('fail')}
            disabled={isPaying}
            style={{
              width: '100%', padding: '10px 0', background: '#fff',
              color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6,
              fontSize: 13, fontWeight: 500, cursor: isPaying ? 'not-allowed' : 'pointer',
              marginBottom: 8,
            }}
          >
            Simulate Payment Failure
          </button>

          <button
            onClick={onClose}
            disabled={isPaying}
            style={{
              width: '100%', padding: '8px 0', background: 'transparent',
              color: '#888', border: 'none', fontSize: 13,
              cursor: isPaying ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Razorpay checkout helper ─────────────────────────────────────────────────

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(script)
  })
}

interface Props {
  plans: Plan[]
  currentPlanSlug?: string
  subscription?: Subscription | null
  creditBalancePence?: number
  defaultCurrency?: SupportedCurrency
}

// Feature + price logic lives in lib/utils/plan-display.ts — single source of truth

function getPlanCta(plan: Plan, isCurrent: boolean, isHigherTier: boolean): string {
  if (isCurrent) return 'Current Plan'
  if (plan.slug === 'free') return 'Current Plan'
  if (isHigherTier) return 'Upgrade'
  return 'Switch Plan'
}

export function PricingTable({ plans, currentPlanSlug, subscription, creditBalancePence = 0, defaultCurrency = 'gbp' }: Props): React.ReactElement {
  const [isPending, startTransition] = useTransition()
  const [isRazorpayPending, setIsRazorpayPending] = useState(false)
  const [isCancelPending, setIsCancelPending] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [mockCheckout, setMockCheckout] = useState<MockCheckoutData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAnnual, setIsAnnual] = useState(true)
  const currency: SupportedCurrency = defaultCurrency
  const router = useRouter()

  const sub = subscription as unknown as Record<string, unknown> | null | undefined
  const isPaused = sub?.status === 'paused'
  const isCancelling = sub?.status === 'cancelling'
  const pauseUntil = sub?.pause_until as string | null | undefined

  const directPlans = plans.filter(p => p.type === 'direct')

  // Determine the index of the current plan for upgrade/downgrade logic
  const currentPlanIndex = directPlans.findIndex(p => p.slug === currentPlanSlug)
  const effectiveCurrentIndex = currentPlanIndex >= 0 ? currentPlanIndex : 0 // Free if no subscription

  async function handleRazorpayCancel(): Promise<void> {
    if (!cancelConfirm) { setCancelConfirm(true); return }
    setError(null)
    setIsCancelPending(true)
    setCancelConfirm(false)
    try {
      const res = await fetch('/api/v1/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: 'other' }),
      })
      const data = await res.json() as { success?: boolean; message?: string; error?: string }
      if (data.success) {
        window.location.href = '/dashboard/settings?tab=billing&billing=cancelled'
      } else {
        setError(data.error || 'Could not cancel subscription. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsCancelPending(false)
    }
  }

  function handleSubscribe(planSlug: string, billingCycle: string): void {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planSlug, billingCycle }),
        })
        const data: { url?: string; error?: string } = await res.json()
        if (!res.ok) {
          setError(data.error || 'Failed to create checkout session. Please try again.')
          return
        }
        if (data.url) {
          window.location.href = data.url
        } else {
          setError('No checkout URL received. Please try again.')
        }
      } catch {
        setError('Something went wrong. Please check your connection and try again.')
      }
    })
  }

  const handleRazorpayCheckout = useCallback(async (planSlug: string, billingCycle: string): Promise<void> => {
    setError(null)
    setIsRazorpayPending(true)
    try {
      // 1. Create Razorpay subscription server-side
      const res = await fetch('/api/v1/billing/razorpay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug, billingCycle }),
      })
      const data = await res.json() as {
        subscriptionId?: string
        keyId?: string
        planName?: string
        planSlug?: string
        billingCycle?: string
        amountPaise?: number
        userEmail?: string
        orgName?: string
        mockMode?: boolean
        error?: string
      }
      if (!res.ok || !data.subscriptionId) {
        setError(data.error ?? 'Failed to start checkout. Please try again.')
        setIsRazorpayPending(false)
        return
      }

      // 2a. MOCK MODE — show test modal instead of real Razorpay
      if (data.mockMode) {
        setMockCheckout({
          subscriptionId: data.subscriptionId,
          planSlug:       data.planSlug ?? planSlug,
          planName:       data.planName ?? planSlug,
          billingCycle:   (data.billingCycle ?? billingCycle) as 'monthly' | 'annual',
          amountPaise:    data.amountPaise ?? 0,
          userEmail:      data.userEmail ?? '',
          orgName:        data.orgName ?? '',
        })
        setIsRazorpayPending(false)
        return
      }

      // 2b. Load Razorpay.js and open real checkout modal
      await loadRazorpayScript()
      const rzp = new window.Razorpay({
        key:              data.keyId,
        subscription_id:  data.subscriptionId,
        name:             'Uptrue',
        description:      `${data.planName ?? planSlug} · ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} (incl. 18% GST)`,
        image:            '/logo.svg',
        prefill:          { email: data.userEmail ?? '', name: data.orgName ?? '' },
        theme:            { color: '#3b82f6' },
        handler:          (_response: unknown) => {
          // Payment captured — webhook will activate the subscription
          window.location.href = '/dashboard/settings?tab=billing&billing=success'
        },
        modal: {
          ondismiss: () => { setIsRazorpayPending(false) },
        },
      })
      rzp.open()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsRazorpayPending(false)
    }
  }, [])

  const creditGbp = (creditBalancePence / 100).toFixed(2)

  return (
    <div>
      {/* Mock Razorpay checkout — dev/staging only */}
      {mockCheckout && (
        <MockRazorpayModal
          data={mockCheckout}
          onClose={() => { setMockCheckout(null); setIsRazorpayPending(false) }}
        />
      )}

      {/* Cancel / Pause modal — GBP (Stripe) users */}
      {currentPlanSlug && (
        <CancelPlanModal
          planName={directPlans.find(p => p.slug === currentPlanSlug)?.name ?? currentPlanSlug}
          isOpen={showCancelModal}
          isPaused={isPaused}
          pauseUntil={pauseUntil ?? null}
          onClose={() => setShowCancelModal(false)}
          onComplete={() => router.refresh()}
        />
      )}

      {/* Billing cycle toggle */}
      <div style={{ marginBottom: 8 }}>
        <div className="billing-toggle-wrapper">
          <button
            className={`billing-toggle-btn${!isAnnual ? ' billing-toggle-active' : ''}`}
            onClick={() => setIsAnnual(false)}
          >
            Monthly
          </button>
          <button
            className={`billing-toggle-btn${isAnnual ? ' billing-toggle-active' : ''}`}
            onClick={() => setIsAnnual(true)}
          >
            Annual
            {currency === 'gbp' && <span className="billing-toggle-save">Save 20%</span>}
          </button>
        </div>
      </div>

      {currency === 'inr' && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          + 18% GST · Secure checkout via Razorpay
        </p>
      )}

      {creditBalancePence > 0 && currency === 'gbp' && (
        <div className="credit-balance-banner">
          Your credits: <strong>{'\u00A3'}{creditGbp}</strong> will be applied to your next bill
        </div>
      )}

      {error && (
        <div className="form-error" style={{ marginBottom: 16, padding: 12, textAlign: 'center' }}>
          {error}
        </div>
      )}
      <div className="pricing-grid">
        {directPlans.map((plan, index) => {
          const isCurrent = plan.slug === currentPlanSlug || (plan.slug === 'free' && !currentPlanSlug)
          const isHigherTier = index > effectiveCurrentIndex
          const isFree = plan.price_monthly_gbp === 0 && (!plan.price_annual_gbp || plan.price_annual_gbp === 0)
          const price = formatPlanPrice(plan as unknown as PlanDisplayData, isAnnual, currency)
          const features = getPlanFeatures(plan as unknown as PlanDisplayData)
          const ctaText = getPlanCta(plan, isCurrent, isHigherTier)
          const isPopular = plan.slug === 'builder'
          const hasAnnual = plan.price_annual_gbp && plan.price_annual_gbp > 0 && plan.price_monthly_gbp > 0
          const billingCycle = isAnnual && hasAnnual ? 'annual' : 'monthly'
          const isInrMode = currency === 'inr' && !isFree

          return (
            <div
              key={plan.id}
              className={`pricing-card${isCurrent ? ' pricing-card-current' : ''}${isPopular ? ' pricing-card-highlighted' : ''}`}
            >
              {isCurrent && <div className="pricing-badge">Current Plan</div>}
              {isPopular && !isCurrent && <div className="pricing-badge">Most Popular</div>}

              <div className="pricing-card-header">
                <h3 className="pricing-plan-name">{plan.name}</h3>
                <div className="pricing-price">
                  <span className="pricing-amount">{price.symbol}{price.amount}</span>
                  <span className="pricing-period">{price.period}</span>
                </div>
                {price.note && (
                  <p className="pricing-description">{price.note}</p>
                )}
              </div>

              <ul className="pricing-features">
                {features.map((feature, fi) => (
                  <li
                    key={fi}
                    className={`pricing-feature${!feature.included ? ' pricing-feature-disabled' : ''}`}
                  >
                    <span className="pricing-feature-icon">
                      {feature.included ? '\u2713' : '\u2014'}
                    </span>
                    {feature.text}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div>
                  <div className="pricing-card-current-label">{'\u2713'} You&apos;re on this plan</div>
                  {!isFree && (
                    <div style={{ marginTop: 8 }}>
                      {currency === 'inr' ? (
                        // INR / Razorpay — inline two-step cancel
                        cancelConfirm ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-ghost btn-full"
                              style={{ fontSize: 13, color: 'var(--danger, #dc2626)', borderColor: 'var(--danger, #dc2626)' }}
                              onClick={() => void handleRazorpayCancel()}
                              disabled={isCancelPending}
                            >
                              {isCancelPending ? 'Cancelling…' : 'Yes, cancel'}
                            </button>
                            <button
                              className="btn btn-secondary btn-full"
                              style={{ fontSize: 13 }}
                              onClick={() => setCancelConfirm(false)}
                              disabled={isCancelPending}
                            >
                              Keep plan
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-ghost btn-full"
                            style={{ fontSize: 13, color: 'var(--text-muted)' }}
                            onClick={() => void handleRazorpayCancel()}
                            disabled={isCancelPending}
                          >
                            Cancel subscription
                          </button>
                        )
                      ) : (
                        // GBP / Stripe — open cancel modal
                        !isCancelling && (
                          <button
                            className="btn btn-ghost btn-full"
                            style={{ fontSize: 13, color: 'var(--text-muted)' }}
                            onClick={() => setShowCancelModal(true)}
                          >
                            {isPaused ? 'Resume or Cancel' : 'Cancel plan'}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : isFree ? (
                <button className="btn btn-secondary btn-full" disabled>
                  Free Plan
                </button>
              ) : isInrMode ? (
                // INR: upgrade AND downgrade both go through Razorpay checkout
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => void handleRazorpayCheckout(plan.slug, billingCycle)}
                  disabled={isRazorpayPending}
                >
                  {isRazorpayPending ? 'Opening…' : ctaText}
                </button>
              ) : isHigherTier ? (
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleSubscribe(plan.slug, billingCycle)}
                  disabled={isPending}
                >
                  {isPending ? 'Loading...' : ctaText}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

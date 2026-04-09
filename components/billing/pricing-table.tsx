'use client'

import { useState, useTransition, useCallback } from 'react'
import type { Plan } from '@/lib/types'
import type { SupportedCurrency } from '@/lib/utils/currency'
import { formatInr, formatGbp } from '@/lib/utils/currency'

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

interface PlanFeatureDisplay {
  text: string
  included: boolean
}

interface Props {
  plans: Plan[]
  currentPlanSlug?: string
  creditBalancePence?: number
  defaultCurrency?: SupportedCurrency
}

function getPlanFeatures(plan: Plan): PlanFeatureDisplay[] {
  const p = plan as unknown as Record<string, unknown>
  const features: PlanFeatureDisplay[] = []

  features.push({
    text: plan.monitor_limit ? `${plan.monitor_limit} monitors` : 'Unlimited monitors',
    included: true,
  })
  features.push({
    text: plan.check_interval_seconds >= 300
      ? `${plan.check_interval_seconds / 60}-minute check interval`
      : `${plan.check_interval_seconds}-second check interval`,
    included: true,
  })

  features.push({ text: 'Email alerts', included: Boolean(p.has_email_alerts ?? true) })
  features.push({ text: 'Slack & Teams alerts', included: Boolean(p.has_slack_teams) })
  features.push({ text: 'Webhooks', included: Boolean(p.has_webhooks) })

  // Status pages
  const statusPageLimit = p.status_page_limit as number | undefined
  if (plan.has_status_page_custom_domain) {
    features.push({ text: statusPageLimit ? `${statusPageLimit} custom domain status pages` : 'Unlimited status pages', included: true })
  } else if (p.has_status_pages) {
    features.push({ text: statusPageLimit ? `${statusPageLimit} status page${statusPageLimit > 1 ? 's' : ''}` : 'Status pages', included: true })
  } else {
    features.push({ text: 'Status pages', included: false })
  }

  // AI reports
  const aiLimit = p.ai_report_limit as number | undefined
  if (plan.has_ai_predictive || (aiLimit && aiLimit > 0)) {
    features.push({ text: aiLimit ? `AI reports (${aiLimit}/month)` : 'Unlimited AI reports', included: true })
  } else {
    features.push({ text: 'AI reports', included: false })
  }

  const watchdogLimit = (p.competitor_limit as number | undefined) ?? 3
  features.push({ text: `Watchdog — ${watchdogLimit} competitor${watchdogLimit === 1 ? '' : 's'}`, included: true })

  // AI Visibility
  const llmsTxtLimit = p.llms_txt_limit as number | undefined
  const citationLimit = p.citation_check_monthly_limit as number | undefined
  if (llmsTxtLimit && llmsTxtLimit > 0) {
    const llmsText = llmsTxtLimit >= 999 ? 'llms.txt Generator (unlimited)' : `llms.txt Generator (${llmsTxtLimit}/month)`
    features.push({ text: llmsText, included: true })
  } else {
    features.push({ text: 'llms.txt Generator', included: false })
  }
  if (citationLimit && citationLimit > 0) {
    features.push({ text: `AI Citation Monitor (${citationLimit}/month)`, included: true })
  } else {
    features.push({ text: 'AI Citation Monitor', included: false })
  }

  // API access — hidden until API feature is ready for public listing
  // features.push({ text: 'API access', included: plan.has_api_access })

  return features
}

function getPlanPrice(plan: Plan, isAnnual: boolean, currency: SupportedCurrency): { amount: string; period: string; note?: string } {
  const p = plan as unknown as Record<string, number>

  // INR pricing
  if (currency === 'inr') {
    const monthlyPaise = p.price_monthly_inr ?? 0
    const annualPaise = p.price_annual_inr ?? 0
    if (monthlyPaise === 0 && annualPaise === 0) return { amount: formatInr(0), period: 'forever' }
    // Lite is annual-only in GBP but monthly available in INR
    if (isAnnual && annualPaise > 0) {
      return { amount: formatInr(annualPaise), period: '/year', note: '+ 18% GST' }
    }
    return { amount: formatInr(monthlyPaise), period: '/month', note: '+ 18% GST' }
  }

  // GBP pricing
  const monthlyPence = plan.price_monthly_gbp
  const annualPence = plan.price_annual_gbp

  if (monthlyPence === 0 && (!annualPence || annualPence === 0)) {
    return { amount: '\u00A30', period: 'forever' }
  }

  // Annual-only plan (no monthly price set, only annual)
  if (monthlyPence === 0 && annualPence && annualPence > 0) {
    const annualGbp = annualPence / 100
    const monthlyEquiv = Math.round((annualPence / 12)) / 100
    return {
      amount: `\u00A3${annualGbp}`,
      period: '/year',
      note: `Just ${monthlyEquiv < 1 ? `${Math.round(monthlyEquiv * 100)}p` : `\u00A3${monthlyEquiv.toFixed(2)}`}/mo`,
    }
  }

  if (isAnnual && annualPence && annualPence > 0) {
    const annualGbp = annualPence / 100
    const savings = Math.round(((monthlyPence * 12 - annualPence) / (monthlyPence * 12)) * 100)
    return {
      amount: `\u00A3${annualGbp.toFixed(2)}`,
      period: '/year',
      note: savings > 0 ? `Save ${savings}% vs monthly` : undefined,
    }
  }

  const monthlyGbp = monthlyPence / 100
  return { amount: `\u00A3${monthlyGbp.toFixed(2)}`, period: '/month' }
}

function getPlanCta(plan: Plan, isCurrent: boolean, isHigherTier: boolean): string {
  if (isCurrent) return 'Current Plan'
  if (plan.slug === 'free') return 'Current Plan'
  if (isHigherTier) return 'Upgrade'
  return 'Switch Plan'
}

export function PricingTable({ plans, currentPlanSlug, creditBalancePence = 0, defaultCurrency = 'gbp' }: Props): React.ReactElement {
  const [isPending, startTransition] = useTransition()
  const [isPortalPending, startPortalTransition] = useTransition()
  const [isRazorpayPending, setIsRazorpayPending] = useState(false)
  const [isCancelPending, setIsCancelPending] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [mockCheckout, setMockCheckout] = useState<MockCheckoutData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAnnual, setIsAnnual] = useState(true)
  const currency: SupportedCurrency = defaultCurrency

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

  function handleOpenPortal(): void {
    setError(null)
    startPortalTransition(async () => {
      try {
        const res = await fetch('/api/v1/billing/portal', { method: 'POST' })
        const data: { url?: string; error?: string } = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          setError(data.error || 'Could not open billing portal. Please try again.')
        }
      } catch {
        setError('Something went wrong. Please check your connection and try again.')
      }
    })
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
          Razorpay checkout coming soon. Prices shown for reference.
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
          const price = getPlanPrice(plan, isAnnual, currency)
          const features = getPlanFeatures(plan)
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
                  <span className="pricing-amount">{price.amount}</span>
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
                  {!isFree && currency === 'inr' ? (
                    // INR / Razorpay cancel — no portal
                    <div style={{ marginTop: 8 }}>
                      {cancelConfirm ? (
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
                      )}
                    </div>
                  ) : !isFree ? (
                    // GBP / Stripe cancel — open portal
                    <button
                      className="btn btn-ghost btn-full"
                      style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}
                      onClick={handleOpenPortal}
                      disabled={isPortalPending}
                    >
                      {isPortalPending ? 'Opening...' : 'Cancel subscription'}
                    </button>
                  ) : null}
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

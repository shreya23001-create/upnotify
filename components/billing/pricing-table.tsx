'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Plan, Subscription } from '@/lib/types'
import type { SupportedCurrency } from '@/lib/utils/currency'
import { getPlanFeatures, formatPlanPrice } from '@/lib/utils/plan-display'
import type { PlanDisplayData } from '@/lib/utils/plan-display'
import { CancelPlanModal } from './cancel-plan-modal'
import type { AddonSubscription } from '@/lib/db/subscriptions'
import { MockRazorpayModal, type MockCheckoutData, loadRazorpayScript } from './razorpay-checkout-modal'

interface Props {
  plans: Plan[]
  currentPlanSlug?: string
  subscription?: Subscription | null
  creditBalancePence?: number
  defaultCurrency?: SupportedCurrency
  addonSubscriptions?: AddonSubscription[]
}

// Feature + price logic lives in lib/utils/plan-display.ts — single source of truth

function getPlanCta(plan: Plan, isCurrent: boolean, isHigherTier: boolean): string {
  if (isCurrent) return 'Current Plan'
  if (plan.slug === 'free') return 'Current Plan'
  if (isHigherTier) return 'Upgrade'
  return 'Downgrade'
}

export function PricingTable({ plans, currentPlanSlug, subscription, creditBalancePence = 0, defaultCurrency = 'gbp', addonSubscriptions = [] }: Props): React.ReactElement {
  const [isPending, startTransition] = useTransition()
  // Track which specific plan's Razorpay checkout is loading, not a single
  // shared flag — otherwise every card shows "Opening…" at once.
  const [razorpayPendingSlug, setRazorpayPendingSlug] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showAddonConfirm, setShowAddonConfirm] = useState(false)
  const [mockCheckout, setMockCheckout] = useState<MockCheckoutData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isAnnual = true
  const currency: SupportedCurrency = defaultCurrency
  const router = useRouter()

  const sub = subscription as unknown as Record<string, unknown> | null | undefined
  const isPaused = sub?.status === 'paused'
  const isCancelling = sub?.status === 'cancelling'
  const pauseUntil = sub?.pause_until as string | null | undefined
  // Existing Stripe subscribers switch plans in place; everyone else (no
  // subscription yet, or Razorpay-only) goes through the checkout flow.
  const hasStripeSubscription = Boolean(sub?.stripe_subscription_id) && (sub?.status === 'active' || sub?.status === 'cancelling' || sub?.status === 'past_due')

  const hasActiveAddons = addonSubscriptions.length > 0
  // Add On Plan purchases are Razorpay (INR) only.
  const canBuyAddon = currency === 'inr'

  // Temporarily showing only Lite and Builder on the pricing grid.
  const VISIBLE_PLAN_SLUGS = new Set(['lite', 'builder'])
  const directPlans = plans.filter(p => p.type === 'direct' && VISIBLE_PLAN_SLUGS.has(p.slug))

  // Determine the index of the current plan for upgrade/downgrade logic
  const currentPlanIndex = directPlans.findIndex(p => p.slug === currentPlanSlug)
  // -1 means free/no subscription — all paid plans are higher tier
  const effectiveCurrentIndex = currentPlanIndex >= 0 ? currentPlanIndex : -1

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

  // For orgs with an existing Stripe subscription, switch the plan in place
  // (upgrade or downgrade) instead of starting a brand new checkout session.
  function handleChangePlan(planSlug: string, billingCycle: string): void {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/billing/change-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planSlug, billingCycle }),
        })
        const data: { success?: boolean; error?: string } = await res.json()
        if (!res.ok) {
          setError(data.error || 'Failed to change plan. Please try again.')
          return
        }
        router.refresh()
      } catch {
        setError('Something went wrong. Please check your connection and try again.')
      }
    })
  }

  const handleRazorpayCheckout = useCallback(async (planSlug: string, billingCycle: string): Promise<void> => {
    setError(null)
    setRazorpayPendingSlug(planSlug)
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
        setRazorpayPendingSlug(null)
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
        setRazorpayPendingSlug(null)
        return
      }

      // 2b. Load Razorpay.js and open real checkout modal
      await loadRazorpayScript()
      const isTestKey = (data.keyId ?? '').startsWith('rzp_test_')
      const rzp = new window.Razorpay({
        key:              data.keyId,
        subscription_id:  data.subscriptionId,
        name:             'Upnotify',
        description:      isTestKey
          ? `${data.planName ?? planSlug} · TEST MODE — Use card: 5267 3181 8797 5449 (Razorpay test Mastercard)`
          : `${data.planName ?? planSlug} · ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} (incl. 18% GST)`,
        image:            `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://upnotify-monitoring.vercel.app'}/logo.svg`,
        prefill:          { email: data.userEmail ?? '', name: data.orgName ?? '' },
        theme:            { color: '#1392FB' },
        handler:          (_response: unknown) => {
          // Payment captured — webhook will activate the subscription
          window.location.href = '/dashboard/settings?tab=billing&billing=success'
        },
        modal: {
          ondismiss: () => { setRazorpayPendingSlug(null) },
        },
      })
      rzp.open()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setRazorpayPendingSlug(null)
    }
  }, [])

  const [isAddonPending, setIsAddonPending] = useState(false)

  const handleAddonCheckout = useCallback(async (): Promise<void> => {
    setError(null)
    setIsAddonPending(true)
    try {
      const res = await fetch('/api/v1/billing/razorpay/addon-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json() as {
        subscriptionId?: string
        keyId?: string
        planName?: string
        amountPaise?: number
        userEmail?: string
        orgName?: string
        mockMode?: boolean
        error?: string
      }
      if (!res.ok || !data.subscriptionId) {
        setError(data.error ?? 'Failed to start Add On Plan checkout. Please try again.')
        setIsAddonPending(false)
        return
      }

      if (data.mockMode) {
        setMockCheckout({
          subscriptionId: data.subscriptionId,
          planSlug:       'lite',
          planName:       data.planName ?? 'Add On Plan',
          billingCycle:   'annual',
          amountPaise:    data.amountPaise ?? 0,
          userEmail:      data.userEmail ?? '',
          orgName:        data.orgName ?? '',
        })
        setIsAddonPending(false)
        return
      }

      await loadRazorpayScript()
      const isTestKey = (data.keyId ?? '').startsWith('rzp_test_')
      const rzp = new window.Razorpay({
        key:              data.keyId,
        subscription_id:  data.subscriptionId,
        name:             'Upnotify',
        description:      isTestKey
          ? `${data.planName ?? 'Add On Plan'} · TEST MODE — Use card: 5267 3181 8797 5449 (Razorpay test Mastercard)`
          : `${data.planName ?? 'Add On Plan'} · Annual (incl. 18% GST)`,
        image:            `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://upnotify-monitoring.vercel.app'}/logo.svg`,
        prefill:          { email: data.userEmail ?? '', name: data.orgName ?? '' },
        theme:            { color: '#FBA830' },
        handler:          (_response: unknown) => {
          window.location.href = '/dashboard/settings?tab=billing&billing=addon_success'
        },
        modal: {
          ondismiss: () => { setIsAddonPending(false) },
        },
      })
      rzp.open()
    } catch {
      setError('Something went wrong. Please try again.')
      setIsAddonPending(false)
    }
  }, [])

  const creditGbp = (creditBalancePence / 100).toFixed(2)

  return (
    <div>
      {/* Mock Razorpay checkout — dev/staging only */}
      {mockCheckout && (
        <MockRazorpayModal
          data={mockCheckout}
          onClose={() => { setMockCheckout(null); setRazorpayPendingSlug(null) }}
        />
      )}

      {/* Add On Plan confirmation — shows what you're buying before Razorpay opens */}
      {showAddonConfirm && (() => {
        const addonPlan = directPlans.find(p => p.slug === 'lite')
        const addonFeatures = addonPlan ? getPlanFeatures(addonPlan as unknown as PlanDisplayData) : []
        const addonPrice = addonPlan ? formatPlanPrice(addonPlan as unknown as PlanDisplayData, true, 'inr') : null
        return (
          <div className="popup-overlay" onClick={() => setShowAddonConfirm(false)}>
            <div className="popup-content popup-content-lg" onClick={e => e.stopPropagation()}>
              <button className="popup-close" onClick={() => setShowAddonConfirm(false)}>&times;</button>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Add On Plan</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                This adds another <strong>Pre Plan</strong>&apos;s worth of limits on top of your current plan, billed annually on its own cycle starting today.
              </p>

              {addonPrice && (
                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
                  {addonPrice.symbol}{addonPrice.amount}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}> {addonPrice.period}</span>
                </div>
              )}

              <ul className="pricing-features" style={{ marginBottom: 20 }}>
                {addonFeatures.map((feature, fi) => (
                  <li
                    key={fi}
                    className={`pricing-feature${!feature.included ? ' pricing-feature-disabled' : ''}`}
                  >
                    <span className="pricing-feature-icon">
                      {feature.included
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      }
                    </span>
                    {feature.text}
                  </li>
                ))}
              </ul>

              {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  disabled={isAddonPending}
                  onClick={() => { setShowAddonConfirm(false); void handleAddonCheckout() }}
                >
                  {isAddonPending ? 'Opening…' : 'Continue to Razorpay'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAddonConfirm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Cancel / Pause modal — all users */}
      {currentPlanSlug && (
        <CancelPlanModal
          planName={directPlans.find(p => p.slug === currentPlanSlug)?.name ?? currentPlanSlug}
          isOpen={showCancelModal}
          isPaused={isPaused}
          pauseUntil={pauseUntil ?? null}
          onClose={() => setShowCancelModal(false)}
          onComplete={() => router.refresh()}
          cancelProvider={currency === 'inr' ? 'razorpay' : 'stripe'}
          hasActiveAddons={hasActiveAddons}
        />
      )}

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
                      {feature.included
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      }
                    </span>
                    {feature.text}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div>
                  <div className="pricing-card-current-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    You&apos;re on this plan
                  </div>
                  {!isFree && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {!isCancelling && (
                        <button
                          className="btn btn-ghost btn-full"
                          style={{ fontSize: 13, color: 'var(--text-muted)' }}
                          onClick={() => setShowCancelModal(true)}
                        >
                          {isPaused ? 'Resume or Cancel' : 'Cancel subscription'}
                        </button>
                      )}
                      {canBuyAddon && !isPaused && (
                        <button
                          className="btn btn-primary btn-full"
                          style={{ fontSize: 13 }}
                          onClick={() => setShowAddonConfirm(true)}
                          disabled={isAddonPending}
                        >
                          {isAddonPending ? 'Opening…' : 'Add On Plan'}
                        </button>
                      )}
                    </div>
                  )}
                  {canBuyAddon && hasActiveAddons && (
                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                      {addonSubscriptions.length} Add On Plan{addonSubscriptions.length > 1 ? 's' : ''} active
                    </div>
                  )}
                </div>
              ) : isFree ? (
                <button className="btn btn-secondary btn-full" disabled>
                  Free Plan
                </button>
              ) : hasStripeSubscription ? (
                <button
                  className={isHigherTier ? 'btn btn-primary btn-full' : 'btn btn-secondary btn-full'}
                  onClick={() => handleChangePlan(plan.slug, billingCycle)}
                  disabled={isPending}
                >
                  {isPending ? 'Updating…' : ctaText}
                </button>
              ) : isInrMode && isHigherTier ? (
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => void handleRazorpayCheckout(plan.slug, billingCycle)}
                  disabled={razorpayPendingSlug !== null}
                >
                  {razorpayPendingSlug === plan.slug ? 'Opening…' : ctaText}
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

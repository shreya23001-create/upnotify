'use client'

import { useState } from 'react'

interface CompetePlan {
  id: string
  name: string
  slug: string
  description: string | null
  product_limit: number
  price_monthly_pence: number
  price_yearly_pence: number | null
  has_yearly_discount: boolean
  extra_product_price_pence: number
  max_extra_products: number
}

interface CompetePlanSelectorProps {
  plans: CompetePlan[]
  hasPaidBasePlan: boolean
}

function formatPence(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`
}

export function CompetePlanSelector({ plans, hasPaidBasePlan }: CompetePlanSelectorProps): React.ReactElement {
  const [isAnnual, setIsAnnual] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleCheckout = async (slug: string): Promise<void> => {
    setLoading(slug)
    setError('')

    try {
      const res = await fetch('/api/v1/compete/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: slug,
          billingCycle: isAnnual ? 'annual' : 'monthly',
        }),
      })

      const data = await res.json() as { success: boolean; url?: string; error?: string }

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Failed to start checkout')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  if (!hasPaidBasePlan) {
    return (
      <div className="compete-upgrade-cta">
        <h2 className="compete-upgrade-title">Paid Plan Required</h2>
        <p className="compete-upgrade-description">
          Compete is available as an add-on to any paid monitoring plan.
          Upgrade from Free to get started.
        </p>
        <a href="/dashboard/settings?tab=billing" className="btn btn-primary">
          Upgrade Your Plan
        </a>
      </div>
    )
  }

  return (
    <div>
      <div className="compete-upgrade-cta" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
        <h2 className="compete-upgrade-title">Choose Your Compete Plan</h2>
        <p className="compete-upgrade-description" style={{ marginBottom: 20 }}>
          Track competitor prices, detect stock changes, and get alerts. Add to your existing plan.
        </p>

        {/* Toggle */}
        <div className="billing-toggle-wrapper" style={{ marginBottom: 24 }}>
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
            <span className="billing-toggle-save">2 months free</span>
          </button>
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</div>
        )}

        <div className="compete-pricing-grid" style={{ maxWidth: 900 }}>
          {plans.map((plan) => {
            const showAnnual = isAnnual && plan.has_yearly_discount && plan.price_yearly_pence
            const monthlyPrice = plan.price_monthly_pence
            const displayPrice = showAnnual
              ? Math.round((plan.price_yearly_pence ?? 0) / 12)
              : monthlyPrice
            const isHighlighted = plan.slug === 'compete-pro'

            return (
              <div
                key={plan.id}
                className={`pricing-card${isHighlighted ? ' pricing-card-highlighted' : ''}`}
              >
                {isHighlighted && <div className="pricing-badge">Best Value</div>}
                <div className="pricing-card-header">
                  <h3 className="pricing-plan-name">{plan.name}</h3>
                  <div className="pricing-price">
                    <span className="pricing-amount">{formatPence(displayPrice)}</span>
                    <span className="pricing-period">/mo</span>
                  </div>
                  {showAnnual && (
                    <p className="pricing-description">
                      {formatPence(plan.price_yearly_pence ?? 0)}/year — 2 months free
                    </p>
                  )}
                  {!showAnnual && plan.description && (
                    <p className="pricing-description">{plan.description}</p>
                  )}
                </div>

                <ul className="pricing-features">
                  <li className="pricing-feature">
                    <span className="pricing-feature-icon">{'\u2713'}</span>
                    <strong>{plan.product_limit.toLocaleString()}</strong> products included
                  </li>
                  <li className="pricing-feature">
                    <span className="pricing-feature-icon">{'\u2713'}</span>
                    +{formatPence(plan.extra_product_price_pence)} per extra product
                  </li>
                  <li className="pricing-feature">
                    <span className="pricing-feature-icon">{'\u2713'}</span>
                    Up to {plan.max_extra_products} extra products
                  </li>
                  <li className="pricing-feature">
                    <span className="pricing-feature-icon">{'\u2713'}</span>
                    Automatic price extraction
                  </li>
                  <li className="pricing-feature">
                    <span className="pricing-feature-icon">{'\u2713'}</span>
                    Price change alerts
                  </li>
                </ul>

                <button
                  className={`btn btn-full${isHighlighted ? ' btn-primary' : ' btn-secondary'}`}
                  onClick={() => handleCheckout(plan.slug)}
                  disabled={loading !== null}
                >
                  {loading === plan.slug ? 'Redirecting...' : 'Add Compete'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

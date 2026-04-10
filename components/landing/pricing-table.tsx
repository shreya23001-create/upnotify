'use client'

import { useState, useEffect } from 'react'
import type { SupportedCurrency } from '@/lib/utils/currency'
import { getPlanFeatures, formatPlanPrice } from '@/lib/utils/plan-display'
import type { PlanDisplayData } from '@/lib/utils/plan-display'

export default function PricingTable({ defaultCurrency = 'gbp' }: { defaultCurrency?: SupportedCurrency }): React.ReactElement {
  const [isAnnual, setIsAnnual] = useState(true)
  const currency: SupportedCurrency = defaultCurrency
  const [plans, setPlans] = useState<PlanDisplayData[]>([])

  useEffect(() => {
    fetch('/api/v1/plans')
      .then(r => r.json())
      .then((data: { plans?: PlanDisplayData[] }) => {
        if (data.plans) setPlans(data.plans.filter(p => p.is_visible))
      })
      .catch(() => {})
  }, [])

  const highlightedSlug = 'builder'

  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Simple pricing</div>
          <h2 className="section-title">Start free, scale as you grow</h2>
          <p className="section-sub">No hidden fees. No credit card required for free plan. Cancel or pause anytime.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 8 }}>
          <div className="pricing-toggle" style={{ margin: 0 }}>
            <span className="toggle-label">Monthly</span>
            <div
              className={`toggle-pill${isAnnual ? ' annual' : ''}`}
              onClick={() => setIsAnnual(!isAnnual)}
              role="button"
              aria-label="Toggle billing period"
            >
              <div className="toggle-thumb" />
            </div>
            <span className="toggle-label">Annual</span>
            {currency === 'gbp' && <span className="save-badge">Save up to 20%</span>}
          </div>
        </div>
        {currency === 'inr' && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>+ 18% GST · Secure checkout via Razorpay</p>
        )}

        <div className="pricing-grid">
          {plans.map((plan) => {
            const isFree = plan.price_monthly_gbp === 0 && (!plan.price_annual_gbp || plan.price_annual_gbp === 0)
            const isHighlighted = plan.slug === highlightedSlug
            const features = getPlanFeatures(plan)
            const price = formatPlanPrice(plan, isAnnual, currency)

            return (
              <div
                key={plan.slug}
                className={`pricing-card${isHighlighted ? ' featured' : ''}`}
              >
                {isHighlighted && (
                  <div className="popular-badge">Most Popular</div>
                )}
                <div className="plan-name" style={isHighlighted ? { color: 'var(--brand-blue)' } : {}}>
                  {plan.name}
                </div>
                <div className="plan-price">
                  {price.symbol}<span>{price.amount}</span>
                </div>
                <div className="plan-period">{price.period}</div>
                {price.note && <div className="plan-price-note">{price.note}</div>}
                <hr className="plan-divider" />
                <ul className="plan-features">
                  {features.map((feature, index) => (
                    <li key={index} className="plan-feature">
                      <span className={feature.included ? 'plan-check' : 'plan-x'}>
                        {feature.included ? '✓' : '✗'}
                      </span>
                      {' '}{feature.text}
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className={`btn${isHighlighted ? ' btn-primary' : ' btn-ghost'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isFree ? 'Start Free' : `Get ${plan.name}`}
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import type { SupportedCurrency } from '@/lib/utils/currency'
import { getPlanFeatures, formatPlanPrice } from '@/lib/utils/plan-display'
import type { PlanDisplayData } from '@/lib/utils/plan-display'

export default function PricingTable({ defaultCurrency = 'gbp' }: { defaultCurrency?: SupportedCurrency }): React.ReactElement {
  const [isAnnual, setIsAnnual] = useState(true)
  const [currency, setCurrency] = useState<SupportedCurrency>(defaultCurrency)
  const [plans, setPlans] = useState<PlanDisplayData[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    fetch('/api/v1/plans')
      .then(r => r.json())
      .then((data: { plans?: PlanDisplayData[] }) => {
        if (data.plans) setPlans(data.plans.filter(p => p.is_visible))
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        setFetchError(true)
      })
  }, [])

  const highlightedSlug = 'builder'

  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">No surprises</div>
          <h2 className="section-title pricing-title-gradient">Start free. Pay when you&apos;re <em>ready.</em></h2>
          <p className="section-sub">No hidden fees. No credit card for the free plan. Cancel or pause anytime.</p>
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

          {/* Currency selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>View as:</span>
            {(['gbp', 'inr'] as SupportedCurrency[]).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: '1.5px solid',
                  background: currency === c ? 'var(--brand-blue, #3b82f6)' : 'transparent',
                  color: currency === c ? '#fff' : 'var(--text-secondary)',
                  borderColor: currency === c ? 'var(--brand-blue, #3b82f6)' : 'var(--border-input)',
                  transition: 'all 0.15s',
                }}
                aria-pressed={currency === c}
              >
                {c === 'gbp' ? '🇬🇧 GBP (£)' : '🇮🇳 INR (₹)'}
              </button>
            ))}
          </div>
        </div>
        {currency === 'inr' && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>+ 18% GST · Secure checkout via Razorpay</p>
        )}

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Loading plans…</p>
        )}
        {fetchError && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Unable to load pricing. Please refresh the page.</p>
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
                <div className="plan-price-block">
                  <div className="plan-price">
                    {price.symbol}<span>{price.amount}</span>
                  </div>
                  <div className="plan-period-line">
                    <span className="plan-period">{price.period}</span>
                    {price.note && <><span className="plan-period-sep">·</span><span className="plan-price-note">{price.note}</span></>}
                  </div>
                </div>
                <hr className="plan-divider" />
                <ul className="plan-features">
                  {features.map((feature, index) => (
                    <li key={index} className="plan-feature">
                      <span className={feature.included ? 'plan-check' : 'plan-x'}>
                        {feature.included ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
                      </span>
                      {' '}{feature.text}
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className={`btn${isHighlighted ? ' btn-primary' : ' btn-ghost'}`}
                  style={{ width: '83%', justifyContent: 'center' }}
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

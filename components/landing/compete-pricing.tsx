'use client'

import { useState, useEffect } from 'react'

interface CompetePlanData {
  name: string
  slug: string
  product_limit: number
  price_monthly_pence: number
  price_yearly_pence: number | null
  has_yearly_discount: boolean
  extra_product_price_pence: number
  max_extra_products: number
  is_active: boolean
}

function fmt(pence: number): string {
  const gbp = pence / 100
  return `\u00A3${gbp % 1 === 0 ? gbp.toFixed(0) : gbp.toFixed(2)}`
}

export default function CompetePricing(): React.ReactElement {
  const [isAnnual, setIsAnnual] = useState(true)
  const [plans, setPlans] = useState<CompetePlanData[]>([])

  useEffect(() => {
    fetch('/api/v1/compete/plans')
      .then(r => r.json())
      .then((data: { plans?: CompetePlanData[] }) => {
        if (data.plans) setPlans(data.plans.filter(p => p.is_active))
      })
      .catch(() => {})
  }, [])

  return (
    <section className="section" id="compete-pricing">
      <div className="container">
        <div className="compete-pricing-header">
          <span className="compete-pricing-badge">Add-on</span>
          <h2 className="section-title">Upnotify Compete</h2>
          <p className="section-sub">
            Track competitor prices, detect stock changes, and get alerts when prices drop.
            Add to any paid monitoring plan.
          </p>
        </div>

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
            <span className="billing-toggle-save">2 months free</span>
          </button>
        </div>

        <div className="compete-pricing-grid">
          {plans.map((plan) => {
            const showAnnual = isAnnual && plan.has_yearly_discount && plan.price_yearly_pence
            const isHighlighted = plan.slug === 'compete-pro'

            let price: string
            let period: string
            let note: string | undefined

            if (showAnnual && plan.price_yearly_pence) {
              price = fmt(plan.price_yearly_pence)
              period = '/year'
              note = '2 months free'
            } else {
              price = fmt(plan.price_monthly_pence)
              period = '/month'
            }

            return (
              <div
                key={plan.slug}
                className={`pricing-card ${isHighlighted ? 'pricing-card-highlighted' : ''}`}
              >
                {isHighlighted && (
                  <div className="pricing-badge">Best Value</div>
                )}
                <div className="pricing-card-header">
                  <h3 className="pricing-plan-name">{plan.name}</h3>
                  <div className="pricing-price">
                    <span className="pricing-amount">{price}</span>
                    <span className="pricing-period">{period}</span>
                  </div>
                  {note && <p className="pricing-description">{note}</p>}
                </div>

                <div style={{ padding: '0 24px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-primary)' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Products</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-primary)' }}>{plan.product_limit.toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    +{fmt(plan.extra_product_price_pence)} per extra product (bundles of 5 or 10)
                  </p>
                </div>

                <ul className="pricing-features">
                  <li className="pricing-feature"><span className="pricing-feature-icon">{'\u2713'}</span>Automatic price extraction</li>
                  <li className="pricing-feature"><span className="pricing-feature-icon">{'\u2713'}</span>Stock availability monitoring</li>
                  <li className="pricing-feature"><span className="pricing-feature-icon">{'\u2713'}</span>Price change alerts</li>
                  <li className="pricing-feature"><span className="pricing-feature-icon">{'\u2713'}</span>CSV export</li>
                </ul>
                <a
                  href="/signup"
                  className={`btn btn-full ${isHighlighted ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Add Compete
                </a>
              </div>
            )
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>
          Requires any paid monitoring plan (Lite, Builder, or Scale). Cannot be purchased standalone.
        </p>
      </div>
    </section>
  )
}

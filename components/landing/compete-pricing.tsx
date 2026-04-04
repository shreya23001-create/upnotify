'use client'

import { useState } from 'react'

interface CompeteAddonPlan {
  name: string
  monthlyPrice: string
  annualPrice: string | null
  monthlyPeriod: string
  annualPeriod: string | null
  annualNote: string | null
  description: string
  productLimit: string
  extraProducts: string
  features: string[]
  highlighted: boolean
}

const COMPETE_PLANS: CompeteAddonPlan[] = [
  {
    name: 'Starter',
    monthlyPrice: '\u00A39',
    annualPrice: '\u00A37.50',
    monthlyPeriod: '/month',
    annualPeriod: '/mo',
    annualNote: '\u00A390/year \u2014 2 months free',
    description: 'Start tracking competitor prices',
    productLimit: '10 products',
    extraProducts: '+\u00A31 per product (bundles of 5 or 10)',
    features: [
      'Automatic price extraction',
      'Stock availability monitoring',
      'Price change alerts',
      'CSV export',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: '\u00A329',
    annualPrice: '\u00A324.17',
    monthlyPeriod: '/month',
    annualPeriod: '/mo',
    annualNote: '\u00A3290/year \u2014 2 months free',
    description: 'For serious competitive intelligence',
    productLimit: '500 products',
    extraProducts: '+\u00A31 per product (bundles of 5 or 10)',
    features: [
      'Everything in Starter',
      'Webhook integrations',
      'Price history charts',
      'AI-powered price brief',
    ],
    highlighted: true,
  },
  {
    name: 'Business',
    monthlyPrice: '\u00A399',
    annualPrice: null,
    monthlyPeriod: '/month',
    annualPeriod: null,
    annualNote: null,
    description: 'Enterprise-scale price tracking',
    productLimit: '2,500 products',
    extraProducts: '+\u00A31 per product (bundles of 5 or 10)',
    features: [
      'Everything in Pro',
      'Priority support',
      'Bulk product import',
      'Custom check intervals',
    ],
    highlighted: false,
  },
]

export default function CompetePricing(): React.ReactElement {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section className="landing-section landing-compete-pricing" id="compete-pricing">
      <div className="landing-container">
        <div className="compete-pricing-header">
          <span className="compete-pricing-badge">Add-on</span>
          <h2 className="landing-section-title">Uptrue Compete</h2>
          <p className="landing-section-subtitle">
            Track competitor prices, detect stock changes, and get alerts when prices drop.
            Add to any paid monitoring plan.
          </p>
        </div>

        {/* Annual / Monthly toggle */}
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
          {COMPETE_PLANS.map((plan) => {
            const showAnnual = isAnnual && plan.annualPrice
            const price = showAnnual ? plan.annualPrice : plan.monthlyPrice
            const period = showAnnual ? plan.annualPeriod : plan.monthlyPeriod
            const note = showAnnual ? plan.annualNote : null

            return (
              <div
                key={plan.name}
                className={`pricing-card ${plan.highlighted ? 'pricing-card-highlighted' : ''}`}
              >
                {plan.highlighted && (
                  <div className="pricing-badge">Best Value</div>
                )}
                <div className="pricing-card-header">
                  <h3 className="pricing-plan-name">{plan.name}</h3>
                  <div className="pricing-price">
                    <span className="pricing-amount">{price}</span>
                    <span className="pricing-period">{period}</span>
                  </div>
                  <p className="pricing-description">{note || plan.description}</p>
                </div>

                <div style={{ padding: '0 24px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-primary)' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Products</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-primary)' }}>{plan.productLimit}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{plan.extraProducts}</p>
                </div>

                <ul className="pricing-features">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="pricing-feature">
                      <span className="pricing-feature-icon">{'\u2713'}</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className={`btn btn-full ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
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

'use client'

import { useState } from 'react'

interface PlanFeature {
  text: string
  included: boolean
}

interface LandingPlan {
  name: string
  monthlyPrice: string
  annualPrice: string
  monthlyPeriod: string
  annualPeriod: string
  monthlyNote?: string
  annualNote?: string
  description: string
  features: PlanFeature[]
  cta: string
  ctaHref: string
  highlighted: boolean
}

const PLANS: LandingPlan[] = [
  {
    name: 'Free',
    monthlyPrice: '\u00A30',
    annualPrice: '\u00A30',
    monthlyPeriod: 'forever',
    annualPeriod: 'forever',
    description: 'Get started with basic monitoring',
    features: [
      { text: '3 monitors', included: true },
      { text: '10-minute check interval', included: true },
      { text: '7-day data retention', included: true },
      { text: 'Email alerts', included: true },
      { text: 'Solo use only', included: true },
      { text: 'Status pages', included: false },
      { text: 'Slack & Teams alerts', included: false },
      { text: 'Webhooks', included: false },
      { text: 'AI reports', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Start Free',
    ctaHref: '/signup',
    highlighted: false,
  },
  {
    name: 'Lite',
    monthlyPrice: '\u00A31',
    annualPrice: '\u00A310',
    monthlyPeriod: '/month',
    annualPeriod: '/year',
    monthlyNote: 'Or save with annual \u2014 \u00A310/yr',
    annualNote: 'Just 83p per month',
    description: 'Affordable monitoring for small projects',
    features: [
      { text: '5 monitors', included: true },
      { text: '1-minute check interval', included: true },
      { text: '30-day data retention', included: true },
      { text: 'Email alerts', included: true },
      { text: '2 team members', included: true },
      { text: '1 branded status page', included: true },
      { text: 'Slack & Teams alerts', included: true },
      { text: 'Webhooks', included: true },
      { text: 'AI reports', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Get Started',
    ctaHref: '/signup',
    highlighted: false,
  },
  {
    name: 'Builder',
    monthlyPrice: '\u00A315',
    annualPrice: '\u00A312',
    monthlyPeriod: '/month',
    annualPeriod: '/mo',
    annualNote: '\u00A3144/year \u2014 save 20%',
    description: 'For growing teams and serious projects',
    features: [
      { text: '25 monitors', included: true },
      { text: '1-minute check interval', included: true },
      { text: '90-day data retention', included: true },
      { text: 'Email alerts', included: true },
      { text: '10 team members', included: true },
      { text: '5 custom domain status pages', included: true },
      { text: 'Slack & Teams alerts', included: true },
      { text: 'Webhooks', included: true },
      { text: 'AI reports (5/month)', included: true },
      { text: 'API access', included: false },
    ],
    cta: 'Get Started',
    ctaHref: '/signup',
    highlighted: true,
  },
  {
    name: 'Scale',
    monthlyPrice: '\u00A339',
    annualPrice: '\u00A331.17',
    monthlyPeriod: '/month',
    annualPeriod: '/mo',
    annualNote: '\u00A3374/year \u2014 save 20%',
    description: 'Full power for teams that need everything',
    features: [
      { text: '100 monitors', included: true },
      { text: '30-second check interval', included: true },
      { text: '1-year data retention', included: true },
      { text: 'Email alerts', included: true },
      { text: '20 team members', included: true },
      { text: 'Unlimited status pages', included: true },
      { text: 'Slack & Teams alerts', included: true },
      { text: 'Webhooks', included: true },
      { text: 'Unlimited AI reports', included: true },
      { text: 'Full API access', included: true },
    ],
    cta: 'Get Started',
    ctaHref: '/signup',
    highlighted: false,
  },
]

export default function PricingTable(): React.ReactElement {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section className="landing-section landing-pricing" id="pricing">
      <div className="landing-container">
        <h2 className="landing-section-title">Simple, transparent pricing</h2>
        <p className="landing-section-subtitle">
          Start free. Scale as you grow. No hidden fees.
        </p>

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
            <span className="billing-toggle-save">Save 20%</span>
          </button>
        </div>

        <div className="pricing-grid">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
            const period = isAnnual ? plan.annualPeriod : plan.monthlyPeriod
            const note = isAnnual ? plan.annualNote : plan.monthlyNote

            return (
              <div
                key={plan.name}
                className={`pricing-card ${plan.highlighted ? 'pricing-card-highlighted' : ''}`}
              >
                {plan.highlighted && (
                  <div className="pricing-badge">Most Popular</div>
                )}
                <div className="pricing-card-header">
                  <h3 className="pricing-plan-name">
                    {plan.name}
                  </h3>
                  <div className="pricing-price">
                    <span className="pricing-amount">{price}</span>
                    <span className="pricing-period">{period}</span>
                  </div>
                  <p className="pricing-description">{note || plan.description}</p>
                </div>
                <ul className="pricing-features">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className={`pricing-feature ${!feature.included ? 'pricing-feature-disabled' : ''}`}
                    >
                      <span className="pricing-feature-icon">
                        {feature.included ? '\u2713' : '\u2014'}
                      </span>
                      {feature.text}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.ctaHref}
                  className={`btn btn-full ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {plan.cta}
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

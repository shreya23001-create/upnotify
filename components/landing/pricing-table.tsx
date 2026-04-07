'use client'

import { useState, useEffect } from 'react'

interface PlanData {
  name: string
  slug: string
  price_monthly_gbp: number
  price_annual_gbp: number | null
  monitor_limit: number | null
  check_interval_seconds: number
  max_team_members: number
  has_email_alerts: boolean
  has_slack_teams: boolean
  has_webhooks: boolean
  has_status_pages: boolean
  status_page_limit: number
  has_status_page_custom_domain: boolean
  has_ai_predictive: boolean
  ai_report_limit: number
  has_api_access: boolean
  data_retention_days: number | null
  is_visible: boolean
}

function formatInterval(seconds: number): string {
  if (seconds >= 300) return `${seconds / 60}-minute check interval`
  return `${seconds}-second check interval`
}

function formatRetention(days: number | null): string {
  if (!days) return 'Unlimited data retention'
  if (days >= 365) return `${Math.round(days / 365)}-year data retention`
  return `${days}-day data retention`
}

function getFeatures(p: PlanData): { text: string; included: boolean }[] {
  const features: { text: string; included: boolean }[] = []

  features.push({ text: p.monitor_limit ? `${p.monitor_limit} monitors` : 'Unlimited monitors', included: true })
  features.push({ text: formatInterval(p.check_interval_seconds), included: true })
  features.push({ text: formatRetention(p.data_retention_days), included: true })
  features.push({ text: 'Email alerts', included: p.has_email_alerts })

  if (p.max_team_members > 0) {
    features.push({ text: `${p.max_team_members} team members`, included: true })
  } else {
    features.push({ text: 'Solo use only', included: true })
  }

  if (p.has_status_page_custom_domain) {
    features.push({ text: p.status_page_limit ? `${p.status_page_limit} custom domain status pages` : 'Unlimited status pages', included: true })
  } else if (p.has_status_pages) {
    features.push({ text: p.status_page_limit ? `${p.status_page_limit} status page${p.status_page_limit > 1 ? 's' : ''}` : 'Status pages', included: true })
  } else {
    features.push({ text: 'Status pages', included: false })
  }

  features.push({ text: 'Slack & Teams alerts', included: p.has_slack_teams })
  features.push({ text: 'Webhooks', included: p.has_webhooks })

  if (p.has_ai_predictive || p.ai_report_limit > 0) {
    features.push({ text: p.ai_report_limit > 0 ? `AI reports (${p.ai_report_limit}/month)` : 'Unlimited AI reports', included: true })
  } else {
    features.push({ text: 'AI reports', included: false })
  }

  features.push({ text: p.has_api_access ? 'Full API access' : 'API access', included: p.has_api_access })

  return features
}

export default function PricingTable(): React.ReactElement {
  const [isAnnual, setIsAnnual] = useState(true)
  const [plans, setPlans] = useState<PlanData[]>([])

  useEffect(() => {
    fetch('/api/v1/plans')
      .then(r => r.json())
      .then((data: { plans?: PlanData[] }) => {
        if (data.plans) setPlans(data.plans.filter(p => p.is_visible))
      })
      .catch(() => {})
  }, [])

  const highlightedSlug = 'builder'

  return (
    <section className="landing-section landing-pricing" id="pricing">
      <div className="landing-container">
        <div className="lp-section-eyebrow">Simple pricing</div>
        <h2 className="landing-section-title">Start free, scale as you grow</h2>
        <p className="landing-section-subtitle">
          No hidden fees. No credit card required for free plan. Cancel or pause anytime.
        </p>

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
            <span className="billing-toggle-save">Save up to 20%</span>
          </button>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => {
            const isFree = plan.price_monthly_gbp === 0 && (!plan.price_annual_gbp || plan.price_annual_gbp === 0)
            const monthlyGbp = plan.price_monthly_gbp / 100
            const annualGbp = plan.price_annual_gbp ? plan.price_annual_gbp / 100 : null

            let price: string
            let period: string
            let note: string | undefined

            if (isFree) {
              price = '\u00A30'
              period = 'forever'
            } else if (isAnnual && annualGbp) {
              price = `\u00A3${annualGbp.toFixed(annualGbp % 1 === 0 ? 0 : 2)}`
              period = '/year'
              const savings = Math.round(((monthlyGbp * 12 - annualGbp) / (monthlyGbp * 12)) * 100)
              note = savings > 0 ? `Save ${savings}% vs monthly` : undefined
            } else {
              price = `\u00A3${monthlyGbp.toFixed(monthlyGbp % 1 === 0 ? 0 : 2)}`
              period = '/month'
              if (annualGbp) {
                note = `Or \u00A3${annualGbp.toFixed(0)}/year`
              }
            }

            const isHighlighted = plan.slug === highlightedSlug
            const features = getFeatures(plan)

            return (
              <div
                key={plan.slug}
                className={`pricing-card ${isHighlighted ? 'pricing-card-highlighted' : ''}`}
              >
                {isHighlighted && (
                  <div className="pricing-badge">Most Popular</div>
                )}
                <div className="pricing-card-header">
                  <h3 className="pricing-plan-name">{plan.name}</h3>
                  <div className="pricing-price">
                    <span className="pricing-amount">{price}</span>
                    <span className="pricing-period">{period}</span>
                  </div>
                  {note && <p className="pricing-description">{note}</p>}
                </div>
                <ul className="pricing-features">
                  {features.map((feature, index) => (
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
                  href={isFree ? '/signup' : '/signup'}
                  className={`btn btn-full ${isHighlighted ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {isFree ? 'Start Free' : 'Get Started'}
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

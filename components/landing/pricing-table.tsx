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
  if (seconds >= 300) return `${seconds / 60}-minute checks`
  if (seconds === 60) return '1-minute checks'
  return `${seconds}-second checks`
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

  if (p.has_slack_teams) {
    features.push({ text: 'Email + Slack + Teams', included: true })
  } else {
    features.push({ text: 'Slack / Teams', included: false })
  }

  if (p.has_status_page_custom_domain) {
    features.push({ text: p.status_page_limit ? `${p.status_page_limit} custom domain status pages` : 'Unlimited status pages', included: true })
  } else if (p.has_status_pages) {
    features.push({ text: p.status_page_limit ? `${p.status_page_limit} status page${p.status_page_limit > 1 ? 's' : ''}` : 'Status pages', included: true })
  } else {
    features.push({ text: '1 status page', included: p.has_status_pages })
  }

  if (p.has_webhooks) {
    features.push({ text: 'Webhooks', included: true })
  }

  if (p.has_ai_predictive || p.ai_report_limit > 0) {
    features.push({ text: p.ai_report_limit > 0 ? `${p.ai_report_limit} AI reports/month` : 'Unlimited AI reports', included: true })
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
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Simple pricing</div>
          <h2 className="section-title">Start free, scale as you grow</h2>
          <p className="section-sub">No hidden fees. No credit card required for free plan. Cancel or pause anytime.</p>
        </div>

        <div className="pricing-toggle">
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
          <span className="save-badge">Save up to 20%</span>
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
              price = '£0'
              period = 'forever'
            } else if (isAnnual && annualGbp) {
              price = `£${annualGbp.toFixed(annualGbp % 1 === 0 ? 0 : 2)}`
              period = 'per month · billed annually'
              const savings = Math.round(((monthlyGbp * 12 - annualGbp) / (monthlyGbp * 12)) * 100)
              note = savings > 0 ? `Or £${(monthlyGbp).toFixed(0)}/mo billed monthly` : undefined
            } else {
              price = `£${monthlyGbp.toFixed(monthlyGbp % 1 === 0 ? 0 : 2)}`
              period = 'per month'
              if (annualGbp) {
                note = `Or £${annualGbp.toFixed(0)}/yr billed annually`
              }
            }

            const isHighlighted = plan.slug === highlightedSlug
            const features = getFeatures(plan)

            return (
              <div
                key={plan.slug}
                className={`pricing-card${isHighlighted ? ' featured' : ''}`}
              >
                {isHighlighted && (
                  <div className="popular-badge">Most Popular</div>
                )}
                <div className={`plan-name${isHighlighted ? '' : ''}`} style={isHighlighted ? { color: 'var(--brand-blue)' } : {}}>
                  {plan.name}
                </div>
                <div className="plan-price">
                  £<span>{isFree ? '0' : (isAnnual && annualGbp ? (annualGbp / 12).toFixed(annualGbp / 12 % 1 === 0 ? 0 : 0) : monthlyGbp.toFixed(monthlyGbp % 1 === 0 ? 0 : 2))}</span>
                </div>
                <div className="plan-period">{period}</div>
                {note && <div className="plan-price-note">{note}</div>}
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

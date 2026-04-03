'use client'

import { useState, useTransition } from 'react'
import type { Plan } from '@/lib/types'

interface PlanFeatureDisplay {
  text: string
  included: boolean
}

interface Props {
  plans: Plan[]
  currentPlanSlug?: string
  creditBalancePence?: number
}

function getPlanFeatures(plan: Plan): PlanFeatureDisplay[] {
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
  features.push({
    text: plan.client_workspace_limit
      ? `${plan.client_workspace_limit} workspace${plan.client_workspace_limit > 1 ? 's' : ''}`
      : 'Unlimited workspaces',
    included: true,
  })
  features.push({ text: 'Email alerts', included: true })

  const teamLimit = (plan as Record<string, unknown>).max_team_members as number | undefined
  if (teamLimit && teamLimit > 0) {
    features.push({ text: `${teamLimit} team members`, included: true })
  } else {
    features.push({ text: 'Solo use only', included: true })
  }

  features.push({
    text: plan.has_status_page_custom_domain ? 'Custom domain status pages' : 'Status pages',
    included: Boolean(plan.has_status_page_custom_domain || (plan as Record<string, unknown>).has_status_pages),
  })
  features.push({ text: 'Slack & Teams alerts', included: Boolean((plan as Record<string, unknown>).has_slack_teams) || plan.has_api_access })
  features.push({ text: 'Webhooks', included: Boolean((plan as Record<string, unknown>).has_webhooks) || plan.has_api_access })
  features.push({ text: 'AI reports', included: plan.has_ai_predictive })
  features.push({ text: 'API access', included: plan.has_api_access })

  return features
}

function getPlanPrice(plan: Plan, isAnnual: boolean): { amount: string; period: string; note?: string } {
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
    const monthlyEquiv = Math.round((annualPence / 12)) / 100
    const monthlySavings = Math.round(((monthlyPence * 12 - annualPence) / (monthlyPence * 12)) * 100)
    return {
      amount: `\u00A3${monthlyEquiv.toFixed(2)}`,
      period: '/mo',
      note: `\u00A3${annualGbp}/year \u2014 save ${monthlySavings}%`,
    }
  }

  const monthlyGbp = monthlyPence / 100
  return { amount: `\u00A3${monthlyGbp}`, period: '/month' }
}

function getPlanCta(plan: Plan, isCurrent: boolean, isHigherTier: boolean): string {
  if (isCurrent) return 'Current Plan'
  if (plan.slug === 'free') return 'Current Plan'
  if (isHigherTier) return 'Upgrade'
  return 'Downgrade'
}

export function PricingTable({ plans, currentPlanSlug, creditBalancePence = 0 }: Props): React.ReactElement {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isAnnual, setIsAnnual] = useState(true)

  const directPlans = plans.filter(p => p.type === 'direct')

  // Determine the index of the current plan for upgrade/downgrade logic
  const currentPlanIndex = directPlans.findIndex(p => p.slug === currentPlanSlug)
  const effectiveCurrentIndex = currentPlanIndex >= 0 ? currentPlanIndex : 0 // Free if no subscription

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

  const creditGbp = (creditBalancePence / 100).toFixed(2)

  return (
    <div>
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

      {creditBalancePence > 0 && (
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
          const price = getPlanPrice(plan, isAnnual)
          const features = getPlanFeatures(plan)
          const ctaText = getPlanCta(plan, isCurrent, isHigherTier)
          const isPopular = plan.slug === 'builder'
          const hasAnnual = plan.price_annual_gbp && plan.price_annual_gbp > 0 && plan.price_monthly_gbp > 0
          const billingCycle = isAnnual && hasAnnual ? 'annual' : 'monthly'

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
                <div className="pricing-card-current-label">{'\u2713'} You&apos;re on this plan</div>
              ) : isFree ? (
                <button className="btn btn-secondary btn-full" disabled>
                  Free Plan
                </button>
              ) : isHigherTier ? (
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleSubscribe(plan.slug, billingCycle)}
                  disabled={isPending}
                >
                  {isPending ? 'Loading...' : ctaText}
                </button>
              ) : (
                <button className="btn btn-secondary btn-full" disabled style={{ opacity: 0.6 }}>
                  {ctaText}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

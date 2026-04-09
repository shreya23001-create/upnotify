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
  const p = plan as unknown as Record<string, unknown>
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

  const teamLimit = p.max_team_members as number | undefined
  if (teamLimit && teamLimit > 0) {
    features.push({ text: `${teamLimit} team members`, included: true })
  } else {
    features.push({ text: 'Solo use only', included: true })
  }

  features.push({ text: 'Email alerts', included: Boolean(p.has_email_alerts ?? true) })
  features.push({ text: 'Slack & Teams alerts', included: Boolean(p.has_slack_teams) })
  features.push({ text: 'Webhooks', included: Boolean(p.has_webhooks) })

  // Status pages
  const statusPageLimit = p.status_page_limit as number | undefined
  if (plan.has_status_page_custom_domain) {
    features.push({ text: statusPageLimit ? `${statusPageLimit} custom domain status pages` : 'Unlimited status pages', included: true })
  } else if (p.has_status_pages) {
    features.push({ text: statusPageLimit ? `${statusPageLimit} status page${statusPageLimit > 1 ? 's' : ''}` : 'Status pages', included: true })
  } else {
    features.push({ text: 'Status pages', included: false })
  }

  // AI reports
  const aiLimit = p.ai_report_limit as number | undefined
  if (plan.has_ai_predictive || (aiLimit && aiLimit > 0)) {
    features.push({ text: aiLimit ? `AI reports (${aiLimit}/month)` : 'Unlimited AI reports', included: true })
  } else {
    features.push({ text: 'AI reports', included: false })
  }

  const watchdogLimit = (p.competitor_limit as number | undefined) ?? 3
  features.push({ text: `Watchdog — ${watchdogLimit} competitor${watchdogLimit === 1 ? '' : 's'}`, included: true })

  // AI Visibility
  const llmsTxtLimit = p.llms_txt_limit as number | undefined
  const citationLimit = p.citation_check_monthly_limit as number | undefined
  if (llmsTxtLimit && llmsTxtLimit > 0) {
    features.push({ text: `llms.txt — ${llmsTxtLimit} generation${llmsTxtLimit === 1 ? '' : 's'}/month`, included: true })
  } else {
    features.push({ text: 'llms.txt generation', included: false })
  }
  if (citationLimit && citationLimit > 0) {
    features.push({ text: `AI citation checks — ${citationLimit}/month`, included: true })
  } else {
    features.push({ text: 'AI citation checks', included: false })
  }

  // API access — hidden until API feature is ready for public listing
  // features.push({ text: 'API access', included: plan.has_api_access })

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
    const savings = Math.round(((monthlyPence * 12 - annualPence) / (monthlyPence * 12)) * 100)
    return {
      amount: `\u00A3${annualGbp.toFixed(2)}`,
      period: '/year',
      note: savings > 0 ? `Save ${savings}% vs monthly` : undefined,
    }
  }

  const monthlyGbp = monthlyPence / 100
  return { amount: `\u00A3${monthlyGbp.toFixed(2)}`, period: '/month' }
}

function getPlanCta(plan: Plan, isCurrent: boolean, isHigherTier: boolean): string {
  if (isCurrent) return 'Current Plan'
  if (plan.slug === 'free') return 'Current Plan'
  if (isHigherTier) return 'Upgrade'
  return 'Switch Plan'
}

export function PricingTable({ plans, currentPlanSlug, creditBalancePence = 0 }: Props): React.ReactElement {
  const [isPending, startTransition] = useTransition()
  const [isPortalPending, startPortalTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isAnnual, setIsAnnual] = useState(true)

  const directPlans = plans.filter(p => p.type === 'direct')

  // Determine the index of the current plan for upgrade/downgrade logic
  const currentPlanIndex = directPlans.findIndex(p => p.slug === currentPlanSlug)
  const effectiveCurrentIndex = currentPlanIndex >= 0 ? currentPlanIndex : 0 // Free if no subscription

  function handleOpenPortal(): void {
    setError(null)
    startPortalTransition(async () => {
      try {
        const res = await fetch('/api/v1/billing/portal', { method: 'POST' })
        const data: { url?: string; error?: string } = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          setError(data.error || 'Could not open billing portal. Please try again.')
        }
      } catch {
        setError('Something went wrong. Please check your connection and try again.')
      }
    })
  }

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
                <div>
                  <div className="pricing-card-current-label">{'\u2713'} You&apos;re on this plan</div>
                  {!isFree && (
                    <button
                      className="btn btn-ghost btn-full"
                      style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}
                      onClick={handleOpenPortal}
                      disabled={isPortalPending}
                    >
                      {isPortalPending ? 'Opening...' : 'Cancel subscription'}
                    </button>
                  )}
                </div>
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
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

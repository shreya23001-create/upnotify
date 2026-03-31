'use client'

import { useTransition } from 'react'
import type { Plan } from '@/lib/types'

interface Props {
  plans: Plan[]
  currentPlanSlug?: string
}

export function PricingTable({ plans, currentPlanSlug }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubscribe(planSlug: string, billingCycle: string): void {
    startTransition(async () => {
      const res = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug, billingCycle }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    })
  }

  return (
    <div className="pricing-grid">
      {plans.filter(p => p.type === 'direct').map(plan => {
        const isCurrent = plan.slug === currentPlanSlug
        const monthlyPrice = plan.price_monthly_gbp / 100
        const annualPrice = plan.price_annual_gbp ? plan.price_annual_gbp / 100 : null
        const isUsageBased = plan.slug === 'usage-based'

        return (
          <div key={plan.id} className={`pricing-card ${isCurrent ? 'pricing-card-current' : ''}`}>
            {isCurrent && <div className="pricing-card-badge">Current Plan</div>}
            <div className="pricing-card-name">{plan.name}</div>
            <div className="pricing-card-price">
              {isUsageBased ? (
                <>
                  <span className="pricing-card-amount">&pound;0</span>
                  <span className="pricing-card-period"> + &pound;1/monitor</span>
                </>
              ) : (
                <>
                  <span className="pricing-card-amount">&pound;{monthlyPrice}</span>
                  <span className="pricing-card-period">/month</span>
                </>
              )}
            </div>
            {annualPrice && (
              <div className="pricing-card-annual">&pound;{annualPrice}/year (save 20%)</div>
            )}
            <ul className="pricing-card-features">
              <li>{plan.monitor_limit ? `${plan.monitor_limit} monitors` : 'Unlimited monitors'}</li>
              <li>{plan.check_interval_seconds >= 300 ? `${plan.check_interval_seconds / 60} min checks` : `${plan.check_interval_seconds}s checks`}</li>
              <li>{plan.client_workspace_limit ? `${plan.client_workspace_limit} workspaces` : 'Unlimited workspaces'}</li>
              {plan.has_api_access && <li>{'\u2713'} API access</li>}
              {plan.has_ai_predictive && <li>{'\u2713'} AI predictive alerts</li>}
              {plan.has_status_page_custom_domain && <li>{'\u2713'} Custom status page domain</li>}
              {plan.has_white_label && <li>{'\u2713'} White label</li>}
              {plan.has_voice_calls && <li>{'\u2713'} Voice calls ({plan.voice_call_monthly_limit}/mo)</li>}
            </ul>
            {!isCurrent && !isUsageBased && (
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleSubscribe(plan.slug, 'monthly')}
                  disabled={isPending}
                >
                  {isPending ? 'Loading...' : 'Subscribe Monthly'}
                </button>
                {annualPrice && (
                  <button
                    className="btn btn-secondary btn-full"
                    onClick={() => handleSubscribe(plan.slug, 'annual')}
                    disabled={isPending}
                  >
                    Annual
                  </button>
                )}
              </div>
            )}
            {isCurrent && (
              <div className="pricing-card-current-label">{'\u2713'} You&apos;re on this plan</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

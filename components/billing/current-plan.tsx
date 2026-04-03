'use client'

import { useTransition } from 'react'
import type { Plan, Subscription } from '@/lib/types'

interface Props {
  plan: Plan | null
  subscription: Subscription | null
}

export function CurrentPlan({ plan, subscription }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleManage(): void {
    startTransition(async () => {
      const res = await fetch('/api/v1/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else if (data.error) alert(data.error)
    })
  }

  if (!subscription || !plan) {
    return (
      <div className="card stat-card stat-card-blue">
        <div className="card-content">
          <div className="stat-label">Current Plan</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Free</div>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
            3 monitors, 10-minute checks. Upgrade anytime for more power.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card stat-card stat-card-blue">
      <div className="card-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="stat-label">Current Plan</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
            <span className={`badge ${subscription.status === 'active' ? 'badge-success' : subscription.status === 'trialing' ? 'badge-warning' : 'badge-danger'}`}>
              {subscription.status === 'trialing' ? 'Trial' : subscription.status}
            </span>
            <span style={{ marginLeft: 8, fontSize: 14, color: '#94a3b8', textTransform: 'capitalize' }}>
              {subscription.billing_cycle}
            </span>
            {subscription.status === 'trialing' && subscription.trial_ends_at && (
              <p style={{ fontSize: 13, color: '#f59e0b', marginTop: 8, fontWeight: 500 }}>
                Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString()}
              </p>
            )}
            {subscription.status !== 'trialing' && subscription.current_period_end && (
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          {subscription.status === 'trialing' ? (
            <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
              Upgrade to keep these features
            </span>
          ) : (
            <button className="btn btn-secondary" onClick={handleManage} disabled={isPending}>
              {isPending ? 'Loading...' : 'Manage Subscription'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

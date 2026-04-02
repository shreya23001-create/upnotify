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
            <span className={`badge ${subscription.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
              {subscription.status}
            </span>
            <span style={{ marginLeft: 8, fontSize: 14, color: '#94a3b8', textTransform: 'capitalize' }}>
              {subscription.billing_cycle}
            </span>
            {subscription.current_period_end && (
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          <button className="btn btn-secondary" onClick={handleManage} disabled={isPending}>
            {isPending ? 'Loading...' : 'Manage Subscription'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Plan, Subscription } from '@/lib/types'
import { CancelPlanModal } from './cancel-plan-modal'

interface Props {
  plan: Plan | null
  subscription: Subscription | null
}

export function CurrentPlan({ plan, subscription }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showCancel, setShowCancel] = useState(false)
  const router = useRouter()

  const sub = subscription as unknown as Record<string, unknown> | null
  const isPaused = sub?.status === 'paused'
  const isCancelling = sub?.status === 'cancelling'
  const pauseUntil = sub?.pause_until as string | null
  const currentPeriodEnd = sub?.current_period_end as string | null

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
    <>
      <div className="card stat-card stat-card-blue">
        <div className="card-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Current Plan</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
              <span className={`badge ${subscription.status === 'active' ? 'badge-success' : isPaused ? 'badge-warning' : isCancelling ? 'badge-warning' : 'badge-danger'}`}>
                {isPaused ? 'Paused' : isCancelling ? 'Cancels at period end' : subscription.status}
              </span>
              <span style={{ marginLeft: 8, fontSize: 14, color: '#94a3b8', textTransform: 'capitalize' }}>
                {subscription.billing_cycle}
              </span>
              {isPaused && pauseUntil && (
                <p style={{ fontSize: 13, color: '#f59e0b', marginTop: 8, fontWeight: 500 }}>
                  Paused until {new Date(pauseUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Monitors are not running.
                </p>
              )}
              {isCancelling && currentPeriodEnd && (
                <p style={{ fontSize: 13, color: '#f59e0b', marginTop: 8, fontWeight: 500 }}>
                  Access until {new Date(currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, then moves to Free plan.
                </p>
              )}
              {!isPaused && !isCancelling && subscription.current_period_end && (
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                  Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {isPaused ? (
                <button className="btn btn-primary btn-sm" onClick={() => setShowCancel(true)}>
                  Resume Plan
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={handleManage} disabled={isPending}>
                    {isPending ? 'Loading...' : 'Manage Subscription'}
                  </button>
                  {!isCancelling && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 12, color: 'var(--text-muted)' }}
                      onClick={() => setShowCancel(true)}
                    >
                      Cancel or Pause
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <CancelPlanModal
        planName={plan.name}
        isOpen={showCancel}
        isPaused={isPaused}
        pauseUntil={pauseUntil}
        onClose={() => setShowCancel(false)}
        onComplete={() => router.refresh()}
      />
    </>
  )
}

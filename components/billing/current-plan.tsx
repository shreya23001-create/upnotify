'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Plan, Subscription } from '@/lib/types'
import { CancelPlanModal } from './cancel-plan-modal'

interface Props {
  plan: Plan | null
  subscription: Subscription | null
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function CurrentPlan({ plan, subscription }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showCancel, setShowCancel] = useState(false)
  const router = useRouter()

  const sub = subscription as unknown as Record<string, unknown> | null
  const isPaused    = sub?.status === 'paused'
  const isCancelling = sub?.status === 'cancelling'
  const isTrialing  = sub?.status === 'trialing'
  const isPastDue   = sub?.status === 'past_due'
  const pauseUntil  = sub?.pause_until as string | null
  const periodEnd   = sub?.current_period_end as string | null

  function handleManage(): void {
    startTransition(async () => {
      const res = await fetch('/api/v1/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else if (data.error) alert(data.error)
    })
  }

  /* ── Free / no subscription ── */
  if (!subscription || !plan) {
    return (
      <div className="cp-card">
        <div className="cp-accent" />
        <div className="cp-body">
          <div className="cp-left">
            <div className="cp-plan-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div>
              <div className="cp-plan-name">No plan yet</div>
              <div className="cp-plan-meta">₹149/year per website you monitor</div>
            </div>
          </div>
          <a href="/dashboard/plans" className="btn btn-primary btn-sm">
            Add a Website
          </a>
        </div>
      </div>
    )
  }

  const statusBadgeClass = subscription.status === 'active'
    ? 'cp-badge-active'
    : isPaused || isCancelling ? 'cp-badge-warning'
    : 'cp-badge-danger'

  const statusLabel = isPaused ? 'Paused'
    : isCancelling ? 'Cancels at period end'
    : isPastDue    ? 'Payment failed'
    : subscription.status

  return (
    <>
      <div className="cp-card">
        <div className="cp-accent" />
        <div className="cp-body">
          <div className="cp-left">
            <div className="cp-plan-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div>
              <div className="cp-plan-name">{plan.name}</div>
              <div className="cp-plan-meta">
                <span className={`cp-badge ${statusBadgeClass}`}>{statusLabel}</span>
                <span className="cp-cycle">{subscription.billing_cycle}</span>
              </div>
            </div>
          </div>

          <div className="cp-right">
            {periodEnd && !isPaused && !isCancelling && !isPastDue && (
              <div className="cp-next-billing">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Next billing: {fmt(periodEnd)}
              </div>
            )}
            {isPaused && pauseUntil && (
              <div className="cp-alert-text cp-alert-warn">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Paused until {fmt(pauseUntil)}. Monitors are not running.
              </div>
            )}
            {isCancelling && periodEnd && (
              <div className="cp-alert-text cp-alert-warn">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Access until {fmt(periodEnd)}, then moves to Free.
              </div>
            )}
            {isPastDue && (
              <div className="cp-alert-text cp-alert-danger">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Last payment failed. Update your payment method.
              </div>
            )}
            <div className="cp-actions">
              {isPaused ? (
                <button className="btn btn-primary btn-sm" onClick={() => setShowCancel(true)}>
                  Resume or Cancel
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={handleManage} disabled={isPending}>
                    {isPending
                      ? 'Loading…'
                      : <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Manage Billing</>
                    }
                  </button>
                  {!isCancelling && !isTrialing && (
                    <button className="btn btn-ghost btn-sm cp-cancel-btn" onClick={() => setShowCancel(true)}>
                      Cancel plan
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

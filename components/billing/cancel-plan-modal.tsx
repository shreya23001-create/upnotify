'use client'

import { useState, useEffect } from 'react'

interface CancelPlanModalProps {
  planName: string
  isOpen: boolean
  isPaused: boolean
  pauseUntil?: string | null
  onClose: () => void
  onComplete: () => void
  cancelProvider?: 'stripe' | 'razorpay'
  hasActiveAddons?: boolean
}

const REASONS = [
  { value: 'too_expensive', label: 'Too expensive for my needs' },
  { value: 'not_using', label: 'Not using it enough' },
  { value: 'switching_competitor', label: 'Switching to another tool' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'too_complex', label: 'Too complex to use' },
  { value: 'temporary', label: 'Temporary — I will come back later' },
  { value: 'other', label: 'Other reason' },
]

type Step = 'reason' | 'addon_choice' | 'confirm_cancel' | 'processing' | 'done'

export function CancelPlanModal({ planName, isOpen, isPaused, pauseUntil, onClose, onComplete, cancelProvider = 'stripe', hasActiveAddons = false }: CancelPlanModalProps): React.ReactElement | null {
  const [step, setStep] = useState<Step>('reason')
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [cancelAddonsToo, setCancelAddonsToo] = useState<boolean | null>(null)

  useEffect(() => {
    if (step !== 'confirm_cancel') return
    setCountdown(5)
  }, [step])

  useEffect(() => {
    if (step !== 'confirm_cancel' || countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, step])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('reason')
      setReason('')
      setDetail('')
      setError(null)
      setCancelAddonsToo(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectReason = (): void => {
    if (!reason) return
    setError(null)
    // Razorpay customers with active add-ons need to decide whether
    // cancelling the base plan should also cancel their add-ons.
    setStep(cancelProvider === 'razorpay' && hasActiveAddons ? 'addon_choice' : 'confirm_cancel')
  }

  const handleCancel = async (): Promise<void> => {
    setStep('processing')
    setError(null)
    try {
      const res = cancelProvider === 'razorpay'
        ? await fetch('/api/v1/billing/razorpay/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancelAddons: cancelAddonsToo === true }),
          })
        : await fetch('/api/v1/billing/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'cancel', reason, reasonDetail: detail || undefined }),
          })
      const data = await res.json() as { success?: boolean; error?: string; cancelAt?: string }
      if (data.success) {
        window.location.href = '/dashboard/settings?tab=billing&billing=cancelled'
      } else {
        const msg = data.error ?? 'Something went wrong. Please try again.'
        setError(msg.includes('no payment provider')
          ? 'Your subscription cannot be cancelled automatically. Please contact info@upnotify.com.'
          : msg
        )
        setStep('reason')
      }
    } catch {
      setError('Network error. Please try again.')
      setStep('reason')
    }
  }

  const handleResume = async (): Promise<void> => {
    setStep('processing')
    try {
      const res = await fetch('/api/v1/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (data.success) {
        window.location.href = '/dashboard/settings?tab=billing&billing=portal_return'
      } else {
        setError(data.error ?? 'Something went wrong')
        setStep('reason')
      }
    } catch {
      setError('Network error. Please try again.')
      setStep('reason')
    }
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content popup-content-lg" onClick={e => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>&times;</button>

        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--text-muted)' }}>Processing...</p>
          </div>
        )}

        {/* Resume UI for paused subscriptions — Stripe only (Razorpay has no pause concept) */}
        {step === 'reason' && isPaused && cancelProvider !== 'razorpay' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Subscription Paused</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              Your subscription is paused until{' '}
              <strong>{pauseUntil ? new Date(pauseUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'unknown'}</strong>.
              No charges are being made. Your monitors are paused.
            </p>
            {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => void handleResume()}>Resume Now</button>
              <button className="btn btn-secondary" onClick={() => setStep('confirm_cancel')}>Cancel Permanently</button>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {/* Step 1: Select reason */}
        {step === 'reason' && (!isPaused || cancelProvider === 'razorpay') && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Cancel {planName} Plan</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              We are sorry to see you go. Please tell us why you are canceling so we can improve.
            </p>

            {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13 }}>{error}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {REASONS.map(r => (
                <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${reason === r.value ? 'var(--accent)' : 'var(--border-primary)'}`, cursor: 'pointer', background: reason === r.value ? 'rgba(59,130,246,0.04)' : undefined }}>
                  <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                  <span style={{ fontSize: 14 }}>{r.label}</span>
                </label>
              ))}
            </div>

            {reason === 'other' && (
              <textarea
                className="form-input"
                placeholder="Please tell us more..."
                value={detail}
                onChange={e => setDetail(e.target.value)}
                rows={3}
                style={{ marginBottom: 16 }}
              />
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" onClick={handleSelectReason} disabled={!reason}>Continue</button>
              <button className="btn btn-secondary" onClick={onClose}>Keep My Plan</button>
            </div>
          </div>
        )}

        {/* Step 1.5 (Razorpay + active add-ons only): choose whether to cancel add-ons too */}
        {step === 'addon_choice' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>What about your Add On Plan?</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              You have at least one active <strong>Add On Plan</strong> on top of your {planName} plan. Do you want to cancel your add-ons as well, or keep them running on their own?
            </p>

            {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13 }}>{error}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${cancelAddonsToo === true ? 'var(--accent)' : 'var(--border-primary)'}`, cursor: 'pointer' }}>
                <input type="radio" name="addonChoice" checked={cancelAddonsToo === true} onChange={() => setCancelAddonsToo(true)} style={{ marginTop: 3 }} />
                <span style={{ fontSize: 14 }}>
                  <strong>Cancel everything</strong> — end my {planName} plan and all Add On Plans at the end of their billing periods.
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${cancelAddonsToo === false ? 'var(--accent)' : 'var(--border-primary)'}`, cursor: 'pointer' }}>
                <input type="radio" name="addonChoice" checked={cancelAddonsToo === false} onChange={() => setCancelAddonsToo(false)} style={{ marginTop: 3 }} />
                <span style={{ fontSize: 14 }}>
                  <strong>Keep my Add On Plan(s)</strong> — only cancel the {planName} base plan; add-ons keep billing and renewing on their own.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" disabled={cancelAddonsToo === null} onClick={() => setStep('confirm_cancel')}>Continue</button>
              <button className="btn btn-secondary" onClick={() => setStep('reason')}>Go Back</button>
            </div>
          </div>
        )}

        {/* Step 2: Confirm cancel */}
        {step === 'confirm_cancel' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>Confirm Cancellation</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Your plan will remain active until the end of your current billing period. After that, you will be moved to the <strong>Free plan</strong>:
            </p>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 13, lineHeight: 1.8 }}>
              <div><strong>Monitors:</strong> limited to 3 (excess will be paused)</div>
              <div><strong>Check interval:</strong> 10 minutes only</div>
              <div><strong>Alerts:</strong> email only (Slack, Teams, webhooks disabled)</div>
              <div><strong>Status pages:</strong> unpublished</div>
              <div><strong>AI reports:</strong> not available</div>
              <div><strong>API access:</strong> not available</div>
            </div>
            {hasActiveAddons && cancelProvider === 'razorpay' && cancelAddonsToo !== null && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {cancelAddonsToo
                  ? 'Your Add On Plan(s) will also be cancelled at the end of their billing periods.'
                  : 'Your Add On Plan(s) will keep running and billing independently.'}
              </p>
            )}
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Your data will not be deleted. You can upgrade again at any time.
            </p>
            {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" disabled={countdown > 0} onClick={() => void handleCancel()}>
                {countdown > 0 ? `Wait ${countdown}s…` : 'Cancel My Subscription'}
              </button>
              <button className="btn btn-secondary" onClick={() => setStep(cancelProvider === 'razorpay' && hasActiveAddons ? 'addon_choice' : 'reason')}>Go Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

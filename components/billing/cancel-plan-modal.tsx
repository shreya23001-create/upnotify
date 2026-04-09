'use client'

import { useState, useEffect } from 'react'

interface CancelPlanModalProps {
  planName: string
  isOpen: boolean
  isPaused: boolean
  pauseUntil?: string | null
  onClose: () => void
  onComplete: () => void
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

type Step = 'reason' | 'pause_offer' | 'confirm_cancel' | 'confirm_pause' | 'processing' | 'done'

export function CancelPlanModal({ planName, isOpen, isPaused, pauseUntil, onClose, onComplete }: CancelPlanModalProps): React.ReactElement | null {
  const [step, setStep] = useState<Step>('reason')
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (step !== 'confirm_cancel' && step !== 'confirm_pause') return
    setCountdown(5)
  }, [step])

  useEffect(() => {
    if ((step !== 'confirm_cancel' && step !== 'confirm_pause') || countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, step])

  if (!isOpen) return null

  const handleSelectReason = (): void => {
    if (!reason) return
    if (reason === 'too_expensive') {
      setStep('pause_offer')
    } else {
      setStep('confirm_cancel')
    }
  }

  const handleAction = async (action: 'cancel' | 'pause'): Promise<void> => {
    setStep('processing')
    try {
      const res = await fetch('/api/v1/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, reasonDetail: detail || undefined }),
      })
      const data = await res.json() as { success?: boolean; error?: string; pauseUntil?: string; cancelAt?: string }
      if (data.success) {
        const cancelDateStr = data.cancelAt
          ? new Date(data.cancelAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          : null
        setResult({
          type: 'success',
          text: action === 'pause'
            ? `Your subscription is paused until ${new Date(data.pauseUntil ?? '').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. No charges will be made.`
            : cancelDateStr
              ? `Your subscription will cancel on ${cancelDateStr}. You keep full access until then.`
              : 'Your subscription has been canceled. You are now on the Free plan.',
        })
        setStep('done')
      } else {
        setResult({ type: 'error', text: data.error ?? 'Something went wrong' })
        setStep('reason')
      }
    } catch {
      setResult({ type: 'error', text: 'Network error. Please try again.' })
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
        setResult({ type: 'success', text: 'Your subscription is active again! All monitors have been reactivated.' })
        setStep('done')
      } else {
        setResult({ type: 'error', text: data.error ?? 'Something went wrong' })
      }
    } catch {
      setResult({ type: 'error', text: 'Network error. Please try again.' })
    }
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content popup-content-lg" onClick={e => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>&times;</button>

        {step === 'done' && result && (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{result.type === 'success' ? '\u2705' : '\u274C'}</div>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>{result.text}</p>
            <button className="btn btn-primary" onClick={() => { onClose(); onComplete() }}>Close</button>
          </div>
        )}

        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--text-muted)' }}>Processing...</p>
          </div>
        )}

        {/* Resume UI for paused subscriptions */}
        {step === 'reason' && isPaused && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Subscription Paused</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              Your subscription is paused until{' '}
              <strong>{pauseUntil ? new Date(pauseUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'unknown'}</strong>.
              No charges are being made. Your monitors are paused.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleResume}>Resume Now</button>
              <button className="btn btn-secondary" onClick={() => setStep('confirm_cancel')}>Cancel Permanently</button>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
            {result?.type === 'error' && <p style={{ color: '#ef4444', marginTop: 12, fontSize: 13 }}>{result.text}</p>}
          </div>
        )}

        {/* Step 1: Select reason */}
        {step === 'reason' && !isPaused && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Cancel {planName} Plan</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              We are sorry to see you go. Please tell us why you are canceling so we can improve.
            </p>

            {result?.type === 'error' && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13 }}>{result.text}</p>}

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

        {/* Step 2: Pause offer (for cost concern) */}
        {step === 'pause_offer' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>How about a pause instead?</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              We understand cost is a concern. Instead of canceling, you can <strong>pause your subscription for up to 3 months</strong>. During the pause:
            </p>
            <ul style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20, marginBottom: 16 }}>
              <li><strong>No charges</strong> — billing is completely stopped</li>
              <li><strong>Data preserved</strong> — all monitors, settings, and history kept</li>
              <li><strong>Resume anytime</strong> — one click to reactivate everything</li>
              <li><strong>Auto-resumes</strong> — after 3 months, or whenever you are ready</li>
              <li><strong>Reminders</strong> — we will notify you 14 days and 3 days before billing resumes</li>
            </ul>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setStep('confirm_pause')}>
                Pause for 3 Months
              </button>
              <button className="btn btn-danger" onClick={() => setStep('confirm_cancel')}>
                No, Cancel Permanently
              </button>
              <button className="btn btn-ghost" onClick={onClose}>Keep My Plan</button>
            </div>
          </div>
        )}

        {/* Step 3a: Confirm pause */}
        {step === 'confirm_pause' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Confirm Pause</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              Your subscription will be paused for 3 months. During this time, your monitors will stop running and no alerts will be sent. Your data and settings will be preserved.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" disabled={countdown > 0} onClick={() => handleAction('pause')}>
                {countdown > 0 ? `Wait ${countdown}s...` : 'Confirm Pause'}
              </button>
              <button className="btn btn-secondary" onClick={() => setStep('reason')}>Go Back</button>
            </div>
          </div>
        )}

        {/* Step 3b: Confirm cancel */}
        {step === 'confirm_cancel' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>Confirm Cancellation</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              When you cancel, you will be moved to the <strong>Free plan</strong>. Here is what changes:
            </p>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 13, lineHeight: 1.8 }}>
              <div><strong>Monitors:</strong> limited to 3 (excess will be paused)</div>
              <div><strong>Check interval:</strong> 10 minutes only</div>
              <div><strong>Alerts:</strong> email only (Slack, Teams, webhooks disabled)</div>
              <div><strong>Status pages:</strong> unpublished</div>
              <div><strong>AI reports:</strong> not available</div>
              <div><strong>API access:</strong> not available</div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Your data will not be deleted. You can upgrade again at any time.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" disabled={countdown > 0} onClick={() => handleAction('cancel')}>
                {countdown > 0 ? `Wait ${countdown}s...` : 'Cancel My Subscription'}
              </button>
              <button className="btn btn-secondary" onClick={() => setStep('reason')}>Go Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

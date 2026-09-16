'use client'

import { useState } from 'react'

// ─── Mock Razorpay Modal (dev/staging only — remove when real keys are set) ────
// Shared between pricing-table.tsx (new subscriptions) and current-plan.tsx
// (Add On Plan purchases) so both checkout flows render the same test modal.

export interface MockCheckoutData {
  subscriptionId: string
  planSlug: string
  planName: string
  billingCycle: 'monthly' | 'annual'
  amountPaise: number
  userEmail: string
  orgName: string
  /** Website count for a 'website' planSlug purchase — required for the
   *  simulate route to activate the right number of purchased slots. */
  quantity?: number
  /** Where to send the browser after a simulated success. Defaults to the
   *  legacy org-wide-plan billing settings page for other checkout flows. */
  redirectOnSuccess?: string
}

export function MockRazorpayModal({
  data,
  onClose,
}: {
  data: MockCheckoutData
  onClose: () => void
}): React.ReactElement {
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountInr = (data.amountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })
  const label = data.billingCycle === 'annual' ? 'year' : 'month'

  async function handlePay(outcome: 'success' | 'fail'): Promise<void> {
    setIsPaying(true)
    setError(null)
    try {
      const res = await fetch('/api/dev/razorpay/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: data.subscriptionId,
          planSlug:       data.planSlug,
          billingCycle:   data.billingCycle,
          amountPaise:    data.amountPaise,
          quantity:       data.quantity,
          outcome,
        }),
      })
      const result = await res.json() as { success: boolean; message?: string; error?: string }
      if (result.success) {
        window.location.href = data.redirectOnSuccess ?? '/dashboard/settings?tab=billing&billing=success'
      } else {
        setError(result.message ?? result.error ?? 'Payment failed (simulated)')
        setIsPaying(false)
      }
    } catch {
      setError('Something went wrong')
      setIsPaying(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 8, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
      }}>
        {/* Header — Razorpay orange */}
        <div style={{ background: '#528FF0', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              background: '#fff', borderRadius: 4, padding: '3px 8px',
              fontSize: 11, fontWeight: 700, color: '#528FF0', letterSpacing: 0.5,
            }}>
              TEST MODE
            </div>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              Razorpay checkout simulation
            </span>
          </div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
            ₹{amountInr}
            <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>/ {label}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>
            {data.planName} · {data.billingCycle === 'annual' ? 'Annual' : 'Monthly'} · incl. 18% GST
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16, fontSize: 13, color: '#555' }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: '#222' }}>Payment details</div>
            <div style={{ padding: '10px 12px', background: '#f5f7fa', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Email: <strong>{data.userEmail}</strong></div>
              <div>Organisation: <strong>{data.orgName}</strong></div>
              <div>Subscription ID: <code style={{ fontSize: 11 }}>{data.subscriptionId}</code></div>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
              padding: '10px 12px', fontSize: 13, color: '#dc2626', marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <button
            onClick={() => void handlePay('success')}
            disabled={isPaying}
            style={{
              width: '100%', padding: '12px 0', background: '#528FF0',
              color: '#fff', border: 'none', borderRadius: 6,
              fontSize: 15, fontWeight: 600, cursor: isPaying ? 'not-allowed' : 'pointer',
              opacity: isPaying ? 0.7 : 1, marginBottom: 8,
            }}
          >
            {isPaying ? 'Processing…' : `Pay ₹${amountInr} (Simulated)`}
          </button>

          <button
            onClick={() => void handlePay('fail')}
            disabled={isPaying}
            style={{
              width: '100%', padding: '10px 0', background: '#fff',
              color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6,
              fontSize: 13, fontWeight: 500, cursor: isPaying ? 'not-allowed' : 'pointer',
              marginBottom: 8,
            }}
          >
            Simulate Payment Failure
          </button>

          <button
            onClick={onClose}
            disabled={isPaying}
            style={{
              width: '100%', padding: '8px 0', background: 'transparent',
              color: '#888', border: 'none', fontSize: 13,
              cursor: isPaying ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Razorpay checkout helper ─────────────────────────────────────────────────

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(script)
  })
}

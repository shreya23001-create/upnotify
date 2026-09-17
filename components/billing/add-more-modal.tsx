'use client'

import { useState, useCallback, useMemo } from 'react'
import { X, Sparkles, ArrowRight } from 'lucide-react'
import { MockRazorpayModal, type MockCheckoutData, loadRazorpayScript } from './razorpay-checkout-modal'

const ORIGINAL_PRICE_PER_WEBSITE_INR = 1788 // ₹149/month × 12
const DISCOUNTED_PRICE_PER_WEBSITE_INR = 999
const GST_RATE = 0.18

function fmtMoney(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
}

interface Props {
  currentLimit: number
  onClose: () => void
}

/**
 * "Add More" — buy additional website capacity on top of an already-active
 * Pro Plan. Always a fresh, independent purchase (its own
 * website_subscriptions row, domains: []) charged only for the ADDITIONAL
 * quantity — never the org's new total — so existing capacity/domains are
 * never touched or re-charged. Reuses the exact same checkout/confirm
 * endpoints as the first-purchase flow.
 */
export function AddMoreModal({ currentLimit, onClose }: Props): React.ReactElement {
  const [quantity, setQuantity] = useState<number>(1)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mockCheckout, setMockCheckout] = useState<MockCheckoutData | null>(null)

  const pricing = useMemo(() => {
    const originalTotal = ORIGINAL_PRICE_PER_WEBSITE_INR * quantity
    const discountedTotal = DISCOUNTED_PRICE_PER_WEBSITE_INR * quantity
    const gst = Math.round(discountedTotal * GST_RATE * 100) / 100
    const finalTotal = Math.round((discountedTotal + gst) * 100) / 100
    return { originalTotal, discountedTotal, gst, finalTotal }
  }, [quantity])

  function decrementQuantity(): void {
    setQuantity(q => Math.max(1, q - 1))
  }

  function incrementQuantity(): void {
    setQuantity(q => q + 1)
  }

  function handleQuantityInput(e: React.ChangeEvent<HTMLInputElement>): void {
    const n = parseInt(e.target.value, 10)
    setQuantity(Number.isFinite(n) && n >= 1 ? n : 1)
  }

  const handleCheckout = useCallback(async (): Promise<void> => {
    if (quantity < 1) {
      setError('Enter at least 1 website')
      return
    }
    setError(null)
    setIsPending(true)
    try {
      const res = await fetch('/api/v1/billing/razorpay/website-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })
      const data = await res.json() as {
        subscriptionId?: string
        keyId?: string
        planName?: string
        amountPaise?: number
        userEmail?: string
        orgName?: string
        mockMode?: boolean
        error?: string
      }
      if (!res.ok || !data.subscriptionId) {
        setError(data.error ?? 'Failed to start checkout. Please try again.')
        setIsPending(false)
        return
      }

      if (data.mockMode) {
        setMockCheckout({
          subscriptionId: data.subscriptionId,
          planSlug: 'website',
          planName: data.planName ?? 'Pro Plan',
          billingCycle: 'annual',
          amountPaise: data.amountPaise ?? 0,
          userEmail: data.userEmail ?? '',
          orgName: data.orgName ?? '',
          quantity,
          redirectOnSuccess: '/dashboard/plans?added=1',
        })
        setIsPending(false)
        return
      }

      await loadRazorpayScript()
      const isTestKey = (data.keyId ?? '').startsWith('rzp_test_')
      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: 'Upnotify',
        description: isTestKey
          ? `${data.planName ?? 'Pro Plan'} · TEST MODE — Use card: 5267 3181 8797 5449 (Razorpay test Mastercard)`
          : `${data.planName ?? 'Pro Plan'} · Yearly (incl. 18% GST)`,
        image: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://upnotify-monitoring.vercel.app'}/Logo_2.png`,
        prefill: { email: data.userEmail ?? '', name: data.orgName ?? '' },
        theme: { color: '#FBA830' },
        handler: (response: unknown) => {
          void (async () => {
            const r = response as { razorpay_payment_id?: string; razorpay_subscription_id?: string; razorpay_signature?: string }
            try {
              await fetch('/api/v1/billing/razorpay/website-confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpaySubscriptionId: r.razorpay_subscription_id ?? data.subscriptionId,
                  razorpayPaymentId: r.razorpay_payment_id,
                  razorpaySignature: r.razorpay_signature,
                }),
              })
            } catch {
              // Non-fatal — the webhook (once configured) is still the primary path.
            }
            window.location.href = '/dashboard/plans?added=1'
          })()
        },
        modal: {
          ondismiss: () => { setIsPending(false) },
        },
      })
      rzp.open()
    } catch {
      setError('Something went wrong. Please try again.')
      setIsPending(false)
    }
  }, [quantity])

  return (
    <div className="modal-overlay" onClick={isPending ? undefined : onClose}>
      <div className="modal-box add-more-modal" onClick={e => e.stopPropagation()}>
        {mockCheckout && (
          <MockRazorpayModal
            data={mockCheckout}
            onClose={() => { setMockCheckout(null); setIsPending(false) }}
          />
        )}

        <div className="modal-header add-more-header">
          <div className="add-more-header-icon"><Sparkles size={16} strokeWidth={2.25} /></div>
          <div className="add-more-header-text">
            <span className="modal-title">Add More Websites</span>
            <div className="add-more-header-sub">Expand your Pro Plan capacity</div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={isPending} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="add-more-capacity-card">
            <div className="add-more-current">
              <span className="add-more-current-label">Current Count of Websites</span>
              <span className="add-more-current-value">{currentLimit} website{currentLimit === 1 ? '' : 's'}</span>
            </div>

            <div className="add-more-field-label">Additional websites</div>
            <div className="pro-plan-quantity-stepper add-more-stepper">
              <button type="button" className="pro-plan-qty-btn" onClick={decrementQuantity} disabled={isPending || quantity <= 1} aria-label="Decrease">−</button>
              <input
                type="number"
                min={1}
                step={1}
                className="pro-plan-qty-input"
                value={quantity}
                onChange={handleQuantityInput}
                disabled={isPending}
              />
              <button type="button" className="pro-plan-qty-btn" onClick={incrementQuantity} disabled={isPending} aria-label="Increase">+</button>
              <span className="pro-plan-qty-label">website{quantity === 1 ? '' : 's'}</span>
            </div>
          </div>

          <div className="pro-plan-summary">
            <div className="pro-plan-summary-row">
              <span>Subtotal ({quantity} × ₹{fmtMoney(ORIGINAL_PRICE_PER_WEBSITE_INR)}/year)</span>
              <span className="pro-plan-summary-strike">₹{fmtMoney(pricing.originalTotal)}</span>
            </div>
            <div className="pro-plan-summary-row">
              <span>Discounted</span>
              <span className="pro-plan-summary-discounted">₹{fmtMoney(pricing.discountedTotal)}</span>
            </div>
            <div className="pro-plan-summary-row">
              <span>GST (18%)</span>
              <span>₹{fmtMoney(pricing.gst)}</span>
            </div>
            <div className="pro-plan-summary-row pro-plan-summary-total">
              <span>Total</span>
              <span>₹{fmtMoney(pricing.finalTotal)}</span>
            </div>
          </div>

          {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button
            className="btn btn-primary pro-plan-cta"
            onClick={() => void handleCheckout()}
            disabled={isPending || quantity < 1}
          >
            {isPending ? 'Processing…' : <>Continue to Payment — ₹{fmtMoney(pricing.finalTotal)} <ArrowRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}

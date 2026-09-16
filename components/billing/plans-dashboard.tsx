'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Globe, Lock, Radio, Search, CalendarClock, Zap,
  Ban, Sparkles, ShieldCheck as ShieldIcon, Zap as ZapIcon, CheckCircle2,
  ArrowRight, Plus, Plug, Wifi, HeartPulse,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Invoice } from '@/lib/types'
import type { WebsiteSubscription } from '@/lib/db/subscriptions'
import { MockRazorpayModal, type MockCheckoutData, loadRazorpayScript } from './razorpay-checkout-modal'
import { AddMoreModal } from './add-more-modal'

// Curated, representative subset of the real 23-type monitor engine — kept
// to a fixed count so the "what's included" list fits in a compact grid
// without scrolling. Not the full list; see lib/constants/monitor-types.ts.
const FEATURE_HIGHLIGHTS: { icon: LucideIcon; label: string }[] = [
  { icon: Globe, label: 'HTTP/HTTPS Uptime' },
  { icon: Lock, label: 'SSL Certificate' },
  { icon: Radio, label: 'DNS Records' },
  { icon: Search, label: 'Keyword Detection' },
  { icon: CalendarClock, label: 'Domain Expiry' },
  { icon: Plug, label: 'Port Check' },
  { icon: Wifi, label: 'Ping / Reachability' },
  { icon: HeartPulse, label: 'Heartbeat Monitor' },
  { icon: Zap, label: 'API Endpoint' },
  { icon: ShieldIcon, label: 'Security Headers' },
  { icon: Ban, label: 'Blacklist Check' },
]

const ORIGINAL_PRICE_PER_WEBSITE_INR = 1788 // ₹149/month × 12
const DISCOUNTED_PRICE_PER_WEBSITE_INR = 999
const GST_RATE = 0.18

interface DomainSummary {
  domain: string
  monitorCount: number
  monitorTypes: string[]
}

export interface WebsiteRow {
  subscription: WebsiteSubscription
  perDomain: DomainSummary[]
  invoices: Invoice[]
}

interface Props {
  rows: WebsiteRow[]
  isGrandfathered: boolean
  slotUsage: { limit: number; used: number; remaining: number }
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
}

function statusLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'active': return { text: 'Active', className: 'plans-badge-active' }
    case 'cancelling': return { text: 'Cancels at period end', className: 'plans-badge-warn' }
    case 'past_due': return { text: 'Payment failed', className: 'plans-badge-danger' }
    case 'canceled': return { text: 'Cancelled', className: 'plans-badge-muted' }
    default: return { text: status, className: 'plans-badge-muted' }
  }
}

export function PlansDashboard({ rows, isGrandfathered, slotUsage }: Props): React.ReactElement {
  const [quantity, setQuantity] = useState<number>(1)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mockCheckout, setMockCheckout] = useState<MockCheckoutData | null>(null)
  const [showAddMore, setShowAddMore] = useState(false)
  const searchParams = useSearchParams()
  const [successDismissed, setSuccessDismissed] = useState(false)
  const showSuccess = searchParams.get('added') === '1' && !successDismissed

  const pricing = useMemo(() => {
    const originalTotal = ORIGINAL_PRICE_PER_WEBSITE_INR * quantity
    const discountedTotal = DISCOUNTED_PRICE_PER_WEBSITE_INR * quantity
    const gst = Math.round(discountedTotal * GST_RATE * 100) / 100
    const finalTotal = Math.round((discountedTotal + gst) * 100) / 100
    const savings = originalTotal - discountedTotal
    return { originalTotal, discountedTotal, gst, finalTotal, savings }
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
          redirectOnSuccess: '/dashboard/monitors?purchased=1',
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
        image: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://upnotify-monitoring.vercel.app'}/logo.svg`,
        prefill: { email: data.userEmail ?? '', name: data.orgName ?? '' },
        theme: { color: '#FBA830' },
        handler: (response: unknown) => {
          void (async () => {
            // Client-verified activation fallback — see website-confirm's
            // docstring. The webhook, once configured on a real domain,
            // will independently reach the same result; this just means
            // testing (localhost / Vercel preview) doesn't have to wait
            // on that setup to see the subscription go active.
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
              // Non-fatal — the webhook (once configured) is still the
              // primary path; worst case the customer sees "pending" a
              // moment longer and can refresh.
            }
            window.location.href = '/dashboard/monitors?purchased=1'
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

  const hasActiveCapacity = !isGrandfathered && slotUsage.limit > 0

  return (
    <div className="plans-page">
      {mockCheckout && (
        <MockRazorpayModal
          data={mockCheckout}
          onClose={() => { setMockCheckout(null); setIsPending(false) }}
        />
      )}

      {showAddMore && (
        <AddMoreModal currentLimit={slotUsage.limit} onClose={() => setShowAddMore(false)} />
      )}

      {showSuccess && (
        <div className="modal-overlay" onClick={() => setSuccessDismissed(true)}>
          <div className="modal-box plans-success-box" onClick={e => e.stopPropagation()}>
            <div className="plans-success-icon"><CheckCircle2 size={40} strokeWidth={1.75} /></div>
            <div className="plans-success-title">Payment Successful</div>
            <div className="plans-success-sub">
              Your Pro Plan is now active — {slotUsage.limit} website{slotUsage.limit === 1 ? '' : 's'} available.
            </div>
            <Link href="/dashboard/monitors" className="btn btn-primary pro-plan-cta">
              Continue to Monitors <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {isGrandfathered && (
        <div className="plans-grandfathered-banner">
          You&apos;re on an existing plan (Pre Plan / Pro Plan) that already covers your monitors. The Pro Plan below is only needed for additional websites outside that plan.
        </div>
      )}

      {hasActiveCapacity ? (
        <div className="plans-active-summary">
          <div className="plans-active-summary-left">
            <div className="plans-active-badge"><Sparkles size={12} strokeWidth={2.5} /> PRO PLAN</div>
            <div className="plans-active-title">Active <CheckCircle2 size={18} className="plans-active-check" /></div>
            <div className="plans-active-meta">
              <strong>{slotUsage.limit}</strong> website{slotUsage.limit === 1 ? '' : 's'} · Annual subscription
              {slotUsage.used < slotUsage.limit && (
                <span className="plans-active-remaining"> · {slotUsage.remaining} slot{slotUsage.remaining === 1 ? '' : 's'} unused</span>
              )}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddMore(true)}>
            <Plus size={15} /> Add More
          </button>
        </div>
      ) : (
        <div className="plans-hero">
          <div className="plans-hero-badge"><Sparkles size={12} strokeWidth={2.5} /> PRO</div>
          <div className="plans-hero-title">Powerful monitoring for your websites</div>
        </div>
      )}

      {!hasActiveCapacity && (
        <div className="pro-plan-columns">
          <div className="pro-plan-card pro-plan-col-left">
            <div className="pro-plan-badge"><ZapIcon size={11} strokeWidth={2.5} /> Best Value</div>
            <div className="pro-plan-name">Pro Plan</div>
            <div className="pro-plan-tagline">Everything included. One simple price per website.</div>

            <div className="plans-included-title">What&apos;s included</div>
            <div className="plans-feature-grid">
              {FEATURE_HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <div key={label} className="plans-feature-item">
                  <Icon size={14} strokeWidth={2} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pro-plan-card pro-plan-col-right">
            <div className="pro-plan-section-header">
              <div>
                <div className="pro-plan-section-title">How many websites?</div>
                <div className="pro-plan-section-sub">
                  {slotUsage.used > 0
                    ? `You already have ${slotUsage.used} website${slotUsage.used === 1 ? '' : 's'} on a purchased plan.`
                    : "You'll name your websites after purchase."}
                </div>
              </div>
              <span className="plans-billed-yearly-badge">Billed Yearly</span>
            </div>

            <div className="pro-plan-pricing-table">
              <div className="pro-plan-pricing-table-row">
                <div className="pro-plan-pricing-col">
                  <span className="pro-plan-pricing-col-label">No. of Websites</span>
                  <div className="pro-plan-quantity-stepper">
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
                  </div>
                </div>
                <div className="pro-plan-pricing-col">
                  <span className="pro-plan-pricing-col-label">In Just</span>
                  <div className="pro-plan-pricing-inline">
                    <span className="pro-plan-price-original">₹149</span>
                    <span className="pro-plan-price-discounted-sm">₹99<span className="pro-plan-price-unit">/mo</span></span>
                  </div>
                </div>
                <div className="pro-plan-pricing-col pro-plan-pricing-col-price">
                  <span className="pro-plan-pricing-col-label">Price</span>
                  <span className="pro-plan-price-discounted">₹{fmtMoney(pricing.discountedTotal)}<span className="pro-plan-price-unit">/year</span></span>
                </div>
              </div>
            </div>

            {pricing.savings > 0 && (
              <div className="plans-savings-badge">
                <Sparkles size={12} strokeWidth={2.5} /> You save ₹{fmtMoney(pricing.savings)} with the Pro offer
              </div>
            )}

            <div className="pro-plan-summary">
              <div className="pro-plan-summary-title">Your Subscription</div>
              <div className="pro-plan-summary-row">
                <span>Pro Plan — {quantity} website{quantity === 1 ? '' : 's'}</span>
                <span className="pro-plan-summary-strike">₹{fmtMoney(pricing.originalTotal)}</span>
              </div>
              <div className="pro-plan-summary-row">
                <span>Your discount</span>
                <span className="pro-plan-summary-discounted">−₹{fmtMoney(pricing.savings)}</span>
              </div>
              <div className="pro-plan-summary-row">
                <span>GST (18%)</span>
                <span>₹{fmtMoney(pricing.gst)}</span>
              </div>
              <div className="pro-plan-summary-row pro-plan-summary-total">
                <span>Total Payable</span>
                <span>₹{fmtMoney(pricing.finalTotal)}</span>
              </div>
            </div>

            {error && <p className="form-error" style={{ marginBottom: 10 }}>{error}</p>}

            <button
              className="btn btn-primary pro-plan-cta"
              onClick={() => void handleCheckout()}
              disabled={isPending || quantity < 1}
            >
              {isPending ? 'Processing Payment…' : <>Buy Now <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="plans-list">
          <div className="plans-header-sub">Active subscriptions</div>
          {rows.map(row => {
            const status = statusLabel(row.subscription.status)
            const perDomainYearly = Math.round(DISCOUNTED_PRICE_PER_WEBSITE_INR * (1 + GST_RATE) * 100) / 100
            const yearlyTotal = Math.round(row.subscription.domains.length * perDomainYearly * 100) / 100
            return (
              <div key={row.subscription.id} className="plans-list-item">
                <div className="plans-list-main">
                  <div>
                    <div className="plans-list-meta">
                      <span className={`plans-badge ${status.className}`}>{status.text}</span>
                      <span>₹{fmtMoney(yearlyTotal)}/year total (incl. GST)</span>
                      <span>
                        {row.subscription.status === 'canceled'
                          ? `Ended ${fmtDate(row.subscription.canceled_at)}`
                          : `Renews ${fmtDate(row.subscription.current_period_end)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="plans-website-price-list">
                  {row.subscription.domains.map(d => (
                    <div key={d} className="plans-website-price-row">
                      <span className="plans-domain-pill">{d}</span>
                      <span>₹{fmtMoney(perDomainYearly)}/year</span>
                    </div>
                  ))}
                </div>

                <div className="plans-list-invoices">
                  {row.invoices.length === 0 ? (
                    <span className="plans-no-invoice">No invoice yet</span>
                  ) : (
                    row.invoices.map(inv => (
                      <div key={inv.id} className="plans-invoice-row">
                        <span>₹{((inv.amount_gbp ?? 0) / 100).toFixed(2)}</span>
                        <span>{fmtDate(inv.created_at)}</span>
                        <span className={`plans-badge ${inv.status === 'paid' ? 'plans-badge-active' : 'plans-badge-muted'}`}>{inv.status}</span>
                        <Link href={`/dashboard/billing/invoice/${inv.id}`} className="btn btn-secondary btn-sm">
                          Generate Invoice
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

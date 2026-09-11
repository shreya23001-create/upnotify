'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Globe, Lock, Radio, Search, CalendarClock, Plug, Wifi, Zap, HeartPulse,
  Eye, ShieldCheck, Timer, Bot, MapPin, Mail, Landmark, Map, Link2,
  MailCheck, Ban, Package, Cookie, Network, Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Invoice } from '@/lib/types'
import type { WebsiteSubscription } from '@/lib/db/subscriptions'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'
import { MockRazorpayModal, type MockCheckoutData, loadRazorpayScript } from './razorpay-checkout-modal'

const MONITOR_TYPE_ICONS: Record<string, LucideIcon> = {
  http: Globe, ssl: Lock, dns: Radio, keyword: Search, domain: CalendarClock,
  port: Plug, ping: Wifi, api: Zap, heartbeat: HeartPulse, competitor: Eye,
  'security-headers': ShieldCheck, 'response-time': Timer, 'robots-txt': Bot,
  'ip-change': MapPin, 'mx-health': Mail, 'whois-change': Landmark, sitemap: Map,
  'redirect-chain': Link2, 'spf-dmarc': MailCheck, blacklist: Ban,
  'page-size': Package, 'cookie-consent': Cookie, 'nameserver-change': Network,
}

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

export interface PendingWebsite {
  id: string
  domain: string
}

interface Props {
  rows: WebsiteRow[]
  pendingWebsites: PendingWebsite[]
  isGrandfathered: boolean
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

export function PlansDashboard({ rows, pendingWebsites, isGrandfathered }: Props): React.ReactElement {
  const [selected, setSelected] = useState<Set<string>>(new Set(pendingWebsites.map(w => w.id)))
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mockCheckout, setMockCheckout] = useState<MockCheckoutData | null>(null)

  const selectedCount = selected.size

  const pricing = useMemo(() => {
    const originalTotal = ORIGINAL_PRICE_PER_WEBSITE_INR * selectedCount
    const discountedTotal = DISCOUNTED_PRICE_PER_WEBSITE_INR * selectedCount
    const gst = Math.round(discountedTotal * GST_RATE * 100) / 100
    const finalTotal = Math.round((discountedTotal + gst) * 100) / 100
    return { originalTotal, discountedTotal, gst, finalTotal }
  }, [selectedCount])

  function toggleWebsite(id: string): void {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCheckout = useCallback(async (): Promise<void> => {
    if (selected.size === 0) {
      setError('Select at least one website')
      return
    }
    setError(null)
    setIsPending(true)
    try {
      const selectedIds = Array.from(selected)
      const res = await fetch('/api/v1/billing/razorpay/website-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteSubscriptionIds: selectedIds }),
      })
      const data = await res.json() as {
        subscriptionId?: string
        keyId?: string
        planName?: string
        amountPaise?: number
        userEmail?: string
        orgName?: string
        mockMode?: boolean
        pendingWebsiteIds?: string[]
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
                  pendingWebsiteIds: data.pendingWebsiteIds ?? selectedIds,
                }),
              })
            } catch {
              // Non-fatal — the webhook (once configured) is still the
              // primary path; worst case the customer sees "pending" a
              // moment longer and can refresh.
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
  }, [selected])

  return (
    <div>
      {mockCheckout && (
        <MockRazorpayModal
          data={mockCheckout}
          onClose={() => { setMockCheckout(null); setIsPending(false) }}
        />
      )}

      {isGrandfathered && (
        <div className="plans-grandfathered-banner">
          You&apos;re on an existing plan (Pre Plan / Pro Plan) that already covers your monitors. The Pro Plan below is only needed for additional websites outside that plan.
        </div>
      )}

      {pendingWebsites.length === 0 ? (
        /* Nothing pending — just show the Pro Plan info card, centered,
           no checkout column since there's nothing to select/pay for. */
        <div className="pro-plan-columns pro-plan-columns-centered">
          <div className="pro-plan-card pro-plan-col-solo">
            <div className="pro-plan-badge">Best Value</div>
            <div className="pro-plan-name">Pro Plan</div>
            <div className="pro-plan-tagline">Everything included. One simple price per website.</div>

            <div className="pro-plan-price-row">
              <span className="pro-plan-price-original">₹{fmtMoney(ORIGINAL_PRICE_PER_WEBSITE_INR)}/year</span>
              <span className="pro-plan-price-discounted">₹{fmtMoney(DISCOUNTED_PRICE_PER_WEBSITE_INR)}<span className="pro-plan-price-unit">/website/year</span></span>
            </div>
            <div className="pro-plan-price-sub">Normally ₹149/month per website — billed yearly at a discount.</div>

            <div className="plans-included-monitors">
              {MONITOR_TYPES.filter(mt => mt.type !== 'wordpress').map(mt => {
                const Icon = MONITOR_TYPE_ICONS[mt.type] ?? Globe
                return (
                  <span key={mt.type} className="plans-included-monitor-pill">
                    <Icon size={14} strokeWidth={2} />
                    {mt.name}
                  </span>
                )
              })}
            </div>

            <div className="pro-plan-empty">
              <p>No websites added yet.</p>
              <Link href="/dashboard/websites" className="btn btn-primary">+ Add Websites</Link>
            </div>
          </div>
        </div>
      ) : (
        /* Two-column layout: plan details left, website selection + total right */
        <div className="pro-plan-columns">
          <div className="pro-plan-card pro-plan-col-left">
            <div className="pro-plan-badge">Best Value</div>
            <div className="pro-plan-name">Pro Plan</div>
            <div className="pro-plan-tagline">Everything included. One simple price per website.</div>

            <div className="pro-plan-price-row">
              <span className="pro-plan-price-original">₹{fmtMoney(ORIGINAL_PRICE_PER_WEBSITE_INR)}/year</span>
              <span className="pro-plan-price-discounted">₹{fmtMoney(DISCOUNTED_PRICE_PER_WEBSITE_INR)}<span className="pro-plan-price-unit">/website/year</span></span>
            </div>
            <div className="pro-plan-price-sub">Normally ₹149/month per website — billed yearly at a discount.</div>

            <div className="plans-included-monitors">
              {MONITOR_TYPES.filter(mt => mt.type !== 'wordpress').map(mt => {
                const Icon = MONITOR_TYPE_ICONS[mt.type] ?? Globe
                return (
                  <span key={mt.type} className="plans-included-monitor-pill">
                    <Icon size={14} strokeWidth={2} />
                    {mt.name}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="pro-plan-card pro-plan-col-right">
            <div className="pro-plan-section-header">
              <div>
                <div className="pro-plan-section-title">Websites</div>
                <div className="pro-plan-section-sub">Select which websites to subscribe to</div>
              </div>
              <Link href="/dashboard/websites" className="pro-plan-add-more-link">+ Add more</Link>
            </div>

            <div className="pro-plan-website-list">
              {pendingWebsites.map(w => (
                <label key={w.id} className="pro-plan-website-row">
                  <input
                    type="checkbox"
                    checked={selected.has(w.id)}
                    onChange={() => toggleWebsite(w.id)}
                    disabled={isPending}
                  />
                  <span className="pro-plan-website-check">
                    {selected.has(w.id) && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span>{w.domain}</span>
                </label>
              ))}
            </div>

            <div className="pro-plan-summary">
              <div className="pro-plan-summary-row">
                <span>{selectedCount} website{selectedCount === 1 ? '' : 's'} × ₹{fmtMoney(ORIGINAL_PRICE_PER_WEBSITE_INR)}/year</span>
                <span className="pro-plan-summary-strike">₹{fmtMoney(pricing.originalTotal)}</span>
              </div>
              <div className="pro-plan-summary-row">
                <span>{selectedCount} website{selectedCount === 1 ? '' : 's'} × ₹{fmtMoney(DISCOUNTED_PRICE_PER_WEBSITE_INR)}/year</span>
                <span className="pro-plan-summary-discounted">₹{fmtMoney(pricing.discountedTotal)}</span>
              </div>
              <div className="pro-plan-summary-row">
                <span>18% GST</span>
                <span>₹{fmtMoney(pricing.gst)}</span>
              </div>
              <div className="pro-plan-summary-row pro-plan-summary-total">
                <span>Total (per year)</span>
                <span>₹{fmtMoney(pricing.finalTotal)}</span>
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13 }}>{error}</p>}

            <button
              className="btn btn-primary pro-plan-cta"
              onClick={() => void handleCheckout()}
              disabled={isPending || selectedCount === 0}
            >
              {isPending ? 'Opening…' : `Subscribe — ₹${fmtMoney(pricing.finalTotal)}/year`}
            </button>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="plans-list" style={{ marginTop: 24 }}>
          <div className="plans-header-sub" style={{ marginBottom: 12 }}>Active subscriptions</div>
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

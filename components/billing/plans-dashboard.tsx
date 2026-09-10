'use client'

import { useState, useCallback } from 'react'
import {
  Globe, Lock, Radio, Search, CalendarClock, Plug, Wifi, Zap, HeartPulse,
  Eye, ShieldCheck, Timer, Bot, MapPin, Mail, Landmark, Map, Link2,
  MailCheck, Ban, Package, Cookie, Network,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Invoice } from '@/lib/types'
import type { WebsiteSubscription } from '@/lib/db/subscriptions'
import { getMonitorTypeByType, MONITOR_TYPES } from '@/lib/constants/monitor-types'
import { MockRazorpayModal, type MockCheckoutData, loadRazorpayScript } from './razorpay-checkout-modal'

const MONITOR_TYPE_ICONS: Record<string, LucideIcon> = {
  http: Globe, ssl: Lock, dns: Radio, keyword: Search, domain: CalendarClock,
  port: Plug, ping: Wifi, api: Zap, heartbeat: HeartPulse, competitor: Eye,
  'security-headers': ShieldCheck, 'response-time': Timer, 'robots-txt': Bot,
  'ip-change': MapPin, 'mx-health': Mail, 'whois-change': Landmark, sitemap: Map,
  'redirect-chain': Link2, 'spf-dmarc': MailCheck, blacklist: Ban,
  'page-size': Package, 'cookie-consent': Cookie, 'nameserver-change': Network,
}

const PRICE_PER_WEBSITE_INR = 149

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
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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

function monitorTypeLabel(type: string): string {
  return getMonitorTypeByType(type)?.name ?? type
}

export function PlansDashboard({ rows, isGrandfathered }: Props): React.ReactElement {
  const [showAddModal, setShowAddModal] = useState(false)
  const [targets, setTargets] = useState<string[]>([''])
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mockCheckout, setMockCheckout] = useState<MockCheckoutData | null>(null)

  const nonEmptyTargets = targets.map(t => t.trim()).filter(Boolean)
  const total = nonEmptyTargets.length * PRICE_PER_WEBSITE_INR

  function updateTarget(index: number, value: string): void {
    setTargets(prev => prev.map((t, i) => (i === index ? value : t)))
  }

  function addRow(): void {
    setTargets(prev => [...prev, ''])
  }

  function removeRow(index: number): void {
    setTargets(prev => prev.length === 1 ? [''] : prev.filter((_, i) => i !== index))
  }

  function closeModal(): void {
    setShowAddModal(false)
    setTargets([''])
    setError(null)
  }

  const handleAddWebsites = useCallback(async (): Promise<void> => {
    if (nonEmptyTargets.length === 0) {
      setError('Enter at least one website')
      return
    }
    setError(null)
    setIsPending(true)
    try {
      const res = await fetch('/api/v1/billing/razorpay/website-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: nonEmptyTargets }),
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
          planName: data.planName ?? 'Website Plan',
          billingCycle: 'monthly',
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
          ? `${data.planName ?? 'Website Plan'} · TEST MODE — Use card: 5267 3181 8797 5449 (Razorpay test Mastercard)`
          : `${data.planName ?? 'Website Plan'} · Monthly (incl. 18% GST)`,
        image: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://upnotify-monitoring.vercel.app'}/logo.svg`,
        prefill: { email: data.userEmail ?? '', name: data.orgName ?? '' },
        theme: { color: '#FBA830' },
        handler: (_response: unknown) => {
          window.location.href = '/dashboard/plans?added=1'
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
  }, [nonEmptyTargets])

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
          You&apos;re on an existing plan (Pre Plan / Pro Plan) that already covers your monitors. The ₹149/month-per-website plan below is only needed for additional websites outside that plan.
        </div>
      )}

      <div className="plans-header-row">
        <div className="plans-header-sub">
          {rows.length === 0 ? 'No websites paid for yet.' : `${rows.length} subscription${rows.length === 1 ? '' : 's'}`}
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Website
        </button>
      </div>

      {showAddModal && (
        <div className="popup-overlay" onClick={() => !isPending && closeModal()}>
          <div className="popup-content popup-content-lg" onClick={e => e.stopPropagation()}>
            <button className="popup-close" onClick={closeModal} disabled={isPending}>&times;</button>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Add website(s)</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              ₹149/month per website covers every monitor type (HTTP, SSL, DNS, keyword, and more). Add as many as you need — they&apos;ll be billed together on one invoice.
            </p>

            <div className="plans-included-monitors">
              {MONITOR_TYPES.map(mt => {
                const Icon = MONITOR_TYPE_ICONS[mt.type] ?? Globe
                return (
                  <span key={mt.type} className="plans-included-monitor-pill">
                    <Icon size={14} strokeWidth={2} />
                    {mt.name}
                  </span>
                )
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {targets.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder="example.com"
                    value={t}
                    onChange={e => updateTarget(i, e.target.value)}
                    disabled={isPending}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => removeRow(i)}
                    disabled={isPending}
                    aria-label="Remove website"
                    style={{ padding: '0 12px' }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={addRow}
              disabled={isPending}
              style={{ marginBottom: 16, fontSize: 13, padding: '6px 10px' }}
            >
              + Add more website
            </button>

            <div className="plans-modal-total">
              <span>{nonEmptyTargets.length} website{nonEmptyTargets.length === 1 ? '' : 's'} × ₹{PRICE_PER_WEBSITE_INR}/month</span>
              <span className="plans-modal-total-amount">₹{total}/month</span>
            </div>

            {error && <p style={{ color: '#ef4444', margin: '12px 0 0', fontSize: 13 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => void handleAddWebsites()} disabled={isPending || nonEmptyTargets.length === 0}>
                {isPending ? 'Opening…' : 'Continue to Razorpay'}
              </button>
              <button className="btn btn-secondary" onClick={closeModal} disabled={isPending}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="plans-list">
          {rows.map(row => {
            const status = statusLabel(row.subscription.status)
            const monthlyTotal = row.subscription.domains.length * PRICE_PER_WEBSITE_INR
            return (
              <div key={row.subscription.id} className="plans-list-item">
                <div className="plans-list-main">
                  <div>
                    <div className="plans-list-domains">
                      {row.subscription.domains.map(d => (
                        <span key={d} className="plans-domain-pill">{d}</span>
                      ))}
                    </div>
                    <div className="plans-list-meta">
                      <span className={`plans-badge ${status.className}`}>{status.text}</span>
                      <span>₹{monthlyTotal}/month</span>
                      <span>
                        {row.subscription.status === 'canceled'
                          ? `Ended ${fmtDate(row.subscription.canceled_at)}`
                          : `Renews ${fmtDate(row.subscription.current_period_end)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="plans-monitors-section">
                  {row.perDomain.map(d => (
                    <div key={d.domain} className="plans-monitors-row">
                      <span className="plans-monitors-domain">{d.domain}</span>
                      <div className="plans-monitor-pills">
                        {d.monitorTypes.length === 0 ? (
                          <span className="plans-no-invoice">No monitors added yet</span>
                        ) : (
                          d.monitorTypes.map(type => {
                            const Icon = MONITOR_TYPE_ICONS[type] ?? Globe
                            return (
                              <span key={type} className="plans-monitor-pill">
                                <Icon size={13} strokeWidth={2} />
                                {monitorTypeLabel(type)}
                              </span>
                            )
                          })
                        )}
                      </div>
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

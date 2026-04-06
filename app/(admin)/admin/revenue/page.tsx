'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface EnrichedInvoice {
  id: string
  org_id: string
  orgName: string
  userEmail: string
  amount_gbp: number
  currency: string
  status: string
  invoice_pdf_url: string | null
  period_start: string | null
  period_end: string | null
  created_at: string
  planName: string | null
  billingCycle: string | null
}

interface RevenueData {
  mrr: { basePence: number; competePence: number; totalPence: number }
  planBreakdown: Record<string, { count: number; mrrPence: number }>
  competeBreakdown: Record<string, { count: number; mrrPence: number }>
  totalRevenuePence: number
  revenueByCurrency: Record<string, number>
  activeSubscriptions: number
  activeCompeteSubscriptions: number
  invoices: EnrichedInvoice[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

function gbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

/** Format an amount (in smallest currency unit) for any currency */
function formatAmount(smallestUnit: number, currency: string): string {
  const amount = smallestUnit / 100
  const cur = currency.toUpperCase()
  // Currencies with no decimal places
  const zeroDec = new Set(['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'BIF', 'GNF', 'ISK', 'KMF', 'MGA', 'PYG', 'RWF', 'UGX', 'XAF', 'XOF'])
  const displayAmount = zeroDec.has(cur) ? String(smallestUnit) : amount.toFixed(2)
  const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', INR: '₹', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'AED ' }
  const symbol = symbols[cur] ?? `${cur} `
  return `${symbol}${displayAmount}`
}

/** Currency label for display */
function currencyLabel(code: string): string {
  const labels: Record<string, string> = {
    gbp: 'GBP (£)', usd: 'USD ($)', eur: 'EUR (€)', inr: 'INR (₹)',
    aud: 'AUD (A$)', cad: 'CAD (C$)', sgd: 'SGD (S$)', aed: 'AED',
  }
  return labels[code.toLowerCase()] ?? code.toUpperCase()
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtPeriod(start: string | null, end: string | null): string {
  if (!start || !end) return '—'
  const s = new Date(start)
  const e = new Date(end)
  // If same day it's a one-time payment — show just the date
  if (s.toDateString() === e.toDateString()) return fmtDate(start)
  return `${fmtDate(start)} → ${fmtDate(end)}`
}

export default function AdminRevenuePage(): React.ReactElement {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters & pagination
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        status,
        sortBy,
        sortDir,
      })
      const res = await fetch(`/api/admin/revenue?${params}`)
      if (res.ok) {
        const d = await res.json() as { success: boolean } & RevenueData
        if (d.success) setData(d)
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [page, status, sortBy, sortDir])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [status, sortBy, sortDir, search])

  function toggleSort(col: string) {
    if (sortBy === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortBy !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>
    return <span style={{ marginLeft: 4 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  // Client-side search filter on visible invoices
  const visibleInvoices = (data?.invoices ?? []).filter(inv => {
    if (!search) return true
    const q = search.toLowerCase()
    return inv.userEmail.toLowerCase().includes(q) ||
      inv.orgName.toLowerCase().includes(q) ||
      (inv.planName ?? '').toLowerCase().includes(q)
  })

  const planEntries = Object.entries(data?.planBreakdown ?? {})
  const competeEntries = Object.entries(data?.competeBreakdown ?? {})
  const pagination = data?.pagination

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Revenue &amp; Billing</h1>
          <p className="admin-page-subtitle">Financial overview of all subscriptions and invoices.</p>
        </div>
        <Link href="/admin/user360" className="btn btn-secondary" style={{ fontSize: 13 }}>
          👤 User 360 View
        </Link>
      </div>

      {/* Top KPI stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total MRR', value: gbp(data?.mrr.totalPence ?? 0), color: 'var(--success)' },
          { label: 'Base Plan MRR', value: gbp(data?.mrr.basePence ?? 0), color: 'var(--accent)' },
          { label: 'Compete MRR', value: gbp(data?.mrr.competePence ?? 0), color: 'var(--accent)' },
          { label: 'GBP Revenue', value: gbp(data?.totalRevenuePence ?? 0), color: 'var(--success)' },
          { label: 'Active Subs', value: String(data?.activeSubscriptions ?? 0), color: 'var(--text-primary)' },
          { label: 'Compete Subs', value: String(data?.activeCompeteSubscriptions ?? 0), color: 'var(--text-primary)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Per-currency revenue cards (only shown when non-GBP payments exist) */}
      {data?.revenueByCurrency && Object.keys(data.revenueByCurrency).length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Revenue by Currency
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(data.revenueByCurrency).map(([cur, amount]) => (
              <div key={cur} className="card" style={{ padding: '12px 16px', minWidth: 140 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{currencyLabel(cur)}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{formatAmount(amount, cur)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Base Plan Breakdown</h3>
          {planEntries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active subscriptions.</p>
          ) : (
            <table className="table">
              <thead><tr><th>Plan</th><th>Subscribers</th><th>MRR</th></tr></thead>
              <tbody>
                {planEntries.map(([name, info]) => (
                  <tr key={name}>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td>{info.count}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{gbp(info.mrrPence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Compete Add-on Breakdown</h3>
          {competeEntries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active Compete subscriptions.</p>
          ) : (
            <table className="table">
              <thead><tr><th>Plan</th><th>Subscribers</th><th>MRR</th></tr></thead>
              <tbody>
                {competeEntries.map(([name, info]) => (
                  <tr key={name}>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td>{info.count}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{gbp(info.mrrPence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invoices table */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
            Invoices {pagination ? `(${pagination.total} total)` : ''}
          </h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ display: 'flex', gap: 0 }}>
              <input
                className="form-input"
                style={{ fontSize: 13, padding: '6px 10px', width: 200, borderRadius: '6px 0 0 6px' }}
                placeholder="Search email or org…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
              />
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '6px 10px', borderRadius: '0 6px 6px 0', borderLeft: 'none' }}
                onClick={() => setSearch(searchInput)}
              >Search</button>
            </div>
            {/* Status filter */}
            <select
              className="form-input"
              style={{ fontSize: 13, padding: '6px 10px', width: 120 }}
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="open">Open</option>
              <option value="void">Void</option>
            </select>
            {search && (
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setSearch(''); setSearchInput('') }}>
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
        ) : visibleInvoices.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No invoices found.</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('created_at')}>
                      Date <SortIcon col="created_at" />
                    </th>
                    <th>User / Org</th>
                    <th>Plan</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('amount_gbp')}>
                      Amount <SortIcon col="amount_gbp" />
                    </th>
                    <th>Status</th>
                    <th>Period</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(inv.created_at)}</td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.orgName || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.userEmail || '—'}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {inv.planName ? (
                          <span>
                            {inv.planName}
                            {inv.billingCycle && (
                              <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({inv.billingCycle})</span>
                            )}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                        {formatAmount(inv.amount_gbp, inv.currency ?? 'gbp')}
                      </td>
                      <td>
                        <span className={`badge ${inv.status === 'paid' ? 'badge-success' : inv.status === 'open' ? 'badge-warning' : 'badge-neutral'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {fmtPeriod(inv.period_start, inv.period_end)}
                      </td>
                      <td>
                        {inv.invoice_pdf_url ? (
                          <a href={inv.invoice_pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>PDF ↗</a>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Page {pagination.page} of {pagination.totalPages} · {pagination.total} invoices
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

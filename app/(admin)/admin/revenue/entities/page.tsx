'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GroupBy, EntitiesResponse, PeriodRow } from '@/app/api/admin/revenue/entities/route'

// ─── Formatters ───────────────────────────────────────────────────────────────

function gbp(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function inr(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function isoNMonthsAgo(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString().slice(0, 10)
}

// ─── Period config ────────────────────────────────────────────────────────────

interface PeriodOption {
  key: GroupBy
  label: string
  defaultFrom: () => string
}

const PERIODS: PeriodOption[] = [
  { key: 'day',       label: 'Daily',       defaultFrom: () => isoNMonthsAgo(1) },
  { key: 'week',      label: 'Weekly',      defaultFrom: () => isoNMonthsAgo(3) },
  { key: 'month',     label: 'Monthly',     defaultFrom: () => isoNMonthsAgo(12) },
  { key: 'quarter',   label: 'Quarterly',   defaultFrom: () => isoNMonthsAgo(24) },
  { key: 'halfYear',  label: 'Half-yearly', defaultFrom: () => isoNMonthsAgo(36) },
  { key: 'year',      label: 'Yearly',      defaultFrom: () => isoNMonthsAgo(60) },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function EntityRevenuePage(): React.ReactElement {
  const [groupBy, setGroupBy]   = useState<GroupBy>('month')
  const [dateFrom, setDateFrom] = useState<string>(isoNMonthsAgo(12))
  const [dateTo, setDateTo]     = useState<string>(isoToday())
  const [data, setData]         = useState<EntitiesResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const fetchData = useCallback(async (gb: GroupBy, from: string, to: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ groupBy: gb, dateFrom: from, dateTo: to })
      const res = await fetch(`/api/admin/revenue/entities?${params}`)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json() as EntitiesResponse
      setData(json)
    } catch {
      setError('Failed to load entity revenue. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData(groupBy, dateFrom, dateTo)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePeriodChange(option: PeriodOption): void {
    const newFrom = option.defaultFrom()
    const newTo   = isoToday()
    setGroupBy(option.key)
    setDateFrom(newFrom)
    setDateTo(newTo)
    void fetchData(option.key, newFrom, newTo)
  }

  function handleApplyFilter(): void {
    void fetchData(groupBy, dateFrom, dateTo)
  }

  const totalVisionGbp  = data ? data.vision.totalAmount  / 100 : 0
  const totalCrozentInr = data ? data.crozent.totalAmount / 100 : 0

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Entity Revenue</h1>
          <p className="admin-page-subtitle">
            Vision Software Solutions Ltd (UK) · Crozent Techlabs Pvt Ltd (India)
          </p>
        </div>
      </div>

      {/* ── Period tabs ──────────────────────────────────────────────────────── */}
      <div className="admin-tab-bar" style={{ marginBottom: 16 }}>
        {PERIODS.map(opt => (
          <button
            key={opt.key}
            className={`admin-tab-btn${groupBy === opt.key ? ' admin-tab-btn-active' : ''}`}
            onClick={() => handlePeriodChange(opt)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Date filter ──────────────────────────────────────────────────────── */}
      <div className="admin-card" style={{ marginBottom: 20, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>From</label>
          <input
            type="date"
            value={dateFrom}
            max={dateTo}
            onChange={e => setDateFrom(e.target.value)}
            className="admin-input"
            style={{ width: 160 }}
          />
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>To</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            max={isoToday()}
            onChange={e => setDateTo(e.target.value)}
            className="admin-input"
            style={{ width: 160 }}
          />
          <button className="admin-btn admin-btn-primary" onClick={handleApplyFilter} disabled={loading}>
            {loading ? 'Loading…' : 'Apply'}
          </button>
          <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginLeft: 4 }}>
            Showing {PERIODS.find(p => p.key === groupBy)?.label.toLowerCase()} breakdown
          </span>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* ── Summary cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Vision */}
        <div className="admin-card" style={{ padding: 24, borderTop: '3px solid #3b82f6' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
            Vision Software Solutions Ltd
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
            UK · Company No. 02710980 · Non-Indian customers
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#3b82f6' }}>
                {loading ? '…' : `£${totalVisionGbp.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>Total Revenue (GBP)</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {loading ? '…' : data?.vision.uniqueCustomers ?? 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>Unique Customers</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {loading ? '…' : data?.vision.totalInvoices ?? 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>Paid Invoices</div>
            </div>
          </div>
        </div>

        {/* Crozent */}
        <div className="admin-card" style={{ padding: 24, borderTop: '3px solid #06b6d4' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
            Crozent Techlabs Private Limited
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
            India · Indian customers
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#06b6d4' }}>
                {loading ? '…' : `₹${totalCrozentInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>Total Revenue (INR)</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {loading ? '…' : data?.crozent.uniqueCustomers ?? 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>Unique Customers</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {loading ? '…' : data?.crozent.totalInvoices ?? 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>Paid Invoices</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Combined breakdown table ─────────────────────────────────────────── */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            {PERIODS.find(p => p.key === groupBy)?.label} Breakdown
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
            {dateFrom} → {dateTo}
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Period</th>
                <th style={{ textAlign: 'right' }}>Vision Revenue (£)</th>
                <th style={{ textAlign: 'right' }}>Vision Invoices</th>
                <th style={{ textAlign: 'right' }}>Vision Customers</th>
                <th style={{ textAlign: 'right', borderLeft: '2px solid var(--admin-border)' }}>Crozent Revenue (₹)</th>
                <th style={{ textAlign: 'right' }}>Crozent Invoices</th>
                <th style={{ textAlign: 'right' }}>Crozent Customers</th>
                <th style={{ textAlign: 'right', borderLeft: '2px solid var(--admin-border)' }}>Combined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)' }}>
                    Loading…
                  </td>
                </tr>
              ) : !data || data.periods.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)' }}>
                    No paid invoices in this period.
                  </td>
                </tr>
              ) : (
                data.periods.map((row: PeriodRow) => (
                  <tr key={row.periodKey}>
                    <td style={{ fontWeight: 600 }}>{row.periodLabel}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {row.visionAmount > 0 ? gbp(row.visionAmount) : <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>{row.visionInvoices || <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}</td>
                    <td style={{ textAlign: 'right' }}>{row.visionCustomers || <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', borderLeft: '2px solid var(--admin-border)' }}>
                      {row.crozentAmount > 0 ? inr(row.crozentAmount) : <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>{row.crozentInvoices || <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}</td>
                    <td style={{ textAlign: 'right' }}>{row.crozentCustomers || <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, borderLeft: '2px solid var(--admin-border)', fontSize: 12 }}>
                      {row.visionAmount > 0 && <div style={{ color: '#3b82f6' }}>{gbp(row.visionAmount)}</div>}
                      {row.crozentAmount > 0 && <div style={{ color: '#06b6d4' }}>{inr(row.crozentAmount)}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {data && data.periods.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: '2px solid var(--admin-border)' }}>
                  <td>Total</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#3b82f6' }}>{gbp(data.vision.totalAmount)}</td>
                  <td style={{ textAlign: 'right' }}>{data.vision.totalInvoices}</td>
                  <td style={{ textAlign: 'right' }}>{data.vision.uniqueCustomers}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#06b6d4', borderLeft: '2px solid var(--admin-border)' }}>{inr(data.crozent.totalAmount)}</td>
                  <td style={{ textAlign: 'right' }}>{data.crozent.totalInvoices}</td>
                  <td style={{ textAlign: 'right' }}>{data.crozent.uniqueCustomers}</td>
                  <td style={{ textAlign: 'right', borderLeft: '2px solid var(--admin-border)', fontSize: 12 }}>
                    <div style={{ color: '#3b82f6' }}>{gbp(data.vision.totalAmount)}</div>
                    <div style={{ color: '#06b6d4' }}>{inr(data.crozent.totalAmount)}</div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}

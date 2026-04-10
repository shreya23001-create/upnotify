'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GroupBy, EntitiesResponse, PeriodRow } from '@/app/api/admin/revenue/entities/route'
import type { UpgradesResponse, UpgradeLogRow, RefundStatus } from '@/app/api/admin/revenue/razorpay-upgrades/route'

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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Period config (Entity Revenue tab) ──────────────────────────────────────

interface PeriodOption {
  key: GroupBy
  label: string
  defaultFrom: () => string
}

const PERIODS: PeriodOption[] = [
  { key: 'day',       label: 'Daily',       defaultFrom: () => isoNMonthsAgo(1)  },
  { key: 'week',      label: 'Weekly',      defaultFrom: () => isoNMonthsAgo(3)  },
  { key: 'month',     label: 'Monthly',     defaultFrom: () => isoNMonthsAgo(12) },
  { key: 'quarter',   label: 'Quarterly',   defaultFrom: () => isoNMonthsAgo(24) },
  { key: 'halfYear',  label: 'Half-yearly', defaultFrom: () => isoNMonthsAgo(36) },
  { key: 'year',      label: 'Yearly',      defaultFrom: () => isoNMonthsAgo(60) },
]

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<RefundStatus, { background: string; color: string; label: string }> = {
  pending:  { background: '#fef3c7', color: '#92400e', label: 'Pending'  },
  refunded: { background: '#d1fae5', color: '#065f46', label: 'Refunded' },
  waived:   { background: '#e5e7eb', color: '#374151', label: 'Waived'   },
}

function StatusBadge({ status }: { status: RefundStatus }): React.ReactElement {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 700,
      background: s.background,
      color: s.color,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}>
      {s.label}
    </span>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Entity Revenue tab
// ═════════════════════════════════════════════════════════════════════════════

function EntityRevenueTab(): React.ReactElement {
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

  useEffect(() => { void fetchData(groupBy, dateFrom, dateTo) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePeriodChange(option: PeriodOption): void {
    const newFrom = option.defaultFrom()
    const newTo   = isoToday()
    setGroupBy(option.key)
    setDateFrom(newFrom)
    setDateTo(newTo)
    void fetchData(option.key, newFrom, newTo)
  }

  const totalVisionGbp  = data ? data.vision.totalAmount  / 100 : 0
  const totalCrozentInr = data ? data.crozent.totalAmount / 100 : 0

  return (
    <>
      {/* ── Period tabs ────────────────────────────────────────────────────── */}
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

      {/* ── Date filter ────────────────────────────────────────────────────── */}
      <div className="admin-card" style={{ marginBottom: 20, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>From</label>
          <input
            type="date" value={dateFrom} max={dateTo}
            onChange={e => setDateFrom(e.target.value)}
            className="admin-input" style={{ width: 160 }}
          />
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>To</label>
          <input
            type="date" value={dateTo} min={dateFrom} max={isoToday()}
            onChange={e => setDateTo(e.target.value)}
            className="admin-input" style={{ width: 160 }}
          />
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => void fetchData(groupBy, dateFrom, dateTo)}
            disabled={loading}
          >
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

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
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

      {/* ── Breakdown table ────────────────────────────────────────────────── */}
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
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)' }}>Loading…</td></tr>
              ) : !data || data.periods.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)' }}>No paid invoices in this period.</td></tr>
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
                      {row.visionAmount  > 0 && <div style={{ color: '#3b82f6' }}>{gbp(row.visionAmount)}</div>}
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
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Annual Upgrades tab
// ═════════════════════════════════════════════════════════════════════════════

function AnnualUpgradesTab(): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>(isoNMonthsAgo(12))
  const [dateTo, setDateTo]     = useState<string>(isoToday())
  const [data, setData]         = useState<UpgradesResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [page, setPage]         = useState(1)

  // Inline refund modal state
  const [actionRow, setActionRow]           = useState<UpgradeLogRow | null>(null)
  const [actionStatus, setActionStatus]     = useState<RefundStatus>('refunded')
  const [actionAmount, setActionAmount]     = useState<string>('')
  const [actionNotes, setActionNotes]       = useState<string>('')
  const [actionSaving, setActionSaving]     = useState(false)
  const [actionError, setActionError]       = useState<string | null>(null)

  const fetchData = useCallback(async (status: string, from: string, to: string, pg: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        status,
        dateFrom: from,
        dateTo: to,
        page: String(pg),
        pageSize: '50',
      })
      const res = await fetch(`/api/admin/revenue/razorpay-upgrades?${params}`)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json() as UpgradesResponse
      setData(json)
    } catch {
      setError('Failed to load upgrade records. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData(statusFilter, dateFrom, dateTo, page) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function applyFilter(): void {
    setPage(1)
    void fetchData(statusFilter, dateFrom, dateTo, 1)
  }

  function openAction(row: UpgradeLogRow): void {
    setActionRow(row)
    setActionStatus('refunded')
    setActionAmount(String(Math.round(row.credit_amount_inr / 100)))
    setActionNotes('')
    setActionError(null)
  }

  async function saveAction(): Promise<void> {
    if (!actionRow) return
    setActionSaving(true)
    setActionError(null)

    const amountPaise = actionStatus === 'refunded'
      ? Math.round(parseFloat(actionAmount || '0') * 100)
      : undefined

    try {
      const res = await fetch('/api/admin/revenue/razorpay-upgrades', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: actionRow.id,
          refund_status: actionStatus,
          refunded_amount_inr: amountPaise,
          refund_notes: actionNotes || undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? 'Update failed')
      }
      setActionRow(null)
      void fetchData(statusFilter, dateFrom, dateTo, page)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setActionSaving(false)
    }
  }

  const summary = data?.summary
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1

  return (
    <>
      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="admin-card" style={{ padding: 20, borderTop: '3px solid #f59e0b' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>
            {summary ? inr(summary.totalPendingInr) : '…'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>Total Pending Credits</div>
          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>{summary?.countPending ?? '…'} customers</div>
        </div>
        <div className="admin-card" style={{ padding: 20, borderTop: '3px solid #10b981' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>
            {summary ? inr(summary.totalRefundedInr) : '…'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>Total Refunded</div>
          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>{summary?.countRefunded ?? '…'} customers</div>
        </div>
        <div className="admin-card" style={{ padding: 20, borderTop: '3px solid #6b7280' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#6b7280' }}>
            {summary?.countWaived ?? '…'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>Waived</div>
          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>No refund issued</div>
        </div>
        <div className="admin-card" style={{ padding: 20, borderTop: '3px solid #3b82f6' }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {summary ? (summary.countPending + summary.countRefunded + summary.countWaived) : '…'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>Total Upgrades</div>
          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>All time</div>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="admin-card" style={{ marginBottom: 20, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="admin-input"
            style={{ width: 140 }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="waived">Waived</option>
          </select>

          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>From</label>
          <input
            type="date" value={dateFrom} max={dateTo}
            onChange={e => setDateFrom(e.target.value)}
            className="admin-input" style={{ width: 160 }}
          />
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>To</label>
          <input
            type="date" value={dateTo} min={dateFrom} max={isoToday()}
            onChange={e => setDateTo(e.target.value)}
            className="admin-input" style={{ width: 160 }}
          />
          <button className="admin-btn admin-btn-primary" onClick={applyFilter} disabled={loading}>
            {loading ? 'Loading…' : 'Apply'}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* ── Info banner ────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: 8,
        padding: '10px 16px',
        marginBottom: 20,
        fontSize: 13,
        color: '#78350f',
      }}>
        <strong>V1 — Manual refund workflow.</strong> Credits shown are calculated automatically when a Razorpay annual customer upgrades.
        Issue the refund in the Razorpay dashboard using the old subscription ID, then mark the record below as Refunded.
        Automated refunds will be available in V1.5.
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">Annual Upgrade Credits</div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
            {data ? `${data.total} record${data.total !== 1 ? 's' : ''}` : '…'}
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Upgrade Date</th>
                <th>Plan Change</th>
                <th>Old Period</th>
                <th style={{ textAlign: 'right' }}>Days Left</th>
                <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                <th style={{ textAlign: 'right' }}>New Annual (₹)</th>
                <th>Old Sub ID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)' }}>Loading…</td></tr>
              ) : !data || data.rows.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)' }}>No records found.</td></tr>
              ) : (
                data.rows.map((row: UpgradeLogRow) => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{row.org_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{row.user_email}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{fmtDate(row.upgraded_at)}</td>
                    <td>
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--admin-text-muted)' }}>{row.old_plan_name}</span>
                        <span style={{ margin: '0 6px', color: '#3b82f6' }}>→</span>
                        <span style={{ fontWeight: 600 }}>{row.new_plan_name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                      <div>{fmtDate(row.old_subscription_started_at)}</div>
                      <div>→ {fmtDate(row.old_subscription_period_end)}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                      {row.days_remaining}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b' }}>
                      {inr(row.credit_amount_inr)}
                      {row.refunded_amount_inr !== null && row.refunded_amount_inr !== row.credit_amount_inr && (
                        <div style={{ fontSize: 10, color: '#10b981', fontWeight: 400 }}>
                          Issued: {inr(row.refunded_amount_inr)}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--admin-text-muted)' }}>
                      {inr(row.new_plan_price_annual_inr)}
                    </td>
                    <td style={{ fontSize: 11, fontFamily: 'monospace' }}>
                      <span
                        style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => navigator.clipboard.writeText(row.old_razorpay_subscription_id)}
                        title="Click to copy"
                      >
                        {row.old_razorpay_subscription_id.slice(0, 16)}…
                      </span>
                    </td>
                    <td><StatusBadge status={row.refund_status} /></td>
                    <td>
                      {row.refund_status === 'pending' ? (
                        <button
                          className="admin-btn"
                          style={{ fontSize: 12, padding: '4px 12px' }}
                          onClick={() => openAction(row)}
                        >
                          Update
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                          {row.refunded_at ? fmtDate(row.refunded_at) : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--admin-border)' }}>
            <button
              className="admin-btn" style={{ fontSize: 12 }}
              disabled={page <= 1 || loading}
              onClick={() => { const p = page - 1; setPage(p); void fetchData(statusFilter, dateFrom, dateTo, p) }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="admin-btn" style={{ fontSize: 12 }}
              disabled={page >= totalPages || loading}
              onClick={() => { const p = page + 1; setPage(p); void fetchData(statusFilter, dateFrom, dateTo, p) }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Refund action modal ─────────────────────────────────────────────── */}
      {actionRow && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="admin-card" style={{ width: 480, padding: 28, position: 'relative' }}>
            <button
              onClick={() => setActionRow(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--admin-text-muted)' }}
            >
              ×
            </button>

            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Update Refund Status</div>
            <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 20 }}>
              {actionRow.org_name} · {actionRow.old_plan_name} → {actionRow.new_plan_name}
            </div>

            {/* Old sub ID for Razorpay dashboard */}
            <div style={{ background: '#f9fafb', border: '1px solid var(--admin-border)', borderRadius: 6, padding: '8px 12px', marginBottom: 20, fontSize: 12 }}>
              <div style={{ color: 'var(--admin-text-muted)', marginBottom: 2 }}>Razorpay Subscription ID (old plan)</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{actionRow.old_razorpay_subscription_id}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 2 }}>Days Remaining</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{actionRow.days_remaining}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 2 }}>Calculated Credit</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{inr(actionRow.credit_amount_inr)}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Action</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['refunded', 'waived', 'pending'] as RefundStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setActionStatus(s)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 6, border: '2px solid',
                      borderColor: actionStatus === s ? '#3b82f6' : 'var(--admin-border)',
                      background: actionStatus === s ? '#eff6ff' : 'transparent',
                      color: actionStatus === s ? '#1d4ed8' : 'var(--admin-text-muted)',
                      fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {actionStatus === 'refunded' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Actual Refund Amount (₹)
                </label>
                <input
                  type="number"
                  value={actionAmount}
                  onChange={e => setActionAmount(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                  placeholder={`Default: ${Math.round(actionRow.credit_amount_inr / 100)}`}
                  min="0"
                  step="0.01"
                />
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                  Calculated credit: {inr(actionRow.credit_amount_inr)}. Adjust if partial refund was issued.
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Notes (optional)</label>
              <textarea
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
                className="admin-input"
                style={{ width: '100%', height: 72, resize: 'vertical' }}
                placeholder="e.g. Refunded via Razorpay dashboard, payment ID: pay_xxx"
              />
            </div>

            {actionError && (
              <div className="admin-alert admin-alert-error" style={{ marginBottom: 12 }}>{actionError}</div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="admin-btn" onClick={() => setActionRow(null)} disabled={actionSaving}>
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => void saveAction()}
                disabled={actionSaving}
              >
                {actionSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Page shell — tab switcher
// ═════════════════════════════════════════════════════════════════════════════

type PageTab = 'entities' | 'annual-upgrades'

export default function EntityRevenuePage(): React.ReactElement {
  const [tab, setTab] = useState<PageTab>('entities')

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

      {/* ── Top-level tab switcher ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '2px solid var(--admin-border)',
        marginBottom: 24,
      }}>
        {([
          { key: 'entities',        label: 'Entity Revenue'         },
          { key: 'annual-upgrades', label: 'Razorpay Annual Upgrades' },
        ] as { key: PageTab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: -2,
              color: tab === t.key ? '#3b82f6' : 'var(--admin-text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'entities'        && <EntityRevenueTab />}
      {tab === 'annual-upgrades' && <AnnualUpgradesTab />}
    </div>
  )
}

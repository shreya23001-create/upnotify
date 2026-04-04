'use client'

import { useState, useEffect, useCallback } from 'react'

interface RevenueData {
  mrr: { basePence: number; competePence: number; totalPence: number }
  planBreakdown: Record<string, { count: number; mrrPence: number }>
  competeBreakdown: Record<string, { count: number; mrrPence: number }>
  totalRevenuePence: number
  activeSubscriptions: number
  activeCompeteSubscriptions: number
  recentInvoices: Array<{
    id: string
    org_id: string
    amount_gbp: number
    status: string
    period_start: string | null
    period_end: string | null
    created_at: string
  }>
}

function fmt(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`
}

export default function AdminRevenuePage(): React.ReactElement {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/revenue')
      if (res.ok) {
        const d = await res.json() as { success: boolean } & RevenueData
        if (d.success) setData(d)
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading || !data) return <div><h1 className="admin-page-title">Revenue</h1><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>

  const planEntries = Object.entries(data.planBreakdown)
  const competeEntries = Object.entries(data.competeBreakdown)

  return (
    <div>
      <h1 className="admin-page-title">Revenue &amp; Billing</h1>
      <p className="admin-page-subtitle">Financial overview of all subscriptions and invoices.</p>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card stat-card stat-card-green" style={{ padding: 16 }}>
          <div className="stat-label">Total MRR</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(data.mrr.totalPence)}</div>
        </div>
        <div className="card stat-card stat-card-blue" style={{ padding: 16 }}>
          <div className="stat-label">Base Plan MRR</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(data.mrr.basePence)}</div>
        </div>
        <div className="card stat-card" style={{ padding: 16 }}>
          <div className="stat-label">Compete MRR</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(data.mrr.competePence)}</div>
        </div>
        <div className="card stat-card" style={{ padding: 16 }}>
          <div className="stat-label">Total Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(data.totalRevenuePence)}</div>
        </div>
        <div className="card stat-card" style={{ padding: 16 }}>
          <div className="stat-label">Active Subs</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{data.activeSubscriptions}</div>
        </div>
        <div className="card stat-card" style={{ padding: 16 }}>
          <div className="stat-label">Compete Subs</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{data.activeCompeteSubscriptions}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Base plan breakdown */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Base Plan Breakdown</h3>
          {planEntries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active subscriptions.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Plan</th><th>Subscribers</th><th>MRR</th></tr></thead>
                <tbody>
                  {planEntries.map(([name, info]) => (
                    <tr key={name}>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td>{info.count}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(info.mrrPence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Compete breakdown */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Compete Add-on Breakdown</h3>
          {competeEntries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active Compete subscriptions.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Plan</th><th>Subscribers</th><th>MRR</th></tr></thead>
                <tbody>
                  {competeEntries.map(([name, info]) => (
                    <tr key={name}>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td>{info.count}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(info.mrrPence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Recent Invoices</h3>
        {data.recentInvoices.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No invoices yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Period</th></tr></thead>
              <tbody>
                {data.recentInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontSize: 12 }}>{new Date(inv.created_at).toLocaleDateString('en-GB')}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(inv.amount_gbp)}</td>
                    <td><span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{inv.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {inv.period_start ? new Date(inv.period_start).toLocaleDateString('en-GB') : ''} - {inv.period_end ? new Date(inv.period_end).toLocaleDateString('en-GB') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

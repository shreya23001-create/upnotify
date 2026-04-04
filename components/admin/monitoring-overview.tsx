'use client'

import { useState, useEffect, useCallback } from 'react'

interface AdminMonitor {
  id: string
  name: string
  type: string
  status: string
  severity: string
  orgName: string
  responseTimeMs: number | null
}

interface Summary {
  total: number
  up: number
  down: number
  degraded: number
}

export function MonitoringOverview(): React.ReactElement {
  const [summary, setSummary] = useState<Summary>({ total: 0, up: 0, down: 0, degraded: 0 })
  const [monitors, setMonitors] = useState<AdminMonitor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/monitors?page=0&pageSize=200')
      if (res.ok) {
        const data = await res.json() as { success: boolean; summary: Summary; monitors: AdminMonitor[] }
        if (data.success) {
          setSummary(data.summary)
          setMonitors(data.monitors)
        }
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>Loading monitoring data...</p>

  const total = summary.total || 1
  const upPct = Math.round((summary.up / total) * 100)
  const downPct = Math.round((summary.down / total) * 100)
  const degradedPct = Math.round((summary.degraded / total) * 100)
  const pausedPct = 100 - upPct - downPct - degradedPct

  // Type breakdown
  const typeMap = new Map<string, number>()
  for (const m of monitors) {
    typeMap.set(m.type, (typeMap.get(m.type) ?? 0) + 1)
  }
  const typeBreakdown = [...typeMap.entries()].sort((a, b) => b[1] - a[1])

  // Top 5 slowest
  const slowest = [...monitors]
    .filter(m => m.responseTimeMs !== null && m.responseTimeMs > 0)
    .sort((a, b) => (b.responseTimeMs ?? 0) - (a.responseTimeMs ?? 0))
    .slice(0, 5)

  // Currently down
  const downMonitors = monitors.filter(m => m.status === 'down').slice(0, 5)

  return (
    <div style={{ marginTop: 24 }}>
      <h2 className="admin-section-title">Monitoring Overview</h2>

      {/* Status distribution bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
          {upPct > 0 && <div style={{ width: `${upPct}%`, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>{upPct}%</div>}
          {downPct > 0 && <div style={{ width: `${downPct}%`, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>{downPct}%</div>}
          {degradedPct > 0 && <div style={{ width: `${degradedPct}%`, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>{degradedPct}%</div>}
          {pausedPct > 0 && <div style={{ width: `${pausedPct}%`, background: 'var(--bg-secondary, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)' }}></div>}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <span><span style={{ color: '#22c55e', fontWeight: 600 }}>{'\u25CF'}</span> Up: {summary.up}</span>
          <span><span style={{ color: '#ef4444', fontWeight: 600 }}>{'\u25CF'}</span> Down: {summary.down}</span>
          <span><span style={{ color: '#f59e0b', fontWeight: 600 }}>{'\u25CF'}</span> Degraded: {summary.degraded}</span>
          <span>Total: {summary.total}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Type breakdown */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>By Monitor Type</h3>
          {typeBreakdown.map(([type, count]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, width: 60, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{type}</span>
              <div style={{ flex: 1, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(count / total) * 100}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: 4, minWidth: 2 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, width: 30, textAlign: 'right' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Down monitors */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: downMonitors.length > 0 ? '#ef4444' : undefined }}>
            {downMonitors.length > 0 ? `Currently Down (${downMonitors.length})` : 'All Clear'}
          </h3>
          {downMonitors.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No monitors are currently down.</p>
          ) : (
            downMonitors.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-primary)', fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{m.name}</span>
                <span className="badge badge-danger">{m.severity}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Slowest monitors */}
      {slowest.length > 0 && (
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Slowest Response Times</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {slowest.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                <span>{m.name} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({m.orgName})</span></span>
                <span style={{ fontWeight: 600, color: (m.responseTimeMs ?? 0) > 3000 ? '#ef4444' : (m.responseTimeMs ?? 0) > 1000 ? '#f59e0b' : undefined }}>{m.responseTimeMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

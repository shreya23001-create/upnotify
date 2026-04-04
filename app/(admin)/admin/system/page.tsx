'use client'

import { useState, useEffect, useCallback } from 'react'

interface SystemHealth {
  database: { status: string; latencyMs: number }
  crons: {
    checkRunner: { lastRun: string | null; status: string }
    publicChecks: { lastRun: string | null; status: string }
    nurtureEmails: { lastRun: string | null; status: string }
  }
  monitors: { total: number; active: number; paused: number; inMaintenance: number }
  incidents: { open: number; resolvedToday: number }
  checks: { last24h: number; failRate: number }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function statusColor(status: string): string {
  if (status === 'healthy' || status === 'ok') return '#22c55e'
  if (status === 'warning' || status === 'stale') return '#f59e0b'
  return '#ef4444'
}

export default function AdminSystemPage(): React.ReactElement {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/system-health')
      if (res.ok) {
        const data = await res.json() as { success: boolean; health: SystemHealth }
        if (data.success) setHealth(data.health)
      }
    } catch {
      // Silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30_000)
    return () => clearInterval(interval)
  }, [fetchHealth])

  if (loading || !health) {
    return (
      <div>
        <h1 className="admin-page-title">System Health</h1>
        <p style={{ color: 'var(--text-muted)', padding: 32 }}>Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="admin-page-title">System Health</h1>
      <p className="admin-page-subtitle">Real-time platform status. Refreshes every 30 seconds.</p>

      {/* Database */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Database</div></div>
        <div className="card-content" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor(health.database.status) }} />
          <span style={{ fontWeight: 600 }}>{health.database.status === 'ok' ? 'Connected' : 'Error'}</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Latency: {health.database.latencyMs}ms</span>
        </div>
      </div>

      {/* Cron Jobs */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Cron Jobs</div></div>
        <div className="card-content" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Job</th><th>Status</th><th>Last Run</th></tr>
              </thead>
              <tbody>
                {Object.entries(health.crons).map(([name, cron]) => (
                  <tr key={name}>
                    <td style={{ fontWeight: 500 }}>{name.replace(/([A-Z])/g, ' $1').trim()}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(cron.status) }} />
                        {cron.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{timeAgo(cron.lastRun)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monitor stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Monitors</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{health.monitors.total}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{health.monitors.active}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Open Incidents</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: health.incidents.open > 0 ? '#ef4444' : undefined }}>{health.incidents.open}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Checks (24h)</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{health.checks.last24h.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fail Rate (24h)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: health.checks.failRate > 5 ? '#ef4444' : undefined }}>{health.checks.failRate.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}

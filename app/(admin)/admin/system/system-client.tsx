'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ---------------------------------------------------------------------------
// Cron groups — defines display order and section labels
// ---------------------------------------------------------------------------

const CRON_GROUPS: { label: string; color: string; keys: string[] }[] = [
  {
    label: 'Core Platform',
    color: '#3b82f6',
    keys: ['checkRunner', 'publicChecks', 'healthScores'],
  },
  {
    label: 'Marketing & Nurture',
    color: '#8b5cf6',
    keys: ['nurtureEmails'],
  },
  {
    label: 'Watchdog',
    color: '#f59e0b',
    keys: ['competitorChecks'],
  },
  {
    label: 'Compete',
    color: '#06b6d4',
    keys: ['competeChecks', 'competeBrief'],
  },
  {
    label: 'AOE — Automated Outreach Engine',
    color: '#10b981',
    keys: ['aoeQuotaManager', 'aoeSiteDiscovery', 'aoeOutreachChecker', 'aoeOutreachEmailer', 'aoeLastDayBurst', 'aoeDailySnapshot'],
  },
]

interface CronRun {
  id: string
  status: 'running' | 'ok' | 'error'
  triggered_by: 'schedule' | 'manual'
  duration_ms: number | null
  result_summary: string | null
  error_message: string | null
  ran_at: string
}

interface CronEntry { label: string; schedule: string; path: string; lastRun: string | null; status: string; history: CronRun[] }

interface SystemHealth {
  database: { status: string; latencyMs: number }
  crons: Record<string, CronEntry>
  monitors: { total: number; active: number; paused: number; inMaintenance: number }
  incidents: { open: number; resolvedToday: number }
  checks: { last24h: number; failRate: number }
  compete: { activeProducts: number; activeSubscriptions: number }
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

export function AdminSystemClientPage(): React.ReactElement {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [simMonitorId, setSimMonitorId] = useState('')
  const [simAction, setSimAction] = useState<'both' | 'down' | 'recover'>('both')
  const [simRunning, setSimRunning] = useState(false)
  const [simResult, setSimResult] = useState<string | null>(null)
  const simResultRef = useRef<HTMLDivElement>(null)

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

  // Cron on-demand trigger state: key = cron key, value = 'idle' | 'running' | 'ok' | 'error'
  const [cronTrigger, setCronTrigger] = useState<Record<string, 'idle' | 'running' | 'ok' | 'error'>>({})
  const [expandedCron, setExpandedCron] = useState<string | null>(null)

  const triggerCron = useCallback(async (key: string, path: string): Promise<void> => {
    setCronTrigger(prev => ({ ...prev, [key]: 'running' }))
    try {
      const res = await fetch('/api/admin/trigger-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      setCronTrigger(prev => ({ ...prev, [key]: res.ok ? 'ok' : 'error' }))
      // Reset back to idle after 4 seconds
      setTimeout(() => setCronTrigger(prev => ({ ...prev, [key]: 'idle' })), 4000)
      // Refresh health data after a short delay so last-run updates
      setTimeout(fetchHealth, 2000)
    } catch {
      setCronTrigger(prev => ({ ...prev, [key]: 'error' }))
      setTimeout(() => setCronTrigger(prev => ({ ...prev, [key]: 'idle' })), 4000)
    }
  }, [fetchHealth])

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
                <tr>
                  <th>Job</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Last Run</th>
                  <th style={{ width: 100 }}>History</th>
                  <th style={{ width: 80 }}>Trigger</th>
                </tr>
              </thead>
              <tbody>
                {CRON_GROUPS.flatMap(group => {
                  const groupRows: React.ReactElement[] = []

                  // Group header row
                  groupRows.push(
                    <tr key={`group-${group.label}`}>
                      <td colSpan={6} style={{
                        padding: '8px 16px',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        color: group.color,
                        background: `${group.color}12`,
                        borderTop: '1px solid var(--border-color)',
                        borderBottom: '1px solid var(--border-color)',
                      }}>
                        {group.label}
                      </td>
                    </tr>
                  )

                  // Cron rows for this group
                  for (const key of group.keys) {
                    const cron = health.crons[key as keyof typeof health.crons]
                    if (!cron) continue
                    const trigState = cronTrigger[key] ?? 'idle'
                    const isExpanded = expandedCron === key

                    groupRows.push(
                      <tr
                        key={key}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpandedCron(isExpanded ? null : key)}
                      >
                        <td style={{ fontWeight: 500, paddingLeft: 24 }}>
                          <span style={{ marginRight: 6, fontSize: 11, color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                          {cron.label}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cron.schedule}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(cron.status), flexShrink: 0 }} />
                            <span style={{ fontSize: 13 }}>{cron.status}</span>
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{timeAgo(cron.lastRun)}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {cron.history.length === 0
                              ? <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No runs yet</span>
                              : [...cron.history].reverse().map(run => (
                                  <span
                                    key={run.id}
                                    title={`${run.status.toUpperCase()} · ${timeAgo(run.ran_at)}${run.triggered_by === 'manual' ? ' · manual' : ''}${run.duration_ms ? ` · ${run.duration_ms}ms` : ''}${run.result_summary ? `\n${run.result_summary}` : ''}${run.error_message ? `\n${run.error_message}` : ''}`}
                                    style={{
                                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                      background: run.status === 'ok' ? '#22c55e' : run.status === 'error' ? '#ef4444' : '#f59e0b',
                                      border: run.triggered_by === 'manual' ? '2px solid #3b82f6' : '2px solid transparent',
                                    }}
                                  />
                                ))
                            }
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-secondary"
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              color: trigState === 'ok' ? '#22c55e' : trigState === 'error' ? '#ef4444' : undefined,
                              borderColor: trigState === 'ok' ? '#22c55e' : trigState === 'error' ? '#ef4444' : undefined,
                            }}
                            disabled={trigState === 'running'}
                            onClick={() => triggerCron(key, cron.path)}
                          >
                            {trigState === 'running' ? '…' : trigState === 'ok' ? '✓ Done' : trigState === 'error' ? '✗ Error' : '▶ Run'}
                          </button>
                        </td>
                      </tr>
                    )

                    if (isExpanded) {
                      groupRows.push(
                        <tr key={`${key}-expanded`}>
                          <td colSpan={6} style={{ padding: 0, background: 'var(--bg-secondary)' }}>
                            {cron.history.length === 0 ? (
                              <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-muted)' }}>No run history yet. Trigger manually to generate the first entry.</div>
                            ) : (
                              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '6px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Time</th>
                                    <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                                    <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Duration</th>
                                    <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>By</th>
                                    <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Result / Error</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cron.history.map(run => (
                                    <tr key={run.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                      <td style={{ padding: '6px 20px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(run.ran_at)}</td>
                                      <td style={{ padding: '6px 12px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: run.status === 'ok' ? '#22c55e' : run.status === 'error' ? '#ef4444' : '#f59e0b', flexShrink: 0 }} />
                                          <span style={{ color: run.status === 'error' ? '#ef4444' : undefined, fontWeight: run.status === 'error' ? 600 : undefined }}>{run.status}</span>
                                        </span>
                                      </td>
                                      <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>
                                        {run.duration_ms !== null ? `${run.duration_ms}ms` : '—'}
                                      </td>
                                      <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>
                                        {run.triggered_by === 'manual'
                                          ? <span style={{ color: '#3b82f6', fontWeight: 600 }}>manual</span>
                                          : 'schedule'}
                                      </td>
                                      <td style={{ padding: '6px 12px', color: run.error_message ? '#ef4444' : 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {run.error_message ?? run.result_summary ?? '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )
                    }
                  }

                  return groupRows
                })}
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

      {/* Compete stats */}
      {health.compete && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Compete Products</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{health.compete.activeProducts}</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Compete Subscriptions</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: health.compete.activeSubscriptions > 0 ? '#22c55e' : undefined }}>{health.compete.activeSubscriptions}</div>
          </div>
        </div>
      )}

      {/* Dev Simulation Panel */}
      <div className="card" style={{ marginBottom: 16, border: '2px dashed #f59e0b' }}>
        <div className="card-header" style={{ borderBottom: '1px solid #f59e0b20' }}>
          <div className="card-title" style={{ color: '#f59e0b' }}>⚠ Dev Simulation</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Create a real incident and fire real alerts — for testing only</div>
        </div>
        <div className="card-content" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--text-muted)' }}>Monitor ID</label>
            <input
              type="text"
              className="input"
              placeholder="Paste a monitor UUID..."
              value={simMonitorId}
              onChange={(e) => setSimMonitorId(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--text-muted)' }}>Action</label>
            <select
              className="input"
              value={simAction}
              onChange={(e) => setSimAction(e.target.value as typeof simAction)}
            >
              <option value="both">Down → auto-recover (5s)</option>
              <option value="down">Down only (no recovery)</option>
              <option value="recover">Recover existing incident</option>
            </select>
          </div>
          <button
            className="btn btn-secondary"
            style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
            disabled={!simMonitorId.trim() || simRunning}
            onClick={async () => {
              setSimRunning(true)
              setSimResult(null)
              try {
                const res = await fetch('/api/admin/simulate-incident', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ monitorId: simMonitorId.trim(), action: simAction }),
                })
                const data = await res.json() as Record<string, unknown>
                if (!res.ok) {
                  setSimResult(`Error: ${String(data.error ?? 'Unknown error')}`)
                } else {
                  setSimResult(`Done. Incident created${data.resolved ? ' and resolved' : ''}. Check your alert channels.`)
                }
              } catch {
                setSimResult('Network error — check console.')
              } finally {
                setSimRunning(false)
                setTimeout(() => simResultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
              }
            }}
          >
            {simRunning ? 'Running...' : 'Run Simulation'}
          </button>
        </div>
        {simResult && (
          <div ref={simResultRef} style={{ padding: '8px 16px 16px', fontSize: 13, color: simResult.startsWith('Error') ? '#ef4444' : '#22c55e' }}>
            {simResult}
          </div>
        )}
      </div>
    </div>
  )
}

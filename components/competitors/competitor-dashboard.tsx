'use client'

import { useState } from 'react'
import type { CompetitorMonitor } from '@/lib/db/competitor-monitors'

interface CompetitorDashboardProps {
  competitors: CompetitorMonitor[]
  orgId: string
  limitInfo: { allowed: boolean; currentCount: number; limit: number }
}

function getStatusColor(status: string): string {
  if (status === 'up') return 'var(--color-success, #22c55e)'
  if (status === 'down') return 'var(--color-danger, #ef4444)'
  if (status === 'degraded') return 'var(--color-warning, #f59e0b)'
  return 'var(--text-muted, #94a3b8)'
}

function getStatusLabel(status: string): string {
  if (status === 'up') return 'Up'
  if (status === 'down') return 'Down'
  if (status === 'degraded') return 'Degraded'
  return 'Checking...'
}

function formatResponseTime(ms: number | null): string {
  if (ms === null || ms === undefined) return '--'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatUptime(pct: number | null): string {
  if (pct === null || pct === undefined) return '--'
  return `${pct.toFixed(2)}%`
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

export function CompetitorDashboard({
  competitors,
  orgId,
  limitInfo,
}: CompetitorDashboardProps): React.ReactElement {
  const [showForm, setShowForm] = useState(false)
  const [domain, setDomain] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<CompetitorMonitor[]>(competitors)

  async function handleAdd(): Promise<void> {
    if (!domain.trim()) {
      setError('Domain is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/v1/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          domain: domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
          display_name: displayName.trim() || domain.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to add competitor')
        return
      }

      setItems(prev => [data.competitor, ...prev])
      setDomain('')
      setDisplayName('')
      setShowForm(false)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/v1/competitors?id=${id}&org_id=${orgId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setItems(prev => prev.filter(c => c.id !== id))
      }
    } catch {
      /* silent — will show stale data until refresh */
    }
  }

  return (
    <div className="competitors-section">
      <div className="competitors-header">
        <span className="competitors-count">
          {limitInfo.currentCount} / {limitInfo.limit} competitors
        </span>
        {limitInfo.allowed && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            + Add Competitor
          </button>
        )}
        {!limitInfo.allowed && (
          <span className="competitors-limit-msg">
            Competitor limit reached. Upgrade your plan for more.
          </span>
        )}
      </div>

      {showForm && (
        <div className="card competitor-form-card">
          <h3 style={{ marginBottom: 16 }}>Add Competitor Domain</h3>
          <div className="competitor-form">
            <div className="form-group">
              <label className="form-label">Domain</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. competitor.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Display Name (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Competitor Inc"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="competitor-form-actions">
              <button
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Competitor'}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>
            No competitors tracked yet.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Add competitor domains to compare their uptime and performance against your own sites.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="competitor-grid">
          {items.map((comp) => (
            <div key={comp.id} className="card competitor-card">
              <div className="competitor-card-header">
                <div className="competitor-card-status">
                  <span
                    className="status-dot"
                    style={{ background: getStatusColor(comp.last_status) }}
                  />
                  <span className="competitor-card-name">{comp.display_name}</span>
                </div>
                <button
                  className="btn-icon-sm"
                  onClick={() => handleDelete(comp.id)}
                  title="Remove competitor"
                  aria-label={`Remove ${comp.display_name}`}
                >
                  &times;
                </button>
              </div>
              <div className="competitor-card-domain">{comp.domain}</div>
              <div className="competitor-card-stats">
                <div className="competitor-stat">
                  <span className="competitor-stat-label">Status</span>
                  <span
                    className="competitor-stat-value"
                    style={{ color: getStatusColor(comp.last_status) }}
                  >
                    {getStatusLabel(comp.last_status)}
                  </span>
                </div>
                <div className="competitor-stat">
                  <span className="competitor-stat-label">Response</span>
                  <span className="competitor-stat-value">
                    {formatResponseTime(comp.last_response_time_ms)}
                  </span>
                </div>
                <div className="competitor-stat">
                  <span className="competitor-stat-label">Uptime (30d)</span>
                  <span className="competitor-stat-value">
                    {formatUptime(comp.uptime_30d)}
                  </span>
                </div>
                <div className="competitor-stat">
                  <span className="competitor-stat-label">Last Check</span>
                  <span className="competitor-stat-value">
                    {timeAgo(comp.last_checked_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

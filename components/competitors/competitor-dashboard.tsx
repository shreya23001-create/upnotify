'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, X, Globe, TrendingUp, Clock, Shield, ChevronRight, ScanSearch } from 'lucide-react'
import type { CompetitorMonitor } from '@/lib/db/competitor-monitors'

interface CompetitorDashboardProps {
  competitors: CompetitorMonitor[]
  orgId: string
  limitInfo: { allowed: boolean; currentCount: number; limit: number }
}

function getStatusColor(status: string): string {
  if (status === 'up') return '#22c55e'
  if (status === 'down') return '#ef4444'
  if (status === 'degraded') return '#f59e0b'
  return '#94a3b8'
}

function getStatusBg(status: string): string {
  if (status === 'up') return 'rgba(34,197,94,0.1)'
  if (status === 'down') return 'rgba(239,68,68,0.1)'
  if (status === 'degraded') return 'rgba(245,158,11,0.1)'
  return 'rgba(148,163,184,0.1)'
}

function getStatusLabel(status: string): string {
  if (status === 'up') return 'Up'
  if (status === 'down') return 'Down'
  if (status === 'degraded') return 'Degraded'
  return 'Checking…'
}

function formatResponseTime(ms: number | null): string {
  if (ms === null || ms === undefined) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatUptime(pct: number | null): string {
  if (pct === null || pct === undefined) return '—'
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
    if (!domain.trim()) { setError('Domain is required'); return }
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
      if (!res.ok) { setError(data.error || 'Failed to add competitor'); return }
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

  async function handleDelete(id: string, name: string): Promise<void> {
    if (!confirm(`Remove "${name}" from competitor monitoring? This will delete all check history for this competitor.`)) return
    try {
      const res = await fetch(`/api/v1/competitors?id=${id}&org_id=${orgId}`, { method: 'DELETE' })
      if (res.ok) setItems(prev => prev.filter(c => c.id !== id))
    } catch { /* silent */ }
  }

  return (
    <div className="wd-wrap">

      {/* Toolbar */}
      <div className="wd-toolbar">
        <div className="wd-count-pill">
          <Shield size={13} />
          {limitInfo.currentCount} / {limitInfo.limit} tracked
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!limitInfo.allowed && (
            <span className="wd-limit-msg">Plan limit reached</span>
          )}
          {limitInfo.allowed && (
            <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
              <Plus size={14} /> Add Competitor
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card wd-add-card">
          <div className="wd-add-header">
            <span className="wd-add-title">Track a competitor domain</span>
            <button className="btn-icon-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
          </div>
          <div className="wd-add-body">
            <div className="form-group">
              <label className="form-label">Domain *</label>
              <input
                className="form-input"
                type="text"
                placeholder="competitor.com"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Display Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input
                className="form-input"
                type="text"
                placeholder="Competitor Inc"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="form-error" style={{ margin: '0 20px 12px' }}>{error}</p>}
          <div className="wd-add-footer">
            <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
              {loading ? 'Adding…' : 'Start Monitoring'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="wd-empty">
          <div className="wd-empty-icon"><ScanSearch size={26} strokeWidth={1.5} /></div>
          <div className="wd-empty-title">No competitors tracked yet</div>
          <div className="wd-empty-sub">Add competitor domains to compare their uptime and response time against your own sites.</div>
          {limitInfo.allowed && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
              <Plus size={14} /> Add Your First Competitor
            </button>
          )}
        </div>
      )}

      {/* List */}
      {items.length > 0 && (
        <div className="wd-list">
          {/* Header row — desktop */}
          <div className="wd-header">
            <div className="wd-col-name">Competitor</div>
            <div className="wd-col-status">Status</div>
            <div className="wd-col-response">Response</div>
            <div className="wd-col-uptime">Uptime (30d)</div>
            <div className="wd-col-checked">Last Check</div>
            <div className="wd-col-actions"></div>
          </div>

          {items.map(comp => {
            const color = getStatusColor(comp.last_status)
            const bg = getStatusBg(comp.last_status)
            const label = getStatusLabel(comp.last_status)
            return (
              <div key={comp.id} className="wd-row">
                {/* Name + domain */}
                <div className="wd-col-name">
                  <div className="wd-row-icon">
                    <Globe size={14} color="var(--text-muted)" />
                  </div>
                  <div className="wd-row-name-wrap">
                    <Link href={`/dashboard/watchdog/${comp.id}`} className="wd-row-name">
                      {comp.display_name}
                    </Link>
                    <span className="wd-row-domain">{comp.domain}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="wd-col-status">
                  <span className="wd-status-chip" style={{ color, background: bg }}>
                    <span className="wd-status-dot" style={{ background: color }} />
                    {label}
                  </span>
                </div>

                {/* Response */}
                <div className="wd-col-response wd-muted">
                  {formatResponseTime(comp.last_response_time_ms)}
                </div>

                {/* Uptime */}
                <div className="wd-col-uptime">
                  <span style={{
                    color: comp.uptime_30d !== null && comp.uptime_30d < 99 ? '#f59e0b' : '#22c55e',
                    fontWeight: 600,
                    fontSize: 13,
                  }}>
                    {formatUptime(comp.uptime_30d)}
                  </span>
                </div>

                {/* Last check */}
                <div className="wd-col-checked wd-muted" suppressHydrationWarning>
                  <Clock size={11} style={{ flexShrink: 0 }} />
                  {timeAgo(comp.last_checked_at)}
                </div>

                {/* Actions */}
                <div className="wd-col-actions">
                  <Link href={`/dashboard/watchdog/${comp.id}`} className="btn btn-sm btn-secondary wd-view-btn">
                    <TrendingUp size={12} /> View
                  </Link>
                  <button
                    className="btn-icon-sm wd-delete-btn"
                    onClick={() => handleDelete(comp.id, comp.display_name)}
                    title={`Remove ${comp.display_name}`}
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Mobile-only extra info */}
                <div className="wd-mobile-meta">
                  <span className="wd-status-chip" style={{ color, background: bg }}>
                    <span className="wd-status-dot" style={{ background: color }} />
                    {label}
                  </span>
                  <span className="wd-muted" style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <TrendingUp size={11} />
                    {formatUptime(comp.uptime_30d)}
                  </span>
                  <span className="wd-muted" style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Clock size={11} />
                    <span suppressHydrationWarning>{timeAgo(comp.last_checked_at)}</span>
                  </span>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

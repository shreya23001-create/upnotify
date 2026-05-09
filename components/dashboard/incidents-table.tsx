'use client'

import { useState, useTransition } from 'react'
import type { IncidentWithMonitor } from '@/lib/db/incidents'
import { Pagination } from '@/components/ui/pagination'
import type { PaginationMeta } from '@/lib/utils/pagination'

type TabFilter = 'open' | 'resolved' | 'all'

const SEVERITY_COLORS: Record<string, string> = {
  p1: '#ef4444',
  p2: '#f97316',
  p3: '#eab308',
  p4: '#6b7280',
}

const STATUS_COLORS: Record<string, string> = {
  investigating: '#ef4444',
  identified: '#f97316',
  monitoring: '#3b82f6',
  resolved: '#22c55e',
}

const STATUS_ORDER = ['investigating', 'identified', 'monitoring', 'resolved'] as const

function formatDuration(seconds: number | null, startedAt: string, resolvedAt: string | null): string {
  const totalSeconds = seconds ?? (resolvedAt
    ? Math.floor((new Date(resolvedAt).getTime() - new Date(startedAt).getTime()) / 1000)
    : Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))

  if (totalSeconds < 60) return `${totalSeconds}s`
  if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)}m`
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function IncidentsTable({
  incidents,
  pagination,
  openTotal,
  resolvedTotal,
  activeTab,
}: {
  incidents: IncidentWithMonitor[]
  pagination?: PaginationMeta
  openTotal: number
  resolvedTotal: number
  activeTab: TabFilter
}): React.ReactElement {
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({})
  const [localIncidents, setLocalIncidents] = useState(incidents)
  const [showResolveForm, setShowResolveForm] = useState<string | null>(null)

  async function handleStatusChange(incidentId: string, newStatus: string): Promise<void> {
    if (newStatus === 'resolved') {
      setShowResolveForm(incidentId)
      return
    }

    setUpdatingId(incidentId)
    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/incidents/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidentId, status: newStatus }),
        })
        if (res.ok) {
          setLocalIncidents(prev => prev.map(inc =>
            inc.id === incidentId ? { ...inc, status: newStatus } : inc
          ))
        }
      } catch {
        // Error handled silently - status stays unchanged
      }
      setUpdatingId(null)
    })
  }

  async function handleResolve(incidentId: string): Promise<void> {
    setUpdatingId(incidentId)
    const note = resolutionNotes[incidentId] || ''
    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/incidents/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentId,
            status: 'resolved',
            resolutionNote: note || undefined,
          }),
        })
        if (res.ok) {
          const now = new Date().toISOString()
          setLocalIncidents(prev => prev.map(inc => {
            if (inc.id !== incidentId) return inc
            const started = new Date(inc.started_at).getTime()
            const duration = Math.floor((Date.now() - started) / 1000)
            return {
              ...inc,
              status: 'resolved',
              resolved_at: now,
              duration_seconds: duration,
              root_cause: note || inc.root_cause,
            }
          }))
          setShowResolveForm(null)
          setResolutionNotes(prev => {
            const copy = { ...prev }
            delete copy[incidentId]
            return copy
          })
        }
      } catch {
        // Error handled silently
      }
      setUpdatingId(null)
    })
  }

  function getNextStatuses(current: string): string[] {
    const idx = STATUS_ORDER.indexOf(current as typeof STATUS_ORDER[number])
    if (idx === -1 || idx >= STATUS_ORDER.length - 1) return []
    return STATUS_ORDER.slice(idx + 1) as unknown as string[]
  }

  const tabHref = (t: TabFilter) => `?tab=${t}&page=1`

  return (
    <div>
      {/* Tab filters \u2014 URL-driven so pagination resets on tab change */}
      <div className="incidents-tabs">
        <a
          href={tabHref('open')}
          className={`incidents-tab${activeTab === 'open' ? ' incidents-tab-active' : ''}`}
        >
          Open ({openTotal})
        </a>
        <a
          href={tabHref('resolved')}
          className={`incidents-tab${activeTab === 'resolved' ? ' incidents-tab-active' : ''}`}
        >
          Resolved ({resolvedTotal})
        </a>
        <a
          href="?tab=all&page=1"
          className={`incidents-tab${activeTab === 'all' ? ' incidents-tab-active' : ''}`}
        >
          All ({openTotal + resolvedTotal})
        </a>
      </div>

      {localIncidents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{'\u2705'}</div>
          <p>
            {activeTab === 'open' ? 'No open incidents. Everything looks good!' : 'No incidents found.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Monitor</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Started</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {localIncidents.map(inc => (
                <tr key={inc.id}>
                  <td>
                    <span className="incident-title">{inc.title}</span>
                  </td>
                  <td>
                    {inc.monitor_name ? (
                      <a href={`/dashboard/monitors/${inc.monitor_id}`} className="table-link">
                        {inc.monitor_name}
                      </a>
                    ) : (
                      <a href={`/dashboard/monitors/${inc.monitor_id}`} className="table-link table-cell-muted">
                        {inc.monitor_id.slice(0, 8)}...
                      </a>
                    )}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${SEVERITY_COLORS[inc.severity?.toLowerCase()] || '#6b7280'}20`,
                        color: SEVERITY_COLORS[inc.severity?.toLowerCase()] || '#6b7280',
                        border: `1px solid ${SEVERITY_COLORS[inc.severity?.toLowerCase()] || '#6b7280'}40`,
                      }}
                    >
                      {(inc.severity || 'P4').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${STATUS_COLORS[inc.status] || '#6b7280'}20`,
                        color: STATUS_COLORS[inc.status] || '#6b7280',
                        border: `1px solid ${STATUS_COLORS[inc.status] || '#6b7280'}40`,
                      }}
                    >
                      {inc.status.charAt(0).toUpperCase() + inc.status.slice(1)}
                    </span>
                  </td>
                  <td className="table-cell-muted">
                    {formatDate(inc.started_at)}
                  </td>
                  <td className="table-cell-muted" suppressHydrationWarning>
                    {formatDuration(inc.duration_seconds, inc.started_at, inc.resolved_at)}
                  </td>
                  <td>
                    {inc.status !== 'resolved' ? (
                      <div className="incident-actions">
                        {showResolveForm === inc.id ? (
                          <div className="incident-resolve-form">
                            <textarea
                              className="incident-resolve-textarea"
                              placeholder="Resolution note (optional)"
                              value={resolutionNotes[inc.id] || ''}
                              onChange={(e) => setResolutionNotes(prev => ({
                                ...prev,
                                [inc.id]: e.target.value,
                              }))}
                              rows={2}
                            />
                            <div className="incident-resolve-buttons">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleResolve(inc.id)}
                                disabled={isPending && updatingId === inc.id}
                              >
                                {isPending && updatingId === inc.id ? 'Resolving...' : 'Confirm Resolve'}
                              </button>
                              <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => setShowResolveForm(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <select
                            className="incident-status-select"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleStatusChange(inc.id, e.target.value)
                              }
                            }}
                            disabled={isPending && updatingId === inc.id}
                          >
                            <option value="">Change status...</option>
                            {getNextStatuses(inc.status).map(s => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <span className="table-cell-muted">
                        {inc.root_cause ? `Note: ${inc.root_cause.slice(0, 40)}${inc.root_cause.length > 40 ? '...' : ''}` : '--'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pagination && <Pagination {...pagination} />}
    </div>
  )
}

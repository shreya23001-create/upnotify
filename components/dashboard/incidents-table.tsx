'use client'

import { useEffect, useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle, Clock, Activity, Search, ChevronRight, ChevronDown, Globe } from 'lucide-react'
import type { IncidentWithMonitor, WebsiteIncidentGroup } from '@/lib/db/incidents'

type TabFilter = 'open' | 'resolved' | 'all'

const SEVERITY_META: Record<string, { label: string; color: string; bg: string }> = {
  p1: { label: 'P1', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  p2: { label: 'P2', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  p3: { label: 'P3', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  p4: { label: 'P4', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  investigating: { label: 'Investigating', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: <Search size={11} /> },
  identified:    { label: 'Identified',    color: '#f97316', bg: 'rgba(249,115,22,0.1)', icon: <AlertTriangle size={11} /> },
  monitoring:    { label: 'Monitoring',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Activity size={11} /> },
  resolved:      { label: 'Resolved',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  icon: <CheckCircle size={11} /> },
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
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getNextStatuses(current: string): string[] {
  const idx = STATUS_ORDER.indexOf(current as typeof STATUS_ORDER[number])
  if (idx === -1 || idx >= STATUS_ORDER.length - 1) return []
  return STATUS_ORDER.slice(idx + 1) as unknown as string[]
}

function IncidentRow({
  inc,
  isUpdating,
  showResolveForm,
  resolutionNote,
  onResolutionNoteChange,
  onCancelResolveForm,
  onStatusChange,
  onResolve,
}: {
  inc: IncidentWithMonitor
  isUpdating: boolean
  showResolveForm: boolean
  resolutionNote: string
  onResolutionNoteChange: (v: string) => void
  onCancelResolveForm: () => void
  onStatusChange: (status: string) => void
  onResolve: () => void
}): React.ReactElement {
  const sevKey = inc.severity?.toLowerCase() ?? 'p4'
  const sev = SEVERITY_META[sevKey] ?? SEVERITY_META.p4
  const statusMeta = STATUS_META[inc.status] ?? STATUS_META.investigating
  const isResolved = inc.status === 'resolved'

  return (
    <div className={`inc-row${isResolved ? ' inc-row--resolved' : ' inc-row--open'}`}>

      {/* Severity */}
      <div className="inc-col-sev">
        <span className="inc-sev-badge" style={{ background: sev.bg, color: sev.color }}>
          {sev.label}
        </span>
      </div>

      {/* Title + monitor */}
      <div className="inc-col-title">
        <span className="inc-title">{inc.title}</span>
        {inc.monitor_id && (
          <a href={`/dashboard/monitors/${inc.monitor_id}`} className="inc-monitor-link">
            <ChevronRight size={10} />
            {inc.monitor_name ?? inc.monitor_id.slice(0, 8) + '…'}
          </a>
        )}
        {/* Mobile-only meta */}
        <div className="inc-mobile-meta">
          <span className="inc-status-chip" style={{ background: statusMeta.bg, color: statusMeta.color }}>
            {statusMeta.icon}{statusMeta.label}
          </span>
          <span className="inc-mobile-time">
            <Clock size={10} />
            <span suppressHydrationWarning>{formatDuration(inc.duration_seconds, inc.started_at, inc.resolved_at)}</span>
          </span>
        </div>
        {inc.root_cause && isResolved && (
          <span className="inc-root-cause">{inc.root_cause}</span>
        )}
      </div>

      {/* Status */}
      <div className="inc-col-status">
        <span className="inc-status-chip" style={{ background: statusMeta.bg, color: statusMeta.color }}>
          {statusMeta.icon}{statusMeta.label}
        </span>
      </div>

      {/* Started */}
      <div className="inc-col-started inc-muted">
        {formatDate(inc.started_at)}
      </div>

      {/* Duration */}
      <div className="inc-col-duration inc-muted" suppressHydrationWarning>
        {formatDuration(inc.duration_seconds, inc.started_at, inc.resolved_at)}
      </div>

      {/* Actions */}
      <div className="inc-col-actions">
        {!isResolved ? (
          showResolveForm ? (
            <div className="inc-resolve-form">
              <textarea
                className="inc-resolve-textarea"
                placeholder="Resolution note (optional)"
                value={resolutionNote}
                onChange={e => onResolutionNoteChange(e.target.value)}
                rows={2}
              />
              <div className="inc-resolve-btns">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={onResolve}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Resolving…' : 'Confirm'}
                </button>
                <button className="btn btn-sm btn-secondary" onClick={onCancelResolveForm}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <select
              className="inc-status-select"
              value=""
              onChange={e => { if (e.target.value) onStatusChange(e.target.value) }}
              disabled={isUpdating}
            >
              <option value="">Update status…</option>
              {getNextStatuses(inc.status).map(s => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          )
        ) : (
          <span className="inc-resolved-label">
            {inc.root_cause ? `Note: ${inc.root_cause.slice(0, 40)}${inc.root_cause.length > 40 ? '…' : ''}` : '—'}
          </span>
        )}
      </div>

    </div>
  )
}

function WebsiteIncidentGroupSection({
  group,
  isPending,
  updatingId,
  resolutionNotes,
  showResolveForm,
  onResolutionNoteChange,
  onCancelResolveForm,
  onStatusChange,
  onResolve,
}: {
  group: WebsiteIncidentGroup
  isPending: boolean
  updatingId: string | null
  resolutionNotes: Record<string, string>
  showResolveForm: string | null
  onResolutionNoteChange: (id: string, v: string) => void
  onCancelResolveForm: () => void
  onStatusChange: (id: string, status: string) => void
  onResolve: (id: string) => void
}): React.ReactElement {
  const hasOpenIncident = group.incidents.some(inc => inc.status !== 'resolved')
  const [expanded, setExpanded] = useState(hasOpenIncident)

  return (
    <div className="inc-website-group">
      <button className="inc-website-group-header" onClick={() => setExpanded(v => !v)}>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Globe size={14} />
        <span className="inc-website-group-name">{group.domain || 'Unknown website'}</span>
        <span className="inc-website-group-count">{group.incidents.length}</span>
      </button>

      {expanded && (
        <div className="inc-website-group-body">
          {/* Desktop header */}
          <div className="inc-header">
            <div className="inc-col-sev">Severity</div>
            <div className="inc-col-title">Incident</div>
            <div className="inc-col-status">Status</div>
            <div className="inc-col-started">Started</div>
            <div className="inc-col-duration">Duration</div>
            <div className="inc-col-actions">Actions</div>
          </div>

          <div className="inc-list">
            {group.incidents.map(inc => (
              <IncidentRow
                key={inc.id}
                inc={inc}
                isUpdating={isPending && updatingId === inc.id}
                showResolveForm={showResolveForm === inc.id}
                resolutionNote={resolutionNotes[inc.id] || ''}
                onResolutionNoteChange={v => onResolutionNoteChange(inc.id, v)}
                onCancelResolveForm={onCancelResolveForm}
                onStatusChange={status => onStatusChange(inc.id, status)}
                onResolve={() => onResolve(inc.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function IncidentsTable({
  groups,
  openTotal,
  resolvedTotal,
  activeTab,
}: {
  groups: WebsiteIncidentGroup[]
  openTotal: number
  resolvedTotal: number
  activeTab: TabFilter
}): React.ReactElement {
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({})
  const [localGroups, setLocalGroups] = useState(groups)
  const [showResolveForm, setShowResolveForm] = useState<string | null>(null)

  useEffect(() => { setLocalGroups(groups) }, [groups])

  function updateIncidentInGroups(incidentId: string, updater: (inc: IncidentWithMonitor) => IncidentWithMonitor): void {
    setLocalGroups(prev => prev.map(g => ({
      ...g,
      incidents: g.incidents.map(inc => inc.id === incidentId ? updater(inc) : inc),
    })))
  }

  async function handleStatusChange(incidentId: string, newStatus: string): Promise<void> {
    if (newStatus === 'resolved') { setShowResolveForm(incidentId); return }
    setUpdatingId(incidentId)
    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/incidents/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidentId, status: newStatus }),
        })
        if (res.ok) {
          updateIncidentInGroups(incidentId, inc => ({ ...inc, status: newStatus }))
        }
      } catch { /* silent */ }
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
          body: JSON.stringify({ incidentId, status: 'resolved', resolutionNote: note || undefined }),
        })
        if (res.ok) {
          const now = new Date().toISOString()
          updateIncidentInGroups(incidentId, inc => {
            const duration = Math.floor((Date.now() - new Date(inc.started_at).getTime()) / 1000)
            return { ...inc, status: 'resolved', resolved_at: now, duration_seconds: duration, root_cause: note || inc.root_cause }
          })
          setShowResolveForm(null)
          setResolutionNotes(prev => { const c = { ...prev }; delete c[incidentId]; return c })
        }
      } catch { /* silent */ }
      setUpdatingId(null)
    })
  }

  const TABS: { key: TabFilter; label: string; count: number }[] = [
    { key: 'open',     label: 'Open',     count: openTotal },
    { key: 'resolved', label: 'Resolved', count: resolvedTotal },
    { key: 'all',      label: 'All',      count: openTotal + resolvedTotal },
  ]

  const totalIncidents = localGroups.reduce((sum, g) => sum + g.incidents.length, 0)

  return (
    <div className="inc-wrap">

      {/* Stat pills + tabs */}
      <div className="inc-toolbar">
        <div className="inc-tabs">
          {TABS.map(t => (
            <a
              key={t.key}
              href={`?tab=${t.key}`}
              className={`inc-tab${activeTab === t.key ? ' inc-tab--active' : ''}`}
            >
              {t.label}
              <span className="inc-tab-count">{t.count}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Grouped list */}
      {totalIncidents === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CheckCircle size={32} strokeWidth={1.5} color="#22c55e" />
          </div>
          <h3>{activeTab === 'open' ? 'All clear!' : 'No incidents found'}</h3>
          <p>{activeTab === 'open' ? 'No open incidents — everything is looking healthy.' : 'No incidents match this filter.'}</p>
        </div>
      ) : (
        <div className="inc-website-groups">
          {localGroups.map(group => (
            <WebsiteIncidentGroupSection
              key={group.domain || 'unknown'}
              group={group}
              isPending={isPending}
              updatingId={updatingId}
              resolutionNotes={resolutionNotes}
              showResolveForm={showResolveForm}
              onResolutionNoteChange={(id, v) => setResolutionNotes(prev => ({ ...prev, [id]: v }))}
              onCancelResolveForm={() => setShowResolveForm(null)}
              onStatusChange={(id, status) => handleStatusChange(id, status)}
              onResolve={id => handleResolve(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

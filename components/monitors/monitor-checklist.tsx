'use client'

import { useState, useTransition, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, Settings2, Check } from 'lucide-react'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'
import { MonitorTypeIcon } from './monitor-type-icon'
import { ConfigureMonitorModal } from './configure-monitor-modal'
import { Favicon } from '@/components/ui/favicon'
import { Sparkline } from '@/components/ui/sparkline'
import { toggleMonitorSelectionAction } from '@/app/(dashboard)/dashboard/monitors/actions'
import {
  aggregateDomainGroup, timeAgoShort, STATUS_LABEL, STATUS_DOT_COLOR, STATUS_BADGE_CLASS,
  type CheckResultLite,
} from '@/lib/utils/monitor-aggregation'
import type { Monitor } from '@/lib/types'

const CHECKLIST_TYPES = MONITOR_TYPES.filter(t => t.type !== 'wordpress')
const MANUAL_CONFIG_TYPES = new Set(['keyword', 'port', 'api', 'heartbeat', 'competitor'])

interface Props {
  domain: string
  monitors: Monitor[]
  checkResults?: CheckResultLite[]
}

export function MonitorChecklist({ domain, monitors: initialMonitors, checkResults = [] }: Props): React.ReactElement {
  const [expanded, setExpanded] = useState(false)
  const [monitors, setMonitors] = useState(initialMonitors)
  const [pending, startTransition] = useTransition()
  const [busyType, setBusyType] = useState<string | null>(null)
  const [configuring, setConfiguring] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reconcile with the server's own view whenever it changes (e.g. a
  // revalidatePath triggered by a rapid sequence of checkbox clicks) —
  // without this, useState's initial value is frozen after first mount and
  // a mid-sequence server refresh would never reach this component, so an
  // in-flight optimistic update from one click could be overwritten by a
  // stale re-render of a DIFFERENT click still in flight.
  const pendingTypesRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    // A type present in the fresh server snapshot is confirmed — no longer
    // needs protecting from being overwritten.
    for (const m of initialMonitors) pendingTypesRef.current.delete(m.type)

    setMonitors(prev => {
      const merged = new Map(initialMonitors.map(m => [m.type, m]))
      // Keep any optimistic (not-yet-confirmed) entries the server snapshot
      // doesn't know about yet, so a click that's still in flight isn't
      // wiped out by an earlier click's revalidation landing first.
      for (const m of prev) {
        if (pendingTypesRef.current.has(m.type) && !merged.has(m.type)) {
          merged.set(m.type, m)
        }
      }
      return Array.from(merged.values())
    })
  }, [initialMonitors])

  const byType = new Map(monitors.map(m => [m.type, m]))
  const agg = useMemo(() => aggregateDomainGroup(domain, monitors, checkResults), [domain, monitors, checkResults])

  function handleToggle(type: string, checked: boolean): void {
    setError(null)
    if (checked) {
      if (MANUAL_CONFIG_TYPES.has(type)) {
        setConfiguring(type)
        return
      }
      runToggle(type, 'select')
      return
    }
    runToggle(type, 'deselect')
  }

  function runToggle(type: string, action: 'select' | 'deselect', config?: Record<string, unknown>): void {
    setBusyType(type)
    if (action === 'select') pendingTypesRef.current.add(type)
    startTransition(async () => {
      const res = await toggleMonitorSelectionAction({ domain, type, action, config })
      if (res.error) {
        setError(res.error)
        pendingTypesRef.current.delete(type)
      } else {
        if (action === 'deselect') {
          setMonitors(prev => prev.filter(m => m.type !== type))
        } else {
          // Refresh isn't critical for the checkbox state — mark as selected optimistically.
          // Stays in pendingTypesRef until the next server-driven prop
          // update actually contains this type, so a concurrent click's
          // revalidation can't wipe it out first.
          setMonitors(prev => {
            if (prev.some(m => m.type === type)) return prev
            return [...prev, { id: `temp-${type}`, type } as Monitor]
          })
        }
        setConfiguring(null)
      }
      setBusyType(null)
    })
  }

  const selectedCount = monitors.length

  return (
    <div className={`mon-domain-card${expanded ? ' mon-domain-card--expanded' : ''}`}>
      <button className="mon-domain-header" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>
        <span className="mon-domain-header-lead">
          <Favicon domain={domain || 'Other'} size={22} />
          <span className="mon-domain-name">{domain || 'Other monitors'}</span>
          <span className={`db-badge ${STATUS_BADGE_CLASS[agg.status]} mon-domain-status-badge`}>
            <span className="status-dot" style={{ background: STATUS_DOT_COLOR[agg.status] }} />
            {STATUS_LABEL[agg.status]}
          </span>
        </span>

        <span className="mon-domain-header-metrics">
          <span className="mon-domain-metric">
            <span className="mon-domain-metric-value">{agg.uptimePct !== null ? `${agg.uptimePct.toFixed(1)}%` : '—'}</span>
            <span className="mon-domain-metric-label">Uptime</span>
          </span>
          <span className="mon-domain-metric">
            <span className="mon-domain-metric-value">{agg.avgResponseMs !== null ? `${agg.avgResponseMs}ms` : '—'}</span>
            <span className="mon-domain-metric-label">Response</span>
          </span>
          <span className="mon-domain-metric-sparkline">
            {agg.trend.length >= 2 && <Sparkline values={agg.trend} color={STATUS_DOT_COLOR[agg.status]} />}
          </span>
          <span className="mon-domain-metric mon-domain-metric-muted">
            <span className="mon-domain-metric-value">{selectedCount}</span>
            <span className="mon-domain-metric-label">monitor{selectedCount === 1 ? '' : 's'}</span>
          </span>
          <span className="mon-domain-metric-time">{timeAgoShort(agg.lastCheckedAt)}</span>
          <ChevronDown size={16} className="mon-domain-chevron" />
        </span>
      </button>

      {expanded && (
        <div className="mon-checklist">
          {error && <div className="form-error" style={{ margin: '0 0 12px' }}>{error}</div>}
          <div className="mon-check-grid">
            {CHECKLIST_TYPES.map(mt => {
              const existing = byType.get(mt.type)
              const checked = Boolean(existing)
              const isManual = MANUAL_CONFIG_TYPES.has(mt.type)
              const isBusy = pending && busyType === mt.type

              return (
                <label key={mt.type} className={`mon-check-tile${checked ? ' mon-check-tile--selected' : ''}${isBusy ? ' mon-check-tile--busy' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isBusy}
                    onChange={e => handleToggle(mt.type, e.target.checked)}
                  />
                  <span className="mon-check-tile-icon"><MonitorTypeIcon type={mt.type} iconOnly iconSize={15} /></span>
                  <span className="mon-check-tile-name">{mt.name}</span>
                  {checked && <span className="mon-check-tile-check"><Check size={11} strokeWidth={3} /></span>}
                  {isManual && (
                    <button
                      type="button"
                      className="mon-check-tile-configure"
                      onClick={e => { e.preventDefault(); setConfiguring(mt.type) }}
                      disabled={isBusy}
                    >
                      <Settings2 size={11} />
                      {checked ? 'Edit' : 'Configure'}
                    </button>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      )}

      {configuring && (
        <ConfigureMonitorModal
          type={configuring}
          domain={domain}
          initialConfig={byType.get(configuring)?.config as Record<string, unknown> | undefined}
          onSave={config => runToggle(configuring, 'select', config)}
          onCancel={() => setConfiguring(null)}
          isSaving={pending && busyType === configuring}
          error={error ?? undefined}
        />
      )}
    </div>
  )
}

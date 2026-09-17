'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'
import { MonitorTypeIcon } from './monitor-type-icon'
import { ConfigureMonitorModal } from './configure-monitor-modal'
import { toggleMonitorSelectionAction } from '@/app/(dashboard)/dashboard/monitors/actions'
import type { Monitor } from '@/lib/types'

const CHECKLIST_TYPES = MONITOR_TYPES.filter(t => t.type !== 'wordpress')
const MANUAL_CONFIG_TYPES = new Set(['keyword', 'port', 'api', 'heartbeat', 'competitor'])

interface Props {
  domain: string
  monitors: Monitor[]
}

export function MonitorChecklist({ domain, monitors: initialMonitors }: Props): React.ReactElement {
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
    <div className="mon-website-group">
      <button className="mon-website-group-header" onClick={() => setExpanded(v => !v)}>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="mon-website-group-name">{domain || 'Other monitors'}</span>
        <span className="mon-website-group-count">{selectedCount} monitor{selectedCount === 1 ? '' : 's'}</span>
      </button>

      {expanded && (
        <div className="mon-checklist">
          {error && <div className="form-error" style={{ margin: '0 0 12px' }}>{error}</div>}
          {CHECKLIST_TYPES.map(mt => {
            const existing = byType.get(mt.type)
            const checked = Boolean(existing)
            const isManual = MANUAL_CONFIG_TYPES.has(mt.type)
            const isBusy = pending && busyType === mt.type

            return (
              <div key={mt.type} className="mon-check-row">
                <label className="mon-check-label">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isBusy}
                    onChange={e => handleToggle(mt.type, e.target.checked)}
                  />
                  <MonitorTypeIcon type={mt.type} iconOnly iconSize={16} />
                  <span>{mt.name}</span>
                </label>
                {isManual && (
                  <button
                    className="mon-check-configure-btn"
                    onClick={() => setConfiguring(mt.type)}
                    disabled={isBusy}
                  >
                    {checked ? 'Edit config' : 'Configure'}
                  </button>
                )}
              </div>
            )
          })}
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

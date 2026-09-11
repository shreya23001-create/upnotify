'use client'

import { useState, useTransition } from 'react'
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
    startTransition(async () => {
      const res = await toggleMonitorSelectionAction({ domain, type, action, config })
      if (res.error) {
        setError(res.error)
      } else {
        if (action === 'deselect') {
          setMonitors(prev => prev.filter(m => m.type !== type))
        } else {
          // Refresh isn't critical for the checkbox state — mark as selected optimistically.
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

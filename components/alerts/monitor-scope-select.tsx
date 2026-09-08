'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface MonitorOption {
  id: string
  name: string
  target: string
}

interface MonitorScopeSelectProps {
  monitors: MonitorOption[]
  selected: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export function MonitorScopeSelect({ monitors, selected, onChange, disabled }: MonitorScopeSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function selectMonitor(id: string): void {
    onChange([id])
    setOpen(false)
  }

  const summary =
    selected.length === 0
      ? 'All monitors'
      : (monitors.find(m => m.id === selected[0])?.name ?? 'All monitors')

  if (monitors.length === 0) {
    return (
      <p className="ac-form-hint">You don&apos;t have any monitors yet — this channel will apply to all monitors once you add some.</p>
    )
  }

  return (
    <div className="ac-monitor-dropdown" ref={rootRef}>
      <button
        type="button"
        className="ac-monitor-dropdown-trigger"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-expanded={open}
      >
        <span className={selected.length === 0 ? 'ac-monitor-dropdown-placeholder' : ''}>{summary}</span>
        <ChevronDown size={16} className={`ac-monitor-dropdown-chevron${open ? ' ac-monitor-dropdown-chevron--open' : ''}`} />
      </button>

      {open && (
        <div className="ac-monitor-dropdown-panel">
          <label className={`ac-monitor-option${selected.length === 0 ? ' ac-monitor-option--active' : ''}`}>
            <input
              type="radio"
              name="monitor-scope-choice"
              checked={selected.length === 0}
              onChange={() => { onChange([]); setOpen(false) }}
              disabled={disabled}
            />
            <span className="ac-monitor-option-text">
              <span className="ac-monitor-option-name">All monitors</span>
            </span>
            {selected.length === 0 && <Check size={14} className="ac-monitor-option-check" />}
          </label>
          {monitors.map(m => {
            const active = selected[0] === m.id
            return (
              <label key={m.id} className={`ac-monitor-option${active ? ' ac-monitor-option--active' : ''}`}>
                <input
                  type="radio"
                  name="monitor-scope-choice"
                  checked={active}
                  onChange={() => selectMonitor(m.id)}
                  disabled={disabled}
                />
                <span className="ac-monitor-option-text">
                  <span className="ac-monitor-option-name">{m.name}</span>
                  <span className="ac-monitor-option-target">{m.target}</span>
                </span>
                {active && <Check size={14} className="ac-monitor-option-check" />}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

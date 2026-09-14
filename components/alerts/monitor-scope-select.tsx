'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

export interface MonitorOption {
  id: string
  name: string
  target: string
  target_domain?: string | null
}

interface WebsiteGroup {
  domain: string
  monitors: MonitorOption[]
}

function groupByWebsite(monitors: MonitorOption[]): WebsiteGroup[] {
  const groups = new Map<string, MonitorOption[]>()
  for (const m of monitors) {
    const key = m.target_domain?.trim() || 'Other'
    const list = groups.get(key)
    if (list) list.push(m)
    else groups.set(key, [m])
  }
  return Array.from(groups.entries())
    .map(([domain, list]) => ({ domain, monitors: list }))
    .sort((a, b) => a.domain.localeCompare(b.domain))
}

interface MonitorScopeSelectProps {
  monitors: MonitorOption[]
  selected: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export function MonitorScopeSelect({ monitors, selected, onChange, disabled }: MonitorScopeSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
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

  function toggleMonitor(id: string): void {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id))
    else onChange([...selected, id])
  }

  function toggleGroup(domain: string): void {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain)
      else next.add(domain)
      return next
    })
  }

  function toggleGroupSelection(group: WebsiteGroup): void {
    const groupIds = group.monitors.map(m => m.id)
    const allSelected = groupIds.every(id => selected.includes(id))
    if (allSelected) {
      onChange(selected.filter(id => !groupIds.includes(id)))
    } else {
      onChange([...new Set([...selected, ...groupIds])])
    }
  }

  const summary =
    selected.length === 0
      ? 'All monitors'
      : selected.length === 1
        ? (monitors.find(m => m.id === selected[0])?.name ?? '1 monitor selected')
        : `${selected.length} monitors selected`

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return monitors
    return monitors.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.target.toLowerCase().includes(q) ||
      (m.target_domain ?? '').toLowerCase().includes(q)
    )
  }, [monitors, query])

  const groups = useMemo(() => groupByWebsite(filtered), [filtered])

  const showGrouping = groups.length > 1

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
          {monitors.length > 8 && (
            <div className="ac-monitor-dropdown-search">
              <Search size={13} />
              <input
                type="text"
                placeholder="Search monitors or websites…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <label className={`ac-monitor-option${selected.length === 0 ? ' ac-monitor-option--active' : ''}`}>
            <input
              type="radio"
              name="monitor-scope-all"
              checked={selected.length === 0}
              onChange={() => onChange([])}
              disabled={disabled}
            />
            <span className="ac-monitor-option-text">
              <span className="ac-monitor-option-name">All monitors</span>
            </span>
            {selected.length === 0 && <Check size={14} className="ac-monitor-option-check" />}
          </label>

          {groups.length === 0 && (
            <p className="ac-form-hint" style={{ padding: '10px 14px' }}>No monitors match &ldquo;{query}&rdquo;.</p>
          )}

          {groups.map(group => {
            const isCollapsed = showGrouping && collapsed.has(group.domain)
            const groupIds = group.monitors.map(m => m.id)
            const allGroupSelected = groupIds.every(id => selected.includes(id))
            return (
              <div key={group.domain} className="ac-monitor-group">
                {showGrouping && (
                  <div className="ac-monitor-group-header">
                    <button
                      type="button"
                      className="ac-monitor-group-toggle"
                      onClick={() => toggleGroup(group.domain)}
                    >
                      <ChevronDown size={12} className={`ac-monitor-group-chevron${isCollapsed ? '' : ' ac-monitor-group-chevron--open'}`} />
                      <span className="ac-monitor-group-name">{group.domain}</span>
                      <span className="ac-monitor-group-count">{group.monitors.length}</span>
                    </button>
                    <button
                      type="button"
                      className="ac-monitor-group-selectall"
                      onClick={() => toggleGroupSelection(group)}
                      disabled={disabled}
                    >
                      {allGroupSelected ? 'Clear' : 'Select all'}
                    </button>
                  </div>
                )}
                {!isCollapsed && group.monitors.map(m => {
                  const active = selected.includes(m.id)
                  return (
                    <label key={m.id} className={`ac-monitor-option${active ? ' ac-monitor-option--active' : ''}${showGrouping ? ' ac-monitor-option--nested' : ''}`}>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleMonitor(m.id)}
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
            )
          })}
        </div>
      )}
    </div>
  )
}

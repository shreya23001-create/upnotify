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
  count: number
}

function groupByWebsite(monitors: MonitorOption[]): WebsiteGroup[] {
  const counts = new Map<string, number>()
  for (const m of monitors) {
    const key = m.target_domain?.trim() || 'Other'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => a.domain.localeCompare(b.domain))
}

interface MonitorScopeSelectProps {
  monitors: MonitorOption[]
  selected: string[]
  onChange: (domains: string[]) => void
  disabled?: boolean
}

/**
 * Website-level scope picker. `selected` holds website (target_domain)
 * values, not monitor IDs — picking a website automatically covers every
 * monitor under it, including ones added later (dynamic domain matching,
 * resolved at alert-dispatch time against each monitor's current domain).
 */
export function MonitorScopeSelect({ monitors, selected, onChange, disabled }: MonitorScopeSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
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

  function toggleWebsite(domain: string): void {
    if (selected.includes(domain)) onChange(selected.filter(s => s !== domain))
    else onChange([...selected, domain])
  }

  const allGroups = useMemo(() => groupByWebsite(monitors), [monitors])

  const summary =
    selected.length === 0
      ? 'All websites'
      : selected.length === 1
        ? selected[0]
        : `${selected.length} websites selected`

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allGroups
    return allGroups.filter(g => g.domain.toLowerCase().includes(q))
  }, [allGroups, query])

  if (monitors.length === 0) {
    return (
      <p className="ac-form-hint">You don&apos;t have any websites yet — this channel will apply to all websites once you add some.</p>
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
          {allGroups.length > 8 && (
            <div className="ac-monitor-dropdown-search">
              <Search size={13} />
              <input
                type="text"
                placeholder="Search websites…"
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
              <span className="ac-monitor-option-name">All websites</span>
            </span>
            {selected.length === 0 && <Check size={14} className="ac-monitor-option-check" />}
          </label>

          {filteredGroups.length === 0 && (
            <p className="ac-form-hint" style={{ padding: '10px 14px' }}>No websites match &ldquo;{query}&rdquo;.</p>
          )}

          {filteredGroups.map(group => {
            const active = selected.includes(group.domain)
            return (
              <label key={group.domain} className={`ac-monitor-option${active ? ' ac-monitor-option--active' : ''}`}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleWebsite(group.domain)}
                  disabled={disabled}
                />
                <span className="ac-monitor-option-text">
                  <span className="ac-monitor-option-name">{group.domain}</span>
                  <span className="ac-monitor-option-target">{group.count} monitor{group.count === 1 ? '' : 's'}</span>
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

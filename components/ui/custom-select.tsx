'use client'

import { useState, useRef, useEffect, useId, useMemo } from 'react'

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
  group?: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  name?: string
  id?: string
  searchable?: boolean
}

export function CustomSelect({
  options, value, onChange, disabled, name, id, searchable,
}: CustomSelectProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const uid = useId()
  const resolvedId = id ?? uid

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); setQuery('') }
    }
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setQuery('')
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
    if (!open) setQuery('')
  }, [open, searchable])

  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = query.toLowerCase()
    return options.filter(o => o.label.toLowerCase().includes(q))
  }, [options, query])

  // Build grouped structure: array of { group?: string, items: SelectOption[] }
  const grouped = useMemo(() => {
    const hasGroups = filtered.some(o => o.group)
    if (!hasGroups) return [{ group: undefined, items: filtered }]
    const map = new Map<string, SelectOption[]>()
    for (const opt of filtered) {
      const key = opt.group ?? ''
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(opt)
    }
    return Array.from(map.entries()).map(([group, items]) => ({ group: group || undefined, items }))
  }, [filtered])

  const selected = options.find(o => o.value === value) ?? options[0]

  function handleSelect(opt: SelectOption) {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  return (
    <div
      ref={ref}
      className={`cs-root${open ? ' cs-open' : ''}${disabled ? ' cs-disabled' : ''}`}
      id={resolvedId}
    >
      {name && <input type="hidden" name={name} value={value} />}

      <button
        type="button"
        className="cs-trigger"
        onClick={() => { if (!disabled) setOpen(o => !o) }}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="cs-trigger-inner">
          {selected?.icon && <span className="cs-trigger-icon">{selected.icon}</span>}
          <span className="cs-trigger-label">{selected?.label ?? ''}</span>
        </span>
        <svg className="cs-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="cs-panel" role="listbox">
          {searchable && (
            <div className="cs-search-wrap">
              <svg className="cs-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchRef}
                className="cs-search"
                type="text"
                placeholder="Search..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          )}
          <ul className="cs-list">
            {filtered.length === 0 && (
              <li className="cs-empty">No results</li>
            )}
            {grouped.map(({ group, items }, gi) => (
              <li key={group ?? `g${gi}`} className="cs-group">
                {group && <div className="cs-group-label">{group}</div>}
                <ul className="cs-group-list">
                  {items.map(opt => {
                    const isSelected = opt.value === value
                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        className={`cs-option${isSelected ? ' cs-selected' : ''}`}
                        onClick={() => handleSelect(opt)}
                      >
                        {opt.icon && <span className="cs-icon">{opt.icon}</span>}
                        <span className="cs-label">{opt.label}</span>
                        {isSelected && (
                          <svg className="cs-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

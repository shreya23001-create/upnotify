'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  searchable?: boolean
}

export interface FilterOption {
  label: string
  value: string
}

export interface BulkAction {
  label: string
  onClick: (selectedIds: string[]) => void
  variant?: 'danger'
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  searchPlaceholder?: string
  filters?: { key: string; label: string; options: FilterOption[] }[]
  bulkActions?: BulkAction[]
  pageSize?: number
  emptyMessage?: string
  emptyAction?: { label: string; href: string }
  emptyIcon?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  filters = [],
  bulkActions = [],
  pageSize: initialPageSize = 10,
  emptyMessage = 'No data found.',
  emptyAction,
  emptyIcon = '📊',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const filtered = useMemo(() => {
    let result = [...data]

    // Search
    if (search) {
      const q = search.toLowerCase()
      const searchableCols = columns.filter(c => c.searchable !== false)
      result = result.filter(row =>
        searchableCols.some(col => {
          const val = (row as Record<string, unknown>)[col.key]
          return val != null && String(val).toLowerCase().includes(q)
        })
      )
    }

    // Filters
    for (const [key, value] of Object.entries(filterValues)) {
      if (value) {
        result = result.filter(row => String((row as Record<string, unknown>)[key]) === value)
      }
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey]
        const bVal = (b as Record<string, unknown>)[sortKey]
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return 1
        if (bVal == null) return -1
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [data, search, filterValues, sortKey, sortDir, columns])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const toggleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paged.map(r => r.id)))
    }
  }, [paged, selectedIds.size])

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">{emptyIcon}</div>
        <h3>No data yet</h3>
        <p>{emptyMessage}</p>
        {emptyAction && (
          <Link href={emptyAction.href} className="btn btn-primary" style={{ marginTop: 16 }}>
            {emptyAction.label}
          </Link>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="data-table-toolbar">
        <input
          className="data-table-search"
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
        />
        {filters.map(f => (
          <select
            key={f.key}
            className="data-table-filter"
            value={filterValues[f.key] || ''}
            onChange={e => { setFilterValues(prev => ({ ...prev, [f.key]: e.target.value })); setPage(0) }}
          >
            <option value="">{f.label}</option>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {bulkActions.length > 0 && selectedIds.size > 0 && (
        <div className="data-table-bulk-bar">
          <span>{selectedIds.size} selected</span>
          {bulkActions.map(action => (
            <button
              key={action.label}
              className={`btn btn-sm ${action.variant === 'danger' ? '' : 'btn-secondary'}`}
              style={action.variant === 'danger' ? { color: '#dc2626' } : undefined}
              onClick={() => { action.onClick(Array.from(selectedIds)) }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {bulkActions.length > 0 && (
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  className="data-table-checkbox"
                  checked={paged.length > 0 && selectedIds.size === paged.length}
                  onChange={toggleSelectAll}
                />
              </th>
            )}
            {columns.map(col => (
              <th key={col.key}>
                {col.sortable !== false ? (
                  <span className="data-table-sort-header" onClick={() => toggleSort(col.key)}>
                    {col.label}
                    <span className={`data-table-sort-icon${sortKey === col.key ? ' active' : ''}`}>
                      {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </span>
                ) : col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paged.map(row => (
            <tr key={row.id} className={selectedIds.has(row.id) ? 'selected' : ''}>
              {bulkActions.length > 0 && (
                <td>
                  <input
                    type="checkbox"
                    className="data-table-checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                  />
                </td>
              )}
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {filtered.length > pageSize && (
        <div className="data-table-pagination">
          <span>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select className="data-table-page-size" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <div className="data-table-pagination-buttons">
              <button className="data-table-pagination-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = page < 3 ? i : page - 2 + i
                if (p >= totalPages) return null
                return (
                  <button key={p} className={`data-table-pagination-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>
                    {p + 1}
                  </button>
                )
              })}
              <button className="data-table-pagination-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

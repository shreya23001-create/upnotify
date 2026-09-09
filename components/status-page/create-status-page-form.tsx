'use client'

import { useState, useTransition, useMemo } from 'react'
import { createStatusPageAction } from '@/app/(dashboard)/dashboard/status-pages/actions'
import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import type { Monitor } from '@/lib/types'

function extractDomain(monitorName: string): string {
  const parts = monitorName.split(' — ')
  return parts.length > 1 ? parts[0].trim() : monitorName
}

export function CreateStatusPageForm({ monitors }: { monitors: Monitor[] }) {
  const [name, setName] = useState('')
  const [selectedMonitors, setSelectedMonitors] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [domainFilter, setDomainFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const domains = useMemo(() => {
    const seen = new Set<string>()
    for (const m of monitors) {
      seen.add(extractDomain(m.name))
    }
    return Array.from(seen).sort()
  }, [monitors])

  const showDomainFilters = domains.length > 1

  const filteredMonitors = useMemo(() => {
    let result = monitors
    if (domainFilter) {
      result = result.filter(m => extractDomain(m.name) === domainFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(m => m.name.toLowerCase().includes(q))
    }
    return result
  }, [monitors, domainFilter, search])

  function toggleMonitor(id: string): void {
    setSelectedMonitors(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function selectAll(): void {
    setSelectedMonitors(prev => {
      const next = new Set(prev)
      for (const m of filteredMonitors) next.add(m.id)
      return next
    })
  }

  function deselectAll(): void {
    setSelectedMonitors(prev => {
      const next = new Set(prev)
      for (const m of filteredMonitors) next.delete(m.id)
      return next
    })
  }

  const filteredSelectedCount = filteredMonitors.filter(m => selectedMonitors.has(m.id)).length
  const allFilteredSelected = filteredMonitors.length > 0 && filteredSelectedCount === filteredMonitors.length

  function handleSubmit(formData: FormData): void {
    setError(null)
    if (selectedMonitors.size === 0) {
      setError('Please select at least one monitor to display on this status page.')
      return
    }
    formData.set('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    formData.set('monitor_ids', Array.from(selectedMonitors).join(','))
    startTransition(async () => {
      const result = await createStatusPageAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label className="form-label">Page Name</label>
        <input className="form-input" name="name" required value={name} onChange={e => setName(e.target.value)} placeholder="My Service Status" disabled={isPending} />
      </div>

      <div className="form-group">
        <label className="form-label">Slug (URL)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>/status/</span>
          <input className="form-input" name="slug" value={name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')} readOnly style={{ flex: 1, background: 'var(--bg-muted)' }} />
        </div>
      </div>

      <div className="form-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label className="form-label" style={{ margin: 0 }}>Select Monitors</label>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {selectedMonitors.size} of {monitors.length} selected
          </span>
        </div>

        {monitors.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No monitors available. Create monitors first.</p>
        ) : (
          <>
            {/* Search */}
            <input
              className="form-input"
              type="text"
              placeholder="Search monitors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: 10 }}
            />

            {/* Domain filter pills */}
            {showDomainFilters && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setDomainFilter(null)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                    background: domainFilter === null ? '#1392FB' : 'transparent',
                    color: domainFilter === null ? '#fff' : 'var(--text-secondary)',
                    borderColor: domainFilter === null ? '#1392FB' : 'var(--border-input)',
                    transition: 'all 0.15s',
                  }}
                >
                  All
                </button>
                {domains.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDomainFilter(domainFilter === d ? null : d)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                      background: domainFilter === d ? '#1392FB' : 'transparent',
                      color: domainFilter === d ? '#fff' : 'var(--text-secondary)',
                      borderColor: domainFilter === d ? '#1392FB' : 'var(--border-input)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            {/* Select / Deselect all toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <button
                type="button"
                onClick={allFilteredSelected ? deselectAll : selectAll}
                style={{
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none',
                  color: '#1392FB', padding: 0, textDecoration: 'underline',
                }}
              >
                {allFilteredSelected ? 'Deselect all' : 'Select all'}
                {domainFilter || search.trim() ? ' (filtered)' : ''}
              </button>
              {filteredSelectedCount > 0 && !allFilteredSelected && (
                <>
                  <span style={{ color: 'var(--border-input)' }}>·</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    style={{
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none',
                      color: 'var(--text-secondary)', padding: 0, textDecoration: 'underline',
                    }}
                  >
                    Deselect {filteredSelectedCount}
                  </button>
                </>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-secondary)' }}>
                {filteredMonitors.length} monitor{filteredMonitors.length !== 1 ? 's' : ''}
                {(domainFilter || search.trim()) ? ' shown' : ''}
              </span>
            </div>

            {/* Monitor list */}
            <div style={{ display: 'grid', gap: 6, maxHeight: 400, overflowY: 'auto', paddingRight: 2 }}>
              {filteredMonitors.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '8px 0' }}>No monitors match your filter.</p>
              ) : (
                filteredMonitors.map(m => (
                  <label key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    border: selectedMonitors.has(m.id) ? '2px solid #1392FB' : '1.5px solid var(--border-input)',
                    borderRadius: 10, cursor: 'pointer', background: selectedMonitors.has(m.id) ? 'var(--bg-hover)' : 'var(--bg-card)',
                    transition: 'all 0.15s',
                  }}>
                    <input type="checkbox" checked={selectedMonitors.has(m.id)} onChange={() => toggleMonitor(m.id)} style={{ accentColor: '#1392FB' }} />
                    <MonitorTypeIcon type={m.type} />
                    <span style={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                    <span className={`badge ${m.status === 'up' ? 'badge-success' : m.status === 'down' ? 'badge-danger' : 'badge-outline'}`} style={{ flexShrink: 0 }}>
                      {m.status}
                    </span>
                  </label>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Published</label>
        <select className="form-select" name="is_published" disabled={isPending}>
          <option value="true">Published — visible to public</option>
          <option value="false">Draft — only visible to you</option>
        </select>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isPending} style={{ marginTop: 8 }}>
        {isPending ? 'Creating...' : 'Create Status Page'}
      </button>
    </form>
  )
}

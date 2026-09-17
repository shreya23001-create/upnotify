'use client'

import { useState, useTransition, useMemo } from 'react'
import { createStatusPageAction } from '@/app/(dashboard)/dashboard/status-pages/actions'
import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import { Plus, X, Search, CheckCircle2 } from 'lucide-react'
import type { Monitor } from '@/lib/types'

const STATUS_DOT: Record<string, string> = {
  up:       '#10b981',
  down:     '#ef4444',
  degraded: '#f59e0b',
  paused:   '#94a3b8',
}

export function CreateStatusPageForm({ monitors }: { monitors: Monitor[] }) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function add(id: string): void {
    setSelected(prev => new Set([...prev, id]))
  }

  function remove(id: string): void {
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const available = useMemo(() =>
    monitors.filter(m => {
      if (selected.has(m.id)) return false
      if (!search) return true
      const q = search.toLowerCase()
      return m.name.toLowerCase().includes(q) || m.type.toLowerCase().includes(q)
    }),
    [monitors, selected, search]
  )

  const addedMonitors = useMemo(() =>
    monitors.filter(m => selected.has(m.id)),
    [monitors, selected]
  )

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  function handleSubmit(formData: FormData): void {
    setError(null)
    if (selected.size === 0) {
      setError('Please select at least one monitor to display on this status page.')
      return
    }
    formData.set('slug', slug)
    formData.set('monitor_ids', Array.from(selected).join(','))
    startTransition(async () => {
      const result = await createStatusPageAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      {/* ── Top: settings (full width) ── */}
      <div className="esp-settings esp-settings-full">
        <div className="esp-section-title">Page Settings</div>

        <div className="form-group">
          <label className="form-label">Page Name</label>
          <input className="form-input" name="name" required value={name} onChange={e => setName(e.target.value)} placeholder="My Service Status" disabled={isPending} />
        </div>

        <div className="form-group">
          <label className="form-label">Slug (URL)</label>
          <div className="esp-slug-wrap">
            <span className="esp-slug-prefix">/status/</span>
            <input className="form-input esp-slug-input" name="slug" value={slug} readOnly disabled={isPending} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Visibility</label>
          <select className="form-select" name="is_published" disabled={isPending}>
            <option value="true">Published — visible to public</option>
            <option value="false">Draft — only visible to you</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary esp-save-btn" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create Status Page'}
        </button>
      </div>

      {monitors.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No monitors available. Create monitors first.</p>
      ) : (
        /* ── Bottom: monitors, 2-column ── */
        <div className="esp-layout">

          {/* Left: monitors added to this page */}
          <div className="esp-picker">
            <div className="esp-section-title">
              Monitors on this page
              <span className="esp-count-pill">{selected.size}</span>
            </div>

            <div className="esp-added">
              {addedMonitors.length === 0 ? (
                <div className="esp-added-empty">
                  <CheckCircle2 size={20} strokeWidth={1.5} />
                  <span>No monitors added yet</span>
                </div>
              ) : (
                addedMonitors.map(m => (
                  <div key={m.id} className="esp-added-row">
                    <div className="esp-added-icon">
                      <MonitorTypeIcon type={m.type} iconOnly iconSize={14} />
                    </div>
                    <span className="esp-added-name">{m.name}</span>
                    <span
                      className="esp-added-dot"
                      style={{ background: STATUS_DOT[m.status] ?? STATUS_DOT.paused }}
                      title={m.status}
                    />
                    <button
                      type="button"
                      className="esp-remove-btn"
                      onClick={() => remove(m.id)}
                      disabled={isPending}
                      aria-label={`Remove ${m.name}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: add monitors */}
          <div className="esp-picker">
            <div className="esp-section-title">Add monitors</div>

            <div className="esp-search-wrap">
              <Search size={14} className="esp-search-icon" />
              <input
                className="esp-search"
                type="text"
                placeholder="Search by name or type…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="esp-available">
              {available.length === 0 ? (
                <div className="esp-available-empty">
                  {monitors.length === selected.size
                    ? 'All monitors are already added.'
                    : 'No monitors match your search.'}
                </div>
              ) : (
                available.map(m => (
                  <div key={m.id} className="esp-avail-row">
                    <div className="esp-avail-icon">
                      <MonitorTypeIcon type={m.type} iconOnly iconSize={14} />
                    </div>
                    <div className="esp-avail-info">
                      <span className="esp-avail-name">{m.name}</span>
                      <span className="esp-avail-type">{m.type}</span>
                    </div>
                    <span
                      className="esp-added-dot"
                      style={{ background: STATUS_DOT[m.status] ?? STATUS_DOT.paused }}
                      title={m.status}
                    />
                    <button
                      type="button"
                      className="esp-add-btn"
                      onClick={() => add(m.id)}
                      disabled={isPending}
                      aria-label={`Add ${m.name}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </form>
  )
}

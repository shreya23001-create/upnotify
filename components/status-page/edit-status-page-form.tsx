'use client'

import { useState, useTransition, useMemo } from 'react'
import { updateStatusPageAction } from '@/app/(dashboard)/dashboard/status-pages/actions'
import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import { Plus, X, Search, Globe, CheckCircle2 } from 'lucide-react'
import type { StatusPage, Monitor } from '@/lib/types'

const STATUS_DOT: Record<string, string> = {
  up:       '#10b981',
  down:     '#ef4444',
  degraded: '#f59e0b',
  paused:   '#94a3b8',
}

export function EditStatusPageForm({ statusPage, monitors }: { statusPage: StatusPage; monitors: Monitor[] }) {
  const existingIds = new Set((statusPage.monitor_ids || []) as string[])
  const [selected, setSelected] = useState<Set<string>>(existingIds)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function add(id: string): void {
    setSelected(prev => new Set([...prev, id]))
  }

  function remove(id: string): void {
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  function handleSubmit(formData: FormData): void {
    setError(null)
    formData.set('monitor_ids', Array.from(selected).join(','))
    startTransition(async () => {
      const result = await updateStatusPageAction(statusPage.id, formData)
      if (result?.error) setError(result.error)
    })
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

  return (
    <form action={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      {/* ── Top: settings (full width) ── */}
      <div className="esp-settings esp-settings-full">
        <div className="esp-section-title">Page Settings</div>

        <div className="form-group">
          <label className="form-label">Page Name</label>
          <input className="form-input" name="name" required defaultValue={statusPage.name} disabled={isPending} />
        </div>

        <div className="form-group">
          <label className="form-label">Slug (URL)</label>
          <div className="esp-slug-wrap">
            <span className="esp-slug-prefix">/status/</span>
            <input
              className="form-input esp-slug-input"
              name="slug"
              required
              defaultValue={statusPage.slug}
              disabled={isPending}
            />
          </div>
          <span className="form-hint">
            Public URL: upnotify-monitoring.vercel.app/status/{statusPage.slug}
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Visibility</label>
          <select className="form-select" name="is_published" defaultValue={statusPage.is_published ? 'true' : 'false'} disabled={isPending}>
            <option value="true">Published — visible to everyone</option>
            <option value="false">Draft — only you can see it</option>
          </select>
        </div>

        <div className="esp-preview-link">
          <Globe size={13} />
          <a href={`/status/${statusPage.slug}`} target="_blank" rel="noopener noreferrer">
            Preview status page ↗
          </a>
        </div>

        <button type="submit" className="btn btn-primary esp-save-btn" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* ── Bottom: monitors, 2-column ── */}
      <div className="esp-layout">

        {/* Left: monitors already on this page */}
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

          {/* Search */}
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

          {/* Available monitors */}
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
    </form>
  )
}

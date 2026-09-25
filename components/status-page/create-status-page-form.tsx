'use client'

import { useState, useTransition, useMemo } from 'react'
import { createStatusPageAction } from '@/app/(dashboard)/dashboard/status-pages/actions'
import { Plus, X, Search, Globe, CheckCircle2 } from 'lucide-react'
import type { Monitor } from '@/lib/types'

const STATUS_DOT: Record<string, string> = {
  up:       '#10b981',
  down:     '#ef4444',
  degraded: '#f59e0b',
  paused:   '#94a3b8',
}

interface WebsiteGroup {
  domain: string
  monitors: Monitor[]
}

function monitorDomain(m: Monitor): string {
  return (m as unknown as { target_domain: string | null }).target_domain?.trim() || 'Other'
}

function groupByWebsite(monitors: Monitor[]): WebsiteGroup[] {
  const groups = new Map<string, Monitor[]>()
  for (const m of monitors) {
    const key = monitorDomain(m)
    const list = groups.get(key)
    if (list) list.push(m)
    else groups.set(key, [m])
  }
  return Array.from(groups.entries())
    .map(([domain, list]) => ({ domain, monitors: list }))
    .sort((a, b) => a.domain.localeCompare(b.domain))
}

/** Worst status among a website's monitors, for the group's summary dot. */
function worstDot(monitors: Monitor[]): string {
  if (monitors.some(m => m.status === 'down')) return STATUS_DOT.down
  if (monitors.some(m => m.status === 'degraded')) return STATUS_DOT.degraded
  if (monitors.some(m => m.status === 'paused')) return STATUS_DOT.paused
  return STATUS_DOT.up
}

export function CreateStatusPageForm({ monitors }: { monitors: Monitor[] }) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function addWebsite(group: WebsiteGroup): void {
    setSelected(prev => new Set([...prev, ...group.monitors.map(m => m.id)]))
  }

  function removeWebsite(group: WebsiteGroup): void {
    const ids = new Set(group.monitors.map(m => m.id))
    setSelected(prev => new Set(Array.from(prev).filter(id => !ids.has(id))))
  }

  const allGroups = useMemo(() => groupByWebsite(monitors), [monitors])

  const addedGroups = useMemo(() =>
    allGroups
      .map(g => ({ domain: g.domain, monitors: g.monitors.filter(m => selected.has(m.id)) }))
      .filter(g => g.monitors.length > 0),
    [allGroups, selected]
  )

  const availableGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allGroups
      .map(g => ({ domain: g.domain, monitors: g.monitors.filter(m => !selected.has(m.id)) }))
      .filter(g => g.monitors.length > 0)
      .filter(g => !q || g.domain.toLowerCase().includes(q))
  }, [allGroups, selected, search])

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  function handleSubmit(formData: FormData): void {
    setError(null)
    if (selected.size === 0) {
      setError('Please select at least one website to display on this status page.')
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

        <div className="esp-settings-row">
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
        </div>

        <div className="esp-settings-row">
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
      </div>

      {monitors.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No monitors available. Create monitors first.</p>
      ) : (
        /* ── Bottom: websites, 2-column ── */
        <div className="esp-layout">

          {/* Left: websites added to this page */}
          <div className="esp-picker">
            <div className="esp-section-title">
              Websites on this page
              <span className="esp-count-pill">{selected.size}</span>
            </div>

            <div className="esp-added">
              {addedGroups.length === 0 ? (
                <div className="esp-added-empty">
                  <CheckCircle2 size={20} strokeWidth={1.5} />
                  <span>No websites added yet</span>
                </div>
              ) : (
                addedGroups.map(g => (
                  <div key={g.domain} className="esp-added-row">
                    <div className="esp-added-icon">
                      <Globe size={14} />
                    </div>
                    <span className="esp-added-name">{g.domain}</span>
                    <span className="esp-avail-type">{g.monitors.length} monitor{g.monitors.length === 1 ? '' : 's'}</span>
                    <span
                      className="esp-added-dot"
                      style={{ background: worstDot(g.monitors) }}
                    />
                    <button
                      type="button"
                      className="esp-remove-btn"
                      onClick={() => removeWebsite(g)}
                      disabled={isPending}
                      aria-label={`Remove ${g.domain}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: add websites */}
          <div className="esp-picker">
            <div className="esp-section-title">Add websites</div>

            <div className="esp-search-wrap">
              <Search size={14} className="esp-search-icon" />
              <input
                className="esp-search"
                type="text"
                placeholder="Search by website…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="esp-available">
              {availableGroups.length === 0 ? (
                <div className="esp-available-empty">
                  {allGroups.every(g => g.monitors.every(m => selected.has(m.id)))
                    ? 'All websites are already added.'
                    : 'No websites match your search.'}
                </div>
              ) : (
                availableGroups.map(g => (
                  <div key={g.domain} className="esp-avail-row">
                    <div className="esp-avail-icon">
                      <Globe size={14} />
                    </div>
                    <div className="esp-avail-info">
                      <span className="esp-avail-name">{g.domain}</span>
                      <span className="esp-avail-type">{g.monitors.length} monitor{g.monitors.length === 1 ? '' : 's'}</span>
                    </div>
                    <span
                      className="esp-added-dot"
                      style={{ background: worstDot(g.monitors) }}
                    />
                    <button
                      type="button"
                      className="esp-add-btn"
                      onClick={() => addWebsite(g)}
                      disabled={isPending}
                      aria-label={`Add ${g.domain}`}
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

'use client'

import { useState, useTransition } from 'react'
import { createStatusPageAction } from '@/app/(dashboard)/dashboard/status-pages/actions'
import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import type { Monitor } from '@/lib/types'

export function CreateStatusPageForm({ monitors }: { monitors: Monitor[] }) {
  const [name, setName] = useState('')
  const [selectedMonitors, setSelectedMonitors] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleMonitor(id: string): void {
    setSelectedMonitors(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

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
          <span style={{ color: '#94a3b8', fontSize: 14 }}>/status/</span>
          <input className="form-input" name="slug" value={name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')} readOnly style={{ flex: 1, background: 'var(--bg-muted)' }} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Select Monitors</label>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Choose which monitors to display on this status page</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {monitors.map(m => (
            <label key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              border: selectedMonitors.has(m.id) ? '2px solid #667eea' : '1.5px solid var(--border-input)',
              borderRadius: 10, cursor: 'pointer', background: selectedMonitors.has(m.id) ? 'var(--bg-hover)' : 'var(--bg-card)',
              transition: 'all 0.15s',
            }}>
              <input type="checkbox" checked={selectedMonitors.has(m.id)} onChange={() => toggleMonitor(m.id)} style={{ accentColor: '#667eea' }} />
              <MonitorTypeIcon type={m.type} />
              <span style={{ fontWeight: 500 }}>{m.name}</span>
              <span className={`badge ${m.status === 'up' ? 'badge-success' : m.status === 'down' ? 'badge-danger' : 'badge-outline'}`} style={{ marginLeft: 'auto' }}>
                {m.status}
              </span>
            </label>
          ))}
        </div>
        {monitors.length === 0 && <p style={{ color: '#94a3b8', fontSize: 14 }}>No monitors available. Create monitors first.</p>}
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

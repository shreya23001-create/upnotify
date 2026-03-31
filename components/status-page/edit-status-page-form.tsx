'use client'

import { useState, useTransition } from 'react'
import { updateStatusPageAction } from '@/app/(dashboard)/dashboard/status-pages/actions'
import { MonitorTypeIcon } from '@/components/monitors/monitor-type-icon'
import type { StatusPage, Monitor } from '@/lib/types'

export function EditStatusPageForm({ statusPage, monitors }: { statusPage: StatusPage; monitors: Monitor[] }) {
  const existingMonitorIds = new Set((statusPage.monitor_ids || []) as string[])
  const [selectedMonitors, setSelectedMonitors] = useState<Set<string>>(existingMonitorIds)
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
    formData.set('monitor_ids', Array.from(selectedMonitors).join(','))
    startTransition(async () => {
      const result = await updateStatusPageAction(statusPage.id, formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label className="form-label">Page Name</label>
        <input className="form-input" name="name" required defaultValue={statusPage.name} disabled={isPending} />
      </div>

      <div className="form-group">
        <label className="form-label">Slug (URL)</label>
        <input className="form-input" name="slug" required defaultValue={statusPage.slug} disabled={isPending} />
      </div>

      <div className="form-group">
        <label className="form-label">Select Monitors</label>
        <div style={{ display: 'grid', gap: 8 }}>
          {monitors.map(m => (
            <label key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              border: selectedMonitors.has(m.id) ? '2px solid #667eea' : '1.5px solid #e2e8f0',
              borderRadius: 10, cursor: 'pointer', background: selectedMonitors.has(m.id) ? '#f0f4ff' : '#fff',
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
      </div>

      <div className="form-group">
        <label className="form-label">Published</label>
        <select className="form-select" name="is_published" defaultValue={statusPage.is_published ? 'true' : 'false'} disabled={isPending}>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isPending} style={{ marginTop: 8 }}>
        {isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

'use client'

import { useState, useCallback } from 'react'
import type { PublicMonitor } from '@/lib/db/public-monitors'
import {
  addTrackedSiteAction,
  updateTrackedSiteAction,
  toggleTrackedSiteAction,
  deleteTrackedSiteAction,
} from '@/app/(admin)/admin/tracker/actions'

interface TrackerManagerProps {
  monitors: PublicMonitor[]
}

type EditingMonitor = PublicMonitor | null

function getStatusColor(status: string): string {
  if (status === 'up') return 'var(--color-success, #22c55e)'
  if (status === 'down') return 'var(--color-danger, #ef4444)'
  if (status === 'degraded') return 'var(--color-warning, #f59e0b)'
  return 'var(--text-muted, #94a3b8)'
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const PAGE_SIZE = 25

export function TrackerManager({ monitors }: TrackerManagerProps): React.ReactElement {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<EditingMonitor>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<keyof PublicMonitor>('display_name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const clearMessages = useCallback((): void => {
    setError(null)
    setSuccess(null)
  }, [])

  const handleAdd = useCallback(async (formData: FormData): Promise<void> => {
    clearMessages()
    setSaving(true)
    const result = await addTrackedSiteAction(formData)
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to add site')
    } else {
      setSuccess('Site added successfully')
      setShowAdd(false)
    }
  }, [clearMessages])

  const handleUpdate = useCallback(async (formData: FormData): Promise<void> => {
    clearMessages()
    setSaving(true)
    const result = await updateTrackedSiteAction(formData)
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to update site')
    } else {
      setSuccess('Site updated successfully')
      setEditing(null)
    }
  }, [clearMessages])

  const handleToggle = useCallback(async (id: string, currentActive: boolean): Promise<void> => {
    clearMessages()
    const result = await toggleTrackedSiteAction(id, !currentActive)
    if (!result.success) {
      setError(result.error ?? 'Failed to toggle site')
    } else {
      setSuccess(`Site ${!currentActive ? 'activated' : 'deactivated'}`)
    }
  }, [clearMessages])

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    clearMessages()
    const result = await deleteTrackedSiteAction(id)
    if (!result.success) {
      setError(result.error ?? 'Failed to delete site')
    } else {
      setSuccess('Site deleted')
    }
    setDeleteConfirmId(null)
  }, [clearMessages])

  const filteredMonitors = (filter
    ? monitors.filter(m =>
        m.domain.toLowerCase().includes(filter.toLowerCase()) ||
        m.display_name.toLowerCase().includes(filter.toLowerCase()) ||
        m.category.toLowerCase().includes(filter.toLowerCase())
      )
    : monitors
  ).slice().sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function handleSort(key: keyof PublicMonitor): void {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  function SortIcon({ col }: { col: keyof PublicMonitor }): React.ReactElement {
    if (sortKey !== col) return <span style={{ opacity: 0.3, marginLeft: 3 }}>↕</span>
    return <span style={{ marginLeft: 3 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const totalPages = Math.ceil(filteredMonitors.length / PAGE_SIZE)
  const paginatedMonitors = filteredMonitors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset to page 1 when filter changes
  const handleFilterChange = (value: string): void => {
    setFilter(value)
    setPage(1)
  }

  return (
    <div>
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <div className="card-header-row" style={{ marginBottom: 16 }}>
        <input
          type="text"
          className="form-input"
          placeholder="Filter by domain, name, or category..."
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setShowAdd(true); setEditing(null); clearMessages() }}
        >
          Add Site
        </button>
      </div>

      {/* Add site form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add Tracked Site</h3>
          <form action={handleAdd}>
            <div className="plans-form-grid">
              <div className="form-group">
                <label className="form-label">Domain</label>
                <input className="form-input" name="domain" placeholder="example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input className="form-input" name="display_name" placeholder="Example" required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" name="category" placeholder="Cloud & Hosting" defaultValue="Other" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Adding...' : 'Add Site'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="plans-table-wrapper">
        <table className="plans-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('display_name')}>Site <SortIcon col="display_name" /></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>Category <SortIcon col="category" /></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('last_status')}>Status <SortIcon col="last_status" /></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('last_response_time_ms')}>Response <SortIcon col="last_response_time_ms" /></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('last_checked_at')}>Last Checked <SortIcon col="last_checked_at" /></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('is_active')}>Active <SortIcon col="is_active" /></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')}>Added <SortIcon col="created_at" /></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMonitors.map(m => (
              <tr key={m.id}>
                <td>
                  <span style={{ fontWeight: 600 }}>{m.display_name}</span>
                  <br />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {m.domain}
                    {' '}
                    <a
                      href={`/tracker/${m.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open public tracker page"
                      style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 11 }}
                    >
                      ↗
                    </a>
                  </span>
                </td>
                <td>
                  <span className="badge badge-outline">{m.category}</span>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: getStatusColor(m.last_status),
                        display: 'inline-block',
                      }}
                    />
                    {m.last_status}
                  </span>
                </td>
                <td>{m.last_response_time_ms !== null ? `${m.last_response_time_ms}ms` : '—'}</td>
                <td>{formatTimeAgo(m.last_checked_at)}</td>
                <td>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={m.is_active}
                      onChange={() => handleToggle(m.id, m.is_active)}
                    />
                    <span className="switch-slider" />
                  </label>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setEditing(m); setShowAdd(false); clearMessages() }}
                    >
                      Edit
                    </button>
                    {deleteConfirmId === m.id ? (
                      <>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                          Confirm
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirmId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setDeleteConfirmId(m.id); clearMessages() }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginatedMonitors.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                  {filter ? 'No sites match your filter.' : 'No tracked sites yet. Add one above.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredMonitors.length)} of {filteredMonitors.length} sites
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span style={{ padding: '6px 12px', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="plans-modal-overlay" onClick={() => setEditing(null)}>
          <div className="plans-modal plans-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="plans-modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit: {editing.display_name}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Close</button>
            </div>
            <form action={handleUpdate} className="plans-modal-body">
              <input type="hidden" name="id" value={editing.id} />
              <div className="form-group">
                <label className="form-label">Domain</label>
                <input className="form-input" name="domain" defaultValue={editing.domain} required />
              </div>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input className="form-input" name="display_name" defaultValue={editing.display_name} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" name="category" defaultValue={editing.category} />
              </div>
              <div className="plans-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'

interface AuditEntry {
  id: string
  org_id: string | null
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  user_email?: string
}

const PAGE_SIZE = 30

// canWrite unused — audit log is read-only by nature, prop accepted for API consistency
export function AdminAuditLogClientPage({ canWrite: _canWrite = true }: { canWrite?: boolean }): React.ReactElement {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (filter) params.set('action', filter)
      const res = await fetch(`/api/admin/audit-log?${params}`)
      if (res.ok) {
        const data = await res.json() as { success: boolean; logs: AuditEntry[]; total: number }
        if (data.success) {
          setLogs(data.logs)
          setTotal(data.total)
        }
      }
    } catch {
      // Silently ignore
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <h1 className="admin-page-title">Audit Log</h1>
      <p className="admin-page-subtitle">
        Immutable record of all user and admin actions on the platform.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          className="form-input"
          placeholder="Filter by action (e.g. monitor.created, team.invite_created)"
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1) }}
          style={{ maxWidth: 400 }}
        />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} entries</span>
      </div>

      <div className="card">
        <div className="card-content" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p>
          ) : logs.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No audit log entries found.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>IP</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleDateString('en-GB')}
                        {' '}
                        {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontSize: 12 }}>{log.user_email ?? log.user_id?.slice(0, 8) ?? '\u2014'}</td>
                      <td>
                        <span className="badge badge-outline" style={{ fontSize: 11 }}>{log.action}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {log.resource_type ? `${log.resource_type}` : '\u2014'}
                        {log.resource_id ? ` / ${log.resource_id.slice(0, 8)}` : ''}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {log.ip_address ?? '\u2014'}
                      </td>
                      <td style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : '\u2014'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

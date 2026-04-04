'use client'

import { useState, useEffect, useCallback } from 'react'

interface AdminMonitor {
  id: string
  name: string
  type: string
  status: string
  severity: string
  lastCheckedAt: string | null
  orgId: string
  orgName: string
  responseTimeMs: number | null
  isPaused: boolean
}

interface Summary {
  total: number
  up: number
  down: number
  degraded: number
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const STATUS_DOT_COLORS: Record<string, string> = {
  up: '#22c55e',
  down: '#ef4444',
  degraded: '#f97316',
  paused: '#6b7280',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatResponseTime(ms: number | null): string {
  if (ms === null || ms === undefined) return '--'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function MonitoringOverview(): React.ReactElement {
  const [monitors, setMonitors] = useState<AdminMonitor[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, up: 0, down: 0, degraded: 0 })
  const [pagination, setPagination] = useState<Pagination>({ page: 0, pageSize: 25, total: 0, totalPages: 0 })
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchMonitors = useCallback(async (page: number, status: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '25',
        status,
      })
      const res = await fetch(`/api/admin/monitors?${params}`)
      if (!res.ok) return
      const data = await res.json() as {
        success: boolean
        monitors: AdminMonitor[]
        summary: Summary
        pagination: Pagination
      }
      if (data.success) {
        setMonitors(data.monitors)
        setSummary(data.summary)
        setPagination(data.pagination)
      }
    } catch {
      // Silently handle
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMonitors(0, statusFilter)
  }, [fetchMonitors, statusFilter])

  function handleFilterChange(newStatus: string): void {
    setStatusFilter(newStatus)
  }

  function handlePageChange(newPage: number): void {
    fetchMonitors(newPage, statusFilter)
  }

  return (
    <div className="admin-monitoring-overview" style={{ marginTop: 32 }}>
      <h2 className="admin-section-title">Monitoring Overview</h2>

      {/* Summary stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 16 }}>
        <div
          className={`admin-stat-card admin-stat-card-clickable${statusFilter === 'all' ? ' admin-stat-card-selected' : ''}`}
          onClick={() => handleFilterChange('all')}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-stat-info">
            <span className="admin-stat-number">{summary.total}</span>
            <span className="admin-stat-label">Total Monitors</span>
          </div>
        </div>
        <div
          className={`admin-stat-card admin-stat-card-clickable${statusFilter === 'up' ? ' admin-stat-card-selected' : ''}`}
          onClick={() => handleFilterChange('up')}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-stat-info">
            <span className="admin-stat-number" style={{ color: '#22c55e' }}>{summary.up}</span>
            <span className="admin-stat-label">Up</span>
          </div>
        </div>
        <div
          className={`admin-stat-card admin-stat-card-clickable${statusFilter === 'down' ? ' admin-stat-card-selected' : ''}`}
          onClick={() => handleFilterChange('down')}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-stat-info">
            <span className="admin-stat-number" style={{ color: '#ef4444' }}>{summary.down}</span>
            <span className="admin-stat-label">Down</span>
          </div>
        </div>
        <div
          className={`admin-stat-card admin-stat-card-clickable${statusFilter === 'degraded' ? ' admin-stat-card-selected' : ''}`}
          onClick={() => handleFilterChange('degraded')}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-stat-info">
            <span className="admin-stat-number" style={{ color: '#f97316' }}>{summary.degraded}</span>
            <span className="admin-stat-label">Degraded</span>
          </div>
        </div>
      </div>

      {/* Monitors table */}
      {loading ? (
        <div className="empty-state">
          <p>Loading monitors...</p>
        </div>
      ) : monitors.length === 0 ? (
        <div className="empty-state">
          <p>No monitors found.</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Monitor Name</th>
                  <th>Org</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Response Time</th>
                  <th>Last Checked</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {monitors.map(m => (
                  <tr key={m.id}>
                    <td>
                      <span className="monitor-name-cell">{m.name}</span>
                    </td>
                    <td className="table-cell-muted">{m.orgName}</td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                      }}>
                        {m.type.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: STATUS_DOT_COLORS[m.isPaused ? 'paused' : m.status] || '#6b7280',
                        }} />
                        {m.isPaused ? 'Paused' : m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell-muted">
                      {formatResponseTime(m.responseTimeMs)}
                    </td>
                    <td className="table-cell-muted">
                      {formatDate(m.lastCheckedAt)}
                    </td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: m.severity === 'p1' ? '#fef2f2' : m.severity === 'p2' ? '#fff7ed' : m.severity === 'p3' ? '#fefce8' : '#f9fafb',
                        color: m.severity === 'p1' ? '#ef4444' : m.severity === 'p2' ? '#f97316' : m.severity === 'p3' ? '#eab308' : '#6b7280',
                        border: `1px solid ${m.severity === 'p1' ? '#fecaca' : m.severity === 'p2' ? '#fed7aa' : m.severity === 'p3' ? '#fef08a' : '#e5e7eb'}`,
                      }}>
                        {(m.severity || 'P4').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="admin-pagination" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 16, padding: '8px 0',
            }}>
              <span className="table-cell-muted" style={{ fontSize: 13 }}>
                Showing {pagination.page * pagination.pageSize + 1}
                {' '}-{' '}
                {Math.min((pagination.page + 1) * pagination.pageSize, pagination.total)}
                {' '}of {pagination.total}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={pagination.page === 0}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={pagination.page >= pagination.totalPages - 1}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

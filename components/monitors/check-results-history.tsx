'use client'

import { DataTable, type Column } from '@/components/ui/data-table'
import type { CheckResult } from '@/lib/types'

export function CheckResultsHistory({ results }: { results: CheckResult[] }) {
  const columns: Column<CheckResult>[] = [
    { key: 'checked_at', label: 'Time', render: (r) => <span className="table-muted">{new Date(r.checked_at).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (r) => (
      <span className={`badge ${r.status === 'up' ? 'badge-success' : r.status === 'down' ? 'badge-danger' : 'badge-warning'}`}>
        {r.status}
      </span>
    )},
    { key: 'response_time_ms', label: 'Response Time', render: (r) => r.response_time_ms ? `${r.response_time_ms}ms` : '—' },
    { key: 'status_code', label: 'Status Code', render: (r) => r.status_code != null ? String(r.status_code) : '—' },
    { key: 'error_message', label: 'Error', render: (r) => <span className="table-muted table-truncate">{r.error_message ?? '—'}</span> },
  ]

  const filters = [
    { key: 'status', label: 'All Statuses', options: [
      { label: 'Up', value: 'up' },
      { label: 'Down', value: 'down' },
      { label: 'Degraded', value: 'degraded' },
    ]},
  ]

  return (
    <div className="card">
      <div className="card-header"><div className="card-title">Check History</div></div>
      <div className="card-content">
        <DataTable
          columns={columns}
          data={results}
          searchPlaceholder="Search results..."
          filters={filters}
          pageSize={10}
          emptyMessage="No check results yet. The first check will run shortly."
        />
      </div>
    </div>
  )
}

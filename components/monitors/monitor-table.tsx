'use client'

import Link from 'next/link'
import { MonitorStatusBadge } from './monitor-status-badge'
import type { Monitor } from '@/lib/types'

export function MonitorTable({ monitors }: { monitors: Monitor[] }) {
  if (monitors.length === 0) {
    return <div className="empty-state"><p>No monitors yet. Create your first monitor to get started.</p></div>
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Target</th>
          <th>Status</th>
          <th>Last Checked</th>
        </tr>
      </thead>
      <tbody>
        {monitors.map((monitor) => (
          <tr key={monitor.id}>
            <td><Link href={`/dashboard/monitors/${monitor.id}`} className="table-link">{monitor.name}</Link></td>
            <td style={{ textTransform: 'capitalize' }}>{monitor.type}</td>
            <td className="table-truncate table-muted">{monitor.target}</td>
            <td><MonitorStatusBadge status={monitor.status} /></td>
            <td className="table-muted">{monitor.last_checked_at ? new Date(monitor.last_checked_at).toLocaleString() : 'Never'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

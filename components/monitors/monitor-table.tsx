'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import { MonitorStatusBadge } from './monitor-status-badge'
import { UptimeBar } from './uptime-bar'
import { MonitorTypeIcon } from './monitor-type-icon'
import { pauseMonitorAction, resumeMonitorAction, deleteMonitorAction } from '@/app/(dashboard)/dashboard/monitors/actions'
import type { Monitor } from '@/lib/types'

interface UptimeSlot { slot: string; status: 'up' | 'down' | 'degraded' | 'none' }

interface MonitorTableProps {
  monitors: Monitor[]
  uptimeData: Record<string, UptimeSlot[]>
}

export function MonitorTable({ monitors, uptimeData }: MonitorTableProps) {
  const [isPending, startTransition] = useTransition()

  function handlePauseResume(id: string, isPaused: boolean): void {
    startTransition(async () => {
      if (isPaused) {
        await resumeMonitorAction(id)
      } else {
        await pauseMonitorAction(id)
      }
    })
  }

  function handleDelete(id: string): void {
    if (!confirm('Delete this monitor? All check history will be lost.')) return
    startTransition(async () => {
      await deleteMonitorAction(id)
    })
  }

  const columns: Column<Monitor>[] = [
    { key: 'type', label: 'Type', render: (m) => <MonitorTypeIcon type={m.type} /> },
    { key: 'name', label: 'Name', render: (m) => <Link href={`/dashboard/monitors/${m.id}`} className="table-link">{m.name}</Link> },
    { key: 'uptime', label: 'Uptime (12h)', sortable: false, searchable: false, render: (m) => <UptimeBar slots={uptimeData[m.id] || []} /> },
    { key: 'status', label: 'Status', render: (m) => <MonitorStatusBadge status={m.status} /> },
    { key: 'last_checked_at', label: 'Last Checked', render: (m) => <span className="table-muted">{m.last_checked_at ? timeAgo(m.last_checked_at) : 'Never'}</span> },
    {
      key: 'actions',
      label: '',
      sortable: false,
      searchable: false,
      render: (m) => (
        <span style={{ display: 'flex', gap: 8 }}>
          <Link href={`/dashboard/monitors/${m.id}`} className="btn btn-sm btn-secondary">Edit</Link>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => handlePauseResume(m.id, m.is_paused)}
            disabled={isPending}
          >
            {m.is_paused ? 'Resume' : 'Pause'}
          </button>
          <button
            className="btn btn-sm btn-ghost"
            style={{ color: '#dc2626' }}
            onClick={() => handleDelete(m.id)}
            disabled={isPending}
          >
            Delete
          </button>
        </span>
      ),
    },
  ]

  const filters = [
    { key: 'status', label: 'All Statuses', options: [
      { label: 'Up', value: 'up' },
      { label: 'Down', value: 'down' },
      { label: 'Degraded', value: 'degraded' },
      { label: 'Paused', value: 'paused' },
      { label: 'Unknown', value: 'unknown' },
    ]},
    { key: 'type', label: 'All Types', options: [
      { label: 'HTTP', value: 'http' },
      { label: 'SSL', value: 'ssl' },
      { label: 'DNS', value: 'dns' },
      { label: 'Keyword', value: 'keyword' },
      { label: 'Domain', value: 'domain' },
      { label: 'Port', value: 'port' },
      { label: 'Ping', value: 'ping' },
      { label: 'API', value: 'api' },
      { label: 'Heartbeat', value: 'heartbeat' },
      { label: 'Competitor', value: 'competitor' },
    ]},
  ]

  const bulkActions: BulkAction[] = [
    { label: 'Pause', onClick: () => { /* TODO: bulk pause */ } },
    { label: 'Delete', onClick: () => { /* TODO: bulk delete */ }, variant: 'danger' },
  ]

  return (
    <DataTable
      columns={columns}
      data={monitors}
      searchPlaceholder="Search monitors..."
      filters={filters}
      bulkActions={bulkActions}
      emptyMessage="No monitors yet. Create your first monitor to get started."
    />
  )
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

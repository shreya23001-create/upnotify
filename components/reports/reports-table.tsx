'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import { deleteReportAction } from '@/app/(dashboard)/dashboard/reports/actions'
import type { Report } from '@/lib/types'

export function ReportsTable({ reports }: { reports: Report[] }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string): void {
    if (!confirm('Delete this report?')) return
    startTransition(async () => { await deleteReportAction(id) })
  }

  const columns: Column<Report>[] = [
    { key: 'type', label: 'Type', render: (r) => (
      <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{r.type.replace('_', ' ')}</span>
    )},
    { key: 'period_start', label: 'Period', render: (r) => (
      <span style={{ fontSize: 14 }}>{r.period_start} — {r.period_end}</span>
    )},
    { key: 'generated_at', label: 'Generated', render: (r) => (
      <span className="table-muted">{new Date(r.generated_at).toLocaleString()}</span>
    )},
    { key: 'ai_summary', label: 'AI Summary', sortable: false, searchable: false, render: (r) => (
      <span className="table-muted table-truncate" style={{ maxWidth: 200 }}>
        {r.ai_summary ? r.ai_summary.slice(0, 60) + '...' : 'No summary'}
      </span>
    )},
    { key: 'actions', label: '', sortable: false, searchable: false, render: (r) => (
      <span style={{ display: 'flex', gap: 8 }}>
        <Link href={`/dashboard/reports/${r.id}`} className="btn btn-sm btn-secondary">View</Link>
        <button className="btn btn-sm btn-ghost" style={{ color: '#dc2626' }} onClick={() => handleDelete(r.id)} disabled={isPending}>Delete</button>
      </span>
    )},
  ]

  const filters = [
    { key: 'type', label: 'All Types', options: [
      { label: 'Monthly', value: 'monthly' },
      { label: 'Custom', value: 'custom' },
      { label: 'On Demand', value: 'on_demand' },
    ]},
  ]

  async function handleBulkDelete(selectedIds: string[]): Promise<void> {
    if (!confirm(`Delete ${selectedIds.length} report(s)?`)) return
    startTransition(async () => {
      for (const id of selectedIds) {
        await deleteReportAction(id)
      }
    })
  }

  const bulkActions: BulkAction[] = [
    { label: 'Delete', onClick: handleBulkDelete, variant: 'danger' },
  ]

  return (
    <DataTable
      columns={columns}
      data={reports}
      searchPlaceholder="Search reports..."
      filters={filters}
      bulkActions={bulkActions}
      emptyMessage="No reports generated yet. Click Generate Report to create your first report."
    />
  )
}

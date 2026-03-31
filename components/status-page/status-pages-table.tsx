'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import { deleteStatusPageAction } from '@/app/(dashboard)/dashboard/status-pages/actions'
import type { StatusPage } from '@/lib/types'

export function StatusPagesTable({ pages }: { pages: StatusPage[] }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string): void {
    if (!confirm('Delete this status page?')) return
    startTransition(async () => { await deleteStatusPageAction(id) })
  }

  const columns: Column<StatusPage>[] = [
    { key: 'name', label: 'Name', render: (p) => <span style={{ fontWeight: 600 }}>{p.name}</span> },
    { key: 'slug', label: 'Public URL', render: (p) => (
      <a href={`/status/${p.slug}`} target="_blank" rel="noopener noreferrer" className="table-link" style={{ fontFamily: 'monospace', fontSize: 13 }}>
        /status/{p.slug}
      </a>
    )},
    { key: 'monitor_ids', label: 'Monitors', sortable: false, searchable: false, render: (p) => {
      const ids = (p.monitor_ids || []) as string[]
      return <span className="table-muted">{ids.length} monitors</span>
    }},
    { key: 'is_published', label: 'Status', render: (p) => (
      <span className={`badge ${p.is_published ? 'badge-success' : 'badge-outline'}`}>
        <span className={`status-dot ${p.is_published ? 'status-dot-up' : 'status-dot-paused'}`} style={{ marginRight: 6 }} />
        {p.is_published ? 'Published' : 'Draft'}
      </span>
    )},
    { key: 'actions', label: '', sortable: false, searchable: false, render: (p) => (
      <span style={{ display: 'flex', gap: 8 }}>
        <Link href={`/dashboard/status-pages/${p.id}`} className="btn btn-sm btn-secondary">Edit</Link>
        <button className="btn btn-sm btn-ghost" style={{ color: '#dc2626' }} onClick={() => handleDelete(p.id)} disabled={isPending}>Delete</button>
      </span>
    )},
  ]

  const bulkActions: BulkAction[] = [
    { label: 'Delete', onClick: () => {}, variant: 'danger' },
  ]

  return (
    <DataTable
      columns={columns}
      data={pages}
      searchPlaceholder="Search status pages..."
      bulkActions={bulkActions}
      emptyMessage="No status pages yet. Create one to share uptime status publicly."
    />
  )
}

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteStatusPageAction, bulkDeleteStatusPagesAction, bulkPublishStatusPagesAction, bulkUnpublishStatusPagesAction } from '@/app/(dashboard)/dashboard/status-pages/actions'
import type { StatusPage } from '@/lib/types'

interface PendingConfirm {
  type: 'delete' | 'bulk-delete' | 'bulk-publish' | 'bulk-unpublish'
  ids: string[]
}

export function StatusPagesTable({ pages }: { pages: StatusPage[] }) {
  const [isPending, startTransition] = useTransition()
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)

  function handleDelete(id: string): void {
    setPendingConfirm({ type: 'delete', ids: [id] })
  }

  function executeConfirm(): void {
    if (!pendingConfirm) return
    const { type, ids } = pendingConfirm
    setPendingConfirm(null)

    startTransition(async () => {
      switch (type) {
        case 'delete':
          await deleteStatusPageAction(ids[0])
          break
        case 'bulk-delete':
          await bulkDeleteStatusPagesAction(ids)
          break
        case 'bulk-publish':
          await bulkPublishStatusPagesAction(ids)
          break
        case 'bulk-unpublish':
          await bulkUnpublishStatusPagesAction(ids)
          break
      }
    })
  }

  function getConfirmProps(): { title: string; message: string; confirmText: string; variant: 'danger' | 'warning' } {
    if (!pendingConfirm) return { title: '', message: '', confirmText: '', variant: 'danger' }
    switch (pendingConfirm.type) {
      case 'delete':
        return { title: 'Delete Status Page', message: 'This status page will be permanently deleted. The public URL will no longer be accessible. This action cannot be undone.', confirmText: 'Delete', variant: 'danger' }
      case 'bulk-delete':
        return { title: `Delete ${pendingConfirm.ids.length} Status Page(s)`, message: `${pendingConfirm.ids.length} status page(s) will be permanently deleted. This action cannot be undone.`, confirmText: 'Delete All', variant: 'danger' }
      case 'bulk-publish':
        return { title: `Publish ${pendingConfirm.ids.length} Status Page(s)`, message: `${pendingConfirm.ids.length} status page(s) will be published and accessible via their public URLs.`, confirmText: 'Publish All', variant: 'warning' }
      case 'bulk-unpublish':
        return { title: `Unpublish ${pendingConfirm.ids.length} Status Page(s)`, message: `${pendingConfirm.ids.length} status page(s) will be unpublished. Their public URLs will no longer be accessible.`, confirmText: 'Unpublish All', variant: 'warning' }
    }
  }

  const columns: Column<StatusPage>[] = [
    { key: 'name', label: 'Name', render: (p) => <span style={{ fontWeight: 600 }}>{p.name}</span> },
    { key: 'slug', label: 'Public URL', render: (p) => (
      <a href={`/status/${p.slug}`} target="_blank" rel="noopener noreferrer" className="table-link" style={{ fontFamily: 'monospace', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        /status/{p.slug} <span style={{ fontSize: 11 }}>↗</span>
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

  function handleBulkDelete(selectedIds: string[]): void {
    setPendingConfirm({ type: 'bulk-delete', ids: selectedIds })
  }

  function handleBulkPublish(selectedIds: string[]): void {
    setPendingConfirm({ type: 'bulk-publish', ids: selectedIds })
  }

  function handleBulkUnpublish(selectedIds: string[]): void {
    setPendingConfirm({ type: 'bulk-unpublish', ids: selectedIds })
  }

  const bulkActions: BulkAction[] = [
    { label: 'Publish', onClick: handleBulkPublish },
    { label: 'Unpublish', onClick: handleBulkUnpublish },
    { label: 'Delete', onClick: handleBulkDelete, variant: 'danger' },
  ]

  const confirmProps = getConfirmProps()

  return (
    <>
      <DataTable
        columns={columns}
        data={pages}
        searchPlaceholder="Search status pages..."
        bulkActions={bulkActions}
        emptyIcon="🌐"
        emptyMessage="No status pages yet. Create one to share your uptime status publicly."
        emptyAction={{ label: '+ Create Status Page', href: '/dashboard/status-pages/new' }}
      />
      <ConfirmDialog
        isOpen={pendingConfirm !== null}
        onConfirm={executeConfirm}
        onCancel={() => setPendingConfirm(null)}
        title={confirmProps.title}
        message={confirmProps.message}
        confirmText={confirmProps.confirmText}
        variant={confirmProps.variant}
      />
    </>
  )
}

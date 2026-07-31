'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Globe, ExternalLink, Edit2, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteStatusPageAction } from '@/app/(dashboard)/dashboard/status-pages/actions'
import type { StatusPage } from '@/lib/types'
import { Pagination } from '@/components/ui/pagination'
import type { PaginationMeta } from '@/lib/utils/pagination'

export function StatusPagesTable({ pages, pagination }: { pages: StatusPage[]; pagination?: PaginationMeta }) {
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  function executeDelete(): void {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)
    startTransition(async () => { await deleteStatusPageAction(id) })
  }

  const filtered = search
    ? pages.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
      )
    : pages

  if (pages.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Globe size={32} strokeWidth={1.5} /></div>
        <h3>No status pages yet</h3>
        <p>Create a status page to share your uptime status publicly with your users.</p>
        <Link href="/dashboard/status-pages/new" className="btn btn-primary" style={{ marginTop: 16 }}>
          + Create Status Page
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Search */}
      <div className="spt-toolbar">
        <input
          className="data-table-search"
          type="text"
          placeholder="Search status pages..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop table header */}
      <div className="spt-header">
        <div className="spt-col-name">Name</div>
        <div className="spt-col-url">Public URL</div>
        <div className="spt-col-monitors">Monitors</div>
        <div className="spt-col-status">Status</div>
        <div className="spt-col-actions" />
      </div>

      {/* Rows */}
      <div className="spt-list">
        {filtered.length === 0 ? (
          <div className="spt-empty">No status pages match your search.</div>
        ) : (
          filtered.map(p => {
            const monitorCount = ((p.monitor_ids || []) as string[]).length
            return (
              <div key={p.id} className="spt-row">
                {/* Name + inline status badge (badge hidden on desktop, shown on mobile) */}
                <div className="spt-col-name">
                  <div className="spt-name-icon">
                    <Globe size={14} />
                  </div>
                  <span className="spt-name">{p.name}</span>
                  <span className={`spt-status-badge spt-status-mobile ${p.is_published ? 'published' : 'draft'}`}>
                    <span className="spt-status-dot" />
                    {p.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Public URL */}
                <div className="spt-col-url">
                  <a
                    href={`/status/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="spt-url-link"
                  >
                    /status/{p.slug}
                    <ExternalLink size={11} />
                  </a>
                </div>

                {/* Monitors */}
                <div className="spt-col-monitors">
                  <span className="spt-monitors-chip">{monitorCount} monitor{monitorCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Status — desktop only */}
                <div className="spt-col-status">
                  <span className={`spt-status-badge ${p.is_published ? 'published' : 'draft'}`}>
                    <span className="spt-status-dot" />
                    {p.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Actions */}
                <div className="spt-col-actions">
                  <Link
                    href={`/dashboard/status-pages/${p.id}`}
                    className="btn btn-sm btn-secondary spt-action-btn"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </Link>
                  <button
                    className="btn btn-sm btn-ghost spt-action-btn spt-delete-btn"
                    onClick={() => setDeleteId(p.id)}
                    disabled={isPending}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {pagination && <Pagination {...pagination} />}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
        title="Delete Status Page"
        message="This status page will be permanently deleted. The public URL will no longer be accessible. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  )
}

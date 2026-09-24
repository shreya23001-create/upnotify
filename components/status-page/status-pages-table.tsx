'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Globe, ExternalLink, Edit2, Trash2, Search } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteStatusPageAction } from '@/app/(dashboard)/dashboard/status-pages/actions'
import type { StatusPage } from '@/lib/types'
import { Pagination } from '@/components/ui/pagination'
import type { PaginationMeta } from '@/lib/utils/pagination'

type StatusFilter = 'all' | 'published' | 'draft'

export function StatusPagesTable({ pages, pagination }: { pages: StatusPage[]; pagination?: PaginationMeta }) {
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  function executeDelete(): void {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)
    startTransition(async () => { await deleteStatusPageAction(id) })
  }

  const bySearch = search
    ? pages.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
      )
    : pages

  const filtered = bySearch.filter(p => {
    if (statusFilter === 'published') return p.is_published
    if (statusFilter === 'draft') return !p.is_published
    return true
  })

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
      {/* Search + filters */}
      <div className="spt-toolbar">
        <div className="spt-search-wrap">
          <Search size={14} className="spt-search-icon" />
          <input
            className="form-input spt-search"
            type="text"
            placeholder="Search status pages..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="spt-filter-chips">
          {(['all', 'published', 'draft'] as StatusFilter[]).map(f => (
            <button
              key={f}
              type="button"
              className={`spt-filter-chip${statusFilter === f ? ' active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'published' ? 'Published' : 'Draft'}
            </button>
          ))}
        </div>
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
          filtered.map((p, i) => {
            const monitorCount = ((p.monitor_ids || []) as string[]).length
            return (
              <div key={p.id} className="spt-row" style={{ animationDelay: `${i * 40}ms` }}>
                {/* Name + inline status badge (badge hidden on desktop, shown on mobile) */}
                <div className="spt-col-name">
                  <div className="spt-name-icon">
                    <Globe size={15} />
                  </div>
                  <span className="spt-name">{p.name}</span>
                  <span className={`spt-status-badge spt-status-mobile ${p.is_published ? 'published' : 'draft'}`}>
                    <span className="spt-status-dot" />
                    {p.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Public URL + monitors chip (chip shows inline on mobile) */}
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
                  <span className="spt-monitors-chip spt-monitors-inline">{monitorCount} monitor{monitorCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Monitors — desktop only standalone column */}
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
                    className="spt-delete-btn"
                    onClick={() => setDeleteId(p.id)}
                    disabled={isPending}
                    aria-label="Delete status page"
                  >
                    <Trash2 size={14} />
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

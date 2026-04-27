'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import type { BlogPost } from '@/lib/types'
import {
  deleteBlogPostAction,
  bulkDeleteBlogPostsAction,
  bulkUpdateBlogPostStatusAction,
} from '@/app/(admin)/admin/blog/actions'
import { IconPlus, IconEdit, IconX } from '@/components/icons'

interface AdminBlogContentProps {
  posts: BlogPost[]
}

type StatusFilter = 'all' | 'draft' | 'published' | 'archived' | 'pending_approval'
type SortKey = 'title' | 'status' | 'category' | 'published_at' | 'created_at'
type SortDir = 'asc' | 'desc'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'published':        return 'badge badge-success'
    case 'draft':            return 'badge badge-outline'
    case 'archived':         return 'badge badge-muted'
    case 'pending_approval': return 'badge badge-warning'
    default:                 return 'badge badge-outline'
  }
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }): React.ReactElement {
  if (!active) return <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 11 }}>⇅</span>
  return <span style={{ marginLeft: 4, fontSize: 11 }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

export function AdminBlogContent({ posts }: AdminBlogContentProps): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Single delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Bulk action state
  const [bulkConfirm, setBulkConfirm] = useState<'delete' | 'draft' | 'archive' | 'publish' | null>(null)
  const [bulkWorking, setBulkWorking] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ── Sorting ──────────────────────────────────────────────
  function toggleSort(key: SortKey): void {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
    setSelected(new Set())
  }

  const filteredPosts = useMemo(() => {
    let list = posts.filter(post => {
      if (statusFilter !== 'all' && post.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          post.title.toLowerCase().includes(q) ||
          post.slug.toLowerCase().includes(q) ||
          (post.category ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })

    list = [...list].sort((a, b) => {
      let av: string = ''
      let bv: string = ''
      switch (sortKey) {
        case 'title':       av = a.title;           bv = b.title;           break
        case 'status':      av = a.status;           bv = b.status;          break
        case 'category':    av = a.category ?? '';   bv = b.category ?? '';  break
        case 'published_at': av = a.published_at ?? ''; bv = b.published_at ?? ''; break
        case 'created_at':  av = a.created_at;       bv = b.created_at;      break
      }
      const cmp = av.localeCompare(bv)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [posts, statusFilter, search, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize))
  const pagedPosts = filteredPosts.slice((page - 1) * pageSize, page * pageSize)

  // ── Selection helpers — select/deselect across ALL filtered pages ──
  const allSelected = filteredPosts.length > 0 && filteredPosts.every(p => selected.has(p.id))
  const someSelected = selected.size > 0

  function toggleAll(): void {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredPosts.map(p => p.id)))
    }
  }

  function toggleOne(id: string): void {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Single delete ─────────────────────────────────────────
  const handleDelete = useCallback(async (id: string): Promise<void> => {
    setError(null)
    setSuccess(null)
    setDeleting(true)
    const result = await deleteBlogPostAction(id)
    setDeleting(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to delete post')
    } else {
      setSuccess('Post deleted')
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
    }
    setDeleteConfirmId(null)
  }, [])

  // ── Bulk actions ──────────────────────────────────────────
  async function executeBulkAction(action: 'delete' | 'draft' | 'archive' | 'publish'): Promise<void> {
    setError(null)
    setSuccess(null)
    setBulkWorking(true)
    const ids = Array.from(selected)
    const BATCH = 100
    const chunks: string[][] = []
    for (let i = 0; i < ids.length; i += BATCH) chunks.push(ids.slice(i, i + BATCH))

    let totalDone = 0
    let failed = false

    for (const chunk of chunks) {
      let result: { success: boolean; error?: string }
      if (action === 'delete') {
        result = await bulkDeleteBlogPostsAction(chunk)
      } else {
        const status = action === 'draft' ? 'draft' : action === 'archive' ? 'archived' : 'published'
        result = await bulkUpdateBlogPostStatusAction(chunk, status)
      }
      if (!result.success) { failed = true; setError(result.error ?? 'Bulk action failed'); break }
      totalDone += chunk.length
      if (chunks.length > 1) setSuccess(`Processing… ${totalDone} / ${ids.length}`)
    }

    if (!failed) {
      const label = action === 'delete' ? 'deleted' : action === 'draft' ? 'moved to draft' : action === 'archive' ? 'archived' : 'published'
      setSuccess(`${totalDone} post${totalDone !== 1 ? 's' : ''} ${label}`)
    }
    setSelected(new Set())
    setBulkConfirm(null)
    setBulkWorking(false)
  }

  const statusCounts = useMemo(() => ({
    all: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    published: posts.filter(p => p.status === 'published').length,
    archived: posts.filter(p => p.status === 'archived').length,
    pending_approval: posts.filter(p => p.status === 'pending_approval').length,
  }), [posts])

  const thStyle: React.CSSProperties = {
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  }

  return (
    <div>
      {/* Messages */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {error}
          <button onClick={() => setError(null)} className="alert-close" aria-label="Dismiss"><IconX size={14} /></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {success}
          <button onClick={() => setSuccess(null)} className="alert-close" aria-label="Dismiss"><IconX size={14} /></button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <Link href="/admin/blog/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <IconPlus size={16} />
          New Post
        </Link>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {(['all', 'draft', 'published', 'archived', 'pending_approval'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setSelected(new Set()); setPage(1) }}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {s === 'pending_approval' ? 'Pending' : s}
              <span style={{ marginLeft: 4, opacity: 0.7 }}>({statusCounts[s]})</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Per page:</label>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="input"
            style={{ width: 90, padding: '4px 8px' }}
          >
            {[100, 250, 1000, 2500, 5000].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(new Set()); setPage(1) }}
            className="input"
            style={{ maxWidth: 220 }}
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
          padding: '10px 14px', marginBottom: 12,
          background: 'var(--color-primary-subtle, #eff6ff)',
          border: '1px solid var(--color-primary-muted, #bfdbfe)',
          borderRadius: 8,
        }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', marginRight: 4 }}>
            {selected.size} selected
          </span>

          {bulkConfirm ? (
            <>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {bulkConfirm === 'delete'
                  ? `Delete ${selected.size} post${selected.size !== 1 ? 's' : ''}? This is permanent.`
                  : `Move ${selected.size} post${selected.size !== 1 ? 's' : ''} to ${bulkConfirm}?`}
              </span>
              <button
                onClick={() => executeBulkAction(bulkConfirm)}
                disabled={bulkWorking}
                className={`btn btn-sm ${bulkConfirm === 'delete' ? 'btn-danger' : 'btn-primary'}`}
              >
                {bulkWorking ? 'Working...' : 'Confirm'}
              </button>
              <button onClick={() => setBulkConfirm(null)} className="btn btn-sm btn-outline" disabled={bulkWorking}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setBulkConfirm('draft')} className="btn btn-sm btn-outline">
                Move to Draft
              </button>
              <button onClick={() => setBulkConfirm('publish')} className="btn btn-sm btn-outline">
                Publish
              </button>
              <button onClick={() => setBulkConfirm('archive')} className="btn btn-sm btn-outline">
                Archive
              </button>
              <button
                onClick={() => setBulkConfirm('delete')}
                className="btn btn-sm btn-outline"
                style={{ color: 'var(--color-danger, #ef4444)' }}
              >
                Delete
              </button>
              <button onClick={() => setSelected(new Set())} className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }}>
                Clear
              </button>
            </>
          )}
        </div>
      )}

      {/* Table */}
      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <p>{posts.length === 0 ? 'No blog posts yet. Create your first post.' : 'No posts match your filters.'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th style={thStyle} onClick={() => toggleSort('title')}>
                  Title <SortIcon active={sortKey === 'title'} dir={sortDir} />
                </th>
                <th>Slug</th>
                <th style={thStyle} onClick={() => toggleSort('category')}>
                  Category <SortIcon active={sortKey === 'category'} dir={sortDir} />
                </th>
                <th style={thStyle} onClick={() => toggleSort('status')}>
                  Status <SortIcon active={sortKey === 'status'} dir={sortDir} />
                </th>
                <th style={thStyle} onClick={() => toggleSort('published_at')}>
                  Published <SortIcon active={sortKey === 'published_at'} dir={sortDir} />
                </th>
                <th style={thStyle} onClick={() => toggleSort('created_at')}>
                  Created <SortIcon active={sortKey === 'created_at'} dir={sortDir} />
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedPosts.map(post => (
                <tr key={post.id} style={selected.has(post.id) ? { background: 'var(--color-primary-subtle, #eff6ff)' } : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(post.id)}
                      onChange={() => toggleOne(post.id)}
                      aria-label={`Select ${post.title}`}
                    />
                  </td>
                  <td>
                    <Link href={`/admin/blog/${post.id}`} className="link" style={{ fontWeight: 500 }}>
                      {post.title}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{post.slug}</td>
                  <td>{post.category ?? '—'}</td>
                  <td>
                    <span className={getStatusBadgeClass(post.status)}>
                      {post.status === 'pending_approval' ? 'pending' : post.status}
                    </span>
                    {post.content && typeof post.content === 'object' && (post.content as Record<string, unknown>).type === 'static' && (
                      <span className="badge badge-warning" style={{ marginLeft: 4, fontSize: 10 }}>Static</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{formatDate(post.published_at)}</td>
                  <td style={{ fontSize: '0.875rem' }}>{formatDate(post.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Link
                        href={`/admin/blog/${post.id}/preview`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Preview
                      </Link>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="btn btn-sm btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <IconEdit size={14} />
                        Edit
                      </Link>
                      {deleteConfirmId === post.id ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="btn btn-sm btn-danger"
                            disabled={deleting}
                          >
                            {deleting ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button onClick={() => setDeleteConfirmId(null)} className="btn btn-sm btn-outline">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(post.id)}
                          className="btn btn-sm btn-outline"
                          style={{ color: 'var(--color-danger, #ef4444)' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {filteredPosts.length === 0 ? 'No posts' : (
            <>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredPosts.length)} of {filteredPosts.length}
              {filteredPosts.length !== posts.length && ` (filtered from ${posts.length} total)`}
              {someSelected && ` · ${selected.size} selected`}
            </>
          )}
        </span>
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="btn btn-sm btn-outline"
              aria-label="First page"
            >«</button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-sm btn-outline"
              aria-label="Previous page"
            >‹</button>
            <span style={{ fontSize: '0.8rem', padding: '0 8px', whiteSpace: 'nowrap' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-sm btn-outline"
              aria-label="Next page"
            >›</button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="btn btn-sm btn-outline"
              aria-label="Last page"
            >»</button>
          </div>
        )}
      </div>
    </div>
  )
}

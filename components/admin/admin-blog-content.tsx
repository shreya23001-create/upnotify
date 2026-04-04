'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { BlogPost } from '@/lib/types'
import { deleteBlogPostAction } from '@/app/(admin)/admin/blog/actions'
import { IconPlus, IconEdit, IconX } from '@/components/icons'

interface AdminBlogContentProps {
  posts: BlogPost[]
}

type StatusFilter = 'all' | 'draft' | 'published' | 'archived'

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
    case 'published': return 'badge badge-success'
    case 'draft': return 'badge badge-outline'
    case 'archived': return 'badge badge-muted'
    default: return 'badge badge-outline'
  }
}

export function AdminBlogContent({ posts }: AdminBlogContentProps): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    setError(null)
    setSuccess(null)
    setDeleting(true)
    const result = await deleteBlogPostAction(id)
    setDeleting(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to delete post')
    } else {
      setSuccess('Post deleted successfully')
    }
    setDeleteConfirmId(null)
  }, [])

  const filteredPosts = posts.filter(post => {
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

  return (
    <div>
      {/* Messages */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {error}
          <button onClick={() => setError(null)} className="alert-close" aria-label="Dismiss">
            <IconX size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {success}
          <button onClick={() => setSuccess(null)} className="alert-close" aria-label="Dismiss">
            <IconX size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <Link href="/admin/blog/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <IconPlus size={16} />
          New Post
        </Link>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(['all', 'draft', 'published', 'archived'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {s}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          style={{ maxWidth: 260, marginLeft: 'auto' }}
        />
      </div>

      {/* Posts table */}
      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <p>{posts.length === 0 ? 'No blog posts yet. Create your first post.' : 'No posts match your filters.'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Category</th>
                <th>Status</th>
                <th>Published</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map(post => (
                <tr key={post.id}>
                  <td>
                    <Link href={`/admin/blog/${post.id}`} className="link" style={{ fontWeight: 500 }}>
                      {post.title}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{post.slug}</td>
                  <td>{post.category ?? '—'}</td>
                  <td>
                    <span className={getStatusBadgeClass(post.status)}>
                      {post.status}
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
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="btn btn-sm btn-outline"
                          >
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
    </div>
  )
}

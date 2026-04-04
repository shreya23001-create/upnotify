'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { BlogPost } from '@/lib/types'
import {
  createBlogPostAction,
  updateBlogPostAction,
} from '@/app/(admin)/admin/blog/actions'
import { IconArrowLeft, IconCheck, IconX } from '@/components/icons'

interface AdminBlogEditorProps {
  post?: BlogPost
}

const CATEGORIES = [
  'Uptime Monitoring',
  'Performance',
  'Security',
  'DevOps',
  'Product Updates',
  'Guides',
  'Case Studies',
  'Industry News',
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getContentBody(content: unknown): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (typeof content === 'object' && content !== null && 'body' in content) {
    return String((content as Record<string, unknown>).body ?? '')
  }
  return ''
}

export function AdminBlogEditor({ post }: AdminBlogEditorProps): React.ReactElement {
  const router = useRouter()
  const isEditing = Boolean(post)

  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [content, setContent] = useState(getContentBody(post?.content))
  const [category, setCategory] = useState(post?.category ?? '')
  const [status, setStatus] = useState(post?.status ?? 'draft')
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(post?.seo_description ?? '')
  const [publishedAt, setPublishedAt] = useState(
    post?.published_at ? post.published_at.slice(0, 16) : ''
  )
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleTitleChange = useCallback((value: string): void => {
    setTitle(value)
    if (!slugManuallyEdited && !isEditing) {
      setSlug(slugify(value))
    }
  }, [slugManuallyEdited, isEditing])

  const handleSlugChange = useCallback((value: string): void => {
    setSlugManuallyEdited(true)
    setSlug(slugify(value))
  }, [])

  const handleSave = useCallback(async (): Promise<void> => {
    setError(null)
    setSuccess(null)
    setSaving(true)

    const formData = new FormData()
    if (post?.id) formData.set('id', post.id)
    formData.set('title', title)
    formData.set('slug', slug)
    formData.set('excerpt', excerpt)
    formData.set('content', content)
    formData.set('category', category)
    formData.set('status', status)
    formData.set('seo_title', seoTitle)
    formData.set('seo_description', seoDescription)
    formData.set('published_at', publishedAt)

    const result = isEditing
      ? await updateBlogPostAction(formData)
      : await createBlogPostAction(formData)

    setSaving(false)

    if (!result.success) {
      setError(result.error ?? 'Failed to save post')
    } else {
      setSuccess(isEditing ? 'Post updated successfully' : 'Post created successfully')
      if (!isEditing && result.id) {
        router.push(`/admin/blog/${result.id}`)
      }
    }
  }, [post?.id, title, slug, excerpt, content, category, status, seoTitle, seoDescription, publishedAt, isEditing, router])

  const handleSaveAndPublish = useCallback(async (): Promise<void> => {
    setStatus('published')
    if (!publishedAt) {
      setPublishedAt(new Date().toISOString().slice(0, 16))
    }
    // Use setTimeout to allow state updates to propagate before saving
    setTimeout(() => {
      const formData = new FormData()
      if (post?.id) formData.set('id', post.id)
      formData.set('title', title)
      formData.set('slug', slug)
      formData.set('excerpt', excerpt)
      formData.set('content', content)
      formData.set('category', category)
      formData.set('status', 'published')
      formData.set('seo_title', seoTitle)
      formData.set('seo_description', seoDescription)
      formData.set('published_at', publishedAt || new Date().toISOString().slice(0, 16))

      setError(null)
      setSuccess(null)
      setSaving(true)

      const action = isEditing ? updateBlogPostAction : createBlogPostAction
      action(formData).then(result => {
        setSaving(false)
        if (!result.success) {
          setError(result.error ?? 'Failed to publish post')
        } else {
          setSuccess('Post published successfully')
          if (!isEditing && result.id) {
            router.push(`/admin/blog/${result.id}`)
          }
        }
      })
    }, 0)
  }, [post?.id, title, slug, excerpt, content, category, seoTitle, seoDescription, publishedAt, isEditing, router])

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/blog" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IconArrowLeft size={16} />
            Back
          </Link>
          <div>
            <h1 className="admin-page-title" style={{ marginBottom: 0 }}>
              {isEditing ? 'Edit Post' : 'New Post'}
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving || !title || !slug}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <IconCheck size={16} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handleSaveAndPublish}
            disabled={saving || !title || !slug}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <IconCheck size={16} />
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

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

      {/* Editor layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        {/* Main content */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="blog-title" className="form-label">Title</label>
                <input
                  id="blog-title"
                  type="text"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  className="input"
                  placeholder="Enter post title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="blog-slug" className="form-label">Slug</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>/blog/</span>
                  <input
                    id="blog-slug"
                    type="text"
                    value={slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    className="input"
                    placeholder="post-slug"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="blog-excerpt" className="form-label">Excerpt</label>
                <textarea
                  id="blog-excerpt"
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  className="input"
                  placeholder="Brief summary for cards and previews"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="blog-content" className="form-label">Content</label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>
                  Plain text editor. Rich text editor coming in Phase 2.
                </p>
                <textarea
                  id="blog-content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="input"
                  placeholder="Write your blog post content here..."
                  rows={20}
                  style={{ resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Status and publishing */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Publishing</h3>

              <div className="form-group">
                <label htmlFor="blog-status" className="form-label">Status</label>
                <select
                  id="blog-status"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="input"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="blog-published-at" className="form-label">Publish Date</label>
                <input
                  id="blog-published-at"
                  type="datetime-local"
                  value={publishedAt}
                  onChange={e => setPublishedAt(e.target.value)}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="blog-category" className="form-label">Category</label>
                <select
                  id="blog-category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="input"
                >
                  <option value="">No category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>SEO</h3>

              <div className="form-group">
                <label htmlFor="blog-seo-title" className="form-label">
                  Meta Title
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                    {seoTitle.length}/60
                  </span>
                </label>
                <input
                  id="blog-seo-title"
                  type="text"
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  className="input"
                  placeholder="SEO title (defaults to post title)"
                  maxLength={60}
                />
              </div>

              <div className="form-group">
                <label htmlFor="blog-seo-desc" className="form-label">
                  Meta Description
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                    {seoDescription.length}/160
                  </span>
                </label>
                <textarea
                  id="blog-seo-desc"
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  className="input"
                  placeholder="SEO description for search results"
                  rows={3}
                  maxLength={160}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Post info (edit mode only) */}
          {isEditing && post && (
            <div className="card">
              <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Info</h3>
                <div>
                  <strong>ID:</strong>{' '}
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{post.id}</span>
                </div>
                <div>
                  <strong>Created:</strong> {new Date(post.created_at).toLocaleString('en-GB')}
                </div>
                <div>
                  <strong>Updated:</strong> {new Date(post.updated_at).toLocaleString('en-GB')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

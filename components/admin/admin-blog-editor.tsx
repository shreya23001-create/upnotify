'use client'

import { useState, useCallback, useRef } from 'react'
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
  'Guide', 'WordPress', 'Security', 'Hosting', 'Ecommerce',
  'Agency', 'Performance', 'Tools', 'Compete', 'Product Updates',
]

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function getContentBody(content: unknown): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (typeof content === 'object' && content !== null) {
    if ('body' in content) return String((content as Record<string, unknown>).body ?? '')
    if ('type' in content && (content as Record<string, unknown>).type === 'static') return ''
  }
  return ''
}

function getCta(content: unknown, key: string): { heading: string; buttonLabel: string; buttonUrl: string } {
  const defaults = { heading: '', buttonLabel: '', buttonUrl: '' }
  if (!content || typeof content !== 'object') return defaults
  const c = content as Record<string, unknown>
  if (c[key] && typeof c[key] === 'object') {
    const cta = c[key] as Record<string, unknown>
    return {
      heading: String(cta.heading ?? ''),
      buttonLabel: String(cta.buttonLabel ?? ''),
      buttonUrl: String(cta.buttonUrl ?? ''),
    }
  }
  return defaults
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function markdownToHtml(md: string): string {
  // Escape raw HTML first — prevents XSS from injected scripts or event handlers
  const safe = escapeHtml(md)
  return safe
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, linkText, url) => {
      const trimmed = url.trim()
      if (/^javascript:/i.test(trimmed)) return escapeHtml(linkText)
      return `<a href="${trimmed}" rel="noopener noreferrer">${linkText}</a>`
    })
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>') // match escaped >
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function AdminBlogEditor({ post }: AdminBlogEditorProps): React.ReactElement {
  const router = useRouter()
  const isEditing = Boolean(post)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [content, setContent] = useState(getContentBody(post?.content))
  const [category, setCategory] = useState(post?.category ?? '')
  const [status, setStatus] = useState(post?.status ?? 'draft')
  const [tags, setTags] = useState(post?.tags?.join(', ') ?? '')
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(post?.seo_description ?? '')
  const [ogImageUrl, setOgImageUrl] = useState(post?.og_image_url ?? '')
  const [publishedAt, setPublishedAt] = useState(post?.published_at ? post.published_at.slice(0, 16) : '')
  const [midCta, setMidCta] = useState(getCta(post?.content, 'midCta'))
  const [endCta, setEndCta] = useState(getCta(post?.content, 'endCta'))
  const [showPreview, setShowPreview] = useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isStatic = post?.content && typeof post.content === 'object' && (post.content as Record<string, unknown>).type === 'static'

  const handleTitleChange = useCallback((value: string): void => {
    setTitle(value)
    if (!slugManuallyEdited && !isEditing) setSlug(slugify(value))
  }, [slugManuallyEdited, isEditing])

  const insertMarkdown = useCallback((before: string, after: string, placeholder: string): void => {
    const ta = contentRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end) || placeholder
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end)
    setContent(newContent)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }, [content])

  const handleSave = useCallback(async (publishNow?: boolean): Promise<void> => {
    setError(null)
    setSuccess(null)

    if (publishNow && !content.trim()) {
      setError('Cannot publish an empty post. Add some content or save as draft.')
      return
    }

    setSaving(true)

    const finalStatus = publishNow ? 'published' : status
    const finalPublishedAt = publishNow && !publishedAt ? new Date().toISOString().slice(0, 16) : publishedAt

    const formData = new FormData()
    if (post?.id) formData.set('id', post.id)
    formData.set('title', title)
    formData.set('slug', slug)
    formData.set('excerpt', excerpt)
    // Raw markdown — the server action wraps this into { body, midCta?, endCta? }.
    // Sending as a JSON-stringified object here used to double-encode and silently
    // drop CTAs (fixed alongside the calendar-blog-generator content-shape bug).
    formData.set('content', content)
    formData.set('category', category)
    formData.set('status', finalStatus)
    formData.set('seo_title', seoTitle)
    formData.set('seo_description', seoDescription)
    formData.set('og_image_url', ogImageUrl)
    formData.set('published_at', finalPublishedAt)
    formData.set('tags', tags)
    formData.set('mid_cta_heading', midCta.heading)
    formData.set('mid_cta_label', midCta.buttonLabel)
    formData.set('mid_cta_url', midCta.buttonUrl)
    formData.set('end_cta_heading', endCta.heading)
    formData.set('end_cta_label', endCta.buttonLabel)
    formData.set('end_cta_url', endCta.buttonUrl)

    const result = isEditing ? await updateBlogPostAction(formData) : await createBlogPostAction(formData)
    setSaving(false)

    if (!result.success) {
      setError(result.error ?? 'Failed to save')
    } else {
      setSuccess(publishNow ? 'Published!' : 'Saved!')
      if (!isEditing && result.id) router.push(`/admin/blog/${result.id}`)
    }
  }, [post?.id, title, slug, excerpt, content, category, status, tags, seoTitle, seoDescription, ogImageUrl, publishedAt, midCta, endCta, isEditing, router])

  const displaySeoTitle = seoTitle || title || 'Post Title'
  const displaySeoUrl = `upnotify-monitoring.vercel.app/blog/${slug || 'post-slug'}`
  const displaySeoDesc = seoDescription || excerpt || 'Post description will appear here...'

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/blog" className="btn btn-secondary btn-sm"><IconArrowLeft size={14} /> Back</Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{isEditing ? 'Edit Post' : 'New Post'}</h1>
          {isStatic && <span className="badge badge-warning">Static File — edit content below to migrate to DB</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleSave(false)} disabled={saving || !title || !slug} className="btn btn-secondary">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !title || !slug || !content.trim()}
            className="btn btn-primary"
            title={!content.trim() ? 'Add content before publishing' : undefined}
          >
            <IconCheck size={14} /> {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error} <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}><IconX size={14} /></button></div>}
      {success && <div className="form-success" style={{ marginBottom: 16 }}>{success}</div>}

      {/* Two-column layout */}
      <div className="blog-editor-layout">
        {/* Main */}
        <div className="blog-editor-main">
          {/* Title */}
          <input
            className="blog-editor-title-input"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Post title..."
          />

          {/* Slug */}
          <div className="blog-editor-slug-row">
            <span className="blog-editor-slug-prefix">/blog/</span>
            <input
              className="form-input blog-editor-slug-input"
              value={slug}
              onChange={e => { setSlugManuallyEdited(true); setSlug(slugify(e.target.value)) }}
              placeholder="post-slug"
            />
          </div>

          {/* Excerpt */}
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Excerpt</label>
            <textarea className="form-input" value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={3} placeholder="Brief summary for cards and search results..." />
          </div>

          {/* Content Editor */}
          <div className="blog-editor-content-card">
            <div className="blog-editor-toolbar">
              <button type="button" onClick={() => insertMarkdown('**', '**', 'bold')} title="Bold"><strong>B</strong></button>
              <button type="button" onClick={() => insertMarkdown('*', '*', 'italic')} title="Italic"><em>I</em></button>
              <button type="button" onClick={() => insertMarkdown('[', '](url)', 'link text')} title="Link">Link</button>
              <button type="button" onClick={() => insertMarkdown('## ', '', 'Heading')} title="Heading">H2</button>
              <button type="button" onClick={() => insertMarkdown('### ', '', 'Subheading')} title="Subheading">H3</button>
              <button type="button" onClick={() => insertMarkdown('- ', '', 'list item')} title="List">List</button>
              <button type="button" onClick={() => insertMarkdown('`', '`', 'code')} title="Code">Code</button>
              <button type="button" onClick={() => insertMarkdown('> ', '', 'quote')} title="Blockquote">Quote</button>
              <button type="button" onClick={() => insertMarkdown('![', '](image-url)', 'alt text')} title="Image">Img</button>
              <button type="button" onClick={() => insertMarkdown('\n---\n', '', '')} title="Horizontal rule">HR</button>
              <div style={{ flex: 1 }} />
              <button type="button" className={showPreview ? 'blog-editor-toolbar-active' : ''} onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? 'Edit' : 'Preview'}
              </button>
              <span className="blog-editor-wordcount">{wordCount(content)} words</span>
            </div>

            {showPreview ? (
              <div className="blog-editor-preview" dangerouslySetInnerHTML={{ __html: `<p>${markdownToHtml(content)}</p>` }} />
            ) : (
              <textarea
                ref={contentRef}
                className="blog-editor-textarea"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your blog post content here using Markdown..."
              />
            )}
          </div>

          {/* CTAs */}
          <div className="card" style={{ marginTop: 20, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Call to Action Blocks</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label className="form-label">Mid-Article CTA</label>
                <input className="form-input" value={midCta.heading} onChange={e => setMidCta({ ...midCta, heading: e.target.value })} placeholder="CTA heading (e.g. Check Your Website Score)" style={{ marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={midCta.buttonLabel} onChange={e => setMidCta({ ...midCta, buttonLabel: e.target.value })} placeholder="Button label" style={{ flex: 1 }} />
                  <input className="form-input" value={midCta.buttonUrl} onChange={e => setMidCta({ ...midCta, buttonUrl: e.target.value })} placeholder="/score" style={{ flex: 1 }} />
                </div>
              </div>
              <div>
                <label className="form-label">End-Article CTA</label>
                <input className="form-input" value={endCta.heading} onChange={e => setEndCta({ ...endCta, heading: e.target.value })} placeholder="CTA heading (e.g. Start Monitoring Free)" style={{ marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={endCta.buttonLabel} onChange={e => setEndCta({ ...endCta, buttonLabel: e.target.value })} placeholder="Button label" style={{ flex: 1 }} />
                  <input className="form-input" value={endCta.buttonUrl} onChange={e => setEndCta({ ...endCta, buttonUrl: e.target.value })} placeholder="/signup" style={{ flex: 1 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="blog-editor-sidebar">
          {/* Status */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Publishing</h3>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="form-label">Publish Date</label>
              <input className="form-input" type="datetime-local" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="form-label">Tags</label>
              <input className="form-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="wordpress, monitoring, ssl" />
            </div>
          </div>

          {/* SEO */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>SEO</h3>
            <div className="form-group">
              <label className="form-label">Meta Title <span style={{ color: seoTitle.length > 60 ? '#ef4444' : 'var(--text-muted)', fontSize: 11 }}>{seoTitle.length}/60</span></label>
              <input className="form-input" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="SEO title (defaults to post title)" maxLength={70} />
            </div>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="form-label">Meta Description <span style={{ color: seoDescription.length > 160 ? '#ef4444' : 'var(--text-muted)', fontSize: 11 }}>{seoDescription.length}/160</span></label>
              <textarea className="form-input" value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="Description for search results" rows={3} maxLength={200} />
            </div>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="form-label">OG Image URL</label>
              <input className="form-input" value={ogImageUrl} onChange={e => setOgImageUrl(e.target.value)} placeholder="/og-image.svg" />
            </div>

            {/* Google Preview */}
            <div className="blog-editor-seo-preview">
              <div className="blog-editor-seo-preview-title">{displaySeoTitle.slice(0, 60)}</div>
              <div className="blog-editor-seo-preview-url">{displaySeoUrl}</div>
              <div className="blog-editor-seo-preview-desc">{displaySeoDesc.slice(0, 160)}</div>
            </div>
          </div>

          {/* Info */}
          {isEditing && post && (
            <div className="card" style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Info</h3>
              <div style={{ lineHeight: 1.8 }}>
                <div><strong>ID:</strong> <code style={{ fontSize: 10 }}>{post.id.slice(0, 8)}</code></div>
                <div><strong>Created:</strong> {new Date(post.created_at).toLocaleDateString('en-GB')}</div>
                <div><strong>Updated:</strong> {new Date(post.updated_at).toLocaleDateString('en-GB')}</div>
                <div><strong>Words:</strong> {wordCount(content)}</div>
                <div><strong>Canonical:</strong> /blog/{slug}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

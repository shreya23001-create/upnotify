import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { getBlogPostById } from '@/lib/db/blog-posts'
import { BlogCardImage } from '@/components/ui/blog-card-image'

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

interface BlogContent {
  body?: string
  type?: string
  html?: string
  midCta?: { heading: string; buttonLabel: string; buttonUrl: string }
  endCta?: { heading: string; buttonLabel: string; buttonUrl: string }
  sources?: Array<{ title: string; url: string; source: string }>
}

function parseContent(raw: unknown): BlogContent | null {
  if (!raw) return null
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as BlogContent
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as BlogContent
    } catch { /* not valid JSON */ }
  }
  return null
}

function markdownToHtml(md: string): string {
  const text = md.replace(/\\n/g, '\n')
  const lines = text.split('\n')
  const blocks: string[] = []
  let listItems: string[] = []
  let orderedItems: string[] = []
  let paraLines: string[] = []

  function flushPara() {
    if (paraLines.length > 0) {
      blocks.push(`<p>${inlineFmt(paraLines.join(' '))}</p>`)
      paraLines = []
    }
  }
  function flushList() {
    if (listItems.length > 0) {
      blocks.push(`<ul>${listItems.map(li => `<li>${inlineFmt(li)}</li>`).join('')}</ul>`)
      listItems = []
    }
    if (orderedItems.length > 0) {
      blocks.push(`<ol>${orderedItems.map(li => `<li>${inlineFmt(li)}</li>`).join('')}</ol>`)
      orderedItems = []
    }
  }

  for (const line of lines) {
    const t = line.trim()
    if (t === '') { flushPara(); flushList(); continue }
    const h3 = t.match(/^### (.+)$/)
    const h2 = t.match(/^## (.+)$/)
    const h1 = t.match(/^# (.+)$/)
    const blockquote = t.match(/^> (.+)$/)
    const unordered = t.match(/^[-*] (.+)$/)
    const ordered = t.match(/^\d+\. (.+)$/)
    if (h3) { flushPara(); flushList(); blocks.push(`<h3>${inlineFmt(h3[1])}</h3>`) }
    else if (h2) { flushPara(); flushList(); blocks.push(`<h2>${inlineFmt(h2[1])}</h2>`) }
    else if (h1) { flushPara(); flushList(); blocks.push(`<h1>${inlineFmt(h1[1])}</h1>`) }
    else if (t === '---') { flushPara(); flushList(); blocks.push('<hr/>') }
    else if (blockquote) { flushPara(); flushList(); blocks.push(`<blockquote>${inlineFmt(blockquote[1])}</blockquote>`) }
    else if (unordered) { flushPara(); flushList(); listItems.push(unordered[1]) }
    else if (ordered) { flushPara(); orderedItems.push(ordered[1]) }
    else { flushList(); paraLines.push(t) }
  }
  flushPara(); flushList()
  return blocks.join('\n')
}

function inlineFmt(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}

const STATUS_COLOURS: Record<string, string> = {
  published: '#16a34a',
  draft: '#6b7280',
  pending_approval: '#d97706',
  archived: '#9333ea',
}

export default async function AdminBlogPreviewPage({ params }: PreviewPageProps): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const canRead = await canAccessAdminModule(user.email, !!user.is_super_admin, 'blog')
  if (!canRead) redirect('/admin')

  const { id } = await params
  const post = await getBlogPostById(id)
  if (!post) notFound()

  const content = parseContent(post.content)
  const rawHtml = (content as Record<string, unknown> | null)?.html as string | undefined
  const body = rawHtml ?? (content?.body ?? '')
  const bodyHtml = rawHtml ? body : markdownToHtml(body)
  const midCta = content?.midCta
  const endCta = content?.endCta
  const sources = content?.sources ?? []
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const statusLabel = post.status === 'pending_approval' ? 'pending' : post.status
  const statusColour = STATUS_COLOURS[post.status] ?? '#6b7280'

  return (
    <>
      {/* Sticky preview banner */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: '#1e293b',
        color: '#f1f5f9',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 13,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <span style={{
          background: '#f59e0b',
          color: '#000',
          fontWeight: 700,
          padding: '2px 10px',
          borderRadius: 4,
          fontSize: 11,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Preview Mode
        </span>
        <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.title}
        </span>
        <span style={{
          background: statusColour,
          color: '#fff',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {statusLabel}
        </span>
        <Link
          href={`/admin/blog/${post.id}`}
          style={{
            background: '#3b82f6',
            color: '#fff',
            padding: '5px 14px',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 12,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Edit Post
        </Link>
        <Link
          href="/admin/blog"
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#f1f5f9',
            padding: '5px 14px',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 12,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          ← Blog List
        </Link>
      </div>

      {/* Article rendered exactly as public blog post */}
      <div className="blog-article-wrap">
        <div className="blog-article-hero">
          <BlogCardImage category={post.category ?? 'Default'} title={post.title} />
        </div>
        <article className="blog-article">
          <header className="blog-article-header">
            <div className="blog-article-meta-top">
              {post.category && <span className="blog-post-category">{post.category}</span>}
            </div>
            <h1 className="blog-article-title">{post.title}</h1>
            {post.excerpt && <p className="blog-article-subtitle">{post.excerpt}</p>}
            <div className="blog-article-meta-top" style={{ marginTop: 12 }}>
              {publishedDate && <span>{publishedDate}</span>}
              <span>&middot;</span>
              <span>Upnotify Team</span>
            </div>
          </header>

          {midCta && (
            <div className="blog-cta-section" style={{ margin: '32px 0' }}>
              <h3>{midCta.heading}</h3>
              <Link href={midCta.buttonUrl} className="btn btn-primary btn-lg">{midCta.buttonLabel}</Link>
            </div>
          )}

          {bodyHtml ? (
            <div className="blog-article-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          ) : (
            <div style={{ padding: '40px 0', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
              No content yet — add content in the editor.
            </div>
          )}

          {endCta && (
            <div className="blog-cta-section" style={{ margin: '40px 0' }}>
              <h3>{endCta.heading}</h3>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                <Link href={endCta.buttonUrl} className="btn btn-primary btn-lg">{endCta.buttonLabel}</Link>
                <Link href="/signup" className="btn btn-secondary btn-lg">Sign Up Free</Link>
              </div>
            </div>
          )}

          {sources.length > 0 && (
            <footer className="blog-article-footer">
              <div className="blog-author">
                <div className="blog-author-info">
                  <span className="blog-author-name">Upnotify Team</span>
                  <span className="blog-author-role">Website Monitoring Platform</span>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Sources</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {sources.map((s, i) => (
                    <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                        {s.title || s.source}
                      </a>
                      {s.source && ` — ${s.source}`}
                    </li>
                  ))}
                </ul>
              </div>
            </footer>
          )}

          {sources.length === 0 && (
            <footer className="blog-article-footer">
              <div className="blog-author">
                <div className="blog-author-info">
                  <span className="blog-author-name">Upnotify Team</span>
                  <span className="blog-author-role">Website Monitoring Platform</span>
                </div>
              </div>
            </footer>
          )}
        </article>
      </div>
    </>
  )
}

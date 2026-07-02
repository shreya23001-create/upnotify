import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { BlogShareSubscribe } from '@/components/blog/blog-share-subscribe'
import { logger } from '@/lib/utils/logger'

export const revalidate = 300 // ISR: revalidate every 5 minutes

const CATEGORY_GRADIENTS: Record<string, string> = {
  Guide:             'linear-gradient(135deg,#7c3aed,#3b82f6)',
  Security:          'linear-gradient(135deg,#dc2626,#b45309)',
  Performance:       'linear-gradient(135deg,#047857,#0e7490)',
  Ecommerce:         'linear-gradient(135deg,#b45309,#9d174d)',
  'Incident Report': 'linear-gradient(135deg,#b91c1c,#5b21b6)',
  Outage:            'linear-gradient(135deg,#b91c1c,#5b21b6)',
  Agency:            'linear-gradient(135deg,#1e3a5f,#1d4ed8)',
  WordPress:         'linear-gradient(135deg,#1d4ed8,#0e7490)',
  Hosting:           'linear-gradient(135deg,#047857,#1d4ed8)',
  'AI-VISIBILITY':   'linear-gradient(135deg,#4c1d95,#1d4ed8)',
  Insights:          'linear-gradient(135deg,#0e7490,#1d4ed8)',
}

interface BlogContent {
  body?: string
  type?: string
  midCta?: { heading: string; buttonLabel: string; buttonUrl: string }
  endCta?: { heading: string; buttonLabel: string; buttonUrl: string }
  sources?: Array<{ title: string; url: string; source: string }>
}

async function getPost(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Not Found' }

  // Tier 3 permutation posts (auto-generated AI-vs-AI etc.) are flagged
  // noindex=true via migration 00096 — emit robots:noindex,nofollow so
  // Search Console stops flagging them as "Alternate page with proper
  // canonical tag". Sitemap also excludes them (see app/sitemap.ts).
  const isNoindex = (post as { noindex?: boolean }).noindex === true

  return {
    title: post.seo_title || `${post.title} | Uptrue`,
    description: post.seo_description || post.excerpt || '',
    alternates: { canonical: `https://uptrue.io/blog/${post.slug}` },
    robots: isNoindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || '',
      url: `https://uptrue.io/blog/${post.slug}`,
      type: 'article',
      ...(post.og_image_url ? { images: [{ url: post.og_image_url }] } : {}),
    },
  }
}

/**
 * Parses the content JSONB field robustly.
 * Supabase normally returns JSONB as a JS object, but handles JSON-string edge cases too.
 */
function parseContent(raw: unknown, slug: string): BlogContent | null {
  if (!raw) return null

  // Normal case: Supabase returns JSONB as a JS object
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as BlogContent
  }

  // Edge case: JSONB came back as a primitive (string/number/bool). Migration
  // 00100 + 00103 + the DB CHECK constraint should make this impossible —
  // log it so we catch any new writer that bypasses the guards.
  logger.warn('Blog post content is not an object — content corruption detected', {
    slug,
    rawType: typeof raw,
    isArray: Array.isArray(raw),
  })

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as BlogContent
      }
    } catch {
      // Plain markdown string — treat as body directly
      return { body: raw } as BlogContent
    }
  }

  return null
}

/**
 * Converts Markdown body to HTML for dangerouslySetInnerHTML.
 * Handles both actual newlines and literal \\n escape sequences.
 */
function markdownToHtml(md: string): string {
  // Normalise literal \n sequences (appear when markdown passes through JSON encoding)
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

    if (t === '') {
      flushPara()
      flushList()
      continue
    }

    const h3 = t.match(/^### (.+)$/)
    const h2 = t.match(/^## (.+)$/)
    const h1 = t.match(/^# (.+)$/)
    const blockquote = t.match(/^> (.+)$/)
    const unordered = t.match(/^[-*] (.+)$/)
    const ordered = t.match(/^\d+\. (.+)$/)
    const hr = t === '---'

    if (h3) {
      flushPara(); flushList()
      blocks.push(`<h3>${inlineFmt(h3[1])}</h3>`)
    } else if (h2) {
      flushPara(); flushList()
      blocks.push(`<h2>${inlineFmt(h2[1])}</h2>`)
    } else if (h1) {
      flushPara(); flushList()
      blocks.push(`<h1>${inlineFmt(h1[1])}</h1>`)
    } else if (hr) {
      flushPara(); flushList()
      blocks.push('<hr/>')
    } else if (blockquote) {
      flushPara(); flushList()
      blocks.push(`<blockquote>${inlineFmt(blockquote[1])}</blockquote>`)
    } else if (unordered) {
      flushPara()
      flushList() // flush ordered if switching
      listItems.push(unordered[1])
    } else if (ordered) {
      flushPara()
      orderedItems.push(ordered[1])
    } else {
      flushList()
      paraLines.push(t)
    }
  }

  flushPara()
  flushList()

  return blocks.join('\n')
}

function inlineFmt(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}

// (public)/layout.tsx provides PublicNav + PublicFooter for every public page
export default async function DynamicBlogPost({ params }: { params: Promise<{ slug: string }> }): Promise<React.ReactElement> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const content = parseContent(post.content, post.slug)
  const isStatic = content?.type === 'static'
  const rawHtml = (content as Record<string, unknown> | null)?.html as string | undefined
  const body = rawHtml ?? (content?.body ?? '')

  // Static posts live in their own .tsx files — let Next.js fall through to the static route
  if (isStatic || !body) notFound()

  const midCta = content?.midCta
  const endCta = content?.endCta
  const sources = content?.sources ?? []
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const bodyHtml = rawHtml ? body : markdownToHtml(body)

  return (
    <div className="blog-article-wrap">
      <div className="blog-article-hero" style={{
        background: CATEGORY_GRADIENTS[post.category ?? ''] ?? 'linear-gradient(135deg,#1d4ed8,#0e7490)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '28px 32px 24px',
      }}>
        {post.category && (
          <span style={{
            fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.65)', alignSelf: 'flex-start',
            background: 'rgba(0,0,0,0.2)', padding: '3px 11px',
            borderRadius: 99, border: '1px solid rgba(255,255,255,0.15)',
          }}>{post.category}</span>
        )}
        <div style={{
          fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.95)',
          lineHeight: 1.3, letterSpacing: '-0.02em', maxWidth: 640,
        }}>{post.title}</div>
      </div>
    <article className="blog-article">
      <header className="blog-article-header">
        <div className="blog-article-meta-top">
          {post.category && (
            <span className="blog-post-category">{post.category}</span>
          )}
        </div>
        <h1 className="blog-article-title">{post.title}</h1>
        {post.excerpt && (
          <p className="blog-article-subtitle">{post.excerpt}</p>
        )}
        <div className="blog-article-meta-top" style={{ marginTop: 12 }}>
          {publishedDate && <span>{publishedDate}</span>}
          <span>&middot;</span>
          <span>Uptrue Team</span>
        </div>
      </header>

      {Boolean((post as unknown as Record<string, unknown>).auto_generated) && post.category === 'outage' && (
        <div style={{
          background: 'var(--bg-secondary, #f8f9fa)',
          border: '1px solid var(--border, #e5e7eb)',
          borderLeft: '4px solid var(--warning, #f59e0b)',
          borderRadius: 6,
          padding: '12px 16px',
          margin: '24px 0',
          fontSize: 13,
          color: 'var(--text-muted, #6b7280)',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--text, #111)', display: 'block', marginBottom: 4 }}>
            Automated monitoring report
          </strong>
          This report was generated automatically by Uptrue when our monitoring system detected a possible issue.
          Information may be incomplete or inaccurate — always check the official status page for confirmed updates.
          Uptrue is an independent monitoring service and has no affiliation with the companies mentioned.
          {' '}To request a correction or removal, email{' '}
          <a href="mailto:reports@uptrue.io" style={{ color: 'var(--accent, #3b82f6)' }}>reports@uptrue.io</a>.
        </div>
      )}

      {midCta && (
        <div className="blog-cta-section" style={{ margin: '32px 0' }}>
          <h3>{midCta.heading}</h3>
          <Link href={midCta.buttonUrl} className="btn btn-primary btn-lg">{midCta.buttonLabel}</Link>
        </div>
      )}

      <div
        className="blog-article-body"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      <BlogShareSubscribe
        title={post.title}
        url={`https://uptrue.io/blog/${post.slug}`}
        category={post.category}
      />

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
              <span className="blog-author-name">Uptrue Team</span>
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
              <span className="blog-author-name">Uptrue Team</span>
              <span className="blog-author-role">Website Monitoring Platform</span>
            </div>
          </div>
        </footer>
      )}
    </article>
    </div>
  )
}

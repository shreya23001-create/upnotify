import Link from 'next/link'
import { getPublishedBlogPosts } from '@/lib/db/blog-posts'

const CARD_GRADIENTS: Record<string, string> = {
  Guide:          'linear-gradient(90deg,#3b82f6,#06b6d4)',
  Security:       'linear-gradient(90deg,#ef4444,#f59e0b)',
  Performance:    'linear-gradient(90deg,#10b981,#06b6d4)',
  Ecommerce:      'linear-gradient(90deg,#f59e0b,#ec4899)',
  'Incident Report': 'linear-gradient(90deg,#ef4444,#7c3aed)',
  Agency:         'linear-gradient(90deg,#0c1322,#3b82f6)',
  WordPress:      'linear-gradient(90deg,#3b82f6,#06b6d4)',
  Hosting:        'linear-gradient(90deg,#10b981,#3b82f6)',
  Outage:         'linear-gradient(90deg,#ef4444,#7c3aed)',
}

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Guide:          { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.2)'  },
  Security:       { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)'   },
  Performance:    { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.2)'  },
  Ecommerce:      { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.2)'  },
  'Incident Report': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  Agency:         { bg: 'rgba(59,130,246,0.1)',  color: '#06b6d4', border: 'rgba(6,182,212,0.2)'   },
  WordPress:      { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.2)'  },
  Hosting:        { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.2)'  },
  Outage:         { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)'   },
}

function badgeStyle(cat: string) {
  return BADGE_STYLES[cat] ?? { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' }
}

function gradient(cat: string) {
  return CARD_GRADIENTS[cat] ?? 'linear-gradient(90deg,#3b82f6,#06b6d4)'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Post {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
}

export async function BlogPreview(): Promise<React.ReactElement> {
  // Single source of truth: database only
  const dbPosts = await getPublishedBlogPosts()

  const posts: Post[] = dbPosts
    .map(p => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? '',
      date: p.published_at ?? p.created_at,
      readTime: '5 min read',
      category: p.category ?? 'Outage',
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

  if (posts.length === 0) return <></>

  return (
    <section className="blog-section">
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div className="blog-section-header">
          <div className="blog-section-header-left">
            <div className="lp-section-eyebrow">From the blog</div>
            <h2 className="landing-section-title" style={{ textAlign: 'left', marginBottom: 0 }}>Latest articles</h2>
          </div>
          <Link href="/blog" className="btn btn-ghost">
            View all posts
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </Link>
        </div>

        <div className="blog-grid">
          {posts.map(post => {
            const bs = badgeStyle(post.category)
            return (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
                <div className="blog-card-image" style={{ background: gradient(post.category) }} />
                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span className="blog-cat-badge" style={{ background: bs.bg, color: bs.color, border: `1px solid ${bs.border}` }}>
                      {post.category}
                    </span>
                    <span className="blog-card-readtime">{post.readTime}</span>
                    <span className="blog-meta-sep">·</span>
                    <span className="blog-card-date">{formatDate(post.date)}</span>
                  </div>
                  <div className="blog-card-title">{post.title}</div>
                  <div className="blog-card-excerpt">{post.excerpt}</div>
                </div>
                <div className="blog-card-footer">
                  <span className="blog-card-link">
                    Read article
                    <svg className="blog-card-arrow" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>uptrue.io/blog</span>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </section>
  )
}

import Link from 'next/link'
import { getPublishedBlogPosts } from '@/lib/db/blog-posts'
import { BlogCardImage } from '@/components/ui/blog-card-image'

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Guide:             { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.2)'  },
  Security:          { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)'   },
  Performance:       { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.2)'  },
  Ecommerce:         { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.2)'  },
  'Incident Report': { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)'   },
  Agency:            { bg: 'rgba(59,130,246,0.1)',  color: '#06b6d4', border: 'rgba(6,182,212,0.2)'   },
  WordPress:         { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.2)'  },
  Hosting:           { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.2)'  },
  Outage:            { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)'   },
}

function badgeStyle(cat: string) {
  return BADGE_STYLES[cat] ?? { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' }
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
      <div className="container">
        <div className="blog-section-header">
          <div className="blog-section-header-left">
            <div className="section-eyebrow">From the blog</div>
            <h2 className="section-title">Latest articles</h2>
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
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="blog-card"
              >
                <div className="blog-card-image">
                  <BlogCardImage category={post.category} title={post.title} style={{ height: '100%' }} />
                </div>
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

        <div className="blog-view-all">
          <Link href="/blog" className="btn btn-ghost btn-lg">
            Browse all 60+ articles
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

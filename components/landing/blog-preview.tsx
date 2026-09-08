import Link from 'next/link'
import { ArrowRight, ShieldCheck, Zap, Globe, Cpu, AlertTriangle, Building2, BookOpen, Server, Activity, Eye } from 'lucide-react'
import { getPublishedBlogPosts } from '@/lib/db/blog-posts'

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string; grad: string }> = {
  Guide: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)', grad: 'linear-gradient(135deg,#00c94a,#3b82f6)' },
  Security: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)', grad: 'linear-gradient(135deg,#dc2626,#b45309)' },
  Performance: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)', grad: 'linear-gradient(135deg,#047857,#0e7490)' },
  Ecommerce: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)', grad: 'linear-gradient(135deg,#b45309,#9d174d)' },
  'Incident Report': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)', grad: 'linear-gradient(135deg,#b91c1c,#00873a)' },
  Agency: { bg: 'rgba(59,130,246,0.1)', color: '#06b6d4', border: 'rgba(6,182,212,0.2)', grad: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)' },
  WordPress: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)', grad: 'linear-gradient(135deg,#1d4ed8,#0e7490)' },
  Hosting: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)', grad: 'linear-gradient(135deg,#047857,#1d4ed8)' },
  Outage: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)', grad: 'linear-gradient(135deg,#b91c1c,#00873a)' },
  'AI-VISIBILITY': { bg: 'rgba(46,224,107,0.1)', color: '#2ee06b', border: 'rgba(46,224,107,0.2)', grad: 'linear-gradient(135deg,#00c94a,#1d4ed8)' },
  Insights: { bg: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: 'rgba(6,182,212,0.2)', grad: 'linear-gradient(135deg,#0e7490,#1d4ed8)' },
}

function badgeStyle(cat: string) {
  return BADGE_STYLES[cat] ?? { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)', grad: 'linear-gradient(135deg,#1d4ed8,#0e7490)' }
}

// Decorative floating icons per category — scattered around the image
const CATEGORY_ICONS: Record<string, React.ReactElement[]> = {
  Guide: [<BookOpen key="a" size={13} />, <Globe key="b" size={11} />, <Activity key="c" size={10} />],
  Security: [<ShieldCheck key="a" size={14} />, <Eye key="b" size={11} />, <AlertTriangle key="c" size={10} />],
  Performance: [<Zap key="a" size={14} />, <Activity key="b" size={11} />, <Cpu key="c" size={10} />],
  Ecommerce: [<Globe key="a" size={13} />, <ShieldCheck key="b" size={11} />, <Zap key="c" size={10} />],
  'Incident Report': [<AlertTriangle key="a" size={14} />, <Activity key="b" size={11} />, <Eye key="c" size={10} />],
  Agency: [<Building2 key="a" size={13} />, <Globe key="b" size={11} />, <Activity key="c" size={10} />],
  WordPress: [<Globe key="a" size={13} />, <Server key="b" size={11} />, <Cpu key="c" size={10} />],
  Hosting: [<Server key="a" size={14} />, <Activity key="b" size={11} />, <Globe key="c" size={10} />],
  Outage: [<AlertTriangle key="a" size={14} />, <Activity key="b" size={11} />, <Eye key="c" size={10} />],
  'AI-VISIBILITY': [<Cpu key="a" size={14} />, <Eye key="b" size={11} />, <Zap key="c" size={10} />],
  Insights: [<Activity key="a" size={13} />, <Zap key="b" size={11} />, <Eye key="c" size={10} />],
}

function getCategoryIcons(cat: string): React.ReactElement[] {
  return CATEGORY_ICONS[cat] ?? [<Globe key="a" size={13} />, <Activity key="b" size={11} />, <Zap key="c" size={10} />]
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
            <h2 className="section-title">Latest &nbsp; Articles</h2>
          </div>
          <Link href="/blog" className="btn btn-ghost">
            View all posts
            <ArrowRight size={14} strokeWidth={2.5} />
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
                {/* Gradient hero image */}
                <div className="blog-card-image" style={{ background: bs.grad }}>
                  {/* mesh overlay */}
                  <div className="blog-card-image-mesh" />
                  {/* floating scattered icons */}
                  <div className="blog-card-floats">
                    {getCategoryIcons(post.category).map((icon, i) => (
                      <span key={i} className={`blog-card-float blog-card-float-${i}`}>{icon}</span>
                    ))}
                  </div>
                  {/* central keyword pill */}
                  <div className="blog-card-center-pill">{post.category}</div>
                  {/* shine sweep on hover */}
                  <div className="blog-card-image-shine" />
                </div>

                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span className="blog-cat-badge" style={{ background: bs.bg, color: bs.color, border: `1px solid ${bs.border}` }}>
                      {post.category}
                    </span>
                    <span className="blog-meta-sep">·</span>
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
                    <ArrowRight className="blog-card-arrow" size={13} strokeWidth={2.5} />
                  </span>
                  <span className="blog-card-domain">uptrue.io/blog</span>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="blog-view-all">
          <Link href="/blog" className="btn btn-ghost btn-lg">
            Browse all 60+ articles
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  )
}

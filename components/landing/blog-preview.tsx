import Link from 'next/link'
import { getPublishedBlogPosts } from '@/lib/db/blog-posts'

// Static post index — source of truth for editorial posts (content in /app/blog/[slug]/)
const STATIC_POSTS = [
  { slug: 'website-monitoring-guide',       title: 'Website Monitoring in 2026: The Complete Guide',                                     excerpt: 'Everything you need to know about monitoring your website — from basic uptime checks to advanced performance tracking.',                    date: '2026-03-05', readTime: '12 min read', category: 'Guide'        },
  { slug: 'public-status-page-guide',       title: 'How to Create a Public Status Page for Your Website (Free)',                           excerpt: 'Your customers deserve to know when something is wrong. Learn what status pages are and how to set one up in under five minutes.',           date: '2026-03-06', readTime: '10 min read', category: 'Guide'        },
  { slug: 'uptime-monitoring-agencies',     title: 'Uptime Monitoring for Agencies: Managing 100+ Client Sites',                          excerpt: 'Generic monitoring tools were built for one-site teams. If you are an agency managing dozens of client websites, you need a different approach.', date: '2026-03-07', readTime: '11 min read', category: 'Agency'       },
  { slug: 'ssl-certificate-monitoring',     title: "SSL Certificate Monitoring: Why Auto-Renew Isn't Enough",                            excerpt: 'Auto-renew sounds foolproof, but SSL certificates still fail in production every day. Here is why it happens and what monitoring catches.',     date: '2026-03-08', readTime: '10 min read', category: 'Security'     },
  { slug: 'competitor-analysis-ecommerce', title: 'Website Competitor Analysis Tools for Ecommerce in 2026',                             excerpt: "Your competitors' website performance directly affects your bottom line. Learn what to track and how to turn intelligence into advantage.",    date: '2026-03-10', readTime: '11 min read', category: 'Ecommerce'    },
  { slug: 'cheap-hosting-hidden-costs',     title: 'Why Cheap Hosting Is the Most Expensive Mistake You Can Make',                        excerpt: 'That £3/month hosting plan is costing you thousands in lost revenue, damaged SEO, and customers who never come back.',                      date: '2026-03-12', readTime: '13 min read', category: 'Hosting'      },
  { slug: 'website-downtime-warning-signs', title: '10 Warning Signs Your Website Is About to Go Down',                                   excerpt: 'Websites rarely crash without warning. Slow TTFB, expiring SSL, rising error rates — here are the 10 signs and how to catch them early.',   date: '2026-03-18', readTime: '13 min read', category: 'Guide'        },
  { slug: 'what-is-uptime-monitoring',      title: 'What Is Uptime Monitoring and Why Every Website Needs It',                            excerpt: 'Uptime monitoring checks your website every 60 seconds and alerts you when it goes down. Learn how it works and how to set it up free.',      date: '2026-03-25', readTime: '11 min read', category: 'Guide'        },
  { slug: 'dns-monitoring-explained',       title: 'DNS Monitoring Explained: Why Your Domain Records Matter',                            excerpt: 'Your DNS records control where your website and email point. When they change accidentally or maliciously — everything breaks.',              date: '2026-03-30', readTime: '12 min read', category: 'Guide'        },
  { slug: 'free-status-page-saas',          title: 'How to Set Up a Free Public Status Page for Your SaaS',                              excerpt: 'When your service goes down, customers have two options: panic and email you, or check your status page. Learn how to set one up free.',     date: '2026-04-03', readTime: '11 min read', category: 'Guide'        },
  { slug: 'uptime-monitoring-tools',        title: 'Best Uptime Monitoring Tools in 2026: What to Look For',                              excerpt: 'Not all uptime monitoring tools are equal. Check frequency, multi-region checks, SSL monitoring, alert channels — what separates good from bad.', date: '2026-04-06', readTime: '13 min read', category: 'Guide'        },
  { slug: 'ssl-certificate-expired',        title: "SSL Certificate Expired: What It Means and How to Fix It in 10 Minutes",              excerpt: "Visitors see 'Your connection is not private' and leave immediately. Learn what the warning means and how to prevent it recurring.",          date: '2026-04-06', readTime: '12 min read', category: 'Security'     },
  { slug: 'website-response-time',          title: 'What Is a Good Website Response Time? (And How to Fix a Slow Server)',                excerpt: 'Under 200ms is excellent, above 2 seconds is damaging. Learn what drives high TTFB and how to monitor it continuously.',                     date: '2026-04-06', readTime: '13 min read', category: 'Performance'  },
  { slug: 'woocommerce-down',               title: 'WooCommerce Down? How to Diagnose and Fix a Broken Store',                            excerpt: 'Your WooCommerce store is not working and every minute is lost revenue. Step-by-step diagnosis for plugin conflicts, DB errors, and more.',  date: '2026-04-06', readTime: '15 min read', category: 'Ecommerce'    },
  { slug: 'shopify-down',                   title: 'Is Shopify Down? How to Check Shopify Status and Protect Your Store',                 excerpt: 'Your Shopify store is not loading. Here is how to find out in 60 seconds whether it is a platform issue or something specific to your store.', date: '2026-04-06', readTime: '14 min read', category: 'Ecommerce'    },
]

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
  // Fetch from DB
  const dbPosts = await getPublishedBlogPosts()

  const dbMapped: Post[] = dbPosts.map(p => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? '',
    date: p.published_at ?? p.created_at,
    readTime: '5 min read',
    category: p.category ?? 'Outage',
  }))

  const staticMapped: Post[] = STATIC_POSTS.map(p => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    date: p.date,
    readTime: p.readTime,
    category: p.category,
  }))

  // Merge: DB takes precedence for duplicate slugs, sort newest first, take 6
  const seen = new Set<string>()
  const posts = [...dbMapped, ...staticMapped]
    .filter(p => { if (seen.has(p.slug)) return false; seen.add(p.slug); return true })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

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

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link href="/blog" className="btn btn-ghost btn-lg">
            Browse all 60+ articles
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

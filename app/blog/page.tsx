import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog — Website Monitoring Guides & Insights',
  description:
    'Practical guides on website monitoring, uptime, SSL certificates, status pages, and competitive analysis. Written by the Uptrue team for developers, agencies, and site owners.',
  alternates: { canonical: 'https://uptrue.io/blog' },
  openGraph: {
    title: 'Uptrue Blog — Website Monitoring Guides & Insights',
    description:
      'Practical guides on website monitoring, uptime, SSL certificates, status pages, and competitive analysis.',
    url: 'https://uptrue.io/blog',
  },
}

interface BlogPostMeta {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
}

const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: 'website-monitoring-guide',
    title: 'Website Monitoring in 2026: The Complete Guide',
    excerpt:
      'Everything you need to know about monitoring your website — from basic uptime checks to advanced performance tracking. Learn why monitoring matters and how to pick the right tool for your needs.',
    date: '2 April 2026',
    readTime: '12 min read',
    category: 'Guide',
  },
  {
    slug: 'public-status-page-guide',
    title: 'How to Create a Public Status Page for Your Website (Free)',
    excerpt:
      'Your customers deserve to know when something is wrong. Learn what status pages are, why they build trust, and how to set one up in under five minutes — without writing any code.',
    date: '5 April 2026',
    readTime: '10 min read',
    category: 'Guide',
  },
  {
    slug: 'uptime-monitoring-agencies',
    title: 'Uptime Monitoring for Agencies: Managing 100+ Client Sites',
    excerpt:
      'Generic monitoring tools were built for one-site teams. If you are an agency managing dozens or hundreds of client websites, you need a different approach entirely.',
    date: '9 April 2026',
    readTime: '11 min read',
    category: 'Agency',
  },
  {
    slug: 'ssl-certificate-monitoring',
    title: 'SSL Certificate Monitoring: Why Auto-Renew Isn\'t Enough',
    excerpt:
      'Auto-renew sounds foolproof, but SSL certificates still fail in production every single day. Here is why it happens, what goes wrong, and how monitoring catches what automation misses.',
    date: '14 April 2026',
    readTime: '10 min read',
    category: 'Security',
  },
  {
    slug: 'competitor-analysis-ecommerce',
    title: 'Website Competitor Analysis Tools for Ecommerce in 2026',
    excerpt:
      'Your competitors\' website performance directly affects your bottom line. Learn what to track, which tools actually help, and how to turn competitive intelligence into a business advantage.',
    date: '18 April 2026',
    readTime: '11 min read',
    category: 'Ecommerce',
  },
]

export default function BlogIndexPage(): React.ReactElement {
  return (
    <div className="blog-index">
      <div className="blog-index-header">
        <h1 className="blog-index-title">Uptrue Blog</h1>
        <p className="blog-index-subtitle">
          Guides, tutorials, and practical insights on website monitoring, uptime, and infrastructure reliability.
        </p>
      </div>

      <div className="blog-posts-grid">
        {BLOG_POSTS.map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.slug} className="blog-post-card">
            <div className="blog-post-card-body">
              <span className="blog-post-category">{post.category}</span>
              <h2 className="blog-post-card-title">{post.title}</h2>
              <p className="blog-post-card-excerpt">{post.excerpt}</p>
              <div className="blog-post-card-meta">
                <span>{post.date}</span>
                <span className="blog-post-card-dot" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

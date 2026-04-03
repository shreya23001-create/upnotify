'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

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
  {
    slug: 'wordpress-database-connection-error',
    title: 'Error Establishing a Database Connection in WordPress: Complete Fix and Monitoring Guide',
    excerpt:
      'The scariest page your WordPress site can show. Learn what causes the database connection error, how to fix each cause, and how to monitor for it so you never discover it from a customer again.',
    date: '22 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-contact-form-not-sending',
    title: 'Contact Form 7 Not Sending Emails: Your Leads Are Disappearing and You Don\'t Know',
    excerpt:
      'Contact Form 7 can silently stop sending emails while still showing a success message. Your leads vanish and you have no idea. Here is why it happens and how to catch it.',
    date: '23 April 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-white-screen-of-death',
    title: 'WordPress White Screen of Death: How to Detect It Before Your Visitors Do',
    excerpt:
      'The WSOD shows a blank page instead of your website — and most monitoring tools report it as "up." Learn what causes it, how to fix it, and how keyword monitoring catches what HTTP checks miss.',
    date: '24 April 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-critical-error',
    title: 'There Has Been a Critical Error on This Website: What It Means and How to Fix It',
    excerpt:
      'WordPress 5.2 replaced the White Screen of Death with a critical error message — but its built-in recovery email is unreliable. Learn what triggers it, how to fix it, and how keyword monitoring catches it automatically.',
    date: '26 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-too-many-redirects',
    title: 'WordPress Too Many Redirects: Fix ERR_TOO_MANY_REDIRECTS and Prevent It Forever',
    excerpt:
      'The redirect loop locks you out of your entire site — including wp-admin. Learn what causes it (SSL stacking, Cloudflare Flexible SSL, .htaccess conflicts) and how HTTP monitoring detects it automatically.',
    date: '27 April 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-php-memory-exhausted',
    title: 'PHP Fatal Error: Allowed Memory Size Exhausted in WordPress — Complete Fix Guide',
    excerpt:
      'The PHP memory exhausted error crashes your site with a white screen or 500 error. Learn what causes it, four ways to fix it, and how to monitor for the crashes it causes.',
    date: '28 April 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-redirect-loop',
    title: 'WordPress Login Redirect Loop: Why wp-admin Keeps Sending You Back to the Login Page',
    excerpt:
      'You enter the correct password, click Log In, and land right back on the same login screen. No error message. No explanation. Learn what causes the wp-admin redirect loop and how to fix it.',
    date: '29 April 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-recovery-mode',
    title: 'WordPress Recovery Mode: What Triggers It, What It Means, and How to Respond',
    excerpt:
      'WordPress recovery mode is supposed to email you when a fatal error crashes your site. In practice, that email almost never arrives. Learn what triggers it, what your visitors see, and how to monitor for it externally.',
    date: '30 April 2026',
    readTime: '13 min read',
    category: 'WordPress',
  },
  {
    slug: 'wp-mail-smtp-not-working',
    title: 'WP Mail SMTP Not Sending Emails: Why Your WordPress Site Is Silently Broken',
    excerpt:
      'WP Mail SMTP can stop sending emails without any visible error. Contact form submissions vanish, order confirmations never arrive, and you have no idea. Learn what causes it and how to detect it.',
    date: '1 May 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-403-forbidden',
    title: 'WordPress 403 Forbidden Error: Why Your Pages Are Blocked and How to Fix It',
    excerpt:
      'Your server is actively refusing to serve your pages — but you might not know because the block can be IP-specific. Learn what causes 403 errors and how HTTP monitoring catches them instantly.',
    date: '2 May 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-japanese-keyword-hack',
    title: 'Japanese Keyword Hack on WordPress: How Hackers Hijack Your SEO and You Don\'t Even Know',
    excerpt:
      'Thousands of spam pages in Japanese appear in Google under your domain — but you cannot see them from wp-admin. Learn how the hack works, how to clean it, and how keyword monitoring catches what cloaking hides.',
    date: '3 May 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-malware-redirect',
    title: 'WordPress Malware Redirect: Why Your Visitors Are Being Sent to Spam Sites',
    excerpt:
      'Your visitors are being redirected to spam sites — but only on mobile, only from Google, and only on the first visit. Learn how conditional redirect hacks work and how HTTP monitoring detects them automatically.',
    date: '4 May 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-504-gateway-timeout',
    title: '504 Gateway Timeout on WordPress: Why Your Pages Take Forever and Then Fail',
    excerpt:
      'Your page loads for 60 seconds and then fails. The 504 is the final stage of a performance problem that has been building for weeks. Learn what causes it and how response time monitoring catches the slowdown before it becomes an outage.',
    date: '5 May 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-pharma-hack',
    title: 'WordPress Pharma Hack: Hidden Viagra Links in Your Site That Only Google Sees',
    excerpt:
      'Hidden pharmaceutical spam is injected directly into your existing pages — invisible to you but fully visible to Google. Learn how the pharma hack works, how to clean it, and how keyword monitoring catches what your eyes cannot see.',
    date: '6 May 2026',
    readTime: '15 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-cron-not-working',
    title: 'WordPress wp-cron Not Firing: Why Scheduled Posts, Emails, and Backups Silently Stop',
    excerpt:
      'WordPress cron depends on traffic to fire. On low-traffic sites, scheduled posts publish late, backups stop running, and emails never send. Learn why wp-cron fails and how heartbeat monitoring keeps it firing on schedule.',
    date: '7 May 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'elementor-not-loading',
    title: 'Elementor Not Loading After Update? Fix the White Screen Before You Lose Traffic',
    excerpt:
      'Elementor can break after a WordPress, PHP, or plugin update — showing a white screen, missing widgets, or a 500 error. Learn what causes it and how HTTP and keyword monitoring catches broken pages automatically.',
    date: '8 May 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-htaccess-error',
    title: 'WordPress .htaccess File Corrupted: How a Single File Takes Down Your Entire Site',
    excerpt:
      'A single misplaced character in .htaccess returns a 500 Internal Server Error on every page. Learn what causes corruption, how to regenerate the file, and how HTTP monitoring catches it instantly.',
    date: '9 May 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
  {
    slug: 'wordpress-permalinks-not-working',
    title: 'WordPress Permalink Changes Breaking All URLs: How to Prevent SEO Disaster',
    excerpt:
      'Changing your permalink structure breaks every URL on your site. Every indexed page returns 404, every backlink leads nowhere, and Google starts deranking you within days. Learn how to fix it and how monitoring multiple pages catches widespread 404s.',
    date: '10 May 2026',
    readTime: '14 min read',
    category: 'WordPress',
  },
]

const POSTS_PER_PAGE = 6

export default function BlogIndexPage(): React.ReactElement {
  const searchParams = useSearchParams()
  const pageParam = searchParams.get('page')
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const totalPages = Math.max(1, Math.ceil(BLOG_POSTS.length / POSTS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIdx = (safePage - 1) * POSTS_PER_PAGE
  const visiblePosts = BLOG_POSTS.slice(startIdx, startIdx + POSTS_PER_PAGE)

  return (
    <div className="blog-index">
      <div className="blog-index-header">
        <h1 className="blog-index-title">Uptrue Blog</h1>
        <p className="blog-index-subtitle">
          Guides, tutorials, and practical insights on website monitoring, uptime, and infrastructure reliability.
        </p>
      </div>

      <div className="blog-posts-grid">
        {visiblePosts.map((post) => (
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

      {totalPages > 1 && (
        <div className="blog-pagination">
          {safePage > 1 ? (
            <Link href={`/blog?page=${safePage - 1}`} className="btn btn-secondary btn-sm">
              {'\u2190'} Newer Posts
            </Link>
          ) : (
            <span />
          )}

          <span className="blog-pagination-info">
            Page {safePage} of {totalPages}
          </span>

          {safePage < totalPages ? (
            <Link href={`/blog?page=${safePage + 1}`} className="btn btn-secondary btn-sm">
              Older Posts {'\u2192'}
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  )
}

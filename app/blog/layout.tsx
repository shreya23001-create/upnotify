import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: {
    default: 'Blog',
    template: '%s | Uptrue Blog',
  },
  description:
    'Guides, tutorials, and insights on website monitoring, uptime, SSL, status pages, and infrastructure reliability. Written by the Uptrue team.',
  openGraph: {
    title: 'Uptrue Blog — Website Monitoring Guides & Insights',
    description:
      'Guides, tutorials, and insights on website monitoring, uptime, SSL, status pages, and infrastructure reliability.',
    url: 'https://uptrue.io/blog',
    siteName: 'Uptrue',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="blog-layout">
      <header className="blog-header">
        <div className="blog-header-inner">
          <Link href="/" className="blog-logo" aria-label="Uptrue home">
            <img
              src="/logo-concept-1.svg"
              alt="Uptrue"
              width={140}
              height={35}
              className="landing-logo-img"
            />
          </Link>
          <nav className="blog-nav">
            <Link href="/blog">Blog</Link>
            <Link href="/score">Score</Link>
            <Link href="/tracker">Tracker</Link>
            <Link href="/#pricing">Pricing</Link>
          </nav>
          <div className="blog-header-actions">
            <Link href="/login" className="btn btn-ghost">Log in</Link>
            <Link href="/signup" className="btn btn-primary">Start Free</Link>
          </div>
        </div>
      </header>
      <main className="blog-main">{children}</main>
      <footer className="blog-footer">
        <div className="blog-footer-inner">
          <div className="blog-footer-grid">
            <div className="blog-footer-brand">
              <img
                src="/logo-concept-1.svg"
                alt="Uptrue"
                width={120}
                height={30}
                className="landing-logo-img"
              />
              <p className="blog-footer-tagline">
                Uptime, performance &amp; infrastructure monitoring for agencies and teams.
              </p>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Product</h4>
              <Link href="/#features">Features</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/score">Website Score</Link>
              <Link href="/tracker">Uptime Tracker</Link>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Resources</h4>
              <Link href="/blog">Blog</Link>
              <Link href="/blog/website-monitoring-guide">Monitoring Guide</Link>
              <Link href="/blog/public-status-page-guide">Status Page Guide</Link>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Legal</h4>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/cookies">Cookies</Link>
            </div>
          </div>
          <div className="blog-footer-bottom">
            <p>{'\u00A9'} {new Date().getFullYear()} Vision Software Solutions Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

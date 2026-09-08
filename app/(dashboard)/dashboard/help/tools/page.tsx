'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { HelpSidebar } from '../help-sidebar'

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Are Upnotify free tools really free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The SSL Checker, Uptime Calculator, and Upnotify Score are completely free with no signup required. You can use them as many times as you like.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does the Upnotify Score measure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Upnotify Score analyses your website across five areas: SSL certificate health, DNS configuration, security headers, response time, and overall availability. It gives you a grade from A+ to F with specific recommendations for improvement.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need an Upnotify account to use the free tools?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. All free tools work without an account or login. If you want continuous monitoring with alerts, you can sign up for a free Upnotify account separately.',
      },
    },
  ],
}

export default function ToolsHelpPage(): React.ReactElement {
  const pathname = usePathname()

  return (
    <div className="help-layout">
      <HelpSidebar currentPath={pathname} />
      <div className="help-main">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
        />

        <nav className="help-breadcrumb" aria-label="Breadcrumb">
          <Link href="/dashboard/help">Help Center</Link>
          <span className="help-breadcrumb-sep">/</span>
          <span>Free Tools</span>
        </nav>

        <article className="help-article">
          <div className="help-article-hero">
            <h1 className="help-article-title">Free Tools</h1>
            <p className="help-article-intro">
              Sometimes you just need a quick answer -- is my SSL valid, how much
              downtime does 99.9% actually mean, is my site healthy? Our free tools
              give you instant results without signing up or paying a penny.
            </p>
          </div>

          <section className="help-section">
            <h2 className="help-section-title">SSL Checker</h2>
            <p>
              The <Link href="/tools/ssl-checker">SSL Checker</Link> inspects
              the SSL certificate on any domain you enter. It shows you:
            </p>
            <ul className="help-list">
              <li><strong>Certificate issuer</strong> -- who issued the certificate (e.g. Let&rsquo;s Encrypt, DigiCert).</li>
              <li><strong>Expiry date and days remaining</strong> -- colour-coded so you can spot certificates about to expire at a glance.</li>
              <li><strong>TLS version</strong> -- confirms whether the site supports modern TLS 1.2 or 1.3.</li>
              <li><strong>Chain validity</strong> -- checks the full certificate chain for errors.</li>
            </ul>
            <p>
              Just enter a domain (e.g. <code>example.com</code>) and hit Check. Results
              appear in seconds.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Uptime Calculator</h2>
            <p>
              The <Link href="/tools/uptime-calculator">Uptime Calculator</Link> converts
              uptime percentages into real-world downtime. Enter a percentage like 99.9%
              and it tells you:
            </p>
            <ul className="help-list">
              <li>How much downtime that allows per day, week, month, and year.</li>
              <li>What common SLA tiers (99%, 99.9%, 99.99%, 99.999%) actually mean in practice.</li>
            </ul>
            <p>
              Useful when negotiating SLAs with customers, evaluating hosting providers, or
              simply understanding what &ldquo;five nines&rdquo; really means.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Upnotify Score</h2>
            <p>
              The <Link href="/score">Upnotify Score</Link> is a free health check for any
              website. Enter a domain and it analyses five areas:
            </p>
            <ul className="help-list">
              <li><strong>SSL certificate health</strong> -- valid, expiring soon, or expired.</li>
              <li><strong>DNS configuration</strong> -- correct records, propagation issues.</li>
              <li><strong>Security headers</strong> -- HSTS, CSP, X-Frame-Options, and more.</li>
              <li><strong>Response time</strong> -- how fast the server responds.</li>
              <li><strong>Overall availability</strong> -- can the site be reached right now.</li>
            </ul>
            <p>
              You get a grade from <strong>A+</strong> to <strong>F</strong> with specific
              recommendations on what to fix. Share the results with your team or use them to
              pitch monitoring services to clients.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">No account needed</h2>
            <p>
              All three tools work without signing up. Run as many checks as you like.
              If you want continuous, automated monitoring with alerts and incident tracking,
              you can <Link href="/signup">create a free Upnotify account</Link> any time.
            </p>
          </section>

          <div className="help-next-links">
            <p className="help-next-label">Back to</p>
            <Link href="/dashboard/help" className="help-next-link">
              &larr; Help Center
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}

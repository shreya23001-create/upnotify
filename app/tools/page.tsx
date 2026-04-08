import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Free Website Monitoring Tools',
  description:
    'Free tools for website owners: SSL certificate checker, uptime calculator, and more. No signup required.',
  alternates: { canonical: 'https://uptrue.io/tools' },
  openGraph: {
    title: 'Free Website Monitoring Tools | Uptrue',
    description:
      'Free SSL checker, uptime calculator, and more tools for website owners.',
    url: 'https://uptrue.io/tools',
    type: 'website',
  },
}

const TOOLS = [
  {
    slug: 'ai-seo-checker',
    title: 'AI SEO Checker',
    description:
      'Is your website visible to ChatGPT, Perplexity, Claude, and Gemini? Get your AI readiness score, audit crawler access, generate your llms.txt, and see where to submit your site.',
    tag: 'New',
  },
  {
    slug: 'ssl-checker',
    title: 'SSL Certificate Checker',
    description:
      'Check any SSL certificate instantly. See issuer, expiry date, days remaining, TLS version, and chain validity. Color-coded warnings for expiring certificates.',
    tag: 'Popular',
  },
  {
    slug: 'uptime-calculator',
    title: 'Uptime & SLA Calculator',
    description:
      'Calculate allowed downtime for any uptime percentage. See how much downtime 99.9%, 99.99%, and other SLA levels actually mean in real time.',
    tag: '',
  },
]

export default function ToolsIndexPage(): React.ReactElement {
  return (
    <div className="tools-page">
      <div className="tools-hero">
        <h1 className="tools-hero-title">Free Website Tools</h1>
        <p className="tools-hero-subtitle">
          Useful tools for developers, sysadmins, and website owners. No signup required.
        </p>
      </div>

      <div className="tools-container">
        <div className="tools-grid">
          {TOOLS.map((tool) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="tools-card">
              <div className="tools-card-header">
                <h2 className="tools-card-title">{tool.title}</h2>
                {tool.tag && <span className="tools-card-tag">{tool.tag}</span>}
              </div>
              <p className="tools-card-desc">{tool.description}</p>
              <span className="tools-card-link">Use this tool &rarr;</span>
            </Link>
          ))}
        </div>

        <div className="tools-coming-soon">
          <h3>More tools coming soon</h3>
          <p>
            DNS lookup, header checker, WHOIS lookup, website speed test, and more.
            Sign up for free to be notified when new tools are available.
          </p>
        </div>

        <div className="tools-cta">
          <h2>Monitor your website 24/7</h2>
          <p>Go beyond one-time checks. Get continuous monitoring with instant alerts.</p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </a>
        </div>
      </div>
    </div>
  )
}

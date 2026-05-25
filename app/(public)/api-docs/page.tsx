import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'API Documentation — Uptrue',
  description:
    'The Uptrue public REST API and SDKs are launching with our developer platform. Until then, integrate with Uptrue today via webhooks, Slack, Teams, and Zapier-style automations.',
  alternates: {
    canonical: 'https://uptrue.io/api-docs',
  },
  openGraph: {
    title: 'API Documentation — Uptrue',
    description:
      'The Uptrue public REST API is launching with our developer platform. Integrate today via webhooks and integrations.',
    url: 'https://uptrue.io/api-docs',
    type: 'website',
  },
}

export default function ApiDocsPage(): React.ReactElement {
  return (
    <div className="landing">
      <section className="about-hero">
        <div className="landing-container">
          <h1 className="about-hero-title">API Documentation</h1>
          <p className="about-hero-subtitle">
            The Uptrue public REST API and official SDKs ship with our developer platform launch.
            Until then, here&rsquo;s how teams integrate with Uptrue today.
          </p>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <div className="help-topics-grid">
            <Link href="/integrations/webhook" className="card help-topic-card">
              <div className="help-topic-icon-wrap">🪝</div>
              <h2 className="help-topic-title">Webhooks</h2>
              <p className="help-topic-desc">
                Receive HMAC-signed events on monitor up/down, incident create/resolve, and check results.
                Configure per channel.
              </p>
              <span className="help-topic-arrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>

            <Link href="/integrations" className="card help-topic-card">
              <div className="help-topic-icon-wrap">🔌</div>
              <h2 className="help-topic-title">All Integrations</h2>
              <p className="help-topic-desc">
                Slack, Microsoft Teams, Telegram, email, and more — wire up alerts to wherever your team
                already works.
              </p>
              <span className="help-topic-arrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>

            <Link href="/dashboard/help/wordpress" className="card help-topic-card">
              <div className="help-topic-icon-wrap">📝</div>
              <h2 className="help-topic-title">WordPress Plugin</h2>
              <p className="help-topic-desc">
                Push-based monitoring from inside your WordPress site — file injections, rogue users,
                security audits, and a free monthly health report.
              </p>
              <span className="help-topic-arrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
          </div>

          <div className="card" style={{ marginTop: 48, padding: 32, textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Want early access to the REST API?</h2>
            <p style={{ color: '#94a3b8', marginBottom: 24, maxWidth: 560, margin: '0 auto 24px' }}>
              We&rsquo;re building a full REST API with SDKs for Node, Python, Go and PHP, plus Zapier / Make /
              n8n connectors. If you&rsquo;d like early access when it launches, let us know.
            </p>
            <Link href="/contact" className="btn btn-primary">
              Request API Access
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

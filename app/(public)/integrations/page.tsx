import type { Metadata } from 'next'
import Link from 'next/link'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'Upnotify Integrations — Slack, Microsoft Teams, Telegram, Webhooks',
  description:
    'Send Upnotify monitoring alerts to Slack, Microsoft Teams, Telegram, or any signed webhook endpoint. Native formatting, severity-coded messages, one-click links to the monitor. Free plan supports email; Lite (£1/month) unlocks every channel.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/integrations' },
  openGraph: {
    title: 'Upnotify Integrations — Slack, Teams, Telegram, Webhooks',
    description:
      'Pipe Upnotify uptime, SSL and security alerts into Slack, Teams, Telegram, or any webhook endpoint with HMAC signing.',
    url: 'https://upnotify-monitoring.vercel.app/integrations',
    type: 'website',
  },
}

const INTEGRATIONS = [
  {
    slug: 'slack',
    name: 'Slack',
    emoji: '💬',
    tagline: 'Block-formatted alerts in your team channel',
    description:
      'Severity, target, status and a one-click "View Monitor" button. Set up with an incoming webhook in 60 seconds.',
  },
  {
    slug: 'teams',
    name: 'Microsoft Teams',
    emoji: '👥',
    tagline: 'Native MessageCard alerts in any Teams channel',
    description:
      'Red/green theme on incident vs resolution, severity and target as Teams facts, OpenUri click-through to your monitor.',
  },
  {
    slug: 'telegram',
    name: 'Telegram',
    emoji: '✈️',
    tagline: 'Mobile push alerts via the Upnotify Telegram bot',
    description:
      'Add the Upnotify bot to any chat or channel, paste the chat ID into Upnotify, and start receiving alerts on every device.',
  },
  {
    slug: 'webhook',
    name: 'Signed Webhooks',
    emoji: '🪝',
    tagline: 'JSON POST with HMAC-SHA256 signing',
    description:
      'Receive every alert as a signed JSON payload. Wire into PagerDuty, Opsgenie, Datadog, n8n, or anywhere else that accepts a webhook.',
  },
]

const FAQ = [
  {
    q: 'Which integration should I pick?',
    a: 'For team-wide visibility on incidents, Slack or Microsoft Teams. For mobile push to on-call engineers, Telegram. For wiring Upnotify into PagerDuty, Opsgenie, Datadog, or your own incident management, signed webhooks. Most customers run two or three channels in parallel for redundancy.',
  },
  {
    q: 'Are integrations free?',
    a: 'The Free plan includes email alerts on 3 monitors. Slack, Microsoft Teams, Telegram and signed webhook channels require a Lite plan or higher (Lite is £1/month or £10/year).',
  },
  {
    q: 'Can I send the same alert to multiple channels?',
    a: 'Yes. Attach multiple alert channels to a single monitor — e.g. page engineering on Telegram, post a notice in #ops on Slack, and ping a webhook into PagerDuty all from the same incident.',
  },
  {
    q: 'What about PagerDuty, Opsgenie, Datadog?',
    a: 'Native PagerDuty and Opsgenie integrations are on the V1.5 roadmap. In the meantime, every Upnotify alert can fire as a signed webhook — point that at PagerDuty\'s generic webhook integration and you have a full integration in 5 minutes.',
  },
  {
    q: 'How does Upnotify prevent alert fatigue across channels?',
    a: 'Two-confirmation detection eliminates 95% of false positives from transient network blips. Smart Digest collapses repeat events for the same incident into a single follow-up email — you get the signal without 50 pages during one outage.',
  },
  {
    q: 'What if my integration endpoint is down when an alert fires?',
    a: 'The dispatch is recorded as failed in the alerts table and the error is logged. Upnotify does not currently retry failed dispatches. Best practice on critical infrastructure: pair every channel with at least one other for redundancy.',
  },
]

export default function IntegrationsIndexPage(): React.ReactElement {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section style={{
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border)',
        padding: '56px 24px 52px',
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            marginBottom: 14,
          }}>
            Integrations
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28, maxWidth: 720, margin: '0 auto 28px' }}>
            Pipe Upnotify uptime, SSL and security alerts into Slack, Microsoft Teams, Telegram, or any signed webhook endpoint. Free plan covers email; Lite (£1/month) unlocks every channel.
          </p>
        </div>
      </section>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '52px 24px 80px' }}>
        {/* Integration cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16, marginBottom: 56 }}>
          {INTEGRATIONS.map((it) => (
            <Link
              key={it.slug}
              href={`/integrations/${it.slug}`}
              style={{
                padding: '24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                gap: 18,
                alignItems: 'flex-start',
              }}
            >
              <span style={{
                width: 48, height: 48,
                background: 'var(--brand-gradient-soft)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, flexShrink: 0,
              }}>{it.emoji}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{it.name}</div>
                <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>{it.tagline}</div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>{it.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* What can you alert on */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            What can you alert on?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Every Upnotify monitor type fires alerts to every channel you configure. Some of the most common:
          </p>
          <ul className="about-list" style={{ fontSize: 15, lineHeight: 1.9 }}>
            <li><Link href="/monitoring/http-uptime-monitoring">HTTP uptime monitoring</Link> — site goes down, channel goes off.</li>
            <li><Link href="/monitoring/ssl-certificate-monitoring">SSL certificate monitoring</Link> — alerts at 30, 14, 3 days before expiry.</li>
            <li><Link href="/monitoring/api-endpoint-monitoring">API endpoint monitoring</Link> — body assertions, latency, status codes.</li>
            <li><Link href="/monitoring/dns-monitoring">DNS record monitoring</Link> — unauthorised record change detection.</li>
            <li><Link href="/monitoring/security-headers-monitoring">Security headers monitoring</Link> — HSTS, CSP, X-Frame-Options regressions.</li>
            <li><Link href="/monitoring">See all 24 monitor types →</Link></li>
          </ul>
          <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            Want to spot-check first? Run our{' '}
            <Link href="/score">free Website Health Score</Link> or browse all{' '}
            <Link href="/tools">free monitoring tools</Link>.
          </p>
        </section>

        {/* FAQ */}
        <Faq
          items={FAQ.map(item => ({ question: item.q, answer: item.a }))}
          headline="Frequently asked questions"
        />

        {/* Final CTA */}
        <div style={{
          textAlign: 'center',
          padding: '44px 32px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            Ready to wire up your alerts?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 520, margin: '0 auto 24px' }}>
            Free 3-monitor plan with email alerts to start. Lite (£1/month) unlocks every channel.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Monitoring Free
          </Link>
        </div>
      </main>
    </>
  )
}

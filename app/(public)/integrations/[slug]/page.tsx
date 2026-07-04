import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Faq from '@/components/landing/faq'

interface IntegrationPage {
  slug: string
  name: string
  emoji: string
  heroTitle: string
  heroSubtitle: string
  seoTitle: string
  seoDescription: string
  /** Two-paragraph "How the integration works". Sourced from the actual
   *  alert-dispatcher implementation in lib/services/alert-dispatcher.ts. */
  howItWorks: string[]
  /** Setup steps inside Uptrue dashboard. Real flow: Alerts → New Channel. */
  setupSteps: string[]
  /** What the user sees / receives when an alert fires. */
  whatYouGet: string[]
  /** Optional plain-text payload sample (used for webhook integration). */
  payloadSample?: string
  /** 6-question FAQ targeting integration keywords. */
  faq: { q: string; a: string }[]
  /** Slugs of other integrations to surface as related. */
  relatedSlugs: string[]
  /** Whether this integration requires a paid plan (Lite or above). */
  paidOnly: boolean
}

const PAGES: IntegrationPage[] = [
  {
    slug: 'slack',
    name: 'Slack',
    emoji: '💬',
    heroTitle: 'Uptrue + Slack — Real-time Alerts in Your Team Channel',
    heroSubtitle: 'Get every uptime, SSL and security incident delivered to the Slack channel where your team already works. Set up in under 60 seconds with an incoming webhook.',
    seoTitle: 'Uptrue Slack Integration — Website Monitoring Alerts in Slack',
    seoDescription: 'Send Uptrue uptime, SSL, DNS and performance alerts directly to Slack. Block-formatted messages with severity, target and one-click View Monitor button. Set up with an incoming webhook in 60 seconds.',
    howItWorks: [
      'When a monitor goes down, Uptrue runs a second confirmation check 5 seconds later. If both checks fail, an incident opens and an alert is dispatched to every channel you have configured — including Slack.',
      'The Slack message uses Slack\'s native Block Kit formatting: a clear headline, severity / target / status / time fields, and a one-click "View Monitor" button that takes the on-call engineer straight to the monitor in your Uptrue dashboard.',
    ],
    setupSteps: [
      'In Slack, go to your workspace settings and create an Incoming Webhook for the channel you want to receive alerts in. Slack will give you a webhook URL.',
      'In Uptrue, open Dashboard → Alerts → New Channel, pick "Slack" as the type, and paste the webhook URL.',
      'Click "Test" to send a sample alert to your Slack channel. Save the channel.',
      'Attach the new Slack channel to one or more monitors. Alerts now flow automatically.',
    ],
    whatYouGet: [
      'Block-formatted message with title, severity, target, status, and timestamp',
      'One-click "View Monitor" button linking to the monitor in your Uptrue dashboard',
      'Smart Digest: first event in a window goes instant; repeat events for the same incident roll into a single follow-up so the channel does not get flooded',
      'Same channel receives both incident-opened and incident-resolved alerts',
    ],
    faq: [
      { q: 'Is the Slack integration free?', a: 'The Slack integration requires a Lite plan or higher. The Free plan includes email alerts on 3 monitors. Lite (£1/month or £10/year) unlocks Slack, Microsoft Teams, Telegram, and signed webhook channels.' },
      { q: 'How do I get the Slack webhook URL?', a: 'In Slack: workspace settings → "Incoming Webhooks" app → "Add to Slack" → choose the channel you want alerts in → copy the webhook URL. The full Slack walkthrough is in their official docs.' },
      { q: 'Can I send alerts to multiple Slack channels?', a: 'Yes. Create one alert channel per Slack channel (engineering, ops, customer-support etc.). You can attach multiple alert channels to a single monitor — for example, paging engineering on critical incidents while sending a degraded-status notice to the customer-support channel.' },
      { q: 'Does Uptrue support Slack threads or @mentions?', a: 'Each alert is a top-level message, not a thread. We do not currently inject @mentions into the message — but you can configure your Slack channel to notify specific users when keywords like "incident" or your monitor name appear.' },
      { q: 'What happens if Slack is down when an alert needs to fire?', a: 'The alert is recorded as failed in the alerts table and the dispatch error is logged. Uptrue currently does not retry failed dispatches — but with multi-channel alerting (Slack + email + signed webhook) you have redundancy. Slack uptime is famously high, but for critical infrastructure pair Slack with at least one other channel.' },
      { q: 'Will my Slack channel be flooded during a long incident?', a: 'No. Smart Digest collapses repeat events for the same incident into a single follow-up after the initial alert. You get the signal without the noise. Configurable per organisation.' },
    ],
    relatedSlugs: ['teams', 'telegram', 'webhook'],
    paidOnly: true,
  },
  {
    slug: 'teams',
    name: 'Microsoft Teams',
    emoji: '👥',
    heroTitle: 'Uptrue + Microsoft Teams — Alerts in Your Team Channel',
    heroSubtitle: 'Send uptime, SSL and security incidents directly to a Microsoft Teams channel using an Incoming Webhook connector. Native MessageCard formatting with severity, target, and a click-through to your monitor.',
    seoTitle: 'Uptrue Microsoft Teams Integration — Website Monitoring Alerts in Teams',
    seoDescription: 'Send Uptrue website monitoring alerts to Microsoft Teams. MessageCard formatting with red/green theme colour, severity, target, status, and a one-click View Monitor action. Set up with an Incoming Webhook connector in 60 seconds.',
    howItWorks: [
      'When a monitor confirms a failure, Uptrue dispatches an alert to your Teams channel using the standard Office 365 Connector MessageCard format. Resolved incidents fire as a green-themed message; new incidents fire as red.',
      'Each alert includes the incident title, severity, monitored target, and current status — plus an "OpenUri" action that takes the on-call engineer straight to the monitor detail view in your Uptrue dashboard.',
    ],
    setupSteps: [
      'In Microsoft Teams, open the channel you want to receive alerts in, click the three-dot menu → Connectors.',
      'Find "Incoming Webhook", click Configure, give it a name (e.g. "Uptrue Alerts"), optionally upload an icon, and click Create. Teams gives you a webhook URL.',
      'In Uptrue, open Dashboard → Alerts → New Channel, pick "Microsoft Teams" as the type, and paste the webhook URL.',
      'Test the channel, save it, and attach it to one or more monitors.',
    ],
    whatYouGet: [
      'MessageCard with red theme on incidents, green on resolutions',
      'Severity, target, and status as Teams-native facts',
      '"View Monitor" button that opens the monitor in your dashboard',
      'Same channel receives both incident-opened and incident-resolved alerts',
    ],
    faq: [
      { q: 'Is the Microsoft Teams integration free?', a: 'The Teams integration requires a Lite plan or higher. The Free plan includes email alerts on 3 monitors. Lite (£1/month or £10/year) unlocks Teams, Slack, Telegram and signed webhook channels.' },
      { q: 'Where do I find the Incoming Webhook connector in Teams?', a: 'In the Teams channel where you want alerts: three-dot menu → Connectors → search for "Incoming Webhook" → Configure. You may need to be a Teams workspace admin to add new connectors. Microsoft\'s docs cover the steps in detail.' },
      { q: 'My organisation has disabled Office 365 Connectors. What can I do?', a: 'Some enterprise tenants disable third-party connectors. Workarounds: (1) ask IT to enable Incoming Webhook specifically for your channel, (2) use a Power Automate flow with the Uptrue webhook, or (3) use the Uptrue email channel and route into Teams via an Outlook/Teams email-to-channel rule.' },
      { q: 'Can I send alerts to multiple Teams channels?', a: 'Yes. Create one alert channel per Teams channel. You can attach multiple alert channels to a single monitor — useful for paging engineering on critical incidents and informing customer-support on degraded status.' },
      { q: 'Does the integration work with Teams in GCC / GCC High / DoD?', a: 'The standard Incoming Webhook connector is supported in commercial Microsoft 365 tenants. GCC, GCC High and DoD tenants have separate connector availability that may differ — please check with your Microsoft administrator before relying on this for regulated environments.' },
      { q: 'What happens if Teams is unreachable when an alert fires?', a: 'The alert is recorded as failed in the alerts table and the dispatch error is logged. Uptrue does not retry the dispatch. Best practice: pair Teams with at least one other channel (email, signed webhook) for redundancy on critical infrastructure.' },
    ],
    relatedSlugs: ['slack', 'telegram', 'webhook'],
    paidOnly: true,
  },
  {
    slug: 'telegram',
    name: 'Telegram',
    emoji: '✈️',
    heroTitle: 'Uptrue + Telegram — Push Alerts to Your Phone',
    heroSubtitle: 'Get uptime, SSL and security incidents pushed to a Telegram channel or chat. Works on every device Telegram runs on. Set up in 60 seconds with a chat ID.',
    seoTitle: 'Uptrue Telegram Integration — Website Monitoring Alerts on Telegram',
    seoDescription: 'Send Uptrue uptime, SSL and DNS alerts to a Telegram chat or channel. Mobile-first push notifications, severity-coded messages, one-click View Monitor link. Set up with a chat ID — no bot installation required by the user.',
    howItWorks: [
      'Uptrue runs a managed Telegram bot. When you set up a Telegram channel inside Uptrue, you give it the Telegram chat ID where you want alerts delivered. The Uptrue bot then posts every alert into that chat.',
      'You retain full control: invite or remove the Uptrue bot from any chat at any time. Alerts are formatted with the monitor name, target, severity, and a deep link to the monitor inside your Uptrue dashboard.',
    ],
    setupSteps: [
      'Add the Uptrue Telegram bot to the chat or channel where you want alerts delivered (the bot username is shown in your Uptrue dashboard once you start setup).',
      'Find the chat ID for the chat or channel. Telegram has multiple ways to get this — for groups, message @userinfobot or use the getUpdates Bot API method.',
      'In Uptrue, open Dashboard → Alerts → New Channel, pick "Telegram" as the type, and paste the chat ID.',
      'Test the channel and attach it to one or more monitors.',
    ],
    whatYouGet: [
      'Mobile push notifications via Telegram on every device',
      'Severity-coded message with monitor name, target, status',
      'Deep link to the monitor detail view in your Uptrue dashboard',
      'Per-event delivery (Smart Digest is currently email-only — Telegram fires every event individually)',
    ],
    faq: [
      { q: 'Is the Telegram integration free?', a: 'The Telegram integration requires a Lite plan or higher. The Free plan includes email alerts on 3 monitors. Lite (£1/month or £10/year) unlocks Telegram, Slack, Microsoft Teams, and signed webhook channels.' },
      { q: 'How do I find my Telegram chat ID?', a: 'For 1:1 chats with the Uptrue bot, the chat ID equals your Telegram user ID. For groups, the chat ID is the group ID (a negative number). The simplest way: add @userinfobot to your group temporarily, it tells you the chat ID, then remove it. The full setup walkthrough is in the dashboard.' },
      { q: 'Can the Uptrue Telegram bot read my messages?', a: 'No. The bot only posts alerts into the chats you explicitly add it to. It does not read messages, does not log any chat content, and cannot be made to do so. You can audit its presence at any time via Telegram\'s standard chat info screen.' },
      { q: 'Can I send alerts to multiple Telegram chats?', a: 'Yes. Create one alert channel per Telegram chat. Useful for splitting engineering alerts from customer-support notifications, or for routing different severities into different chats.' },
      { q: 'Does Smart Digest apply to Telegram alerts?', a: 'Currently no. Smart Digest groups repeat events for the same incident into a single follow-up email. Telegram alerts fire per event today — pair Telegram with email to get the digest behaviour while keeping push notifications for the first alert.' },
      { q: 'What happens during a Telegram outage?', a: 'Telegram has very high uptime. If their API is unreachable, the dispatch is recorded as failed in the alerts table. Best practice on critical infrastructure: pair Telegram with email or a signed webhook for redundancy.' },
    ],
    relatedSlugs: ['slack', 'teams', 'webhook'],
    paidOnly: true,
  },
  {
    slug: 'webhook',
    name: 'Webhook',
    emoji: '🪝',
    heroTitle: 'Uptrue + Signed Webhooks — Wire Alerts Into Anything',
    heroSubtitle: 'Receive every Uptrue alert as a JSON POST to your endpoint, signed with HMAC-SHA256. Pipe into PagerDuty, Opsgenie, your own incident management, or anywhere else.',
    seoTitle: 'Uptrue Webhook Integration — Signed Alert Webhooks for Any Tool',
    seoDescription: 'Receive Uptrue uptime, SSL and DNS alerts as JSON webhooks signed with HMAC-SHA256. Wire into PagerDuty, Opsgenie, Datadog, your own incident system, or any tool that accepts a webhook. Full payload schema documented.',
    howItWorks: [
      'When an incident opens or resolves, Uptrue POSTs a JSON payload to the webhook URL you configure. The body is signed with HMAC-SHA256 using a per-channel secret — your endpoint should verify the X-Uptrue-Signature header before trusting the payload.',
      'The payload includes the incident metadata (id, title, status, severity, started_at, resolved_at) and the monitor metadata (id, name, type, target). Both incident-opened and incident-resolved events are sent to the same webhook URL with different event values, so a single endpoint can handle the full lifecycle.',
    ],
    setupSteps: [
      'In Uptrue, open Dashboard → Alerts → New Channel, pick "Webhook" as the type.',
      'Paste your endpoint URL. Optionally provide a webhook secret — if set, every POST is signed with X-Uptrue-Signature: sha256=<hex>.',
      'Save the channel. The first test request fires immediately — verify your endpoint receives it and that signature verification passes.',
      'Attach the channel to one or more monitors. Both incident-opened and incident-resolved events are POSTed to the same URL.',
    ],
    whatYouGet: [
      'JSON POST with full incident and monitor metadata',
      'HMAC-SHA256 signature in X-Uptrue-Signature header (when secret is set)',
      'User-Agent: Uptrue-Webhook/1.0 for easy filtering at your end',
      'Both incident.created and incident.resolved events on the same URL',
      '10-second timeout — your endpoint should ack quickly and process async',
    ],
    payloadSample: `POST /your-endpoint HTTP/1.1
Content-Type: application/json
User-Agent: Uptrue-Webhook/1.0
X-Uptrue-Signature: sha256=<hex digest of body>

{
  "event": "incident.created",
  "incident": {
    "id": "uuid",
    "title": "site.example.com is down",
    "status": "open",
    "severity": "critical",
    "started_at": "2026-05-03T12:34:56.000Z",
    "resolved_at": null
  },
  "monitor": {
    "id": "uuid",
    "name": "Production homepage",
    "type": "http",
    "target": "https://site.example.com"
  },
  "timestamp": "2026-05-03T12:34:58.123Z"
}`,
    faq: [
      { q: 'Is the webhook integration free?', a: 'Webhook channels require a Lite plan or higher. The Free plan includes email alerts on 3 monitors. Lite (£1/month or £10/year) unlocks signed webhooks, Slack, Microsoft Teams, and Telegram.' },
      { q: 'How do I verify the X-Uptrue-Signature header?', a: 'Compute HMAC-SHA256 over the raw request body using the secret you set when creating the channel, hex-encode the digest, and compare it to the value in the header (after stripping the "sha256=" prefix). Use a constant-time comparison to defend against timing attacks. Most languages have a one-line implementation.' },
      { q: 'Can I use the webhook to wire Uptrue into PagerDuty or Opsgenie?', a: 'Yes. PagerDuty has a generic webhook integration; Opsgenie too. Map our event/incident/monitor fields to their expected schema (often a small Cloudflare Worker, Lambda, or n8n workflow does this in a few lines). Native PagerDuty/Opsgenie integrations are on the V1.5 roadmap.' },
      { q: 'What is the payload schema?', a: 'Top-level: event ("incident.created" or "incident.resolved"), incident object, monitor object, timestamp. The full sample is shown above. The schema is stable — we will version it (v2 etc.) before making any breaking changes, with notice.' },
      { q: 'How long do I have to respond to a webhook?', a: 'Uptrue applies a 10-second timeout. Your endpoint should accept the request quickly and process the work asynchronously — for example, queue the alert and return 200 immediately. A slow endpoint will record the dispatch as failed.' },
      { q: 'What happens if my endpoint is down when an alert fires?', a: 'The alert is recorded as failed and the dispatch error is logged in your alerts table. Uptrue does not currently retry — pair the webhook with at least one other channel (email, Slack, Telegram) on critical infrastructure for redundancy.' },
    ],
    relatedSlugs: ['slack', 'teams', 'telegram'],
    paidOnly: true,
  },
]

const pageMap = new Map(PAGES.map(p => [p.slug, p]))

export async function generateStaticParams() {
  return PAGES.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = pageMap.get(slug)
  if (!page) return {}
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical: `https://uptrue.io/integrations/${slug}` },
    openGraph: {
      title: page.seoTitle,
      description: page.seoDescription,
      url: `https://uptrue.io/integrations/${slug}`,
      type: 'website',
    },
  }
}

export default async function IntegrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = pageMap.get(slug)
  if (!page) notFound()

  const related = page.relatedSlugs
    .map(s => PAGES.find(p => p.slug === s))
    .filter(Boolean) as IntegrationPage[]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: `Uptrue ${page.name} Integration`,
        description: page.seoDescription,
        url: `https://uptrue.io/integrations/${page.slug}`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '1',
          priceCurrency: 'GBP',
          description: 'Lite plan and above',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Uptrue',
          url: 'https://uptrue.io',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faq.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
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
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href="/integrations" style={{ color: 'var(--accent)', fontWeight: 500 }}>All Integrations</Link>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            <span>{page.name}</span>
          </nav>

          <div style={{
            width: 56, height: 56,
            background: 'var(--brand-gradient-soft)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 20,
          }}>
            {page.emoji}
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            marginBottom: 14,
          }}>
            {page.heroTitle}
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28, maxWidth: 720 }}>
            {page.heroSubtitle}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-primary">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Monitoring Free
            </Link>
            <Link href="/integrations" className="btn btn-ghost">← All Integrations</Link>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '52px 24px 80px' }}>
        {/* How it works */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 16 }}>
            How it works
          </h2>
          {page.howItWorks.map((para, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--text-secondary)', marginBottom: 14 }}>
              {para}
            </p>
          ))}
        </section>

        {/* Setup steps */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 16 }}>
            Setup in 4 steps
          </h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {page.setupSteps.map((step, i) => (
              <li key={i} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '14px 18px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}>
                <span style={{
                  flexShrink: 0,
                  width: 26, height: 26,
                  background: 'var(--brand-gradient)',
                  color: '#fff',
                  borderRadius: 8,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                }}>{i + 1}</span>
                <span style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-primary)' }}>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* What you get */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 16 }}>
            What you get
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {page.whatYouGet.map((item, i) => (
              <li key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '10px 14px',
                background: 'var(--color-up-bg)',
                border: '1px solid var(--color-up-border)',
                borderRadius: 8,
                fontSize: 14,
                color: 'var(--text-primary)',
              }}>
                <svg width="14" height="14" fill="none" stroke="var(--color-up)" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Payload sample (webhook only) */}
        {page.payloadSample && (
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 16 }}>
              Payload schema
            </h2>
            <pre style={{
              padding: '20px 24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              overflowX: 'auto',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}>{page.payloadSample}</pre>
          </section>
        )}

        {/* Inline CTA */}
        <div style={{
          background: 'var(--brand-gradient)',
          borderRadius: 14,
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 56,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 4 }}>Ready to wire it up?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              {page.paidOnly ? 'Lite plan from £1/month · Free 3-monitor plan also available' : 'Free plan · No credit card required'}
            </div>
          </div>
          <Link href="/signup" style={{
            background: '#fff',
            color: 'var(--brand-blue)',
            padding: '10px 22px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Get Started Free →
          </Link>
        </div>

        {/* Monitors that send these alerts */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            Monitors that fire {page.name} alerts
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Every Uptrue monitor type can send to {page.name}. Some of the most common:
          </p>
          <ul className="about-list" style={{ fontSize: 15, lineHeight: 1.9 }}>
            <li><Link href="/monitoring/http-uptime-monitoring">HTTP uptime monitoring</Link> — site goes down, you get alerted.</li>
            <li><Link href="/monitoring/ssl-certificate-monitoring">SSL certificate monitoring</Link> — 30, 14 and 3 days before expiry.</li>
            <li><Link href="/monitoring/dns-monitoring">DNS record monitoring</Link> — unauthorised record changes.</li>
            <li><Link href="/monitoring/api-endpoint-monitoring">API endpoint monitoring</Link> — body assertions, status codes, latency.</li>
            <li><Link href="/monitoring/security-headers-monitoring">Security headers monitoring</Link> — HSTS, CSP, X-Frame-Options regressions.</li>
            <li><Link href="/monitoring">All 24 monitor types →</Link></li>
          </ul>
          <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            Want a one-off check first? Run our{' '}
            <Link href="/score">free Website Health Score</Link> or browse all{' '}
            <Link href="/tools">free monitoring tools</Link>.
          </p>
        </section>

        {/* FAQ */}
        <Faq
          items={page.faq.map(item => ({ question: item.q, answer: item.a }))}
          headline="Frequently asked questions"
        />

        {/* Related integrations */}
        {related.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Related Integrations</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {related.map(r => (
                <Link
                  key={r.slug}
                  href={`/integrations/${r.slug}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <span style={{
                    width: 36, height: 36,
                    background: 'var(--brand-gradient-soft)',
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>{r.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{r.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <div style={{
          textAlign: 'center',
          padding: '44px 32px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
        }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>{page.emoji}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            Wire {page.name} into your monitoring today
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 460, margin: '0 auto 24px' }}>
            Free 3-monitor plan to start. Lite (£1/month) unlocks {page.name} and every other channel.
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

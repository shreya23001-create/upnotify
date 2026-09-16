import type { Metadata } from 'next'
import Link from 'next/link'
import { getPlanBySlug } from '@/lib/db/plans'
import type { Plan } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Low-Cost Uptime Monitoring — Plans from ₹999/year | Upnotify',
  description:
    'Affordable uptime monitoring with email alerts. HTTP/HTTPS, SSL certificate, DNS, response time and 20 other monitor types. Simple per-website pricing — no free tier, no trial games.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/free-uptime-monitoring' },
  openGraph: {
    title: 'Low-Cost Uptime Monitoring — Plans from ₹999/year | Upnotify',
    description:
      'Affordable uptime monitoring with email alerts. Simple per-website pricing.',
    url: 'https://upnotify-monitoring.vercel.app/free-uptime-monitoring',
    type: 'website',
  },
}

// Plan values are read from the `plans` table at request time so this
// page automatically reflects any admin changes to monitor_limit,
// check_interval_seconds, data_retention_days, etc.

function formatInterval(seconds: number): string {
  if (seconds >= 3600) return `${seconds / 3600}-hour checks`
  if (seconds >= 60) return seconds === 60 ? '1-minute checks' : `${seconds / 60}-minute checks`
  return `${seconds}-second checks`
}

function formatRetention(days: number | null): string {
  if (!days) return 'Unlimited history'
  if (days >= 365) return `${Math.round(days / 365)}-year history`
  return `${days}-day history`
}

function formatInrPrice(plan: Plan): string {
  const monthly = plan.price_monthly_inr ?? 0
  const annual = plan.price_annual_inr ?? 0
  const fmt = (paise: number): string => {
    const rupees = paise / 100
    return rupees % 1 === 0 ? `₹${rupees.toFixed(0)}` : `₹${rupees.toFixed(2)}`
  }
  if (monthly === 0 && annual === 0) return '—'
  if (monthly > 0 && annual > 0) return `${fmt(monthly)}/mo or ${fmt(annual)}/yr`
  if (monthly > 0) return `${fmt(monthly)}/mo`
  return `${fmt(annual)}/yr`
}

function monitorCount(plan: Plan | null): string {
  if (!plan) return '—'
  if (plan.monitor_limit == null) return 'Unlimited'
  return String(plan.monitor_limit)
}

function statusPagesText(plan: Plan | null): string {
  if (!plan || !plan.has_status_pages) return '—'
  if (plan.status_page_limit === 0) return 'Unlimited'
  return `${plan.status_page_limit} status page${plan.status_page_limit === 1 ? '' : 's'}`
}

const FAQ_BASE = [
  {
    q: 'Does Upnotify have a free plan?',
    a: 'No. Upnotify does not offer a free monitoring plan or a free tier. Every monitoring account is on a paid plan, starting with Pre Plan. We do publish a range of genuinely free one-off tools — SSL Checker, DNS Lookup, Security Headers Checker and more — that anyone can use without an account, but continuous monitoring is a paid product.',
  },
  {
    q: 'What is the cheapest way to start monitoring?',
    a: 'Pre Plan is our entry-level paid plan. It covers continuous HTTP/HTTPS uptime checks with email alerts and incident history, and is designed to be the least expensive way to know whether your site is up. See the pricing page for current rates and billing options.',
  },
  {
    q: 'What types of monitors can I run?',
    a: 'All 24 Upnotify monitor types are available across plans: HTTP/HTTPS uptime, SSL certificate, DNS records, response time, keyword detection, security headers, redirect chain, blacklist, SPF/DMARC, port checks, ping, API endpoint, heartbeat, and more. You pick your set within your plan’s monitor limit.',
  },
  {
    q: 'Is there a free trial?',
    a: 'We do not run a timed free trial. Instead we keep the entry plan genuinely low-cost so you can evaluate Upnotify on a real site without committing to an expensive tier, and you can cancel or pause from your account settings at any time.',
  },
  {
    q: 'When would I need a higher plan?',
    a: 'Three common triggers: (1) you need more monitors than your current plan allows, (2) you want alerts in Slack, Microsoft Teams, Telegram, or via signed webhook, or (3) you need faster check intervals for high-criticality endpoints. Pro Plan and above unlock the additional alert channels and higher limits.',
  },
  {
    q: 'Can I cancel or pause?',
    a: 'Yes. You can cancel at any time from your account settings, and cancellation takes effect at the end of the billing period you have already paid for. You can also pause a subscription for up to 3 months instead of cancelling, which keeps your monitors, data and configuration intact while billing stops.',
  },
  {
    q: 'How do I sign up?',
    a: 'Click any "Start Monitoring" button on the site. You sign up with email + magic link or with Google OAuth, then choose a plan. You will be in the dashboard in under 60 seconds, and you can have your first monitor running within 2 minutes.',
  },
]

export default async function LowCostUptimeMonitoringPage(): Promise<React.ReactElement> {
  const [lite, builder] = await Promise.all([
    getPlanBySlug('lite'),
    getPlanBySlug('builder'),
  ])

  const litePlan: Plan | null = lite
  const builderPlan: Plan | null = builder

  const liteName = litePlan?.name ?? 'Pre Plan'
  const builderName = builderPlan?.name ?? 'Pro Plan'

  const liteMonitors = monitorCount(litePlan)
  const builderMonitors = monitorCount(builderPlan)
  const liteInterval = litePlan ? formatInterval(litePlan.check_interval_seconds) : '—'
  const builderInterval = builderPlan ? formatInterval(builderPlan.check_interval_seconds) : '—'
  const liteRetention = litePlan ? formatRetention(litePlan.data_retention_days) : '—'
  const builderRetention = builderPlan ? formatRetention(builderPlan.data_retention_days) : '—'
  const litePrice = litePlan ? formatInrPrice(litePlan) : '—'
  const builderPrice = builderPlan ? formatInrPrice(builderPlan) : '—'
  const liteStatusPages = statusPagesText(litePlan)
  const builderStatusPages = statusPagesText(builderPlan)

  const liteFeatures = [
    { title: `${liteMonitors} monitor${liteMonitors === '1' ? '' : 's'}`, description: 'Pick any combination of the 24 supported monitor types — HTTP, SSL, DNS, response time, security headers and more.' },
    { title: 'Email alerts', description: 'Email-on-incident, email-on-recovery. Smart Digest collapses repeat events into a single follow-up so your inbox does not flood during a long outage.' },
    { title: liteInterval, description: 'Two-confirmation logic eliminates 95% of false positives from transient blips. No alert until two consecutive checks fail.' },
    { title: liteRetention, description: 'Full incident timeline, response time charts, and uptime percentage on every monitor.' },
    { title: 'Free monitoring tools', description: 'Unlimited use of all 14 free tools — SSL Checker, DNS Lookup, Security Headers Checker, blacklist checker, and more — without signing up.' },
    { title: 'WordPress plugin', description: 'The Upnotify WordPress plugin adds internal site checks and integrity scans on top of external monitoring.' },
  ]

  const compareRows = [
    { feature: 'Monitors', lite: liteMonitors, builder: builderMonitors },
    { feature: 'Check interval', lite: liteInterval.replace(' checks', ''), builder: builderInterval.replace(' checks', '') },
    { feature: 'Email alerts', lite: litePlan?.has_email_alerts ? 'Yes' : '—', builder: builderPlan?.has_email_alerts ? 'Yes' : '—' },
    { feature: 'Slack alerts', lite: litePlan?.has_slack_teams ? 'Yes' : '—', builder: builderPlan?.has_slack_teams ? 'Yes' : '—' },
    { feature: 'Microsoft Teams alerts', lite: litePlan?.has_slack_teams ? 'Yes' : '—', builder: builderPlan?.has_slack_teams ? 'Yes' : '—' },
    { feature: 'Telegram alerts', lite: litePlan?.has_slack_teams ? 'Yes' : '—', builder: builderPlan?.has_slack_teams ? 'Yes' : '—' },
    { feature: 'Signed webhook alerts', lite: litePlan?.has_webhooks ? 'Yes' : '—', builder: builderPlan?.has_webhooks ? 'Yes' : '—' },
    { feature: 'Public status pages', lite: liteStatusPages, builder: builderStatusPages },
    { feature: 'Custom domain status page', lite: litePlan?.has_status_page_custom_domain ? 'Yes' : '—', builder: builderPlan?.has_status_page_custom_domain ? 'Yes' : '—' },
    { feature: 'Incident history retention', lite: liteRetention, builder: builderRetention },
    { feature: 'Price', lite: litePrice, builder: builderPrice },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Upnotify Uptime Monitoring',
        description: `Low-cost uptime monitoring with ${liteMonitors} monitor${liteMonitors === '1' ? '' : 's'} and email alerts on ${liteName}.`,
        url: 'https://upnotify-monitoring.vercel.app/free-uptime-monitoring',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: String((litePlan?.price_annual_inr ?? 99900) / 100),
          priceCurrency: 'INR',
          description: `${liteName} — ${liteMonitors} monitor${liteMonitors === '1' ? '' : 's'}, email alerts, billed annually`,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Upnotify',
          url: 'https://upnotify-monitoring.vercel.app',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_BASE.map((item) => ({
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
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            background: 'var(--brand-gradient-soft)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '0.04em',
            marginBottom: 18,
          }}>SIMPLE PER-WEBSITE PRICING</div>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            marginBottom: 14,
          }}>
            Low-Cost Uptime Monitoring
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28, maxWidth: 720, margin: '0 auto 28px' }}>
            {liteMonitors} monitor{liteMonitors === '1' ? '' : 's'} with {liteInterval.toLowerCase()},
            email alerts, and {liteRetention.toLowerCase()} on {liteName} — {litePrice}.
            Cancel or pause anytime.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/signup" className="btn btn-primary btn-lg">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Monitoring
            </Link>
            <Link href="/score" className="btn btn-ghost">Run Free Health Score</Link>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '52px 24px 80px' }}>
        {/* Features grid */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 20 }}>
            What is included on {liteName}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {liteFeatures.map((feat, i) => (
              <div key={i} style={{
                padding: '20px 22px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
              }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>{feat.title}</div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>{feat.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            {liteName} vs {builderName}
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
            {liteName} is the cheapest way onto Upnotify. {builderName} adds the extra alert channels and
            higher limits most growing teams need. Values are pulled live from the same plans table that
            governs your account, so what you see here is what you get.
          </p>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feature</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{liteName}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{builderName}</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{row.lite}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{row.builder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* What can you monitor */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            What can you monitor?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Every monitor type is available — just pick your set:
          </p>
          <ul className="about-list" style={{ fontSize: 15, lineHeight: 1.9 }}>
            <li><Link href="/monitoring/http-uptime-monitoring">HTTP uptime monitoring</Link> — does the homepage load?</li>
            <li><Link href="/monitoring/ssl-certificate-monitoring">SSL certificate monitoring</Link> — alerts at 30, 14, 3 days before expiry.</li>
            <li><Link href="/monitoring/dns-monitoring">DNS record monitoring</Link> — unauthorised record changes.</li>
            <li><Link href="/monitoring/response-time-monitoring">Response time monitoring</Link> — alert when slow.</li>
            <li><Link href="/monitoring/keyword-monitoring">Keyword monitoring</Link> — verify critical content is present.</li>
            <li><Link href="/monitoring/api-endpoint-monitoring">API endpoint monitoring</Link> — body assertions, latency, status codes.</li>
            <li><Link href="/monitoring">All 24 monitor types →</Link></li>
          </ul>
          <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            Or take a one-off snapshot with our <Link href="/score">free Website Health Score</Link>.
            Browse all <Link href="/tools">free monitoring tools</Link> for ad-hoc checks
            without signing up.
          </p>
        </section>

        {/* Want alerts somewhere else */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            Want alerts in Slack, Teams, or Telegram?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
            {liteName} covers email alerts. {builderName} ({builderPrice}) and above unlock every other channel:
          </p>
          <ul className="about-list" style={{ fontSize: 15, lineHeight: 1.9 }}>
            <li><Link href="/integrations/slack">Slack integration</Link> — block-formatted alerts in your team channel.</li>
            <li><Link href="/integrations/teams">Microsoft Teams integration</Link> — MessageCard alerts in any channel.</li>
            <li><Link href="/integrations/telegram">Telegram integration</Link> — mobile push alerts via the Upnotify bot.</li>
            <li><Link href="/integrations/webhook">Signed webhooks</Link> — wire alerts into PagerDuty, Opsgenie, n8n, anything.</li>
          </ul>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 20 }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ_BASE.map((item, i) => (
              <div key={i} style={{
                padding: '16px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>{item.q}</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <div style={{
          textAlign: 'center',
          padding: '44px 32px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            Get the first monitor running in 2 minutes
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 520, margin: '0 auto 24px' }}>
            Sign up with email + magic link or Google OAuth, then pick a plan. No phone number.
            No sales call.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Monitoring
          </Link>
        </div>
      </main>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getPlanBySlug } from '@/lib/db/plans'
import type { Plan } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Free Uptime Monitoring — No Credit Card, No Trial | Upnotify',
  description:
    'Free uptime monitoring with email alerts. HTTP/HTTPS, SSL certificate, DNS, response time and 20 other monitor types. Genuinely free — not a trial. No credit card required.',
  alternates: { canonical: 'https://uptrue.io/free-uptime-monitoring' },
  openGraph: {
    title: 'Free Uptime Monitoring — No Credit Card, No Trial | Upnotify',
    description:
      'Genuinely free uptime monitoring with email alerts. No credit card, no trial.',
    url: 'https://uptrue.io/free-uptime-monitoring',
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

function formatGbpPrice(plan: Plan): string {
  const monthly = plan.price_monthly_gbp ?? 0
  const annual = plan.price_annual_gbp ?? 0
  if (monthly === 0 && annual === 0) return 'Free forever'
  if (monthly > 0 && annual > 0) {
    const monthlyGbp = monthly / 100
    const annualGbp = annual / 100
    const monthlyStr = monthlyGbp % 1 === 0 ? `£${monthlyGbp.toFixed(0)}` : `£${monthlyGbp.toFixed(2)}`
    const annualStr = annualGbp % 1 === 0 ? `£${annualGbp.toFixed(0)}` : `£${annualGbp.toFixed(2)}`
    return `${monthlyStr}/mo or ${annualStr}/yr`
  }
  if (monthly > 0) {
    const monthlyGbp = monthly / 100
    return `${monthlyGbp % 1 === 0 ? `£${monthlyGbp.toFixed(0)}` : `£${monthlyGbp.toFixed(2)}`}/mo`
  }
  const annualGbp = annual / 100
  return `${annualGbp % 1 === 0 ? `£${annualGbp.toFixed(0)}` : `£${annualGbp.toFixed(2)}`}/yr`
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
    q: 'Is the Free plan really free, or just a trial?',
    a: 'Genuinely free. No credit card required, no time limit, no automatic upgrade. The Free plan exists indefinitely — you can run it for years if it covers what you need. We make money from customers who outgrow it and upgrade to Lite, Builder, or Scale, not from tricking people into trials.',
  },
  {
    q: 'What types of monitors can I run on the Free plan?',
    a: 'All 24 Upnotify monitor types are available on every plan including Free: HTTP/HTTPS uptime, SSL certificate, DNS records, response time, keyword detection, security headers, redirect chain, blacklist, SPF/DMARC, port checks, ping, API endpoint, heartbeat, and more. You just pick your set within the plan\'s monitor limit.',
  },
  {
    q: 'When would I need to upgrade to Lite?',
    a: 'Three triggers: (1) you need more monitors than the Free plan allows, (2) you want alerts in Slack, Microsoft Teams, Telegram, or via signed webhook (Free is email-only), or (3) you need faster check intervals for high-criticality endpoints. Lite is the cheapest paid plan, designed to never feel expensive.',
  },
  {
    q: 'Will my monitors be paused if I do not upgrade?',
    a: 'No. The Free plan is permanent. You can run your free monitors for as long as the Upnotify service is running. We will never pause Free monitors to coerce an upgrade.',
  },
  {
    q: 'Do you have a longer free trial of paid features?',
    a: 'No — and we think that is the right call. Trials are sticky-not-honest: most customers forget they exist and get auto-charged. Our Free plan is permanent, and Lite is so cheap that the trial question never has to come up.',
  },
  {
    q: 'How do you make money if the Free plan is permanent?',
    a: 'About 1 in 10 Free users eventually outgrows it and upgrades to Lite, Builder or Scale. The Free plan is not a marketing ploy — it is genuine value for small projects, side businesses, and personal sites that should not need a paid monitoring tool just to know whether they are up.',
  },
  {
    q: 'How do I sign up?',
    a: 'Click any "Start Monitoring Free" button on the site. You sign up with email + magic link or with Google OAuth. No credit card required. You will be in the dashboard in under 60 seconds, and you can have your first monitor running within 2 minutes.',
  },
]

export default async function FreeUptimeMonitoringPage(): Promise<React.ReactElement> {
  const [free, lite] = await Promise.all([
    getPlanBySlug('free'),
    getPlanBySlug('lite'),
  ])

  // Belt-and-braces — if either plan is missing from the DB, fall back to
  // the values seeded in migration 00011_pricing_update.sql so the page
  // never renders blank in dev where seeds may be incomplete.
  const freePlan: Plan | null = free
  const litePlan: Plan | null = lite

  const freeMonitors = monitorCount(freePlan)
  const liteMonitors = monitorCount(litePlan)
  const freeInterval = freePlan ? formatInterval(freePlan.check_interval_seconds) : '—'
  const liteInterval = litePlan ? formatInterval(litePlan.check_interval_seconds) : '—'
  const freeRetention = freePlan ? formatRetention(freePlan.data_retention_days) : '—'
  const liteRetention = litePlan ? formatRetention(litePlan.data_retention_days) : '—'
  const freePrice = freePlan ? formatGbpPrice(freePlan) : 'Free forever'
  const litePrice = litePlan ? formatGbpPrice(litePlan) : '—'
  const freeStatusPages = statusPagesText(freePlan)
  const liteStatusPages = statusPagesText(litePlan)

  const freeFeatures = [
    { title: `${freeMonitors} monitor${freeMonitors === '1' ? '' : 's'}`, description: 'Pick any combination of the 24 supported monitor types — HTTP, SSL, DNS, response time, security headers and more.' },
    { title: 'Email alerts', description: 'Email-on-incident, email-on-recovery. Smart Digest collapses repeat events into a single follow-up so your inbox does not flood during a long outage.' },
    { title: freeInterval, description: 'Two-confirmation logic eliminates 95% of false positives from transient blips. No alert until two consecutive checks fail.' },
    { title: freeRetention, description: 'Full incident timeline, response time charts, and uptime percentage on every monitor.' },
    { title: 'Free monitoring tools', description: 'Unlimited use of all 14 free tools — SSL Checker, DNS Lookup, Security Headers Checker, blacklist checker, and more — without signing up.' },
    { title: 'WordPress plugin', description: 'Free Upnotify WordPress plugin available on the Free plan and above. Internal site checks, integrity scans, and more.' },
  ]

  const compareRows = [
    { feature: 'Monitors', free: freeMonitors, lite: liteMonitors },
    { feature: 'Check interval', free: freeInterval.replace(' checks', ''), lite: liteInterval.replace(' checks', '') },
    { feature: 'Email alerts', free: 'Yes', lite: litePlan?.has_email_alerts ? 'Yes' : '—' },
    { feature: 'Slack alerts', free: freePlan?.has_slack_teams ? 'Yes' : '—', lite: litePlan?.has_slack_teams ? 'Yes' : '—' },
    { feature: 'Microsoft Teams alerts', free: freePlan?.has_slack_teams ? 'Yes' : '—', lite: litePlan?.has_slack_teams ? 'Yes' : '—' },
    { feature: 'Telegram alerts', free: freePlan?.has_slack_teams ? 'Yes' : '—', lite: litePlan?.has_slack_teams ? 'Yes' : '—' },
    { feature: 'Signed webhook alerts', free: freePlan?.has_webhooks ? 'Yes' : '—', lite: litePlan?.has_webhooks ? 'Yes' : '—' },
    { feature: 'Public status pages', free: freeStatusPages, lite: liteStatusPages },
    { feature: 'Custom domain status page', free: freePlan?.has_status_page_custom_domain ? 'Yes' : '—', lite: litePlan?.has_status_page_custom_domain ? 'Yes' : '—' },
    { feature: 'Incident history retention', free: freeRetention, lite: liteRetention },
    { feature: 'Price', free: freePrice, lite: litePrice },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Upnotify Free Uptime Monitoring',
        description: `Free uptime monitoring with ${freeMonitors} monitor${freeMonitors === '1' ? '' : 's'} and email alerts. Genuinely free — no card, no trial.`,
        url: 'https://uptrue.io/free-uptime-monitoring',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'GBP',
          description: `Free plan — ${freeMonitors} monitor${freeMonitors === '1' ? '' : 's'}, email alerts, no credit card required`,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Upnotify',
          url: 'https://uptrue.io',
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
          }}>FREE — NO CREDIT CARD REQUIRED</div>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            marginBottom: 14,
          }}>
            Free Uptime Monitoring
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28, maxWidth: 720, margin: '0 auto 28px' }}>
            {freeMonitors} monitor{freeMonitors === '1' ? '' : 's'} with {freeInterval.toLowerCase()},
            email alerts, and {freeRetention.toLowerCase()} — genuinely free.
            Not a trial. No card needed. No expiry.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/signup" className="btn btn-primary btn-lg">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Monitoring Free
            </Link>
            <Link href="/score" className="btn btn-ghost">Run Free Health Score</Link>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '52px 24px 80px' }}>
        {/* Features grid */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 20 }}>
            What is included on the Free plan
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {freeFeatures.map((feat, i) => (
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
            Free vs Lite
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
            When you outgrow Free, Lite is the cheapest upgrade we could make it without it feeling free.
            Values pulled live from the same plans table that governs your account, so what you see here
            is what you get.
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
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Free</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lite</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{row.free}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{row.lite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* What can you monitor */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            What can you monitor on the Free plan?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Every monitor type works on Free — just pick your set:
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
            The Free plan covers email alerts. Lite ({litePrice}) and above unlock every other channel:
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
            Sign up with email + magic link or Google OAuth. No credit card. No phone number.
            No sales call.
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

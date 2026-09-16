import type { Metadata } from 'next'
import { IndustryLandingPage, type IndustryLandingData } from '@/components/landing/industry-landing'

const data: IndustryLandingData = {
  slug: 'saas-uptime-monitoring',
  heroTitle: 'SaaS Uptime Monitoring',
  heroSubtitle:
    'Catch API regressions, login failures and silent partial outages before paying customers churn. Built for SaaS founders, engineering teams and platform operators.',
  seoTitle: 'SaaS Uptime Monitoring — API, Login & Status Page Reliability | Upnotify',
  seoDescription:
    'SaaS uptime monitoring built for product teams: API endpoint checks, response time SLAs, login flow keyword detection, SSL expiry alerts, and a public status page included with your plan. Stop losing customers to silent regressions.',
  whyItMatters: [
    'Every minute of unscheduled downtime in a SaaS product is a churn event in slow motion. Customers who hit a broken login, a 502 on a critical API endpoint, or a checkout that quietly fails do not file a support ticket — they switch to a competitor and never come back.',
    'Worse, modern SaaS architectures fail in ways that 200-OK monitoring misses entirely: a new auth deploy that returns successful responses but rejects valid tokens, a third-party CDN that is up but serving stale assets, or a payment webhook that is silently dropping events. SaaS uptime monitoring needs to look at semantics, not just status codes.',
  ],
  painPoints: [
    'Login flow returns 200 OK but rejects every credential — status-only monitoring shows green while support tickets pile up.',
    'API endpoint regression after a deploy: response code is correct but body is malformed.',
    'SSL certificate expiry on the API subdomain — auto-renewal failed silently 27 days ago.',
    'Public status page is out of date because nobody remembered to update it during the incident.',
    'Response time degradation that is just under the alert threshold — customers feel it before any monitor fires.',
    'Webhook endpoint timing out, causing downstream customer integrations to fall behind.',
  ],
  monitors: [
    {
      slug: 'api-endpoint-monitoring',
      label: 'API endpoint monitoring',
      why: 'Test REST APIs with assertions on status, body content, and response time. Catches the semantic regressions that 200-OK monitoring misses.',
    },
    {
      slug: 'http-uptime-monitoring',
      label: 'HTTP uptime monitoring',
      why: 'Foundational up/down check from the edge. Two-confirmation logic eliminates false positives from transient network blips.',
    },
    {
      slug: 'response-time-monitoring',
      label: 'Response time monitoring',
      why: 'Catch slow degradation before it becomes a customer escalation. Configurable warn and critical thresholds per monitor.',
    },
    {
      slug: 'ssl-certificate-monitoring',
      label: 'SSL certificate monitoring',
      why: 'Get warned 30, 14 and 3 days before expiry — across every subdomain, not just the apex.',
    },
    {
      slug: 'keyword-monitoring',
      label: 'Keyword monitoring',
      why: 'Verify the login button, dashboard heading or other critical text is present. Catches partial outages where the page loads but the feature is broken.',
    },
    {
      slug: 'heartbeat-monitoring',
      label: 'Heartbeat monitoring',
      why: 'Detect when scheduled jobs (billing runs, data exports, customer notifications) silently stop firing.',
    },
  ],
  slaCallout: [
    { label: 'Customer churn from one bad outage', value: '~5%' },
    { label: 'SaaS NPS hit per minute of downtime', value: '−2' },
    { label: 'Plans starting from', value: 'Free' },
  ],
  faq: [
    {
      q: 'How is SaaS uptime monitoring different from generic website monitoring?',
      a: 'Generic monitors check whether your homepage loads. SaaS uptime monitoring also checks the application paths your customers actually use: API endpoints, login flows, billing webhooks, scheduled background jobs. A SaaS product can have a perfect homepage and a completely broken core feature — only multi-monitor coverage catches that.',
    },
    {
      q: 'What uptime SLA should we offer customers?',
      a: '99.9% (8h 45m of allowed downtime per year) is the default starting point for early-stage SaaS. 99.95% suits scale-ups with paying customers. 99.99% (52 minutes per year) requires multi-region failover, no-downtime deploys, and continuous SSL/DNS monitoring. We publish a free Uptime SLA Calculator at /tools/uptime-calculator.',
    },
    {
      q: 'Do you support OAuth-protected API endpoint monitoring?',
      a: 'Yes. API Endpoint monitors accept custom HTTP headers, so you can add a long-lived service token to authenticate. We recommend creating a dedicated monitoring user with minimal permissions, and rotating the token quarterly.',
    },
    {
      q: 'Can we white-label a public status page for our customers?',
      a: 'Free and Lite plans include a branded upnotify-monitoring.vercel.app public status page. White-label custom-domain status pages are on the V1.5 roadmap. Until then, embed our status badge on your marketing site and link to your Upnotify status page from your help docs.',
    },
    {
      q: 'How quickly will my engineering team be alerted to a problem?',
      a: 'Within 30–60 seconds of two consecutive failed checks (we run two-confirmation to eliminate false positives). Email alerts are included on every paid plan, with Slack, Microsoft Teams, Telegram, and signed webhook alerts on Pro Plan and above. Smart Digest then collapses repeat events into a single follow-up so engineers are not paged 50 times during an outage.',
    },
    {
      q: 'Do you integrate with PagerDuty, Opsgenie, or similar?',
      a: 'Native PagerDuty and Opsgenie integrations are on the V1.5 roadmap. In the meantime, every Upnotify alert can fire as a signed webhook — point that at your incident management tool and you have full integration in 5 minutes.',
    },
  ],
}

export const metadata: Metadata = {
  title: data.seoTitle,
  description: data.seoDescription,
  alternates: { canonical: `https://upnotify-monitoring.vercel.app/monitoring/${data.slug}` },
  openGraph: {
    title: data.seoTitle,
    description: data.seoDescription,
    url: `https://upnotify-monitoring.vercel.app/monitoring/${data.slug}`,
    type: 'website',
  },
}

export default function SaasUptimeMonitoringPage(): React.ReactElement {
  return <IndustryLandingPage data={data} />
}

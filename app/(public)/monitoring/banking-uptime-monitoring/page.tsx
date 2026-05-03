import type { Metadata } from 'next'
import { IndustryLandingPage, type IndustryLandingData } from '@/components/landing/industry-landing'

const data: IndustryLandingData = {
  slug: 'banking-uptime-monitoring',
  heroTitle: 'Banking Uptime Monitoring',
  heroSubtitle:
    'Catch login outages, slow account pages and silent transaction failures before customers lose trust. Built for retail banks, neobanks, and digital banking platforms.',
  seoTitle: 'Banking Uptime Monitoring — Login, Account & Transaction Reliability | Uptrue',
  seoDescription:
    'Banking uptime monitoring for retail and digital banks: login flow detection, account page response time, SSL chain validation, security headers compliance, and audit-ready incident logs. Designed to support FCA, PRA, and EBA reliability expectations.',
  whyItMatters: [
    'Banking uptime is not measured in minutes — it is measured in customer trust. A retail customer who cannot log in to check their balance during a salary-day morning will tell colleagues and post on social media within minutes. A small business owner who cannot make a same-day payment will move banks. The reputational cost of a 30-minute outage often dwarfs the technical impact.',
    'And banks face a uniquely demanding mix: regulators (FCA, PRA, EBA) expect reportable uptime, customers expect seven-nines style availability, and adversaries actively probe for SSL drift, header weakness, and login-flow regressions. Banking uptime monitoring needs to verify customer journeys end-to-end, prove compliance with auditable evidence, and run continuously across every digital channel.',
  ],
  painPoints: [
    'Login form returns 200 OK but rejects every credential for an hour — no monitor fires because the homepage is fine.',
    'Account-balance API is slow under peak load; customers refresh repeatedly, blocking legitimate transactions.',
    'SSL certificate on the mobile app API expires unnoticed; iOS app rejects connections, support phones overload.',
    'Required security headers drop after a CDN config change; PRA review flags an operational control gap.',
    'Statement download endpoint times out; customers cannot retrieve documents needed for mortgage applications.',
    'No durable, time-stamped record of an outage when the regulator asks for the incident report.',
  ],
  monitors: [
    {
      slug: 'http-uptime-monitoring',
      label: 'HTTP uptime monitoring',
      why: 'Continuous up/down checks on every customer-facing surface — homepage, login, account pages, statement downloads.',
    },
    {
      slug: 'keyword-monitoring',
      label: 'Keyword monitoring',
      why: 'Verify the "Log in" button, account page heading, or critical legal text remain present. Catches the broken-page-with-200-OK that destroys trust.',
    },
    {
      slug: 'response-time-monitoring',
      label: 'Response time monitoring',
      why: 'Slow banking is broken banking — customers retry, support calls spike, and trust erodes. Set tight thresholds on login, account, and transaction endpoints.',
    },
    {
      slug: 'ssl-certificate-monitoring',
      label: 'SSL certificate monitoring',
      why: 'A browser SSL warning on a banking domain destroys trust instantly. Get alerted 30, 14, and 3 days before expiry across every subdomain.',
    },
    {
      slug: 'security-headers-monitoring',
      label: 'Security headers monitoring',
      why: 'HSTS, CSP, and X-Frame-Options are baseline operational controls. Their continuous presence is auditable evidence for PRA and FCA reviews.',
    },
    {
      slug: 'api-endpoint-monitoring',
      label: 'API endpoint monitoring',
      why: 'Mobile app APIs and open banking endpoints fail silently with 200-OK errors. Assert on body content, not just status codes.',
    },
  ],
  slaCallout: [
    { label: 'PRA target uptime for critical services', value: '99.99%' },
    { label: 'Customer trust dropped per outage', value: '> 10%' },
    { label: 'Plans starting from', value: 'Free' },
  ],
  faq: [
    {
      q: 'Can Uptrue produce auditor-ready evidence for FCA or PRA reviews?',
      a: 'Yes — every check, alert, and incident is recorded with a tamper-resistant timestamp. Evidence includes detection time, two-confirmation timing, alert dispatch, and resolution. The data is exportable to support your operational resilience self-assessment. Uptrue is not a substitute for your operational resilience framework but provides the underlying check evidence layer.',
    },
    {
      q: 'How does Uptrue help meet FCA Operational Resilience expectations?',
      a: 'The FCA requires firms to identify Important Business Services and define impact tolerances. Uptrue gives you continuous evidence of whether services are within tolerance — uptime, response time, SSL validity, security headers — and an auditable trail of incidents. This supports both annual self-assessment and ad-hoc regulator queries.',
    },
    {
      q: 'Where is monitoring data stored — is it UK or EU resident?',
      a: 'All Uptrue customer data, including monitor configurations, incident logs, and audit trails, is stored in the EU (Frankfurt region) on Supabase infrastructure. Data is encrypted at rest and in transit. We have a published Data Processing Agreement (DPA) available for Agency and Scale customers, and our subprocessor list is public.',
    },
    {
      q: 'Can we monitor the mobile app API without exposing customer credentials?',
      a: 'Yes. API Endpoint monitors accept custom HTTP headers, so you can use a dedicated read-only service token scoped to a monitoring user. Best practice: rotate quarterly, restrict source IPs at your gateway to Uptrue check origins, and never use credentials with customer-data access.',
    },
    {
      q: 'How do you handle alert sensitivity in a regulated bank?',
      a: 'Two-confirmation alerting eliminates ~95% of false positives from transient network blips. Smart Digest then collapses repeat events for the same incident into a single follow-up — operations teams get the signal without being paged 50 times during one outage. Alert fatigue is itself a regulatory concern; reducing it materially is part of operational resilience.',
    },
    {
      q: 'Is Uptrue suitable for monitoring open banking endpoints?',
      a: 'Yes. Open banking APIs (PSD2 Account Information, Payment Initiation, Confirmation of Funds) all benefit from API Endpoint monitoring with body assertions, response-time thresholds, and SSL certificate monitoring. We do not currently sign requests with eIDAS QWAC certificates — for that you need to monitor your own gateway endpoint that fronts the open banking surface.',
    },
  ],
}

export const metadata: Metadata = {
  title: data.seoTitle,
  description: data.seoDescription,
  alternates: { canonical: `https://uptrue.io/monitoring/${data.slug}` },
  openGraph: {
    title: data.seoTitle,
    description: data.seoDescription,
    url: `https://uptrue.io/monitoring/${data.slug}`,
    type: 'website',
  },
}

export default function BankingUptimeMonitoringPage(): React.ReactElement {
  return <IndustryLandingPage data={data} />
}

import type { Metadata } from 'next'
import { IndustryLandingPage, type IndustryLandingData } from '@/components/landing/industry-landing'

const data: IndustryLandingData = {
  slug: 'fintech-uptime-monitoring',
  heroTitle: 'Fintech Uptime Monitoring',
  heroSubtitle:
    'Meet regulatory uptime SLAs and catch transaction failures before they hit customers. Built for fintech engineering teams, payments platforms, and regulated digital finance.',
  seoTitle: 'Fintech Uptime Monitoring — Regulatory SLA, API & Transaction Health | Uptrue',
  seoDescription:
    'Fintech uptime monitoring for regulated digital finance: API endpoint assertions, response time SLAs, SSL certificate alerts, security headers compliance, and audit-ready incident logs. Designed to meet FCA, PSD2, and DORA reliability expectations.',
  whyItMatters: [
    'Fintech operates under harder reliability constraints than almost any other software industry. Customer trust, regulatory expectations (FCA Operational Resilience, PSD2, DORA in the EU) and financial impact all stack against you. A 30-minute payment gateway outage is not just a customer service problem — it is a reportable operational incident.',
    'And the failure modes are more dangerous: a transaction endpoint returning 200 OK with a malformed body can leave customers double-charged, payments unsettled, or balances mis-stated. Fintech uptime monitoring needs to verify response semantics, not just response codes; track every certificate across every authenticated subdomain; and produce audit-grade evidence of every incident.',
  ],
  painPoints: [
    'Payment endpoint returns 200 OK with a partial response — silent transaction failures slip through QA monitors.',
    'KYC verification API times out under load; account opening flow stalls without a clear error path.',
    'SSL certificate on the API gateway expires unnoticed because the renewal cron failed silently.',
    'Mandatory security headers (HSTS, CSP) drop after a CDN config change; FCA review flags a control gap.',
    'Webhook callbacks from a payments processor are slow; reconciliation falls 6 hours behind.',
    'No durable, time-stamped record of an outage when the regulator asks for an incident write-up.',
  ],
  monitors: [
    {
      slug: 'api-endpoint-monitoring',
      label: 'API endpoint monitoring',
      why: 'Assert on response body, not just status. Catches the silent transaction failures that ordinary uptime monitors miss entirely.',
    },
    {
      slug: 'response-time-monitoring',
      label: 'Response time monitoring',
      why: 'Slow does not just mean slow — under PSD2 strong customer authentication expectations, response time is part of the user experience that regulators audit.',
    },
    {
      slug: 'ssl-certificate-monitoring',
      label: 'SSL certificate monitoring',
      why: 'Track every certificate across every API subdomain. Get alerted 30, 14 and 3 days before expiry — and on chain or issuer changes.',
    },
    {
      slug: 'security-headers-monitoring',
      label: 'Security headers monitoring',
      why: 'HSTS, CSP, X-Frame-Options, and Permissions-Policy presence is auditable evidence of operational controls. Catch regressions within minutes.',
    },
    {
      slug: 'spf-dmarc-monitoring',
      label: 'SPF / DMARC monitoring',
      why: 'Email authentication is a fraud-prevention control. A missing DMARC record opens the door to financial phishing under your brand.',
    },
    {
      slug: 'keyword-monitoring',
      label: 'Keyword monitoring',
      why: 'Verify legal disclosures, regulator-mandated text, and customer-facing fee schedules remain present on the public site.',
    },
  ],
  slaCallout: [
    { label: 'FCA target uptime for critical services', value: '99.99%' },
    { label: 'Of fintech outages caused by config drift', value: '~40%' },
    { label: 'Plans starting from', value: 'Free' },
  ],
  faq: [
    {
      q: 'Can Uptrue produce regulator-ready incident reports?',
      a: 'Yes — every incident has an immutable, time-stamped record including detection time, confirmation, alert dispatch times, and resolution. The data is exportable. While we are not a substitute for your operational resilience framework, we provide the underlying check evidence that regulators expect to see.',
    },
    {
      q: 'How does Uptrue help with FCA Operational Resilience expectations?',
      a: 'The FCA requires firms to identify Important Business Services and define impact tolerances. Uptrue monitors give you continuous evidence of whether services are within tolerance — uptime, response time, SSL validity, security headers. The audit trail and incident log support your annual self-assessment.',
    },
    {
      q: 'Where is monitoring data stored — is it EU-resident?',
      a: 'All Uptrue customer data, including monitor configurations, incident logs, and audit trails, is stored in the EU (Frankfurt region) on Supabase infrastructure. Data is encrypted at rest and in transit. We have a published Data Processing Agreement available for Agency and Scale customers.',
    },
    {
      q: 'Can we monitor authenticated APIs without exposing credentials?',
      a: 'Yes. API Endpoint monitors accept custom HTTP headers, so you can use a long-lived service token scoped to a read-only monitoring user. Best practice: rotate quarterly, restrict source IPs at your gateway to Uptrue check origins, and never use admin-tier credentials.',
    },
    {
      q: 'Is two-confirmation alerting sufficient for a critical fintech service?',
      a: 'For most fintech services, yes — two-confirmation eliminates 95% of false positives from transient network blips. For systems where every minute counts, we recommend pairing it with a heartbeat monitor on a dedicated health endpoint, plus PagerDuty (V1.5) for human escalation. Alert fatigue causes real outages to be missed.',
    },
    {
      q: 'What about DORA (Digital Operational Resilience Act) compliance?',
      a: 'DORA requires regulated financial entities in the EU to maintain ICT risk management and demonstrate operational resilience including third-party monitoring. Uptrue is a Tier 2 ICT third-party provider for monitoring purposes — we publish our subprocessor list, security practices, and DPA. We are not a substitute for DORA compliance but support the monitoring evidence layer.',
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

export default function FintechUptimeMonitoringPage(): React.ReactElement {
  return <IndustryLandingPage data={data} />
}

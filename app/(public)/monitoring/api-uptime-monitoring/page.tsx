import type { Metadata } from 'next'
import { IndustryLandingPage, type IndustryLandingData } from '@/components/landing/industry-landing'

const data: IndustryLandingData = {
  slug: 'api-uptime-monitoring',
  heroTitle: 'API Uptime Monitoring',
  heroSubtitle:
    'Catch silent API regressions, broken auth flows, and slow responses before they reach customer integrations. Built for backend engineering teams, platform APIs, and developer-facing services.',
  seoTitle: 'API Uptime Monitoring — REST, GraphQL & Webhook Health Checks | Upnotify',
  seoDescription:
    'API uptime monitoring with body assertions, latency thresholds, and authentication header support. Catch the regressions that 200-OK monitors miss: malformed responses, broken auth flows, slow webhooks, and silent dependency failures.',
  whyItMatters: [
    'APIs fail in ways websites do not. A status-only check that says "200 OK, all good" can completely miss a broken API: the endpoint can return success while sending malformed JSON, the wrong schema version, an empty result set, or an error nested in a 200 response. By the time customer integrations start breaking, the regression has been live for hours.',
    'And the failure modes compound. A slow webhook means downstream systems queue up. A wrong schema means client SDKs throw. A bad CORS header means browsers reject responses entirely. API uptime monitoring needs to assert on the things that actually matter to consumers — body content, latency, headers — not just the response code.',
  ],
  painPoints: [
    'API returns 200 OK with malformed JSON after a deploy — every consumer breaks but uptime monitors say green.',
    'Auth endpoint accepts requests but issues invalid tokens; downstream calls fail with 401 from the customer side.',
    'Webhook delivery is slow; downstream system queues fall behind and customers report stale data.',
    'Schema version drift after a release: response missing a required field that client SDKs depend on.',
    'CORS headers misconfigured after a CDN change; browser-based integrations break instantly.',
    'Rate-limit response (429) returned at lower volume than expected — caching layer is broken.',
  ],
  monitors: [
    {
      slug: 'api-endpoint-monitoring',
      label: 'API endpoint monitoring',
      why: 'The headline monitor for APIs. Define assertions on status, body content, and response time. Send custom request methods, headers, and bodies.',
    },
    {
      slug: 'response-time-monitoring',
      label: 'Response time monitoring',
      why: 'API consumers feel latency before they notice failures. Set tight warn (e.g. 500ms) and critical (e.g. 1500ms) thresholds per endpoint.',
    },
    {
      slug: 'heartbeat-monitoring',
      label: 'Heartbeat monitoring',
      why: 'Inverted check: your API or background worker pings Upnotify. If the heartbeat stops, the worker has died — even if its HTTP endpoint is "up".',
    },
    {
      slug: 'http-uptime-monitoring',
      label: 'HTTP uptime monitoring',
      why: 'The simple up/down check from the edge with two-confirmation logic. Pair with API endpoint monitoring for full coverage.',
    },
    {
      slug: 'ssl-certificate-monitoring',
      label: 'SSL certificate monitoring',
      why: 'API consumers cannot recover from an expired certificate the way browser users can. Get warned 30, 14 and 3 days ahead — across every API subdomain.',
    },
    {
      slug: 'keyword-monitoring',
      label: 'Keyword monitoring',
      why: 'Validate that JSON responses contain expected keys ("data", "results") or do not contain expected error markers ("error", "deprecated").',
    },
  ],
  slaCallout: [
    { label: 'API consumer SLA expected', value: '99.95%' },
    { label: 'Of API outages return 200 OK', value: '~30%' },
    { label: 'Plans starting from', value: 'Free' },
  ],
  faq: [
    {
      q: 'How is API uptime monitoring different from generic uptime monitoring?',
      a: 'Generic uptime monitoring asks "did I get a response code?". API uptime monitoring asks "was the response semantically correct?". The right monitor for an API checks: did the status code match the assertion, does the body contain expected content, is the response time within tolerance, are CORS and content-type headers correct. Upnotify\'s API Endpoint monitor handles all four in one check.',
    },
    {
      q: 'Can I monitor authenticated APIs without exposing real credentials?',
      a: 'Yes. API Endpoint monitors accept custom HTTP headers. Best practice: create a dedicated read-only monitoring user, issue a long-lived service token, and rotate the token quarterly. Restrict source IPs at your API gateway to Upnotify check origins for an extra layer of safety.',
    },
    {
      q: 'Do you support GraphQL endpoints?',
      a: 'Yes. Configure the API Endpoint monitor to send a POST request with your GraphQL query in the body. Add an assertion on the response body to verify the expected data shape. The same monitor also catches latency regressions, which matter even more in GraphQL because of N+1 query risks.',
    },
    {
      q: 'How do I monitor a webhook delivery latency?',
      a: 'Use Heartbeat monitoring. Have the receiving service ping Upnotify immediately on receiving each webhook. If the gap between expected pings exceeds the grace period, the webhook delivery has stopped. Combined with API Endpoint monitoring on the source webhook URL, you get full pipeline coverage.',
    },
    {
      q: 'What\'s the right check interval for an API?',
      a: 'For customer-facing APIs, 1 minute is the standard. For internal APIs, 5 minutes is usually enough. For canary endpoints used to test new deploys, run them every 30 seconds during the rollout. Free plan includes 1-minute checks; Lite and above include 30-second checks.',
    },
    {
      q: 'How do I avoid alerting fatigue when an API has many endpoints?',
      a: 'Two patterns work well: (1) one monitor per critical user-flow (login, checkout, search) rather than one per endpoint, and (2) Smart Digest grouping — first alert in a window goes instant, repeat events for the same incident roll into a single follow-up email instead of 50 pages. Both are included on every Upnotify plan.',
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

export default function ApiUptimeMonitoringPage(): React.ReactElement {
  return <IndustryLandingPage data={data} />
}

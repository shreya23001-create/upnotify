import type { Metadata } from 'next'
import { ToolPillarLanding, type ToolPillarData } from '@/components/landing/tool-pillar-landing'
import '../../landing.css'

const data: ToolPillarData = {
  pillarSlug: 'uptime',
  seoTitle: 'Free Uptime & Performance Tools — Status Checker, Speed Test, SLA Calculator | Upnotify',
  seoDescription:
    'Free uptime and performance tools: HTTP status checker, full website health score, response-time / TTFB speed test, and uptime SLA calculator. Run one-off checks now or set up continuous monitoring on the free plan.',
  heroTitle: 'Free Uptime & Performance Tools',
  heroSubtitle:
    'Quick checks for whether a site is up, how fast it responds, and what its uptime really means in real time. No signup required.',
  whyItMatters: [
    "Uptime and performance are the two metrics every customer feels first. A site that's down loses sales immediately. A site that's slow loses sales gradually — every extra second of TTFB shaves percentage points off conversion.",
    "These four tools cover the basics in 60 seconds: confirm a URL responds, measure how fast it responds, get a single A+ to F health score across five categories, and translate a vague 'high availability' SLA promise into the actual minutes of allowed downtime per year.",
  ],
  tools: [
    {
      slug: 'score',
      href: '/score',
      label: 'Website Health Score',
      oneLiner: 'Five categories — uptime, SSL, DNS, security headers, performance — combined into a single A+ to F grade.',
      badge: 'Featured',
    },
    {
      slug: 'http-status-checker',
      label: 'HTTP Status Code Checker',
      oneLiner: 'Check any URL\'s response code, follow redirects, and inspect response headers.',
    },
    {
      slug: 'website-speed-test',
      label: 'Website Speed Test',
      oneLiner: 'TTFB, total load time, page size, compression — with a grade and actionable tips.',
    },
    {
      slug: 'uptime-calculator',
      label: 'Uptime & SLA Calculator',
      oneLiner: 'See what 99.9%, 99.99%, and other SLA levels actually mean in real downtime.',
    },
  ],
  monitors: [
    {
      slug: 'http-uptime-monitoring',
      label: 'HTTP uptime monitoring',
      why: 'The foundational up/down check from the edge with two-confirmation logic. Catches what HTTP Status Checker shows you, but every minute, automatically, with alerts.',
    },
    {
      slug: 'response-time-monitoring',
      label: 'Response time monitoring',
      why: 'Continuous version of Speed Test. Set warn and critical thresholds — be alerted before slow becomes downtime.',
    },
    {
      slug: 'keyword-monitoring',
      label: 'Keyword monitoring',
      why: 'Verify a critical button, headline, or copy block is still on the page. Catches the broken-page-with-200-OK failures that pure uptime checks miss.',
    },
    {
      slug: 'page-size-monitoring',
      label: 'Page size monitoring',
      why: 'Alert when page weight balloons unexpectedly — a common cause of TTFB regression after a deploy or a CMS asset upload.',
    },
  ],
  faq: [
    {
      q: 'What\'s the difference between these tools and continuous monitoring?',
      a: 'Each tool runs a one-off check at the moment you click the button. Continuous monitoring runs the same check every minute (or every 5 minutes) automatically, and alerts you the moment something changes. The Free Upnotify plan includes 3 continuous monitors with email alerts.',
    },
    {
      q: 'Which tool should I run first?',
      a: 'The Website Health Score. It bundles HTTP status, SSL, DNS, security headers, and performance into a single A+ to F grade, so you spot the worst category first. Then drill into individual tools (Status Checker, Speed Test) for the failing categories.',
    },
    {
      q: 'How accurate is the speed test from one location?',
      a: 'Accurate for the test region. Real-world performance varies by user location, network, and time of day. For a representative view, set up Response Time monitoring on your domain — Upnotify runs continuous checks and tracks the rolling 24-hour average.',
    },
    {
      q: 'What uptime percentage should I aim for?',
      a: '99.9% (8h 45m of allowed downtime per year) is the default starting point. 99.95% suits scale-ups with paying customers. 99.99% (52 minutes per year) requires multi-region failover. Run the SLA Calculator to see what each tier costs in actual minutes.',
    },
    {
      q: 'Are these tools really free?',
      a: 'Yes. Every tool runs against our edge network — no signup, no email capture, no rate limit beyond basic abuse protection. Run them on any public URL as many times as you want.',
    },
  ],
}

export const metadata: Metadata = {
  title: data.seoTitle,
  description: data.seoDescription,
  alternates: { canonical: `https://upnotify-monitoring.vercel.app/tools/${data.pillarSlug}` },
  openGraph: {
    title: data.seoTitle,
    description: data.seoDescription,
    url: `https://upnotify-monitoring.vercel.app/tools/${data.pillarSlug}`,
    type: 'website',
  },
}

export default function UptimeToolsPillarPage(): React.ReactElement {
  return <ToolPillarLanding data={data} />
}

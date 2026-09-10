/**
 * /score — Public input page for Upnotify Score.
 * Server component with a client-side form that redirects to /score/[domain].
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Activity, KeyRound, Target, Plug, Clock, Server } from 'lucide-react'
import { ScoreForm } from '@/components/score/score-form'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'Free Website Health Score Checker — Test Site Health Online | Upnotify',
  description:
    'Free website health score across 5 categories — uptime, SSL, DNS, security headers, and performance. Instant grade from A+ to F. No signup required. Pairs with continuous uptime monitoring.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/score' },
}

const CONTINUOUS_MONITORS = [
  {
    icon: Activity,
    href: '/monitoring/http-uptime-monitoring',
    title: 'HTTP uptime monitoring',
    desc: 'Be alerted the moment your site stops responding.',
  },
  {
    icon: KeyRound,
    href: '/monitoring/ssl-certificate-monitoring',
    title: 'SSL certificate monitoring',
    desc: 'Get warned 30, 14 and 3 days before expiry.',
  },
  {
    icon: Target,
    href: '/monitoring/dns-monitoring',
    title: 'DNS record monitoring',
    desc: 'Detect unauthorised record changes within minutes.',
  },
  {
    icon: Plug,
    href: '/monitoring/security-headers-monitoring',
    title: 'Security headers monitoring',
    desc: 'Spot when HSTS, CSP or X-Frame-Options drop off.',
  },
  {
    icon: Clock,
    href: '/monitoring/response-time-monitoring',
    title: 'Response time monitoring',
    desc: 'Catch performance degradation before it bites.',
  },
  {
    icon: Server,
    href: '/tools',
    title: 'Free website tools',
    desc: 'SSL, DNS, security headers, blacklist and more — no signup required.',
  },
]

const FAQ = [
  {
    q: 'What does the Website Health Score check?',
    a: 'Five categories in a single test: uptime (does the site respond?), SSL (is the certificate valid and not near expiry?), DNS (do the records resolve correctly?), security headers (HSTS, CSP, X-Frame-Options and others), and performance (response time, TTFB). Each contributes to an overall A+ to F grade with specific recommendations for any failing checks.',
  },
  {
    q: 'Is the Website Health Score free?',
    a: 'Yes, completely free. No account, no email capture, no rate limit. You can score any public URL as many times as you want. The result page is shareable.',
  },
  {
    q: 'How accurate is the score?',
    a: 'The score reflects what the tool can measure from a single point-in-time check at the edge. Uptime, SSL chain, DNS resolution, header presence and response time are all directly observable and reported as-is. The score is a snapshot — for the trends that matter (uptime over weeks, SSL expiry alerts, response time degradation) you need continuous monitoring.',
  },
  {
    q: 'Can I monitor these checks continuously instead of one-off?',
    a: 'Yes. The Free Upnotify plan includes 3 monitors at email-alerts. Each of the five score categories maps to a continuous monitor type: HTTP uptime, SSL certificate monitoring, DNS monitoring, security headers monitoring, and response time monitoring. Set up once, get alerted whenever something breaks.',
  },
  {
    q: 'How is this different from PageSpeed or GTmetrix?',
    a: 'PageSpeed and GTmetrix focus on browser performance metrics. The Upnotify Health Score is broader — it includes infrastructure (DNS, SSL chain), security posture (headers), and uptime in a single grade designed for site owners and agencies, not just developers.',
  },
  {
    q: 'What should I do if my score is low?',
    a: 'Each failing check on the result page links to a specific fix or guide. For example, a missing HSTS header links to our security headers checker; an SSL chain warning links to the SSL certificate checker. You can also browse all our free website monitoring tools.',
  },
]

export default function ScorePage(): React.ReactElement {
  return (
    <div className="score-hero">
      

      <div className="score-hero-content">
        <div className="score-hero-badge">Free tool</div>
        <h1 className="score-hero-title">
          Website Health Score
        </h1>
        <p className="score-hero-subtitle">
          Get an instant health check across 5 categories: uptime, SSL, DNS,
          security headers, and performance. No signup required.
        </p>

        <ScoreForm />

        <div className="score-features-row">
          <div className="score-feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            Uptime
          </div>
          <div className="score-feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            SSL
          </div>
          <div className="score-feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            DNS
          </div>
          <div className="score-feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Security
          </div>
          <div className="score-feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            Performance
          </div>
        </div>
      </div>

      {/* Related continuous monitors — each score category maps to a continuous monitor type */}
      <section className="score-continuous-section">
        <div className="landing-container" style={{ maxWidth: 1080 }}>
          <h2 className="landing-section-title">Score is a snapshot — monitor it continuously</h2>
          <p className="landing-section-subtitle">
            A one-off score tells you the state right now. To catch regressions before
            customers do, set up continuous monitoring on the categories that matter to you.
          </p>
          <div className="score-continuous-grid">
            {CONTINUOUS_MONITORS.map(({ icon: Icon, href, title, desc }) => (
              <Link key={href} href={href} className="score-continuous-card">
                <div className="score-continuous-icon-wrap">
                  <span className="score-continuous-ping" />
                  <span className="score-continuous-icon"><Icon size={26} strokeWidth={1.75} /></span>
                </div>
                <div className="score-continuous-title">{title}</div>
                <div className="score-continuous-desc">{desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <Faq
        items={FAQ.map(item => ({ question: item.q, answer: item.a }))}
        headline="Frequently asked questions"
      />

      {/* JSON-LD FAQPage schema mirroring the FAQ array above */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-container">
          <h2 className="cta-title">Turn the score into peace of mind</h2>
          <p className="cta-subtitle">
            The Free plan includes 3 monitors with email alerts. No credit card required.{' '}
            <Link href="/signup">Start monitoring free</Link> in under 2 minutes.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Sign Up Free
          </Link>
        </div>
      </section>
    </div>
  )
}

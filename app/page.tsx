import './landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'
import { Ticker } from '@/components/landing/ticker'
import { BlogPreview } from '@/components/landing/blog-preview'
import PricingTable from '@/components/landing/pricing-table'
import { getDefaultCurrency } from '@/lib/utils/geo.server'
import { HeroDashboardMockup } from '@/components/landing/hero-dashboard-mockup'
import { FeatureCarousel } from '@/components/landing/feature-carousel'
import { DowntimeCalculator } from '@/components/landing/downtime-calculator'
import Faq from '@/components/landing/faq'
import { AgencyWaitlistCta } from '@/components/landing/agency-waitlist-cta'
import { TrustedLogos } from '@/components/landing/trusted-logos'
import { CtaCanvas } from '@/components/landing/cta-canvas'
import {
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  WebSiteJsonLd,
  FaqPageJsonLd,
} from '@/components/seo/json-ld'
import { FAQ_ITEMS } from '@/lib/constants/faq'
import { getHomepageFeatureTypes } from '@/lib/constants/monitor-types'

// force-dynamic: homepage fetches live DB data (Ticker, BlogPreview, TrustedLogos).
// revalidate=300 would fail local builds without env vars. Revisit when local
// env vars are fully configured or when CDN-level caching is added at the edge.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Uptrue — Website Monitoring Suite for Agencies & Teams',
  description:
    'Monitor uptime, performance and infrastructure across all your sites. 24 monitor types, AI-powered reports, public status pages, multi-channel alerts, and agency white-label — all in one platform. Free plan available.',
  alternates: { canonical: 'https://uptrue.io' },
  openGraph: {
    title: 'Uptrue — Website Monitoring Suite for Agencies & Teams',
    description:
      'Monitor uptime, performance and infrastructure across all your sites. 24 monitor types, AI-powered reports, public status pages, and multi-channel alerts.',
    url: 'https://uptrue.io',
  },
}

const STEPS = [
  {
    number: '1',
    title: 'Add a Monitor',
    description:
      'Enter your URL, choose a monitor type, and set a check interval as low as 1 minute. No config files, no agents, no setup scripts.',
  },
  {
    number: '2',
    title: 'Get Alerted Instantly',
    description:
      'When something goes wrong, Uptrue confirms from a second region and fires an alert to your preferred channel — Slack, email, Teams, or webhook.',
  },
  {
    number: '3',
    title: 'Share Status & Reports',
    description:
      'Publish branded status pages your customers can check themselves. Generate AI-powered reports to share uptime SLAs with stakeholders.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      "We caught three client outages before their users noticed. Our clients still don't know how close it was. Uptrue paid for itself in the first week.",
    name: 'Sarah Mitchell',
    role: 'Founder · Brightwave Digital Agency',
    initials: 'SM',
    cardClass: 't1',
    avatarClass: 'a1',
  },
  {
    quote:
      "The AI reports are genuinely impressive. I send them to our board every month — they actually read them. It's the first monitoring tool that speaks human.",
    name: 'James Thornton',
    role: 'CTO · Formly SaaS',
    initials: 'JT',
    cardClass: 't2',
    avatarClass: 'a2',
  },
  {
    quote:
      'Switched from UptimeRobot. Zero false alarms since day one. The two-region confirmation alone has saved our on-call team from 3am panic alerts.',
    name: 'Alex Deacon',
    role: 'DevOps Lead · Cartify Commerce',
    initials: 'AD',
    cardClass: 't3',
    avatarClass: 'a3',
  },
]

export default async function LandingPage(): Promise<React.ReactElement> {
  const defaultCurrency = await getDefaultCurrency()
  return (
    <>
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <WebSiteJsonLd />
      <FaqPageJsonLd items={FAQ_ITEMS} />

      {/* NAV */}
      <PublicNav />

      {/* Wrapper: clips horizontal overflow from any section without breaking sticky nav */}
      <main className="landing-content-wrap">

      {/* LIVE TICKER */}
      <Ticker />

      {/* ================================================================
          HERO
          ================================================================ */}
      <section className="hero" id="heroSection">
        <div className="hero-grid" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow fade-up">
              <div className="hero-eyebrow-text">
                <span className="hero-eyebrow-dot" />
                24 monitor types · 1-minute checks · AI-powered reports
              </div>
            </div>
            <h1 className="hero-headline fade-up delay-1">
              Know when your sites go down.<br />
              <span className="gradient-text">Before your customers do.</span>
            </h1>
            <p className="hero-sub fade-up delay-2">
              Uptime, performance &amp; infrastructure monitoring for agencies and teams.
              Multi-channel alerts, public status pages, and AI-powered reports — all in one platform.
            </p>
            <div className="hero-ctas fade-up delay-3">
              <Link href="/signup" className="btn btn-primary btn-lg">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Monitoring Free
              </Link>
              <Link href="/#how-it-works" className="btn btn-ghost btn-lg">See How It Works</Link>
              <Link href="/score" className="btn btn-outline-brand btn-lg">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Score Your Site Free
              </Link>
            </div>
            <div className="hero-trust fade-up delay-3">
              <div className="trust-item"><strong>No</strong> credit card required</div>
              <div className="trust-item">·</div>
              <div className="trust-item"><strong>3 monitors</strong> free forever</div>
              <div className="trust-item">·</div>
              <div className="trust-item"><strong>1-minute</strong> check intervals</div>
              <div className="trust-item">·</div>
              <div className="trust-item"><strong>GDPR</strong> compliant · EU data</div>
            </div>

            {/* Dashboard Mockup — interactive + animated */}
            <HeroDashboardMockup />
          </div>
        </div>
      </section>

      {/* ================================================================
          SOCIAL PROOF
          ================================================================ */}
      <div className="social-proof-strip">
        <div className="container">
          <div className="sp-label">Tracking uptime for the world&apos;s most-used platforms</div>
          <TrustedLogos />
        </div>
      </div>

      {/* ================================================================
          STATS BAR
          ================================================================ */}
      <div className="stats-bar">
        <div className="stats-bar-inner">
          <div className="stat-item">
            <div className="stat-value gradient-text">23</div>
            <div className="stat-label">Monitor types</div>
          </div>
          <div className="stat-item">
            <div className="stat-value gradient-text">1 min</div>
            <div className="stat-label">Fastest check interval</div>
          </div>
          <div className="stat-item">
            <div className="stat-value gradient-text">99.9%</div>
            <div className="stat-label">Uptime SLA</div>
          </div>
          <div className="stat-item">
            <div className="stat-value gradient-text">0</div>
            <div className="stat-label">False alarms (2-region confirm)</div>
          </div>
        </div>
      </div>

      {/* ================================================================
          FEATURES
          ================================================================ */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Everything you need</div>
            <h2 className="section-title">Monitoring that actually works</h2>
            <p className="section-sub">
              From basic uptime to AI-powered insights. Built for agencies managing hundreds of sites and teams who need reliability.
            </p>
          </div>
          <FeatureCarousel />
        </div>
      </section>

      {/* ================================================================
          MONITOR TYPE FEATURE CARDS
          ================================================================ */}
      <section className="section" id="monitor-types">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Website Monitoring Suite</div>
            <h2 className="section-title">23 things that can go wrong.<br />We check them all.</h2>
            <p className="section-sub">
              Most tools only check if your site loads. Uptrue monitors every layer —
              uptime, security, DNS, email, compliance, and more.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}>
            {getHomepageFeatureTypes().map(t => (
              <a
                key={t.slug}
                href={`/monitoring/${t.slug}`}
                style={{
                  display: 'block',
                  padding: '20px 22px',
                  borderRadius: 12,
                  border: '1.5px solid var(--border-primary)',
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'var(--bg-card)',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 10 }}>{t.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{t.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.55 }}>{t.tagline}</div>
              </a>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <a
              href="/monitoring"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--accent)',
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              See all 24 monitor types →
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS
          ================================================================ */}
      <section className="section hiw-section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Simple by design</div>
            <h2 className="section-title">Up and running in 2 minutes</h2>
          </div>
          <div className="hiw-steps">
            {STEPS.map((step) => (
              <div key={step.number} className="hiw-step">
                <div className="hiw-number">{step.number}</div>
                <div className="hiw-title">{step.title}</div>
                <div className="hiw-desc">{step.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          AI FEATURES
          ================================================================ */}
      <section className="ai-section">
        <div className="container">
          <div className="ai-inner">
            {/* Left: text + feature bullets */}
            <div className="ai-text">
              <div className="section-eyebrow">AI-Powered Intelligence</div>
              <h2 className="section-title">Your monitoring gets smarter over time</h2>
              <p className="section-sub">
                Uptrue doesn&apos;t just tell you something went down — it tells you why, what it means for your business, and what to do next.
              </p>
              <div className="ai-features-list">
                <div className="ai-feature-item">
                  <div className="ai-feature-icon purple">🤖</div>
                  <div className="ai-feature-body">
                    <h3>Executive AI Reports</h3>
                    <p>One click and Claude analyses 90 days of uptime data, incident patterns, and performance trends — generating a polished summary you can send to clients or stakeholders.</p>
                  </div>
                </div>
                <div className="ai-feature-item">
                  <div className="ai-feature-icon cyan">🔍</div>
                  <div className="ai-feature-body">
                    <h3>Outage Pattern Detection</h3>
                    <p>Uptrue learns your monitor&apos;s normal behaviour and flags anomalies before they become incidents. Recurring issues are spotted and surfaced automatically.</p>
                  </div>
                </div>
                <div className="ai-feature-item">
                  <div className="ai-feature-icon pink">📰</div>
                  <div className="ai-feature-body">
                    <h3>AI Outage News &amp; Blog</h3>
                    <p>When a public service goes down, Uptrue researches and publishes an outage report automatically — with your logo and brand. Real-time SEO content on autopilot.</p>
                  </div>
                </div>
                <div className="ai-feature-item">
                  <div className="ai-feature-icon blue">💡</div>
                  <div className="ai-feature-body">
                    <h3>Plain Language Incident Summaries</h3>
                    <p>Every incident automatically gets a human-readable summary. No log-diving, no decoding stack traces. Just &quot;your checkout was down for 8 minutes on Tuesday.&quot;</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: AI report card mockup */}
            <div>
              <div className="ai-report-card">
                <div className="ai-report-header">
                  <div className="ai-report-title">Monthly Performance Report — Acme Agency</div>
                  <div className="ai-report-badge">
                    <span className="ai-powered-dot" />
                    AI Generated
                  </div>
                </div>
                <div className="ai-report-meta">
                  <span>March 2026</span>
                  <span>·</span>
                  <span>24 monitors</span>
                  <span>·</span>
                  <span>AI Generated</span>
                </div>
                <div className="ai-report-section">
                  <div className="ai-report-section-label">Executive Summary</div>
                  <div className="ai-report-line long" />
                  <div className="ai-report-line med" />
                  <div className="ai-report-line long" />
                  <div className="ai-report-line short" />
                </div>
                <div className="ai-stat-row">
                  <div className="ai-stat-box green">
                    <div className="val">99.94%</div>
                    <div className="lbl">Avg Uptime</div>
                  </div>
                  <div className="ai-stat-box red">
                    <div className="val">3</div>
                    <div className="lbl">Incidents</div>
                  </div>
                  <div className="ai-stat-box blue">
                    <div className="val">142ms</div>
                    <div className="lbl">Avg Response</div>
                  </div>
                </div>
                <div className="ai-report-insight">
                  <div className="ai-insight-icon">💡</div>
                  <div className="ai-insight-text">
                    <strong>AI Insight:</strong> checkout.shop.io has experienced 3 slowdowns on Tuesday mornings between 09:00–10:00 UTC. This pattern suggests a scheduled job or traffic spike. Recommend investigating backend cron tasks.
                  </div>
                </div>
                <div className="ai-report-section" style={{ marginTop: 'var(--space-4)' }}>
                  <div className="ai-report-section-label">Recommendations</div>
                  <div className="ai-report-line long" />
                  <div className="ai-report-line med" />
                  <div className="ai-report-line xs" />
                </div>
                <div className="ai-report-cta">
                  <button className="btn-ai-primary">Download PDF Report</button>
                  <button className="btn-ai-ghost">Share</button>
                </div>
                <div className="ai-powered-by">
                  <span className="ai-powered-dot" />
                  Uptrue AI Reports
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          PRICING
          ================================================================ */}
      <PricingTable defaultCurrency={defaultCurrency} />

      {/* ================================================================
          AGENCY CTA
          ================================================================ */}
      <section className="agency-section" id="agency">
        <div className="container">
          <div className="agency-card">
            <div className="agency-text">
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <span className="agency-coming-badge">Coming Soon · Join Waitlist</span>
              </div>
              <h2>Monitor hundreds of client sites under your brand</h2>
              <p>The Agency tier gives you full white-label, multi-tenant workspaces, revenue sharing, custom analytics, and AI reports branded with your agency name. Built for agencies managing dozens of clients.</p>
              <div className="agency-badges">
                <div className="agency-badge">🏷️ Full white-label</div>
                <div className="agency-badge">👥 Multi-tenant workspaces</div>
                <div className="agency-badge">💰 Revenue sharing</div>
                <div className="agency-badge">🤖 Branded AI reports</div>
                <div className="agency-badge">📊 Custom analytics</div>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <AgencyWaitlistCta />
              <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.4)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
                No commitment · Early access pricing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FAQ
          ================================================================ */}
      <Faq />

      {/* ================================================================
          DOWNTIME CALCULATOR
          ================================================================ */}
      <DowntimeCalculator />

      {/* ================================================================
          TESTIMONIALS
          ================================================================ */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Trusted by teams</div>
            <h2 className="section-title">What our users say</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className={`testimonial-card ${t.cardClass}`}>
                <div className="testimonial-quote">&ldquo;</div>
                <div className="testimonial-stars">
                  <span className="testimonial-star">★</span>
                  <span className="testimonial-star">★</span>
                  <span className="testimonial-star">★</span>
                  <span className="testimonial-star">★</span>
                  <span className="testimonial-star">★</span>
                </div>
                <div className="testimonial-text">{t.quote}</div>
                <div className="testimonial-author">
                  <div className={`testimonial-avatar ${t.avatarClass}`}>{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          COMPARISON TABLE
          ================================================================ */}
      <section className="comparison-section">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">How we compare</div>
            <h2 className="section-title">Uptrue vs the alternatives</h2>
            <p className="section-sub">Not all uptime monitoring is equal. Here&apos;s how Uptrue stacks up against the most popular tools.</p>
          </div>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="col-uptrue">
                    <div className="uptrue-col-header">
                      Uptrue
                      <span className="uptrue-col-badge">Best value</span>
                    </div>
                  </th>
                  <th>BetterUptime</th>
                  <th>UptimeRobot</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fastest check interval</td>
                  <td className="col-uptrue"><span className="comp-val highlight">1 minute</span></td>
                  <td><span className="comp-val">30 seconds</span></td>
                  <td><span className="comp-val">5 minutes</span></td>
                </tr>
                <tr>
                  <td>Two-region false alarm prevention</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-yes">✓</span></td>
                  <td><span className="comp-no">—</span></td>
                </tr>
                <tr>
                  <td>AI-powered reports</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-no">—</span></td>
                  <td><span className="comp-no">—</span></td>
                </tr>
                <tr>
                  <td>Watchdog (competitor tracking)</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-no">—</span></td>
                  <td><span className="comp-no">—</span></td>
                </tr>
                <tr>
                  <td>Public uptime leaderboard / tracker</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-no">—</span></td>
                  <td><span className="comp-no">—</span></td>
                </tr>
                <tr>
                  <td>Public status pages</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-yes">✓</span></td>
                  <td><span className="comp-yes">✓</span></td>
                </tr>
                <tr>
                  <td>Monitor types (HTTP, SSL, DNS, Security Headers…)</td>
                  <td className="col-uptrue"><span className="comp-val highlight">24 types</span></td>
                  <td><span className="comp-val">7 types</span></td>
                  <td><span className="comp-val">6 types</span></td>
                </tr>
                <tr>
                  <td>Free plan monitors</td>
                  <td className="col-uptrue"><span className="comp-val highlight">3 monitors</span></td>
                  <td><span className="comp-val">3 monitors</span></td>
                  <td><span className="comp-val">50 monitors</span></td>
                </tr>
                <tr>
                  <td>Starting price (paid plan)</td>
                  <td className="col-uptrue"><span className="comp-val highlight">£10/yr Lite</span></td>
                  <td><span className="comp-val">$24/mo</span></td>
                  <td><span className="comp-val">$7/mo</span></td>
                </tr>
                <tr>
                  <td>GDPR · EU data storage</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-yes">✓</span></td>
                  <td><span className="comp-no">—</span></td>
                </tr>
                <tr>
                  <td>AI outage blog auto-publish</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-no">—</span></td>
                  <td><span className="comp-no">—</span></td>
                </tr>
                <tr>
                  <td>Free AI SEO Checker (4-category audit)</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-no">—</span></td>
                  <td><span className="comp-no">—</span></td>
                </tr>
                <tr>
                  <td>llms.txt Generator</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-no">—</span></td>
                  <td><span className="comp-no">—</span></td>
                </tr>
                <tr>
                  <td>AI Citation Monitoring (Perplexity, ChatGPT, Gemini…)</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-no">—</span></td>
                  <td><span className="comp-no">—</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginTop: 'var(--space-5)' }}>
            Comparison based on publicly available information as of April 2026. Features may vary by plan.
          </p>
        </div>
      </section>

      {/* ================================================================
          BLOG PREVIEW
          ================================================================ */}
      <BlogPreview />

      {/* ================================================================
          CTA BAND
          ================================================================ */}
      <section className="cta-band" id="ctaSection">
        <CtaCanvas />
        <div className="container">
          <div className="cta-band-inner">
            <div className="cta-band-eyebrow">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start in 2 minutes
            </div>
            <h2>Don&apos;t find out you&apos;re down<br />from a customer tweet.</h2>
            <p>Uptrue watches your sites, APIs, and infrastructure 24/7 — and tells you first. Free plan included. No credit card required.</p>
            <div className="cta-band-buttons">
              <Link href="/signup" className="btn-cta-white">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Monitoring Free
              </Link>
              <Link href="/#features" className="btn-cta-outline">
                See All Features →
              </Link>
            </div>
            <div className="cta-band-trust">
              <span className="cta-band-trust-item">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                3 monitors free forever
              </span>
              <span className="cta-band-trust-dot" />
              <span className="cta-band-trust-item">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                No credit card required
              </span>
              <span className="cta-band-trust-dot" />
              <span className="cta-band-trust-item">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                GDPR compliant · EU data
              </span>
              <span className="cta-band-trust-dot" />
              <span className="cta-band-trust-item">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                1-minute check intervals
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <PublicFooter />

      </main>{/* end landing-content-wrap */}
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import PricingTable from '@/components/landing/pricing-table'
import CompetePricing from '@/components/landing/compete-pricing'
import Faq from '@/components/landing/faq'
import {
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  WebSiteJsonLd,
  FaqPageJsonLd,
} from '@/components/seo/json-ld'
import { FAQ_ITEMS } from '@/lib/constants/faq'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'
import { TrustedLogos } from '@/components/landing/trusted-logos'
import { AgencyWaitlistCta } from '@/components/landing/agency-waitlist-cta'
import { Ticker } from '@/components/landing/ticker'
import { FeatureCarousel } from '@/components/landing/feature-carousel'
import { HeroCanvas } from '@/components/landing/hero-canvas'
import { BlogPreview } from '@/components/landing/blog-preview'

export const metadata: Metadata = {
  title: 'Uptrue — Uptime Monitoring for Agencies & Teams',
  description:
    'Monitor uptime, performance and infrastructure across all your sites. 10 monitor types, AI-powered reports, public status pages, multi-channel alerts, and agency white-label — all in one platform. Free plan available.',
  alternates: { canonical: 'https://uptrue.io' },
  openGraph: {
    title: 'Uptrue — Uptime Monitoring for Agencies & Teams',
    description:
      'Monitor uptime, performance and infrastructure across all your sites. 10 monitor types, AI-powered reports, public status pages, and multi-channel alerts.',
    url: 'https://uptrue.io',
  },
}

const STEPS = [
  { number: '1', title: 'Add a Monitor', description: 'Enter a URL, IP, or domain. Choose from 10 monitor types. Set your check interval — as low as 30 seconds.' },
  { number: '2', title: 'Get Alerted Instantly', description: 'When something goes wrong, Uptrue confirms from a second region and alerts you via your preferred channel.' },
  { number: '3', title: 'Share Status & Reports', description: 'Publish branded status pages for your customers. Generate AI-powered reports for stakeholders.' },
]

const TESTIMONIALS = [
  { quote: 'We caught three client outages before their users noticed. Our clients still don\'t know how close it was. Uptrue paid for itself in the first week.', name: 'Sarah Mitchell', role: 'Founder · Brightwave Digital Agency', initials: 'SM', color: '#3b82f6' },
  { quote: 'The AI reports are genuinely impressive. I send them to our board every month — they actually read them. It\'s the first monitoring tool that speaks human.', name: 'James Thornton', role: 'CTO · Formly SaaS', initials: 'JT', color: '#8b5cf6' },
  { quote: 'Switched from UptimeRobot. Zero false alarms since day one. The two-region confirmation alone has saved our on-call team from 3am panic alerts.', name: 'Alex Deacon', role: 'DevOps Lead · Cartify Commerce', initials: 'AD', color: '#06b6d4' },
]

export default function LandingPage(): React.ReactElement {
  return (
    <div className="landing">
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <WebSiteJsonLd />
      <FaqPageJsonLd items={FAQ_ITEMS} />
      <PublicNav />
      <Ticker />

      {/* ================================================================
          HERO — preview-exact structure with canvas animation
          ================================================================ */}
      <section className="hero" id="heroSection">
        <HeroCanvas />
        <div className="hero-grid" />
        <div className="landing-container">
          <div className="hero-content">
            <div className="hero-eyebrow fade-up">
              <div className="hero-eyebrow-text">
                <span className="hero-eyebrow-dot" />
                10 monitor types · 30-second checks · AI-powered reports
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
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Start Monitoring Free
              </Link>
              <Link href="#how-it-works" className="btn btn-ghost btn-lg">See How It Works</Link>
              <Link href="/score" className="btn btn-outline-brand btn-lg">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Score Your Site Free
              </Link>
            </div>
            <div className="hero-trust fade-up delay-3">
              <div className="trust-item"><strong>No</strong> credit card required</div>
              <div className="trust-item">·</div>
              <div className="trust-item"><strong>3 monitors</strong> free forever</div>
              <div className="trust-item">·</div>
              <div className="trust-item"><strong>30-second</strong> check intervals</div>
              <div className="trust-item">·</div>
              <div className="trust-item"><strong>GDPR</strong> compliant · EU data</div>
            </div>

            {/* Dashboard Mockup */}
            <div className="hero-mockup fade-up delay-3">
              <div className="hero-mockup-shadow" />
              <div className="mockup-window">
                <div className="mockup-titlebar">
                  <div className="mockup-dots">
                    <span className="mockup-dot mockup-dot-red" />
                    <span className="mockup-dot mockup-dot-yellow" />
                    <span className="mockup-dot mockup-dot-green" />
                  </div>
                  <div className="mockup-url">app.uptrue.io/dashboard</div>
                </div>
                <div className="mockup-body">
                  <div className="mockup-sidebar">
                    <div className="ms-logo">
                      <div className="ms-logo-icon">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                      </div>
                      <span className="ms-logo-name">Uptrue</span>
                    </div>
                    <div className="ms-nav">
                      <div className="ms-item ms-item-active"><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>Dashboard</div>
                      <div className="ms-item"><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>Monitors<span className="ms-badge">24</span></div>
                      <div className="ms-item"><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>Alerts</div>
                      <div className="ms-item"><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Incidents<span className="ms-badge ms-badge-red">2</span></div>
                      <div className="ms-divider" />
                      <div className="ms-item"><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>Reports</div>
                      <div className="ms-item"><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Status Pages</div>
                    </div>
                  </div>
                  <div className="mockup-main">
                    <div className="mockup-topbar">
                      <span className="mockup-page-title">Dashboard</span>
                      <div className="mockup-avatar">SA</div>
                    </div>
                    <div className="mockup-content">
                      <div className="mockup-stats">
                        <div className="mockup-stat mockup-stat-blue"><div className="mockup-stat-num">24</div><div className="mockup-stat-lbl">Monitors</div></div>
                        <div className="mockup-stat mockup-stat-green"><div className="mockup-stat-num">22</div><div className="mockup-stat-lbl">Healthy</div></div>
                        <div className="mockup-stat mockup-stat-red"><div className="mockup-stat-num">1</div><div className="mockup-stat-lbl">Down</div></div>
                        <div className="mockup-stat mockup-stat-yellow"><div className="mockup-stat-num">1</div><div className="mockup-stat-lbl">Degraded</div></div>
                      </div>
                      <div className="mockup-table">
                        <div className="mockup-table-head"><span>Monitor</span><span>Status</span><span>Uptime</span><span>Response</span></div>
                        <div className="mockup-row"><span className="mockup-row-name"><span className="mockup-dot-up" />api.example.com</span><span className="mockup-pill mockup-pill-up">UP</span><span className="mockup-row-uptime">99.98%</span><span className="mockup-row-ms">124ms</span></div>
                        <div className="mockup-row"><span className="mockup-row-name"><span className="mockup-dot-up" />app.clientsite.io</span><span className="mockup-pill mockup-pill-up">UP</span><span className="mockup-row-uptime">100%</span><span className="mockup-row-ms">89ms</span></div>
                        <div className="mockup-row mockup-row-alert"><span className="mockup-row-name"><span className="mockup-dot-down" />store.brand.co</span><span className="mockup-pill mockup-pill-down">DOWN</span><span className="mockup-row-uptime mockup-row-bad">97.2%</span><span className="mockup-row-ms">—</span></div>
                        <div className="mockup-row"><span className="mockup-row-name"><span className="mockup-dot-up" />cdn.fastload.net</span><span className="mockup-pill mockup-pill-up">UP</span><span className="mockup-row-uptime">99.99%</span><span className="mockup-row-ms">42ms</span></div>
                        <div className="mockup-row"><span className="mockup-row-name"><span className="mockup-dot-warn" />checkout.shop.io</span><span className="mockup-pill mockup-pill-warn">SLOW</span><span className="mockup-row-uptime">99.1%</span><span className="mockup-row-ms mockup-row-warn">843ms</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
          <div className="stat-item"><div className="stat-value">10</div><div className="stat-label">Monitor types</div></div>
          <div className="stat-item"><div className="stat-value">30s</div><div className="stat-label">Fastest check interval</div></div>
          <div className="stat-item"><div className="stat-value">99.9%</div><div className="stat-label">Uptime SLA</div></div>
          <div className="stat-item"><div className="stat-value">0</div><div className="stat-label">False alarms (2-region confirm)</div></div>
        </div>
      </div>

      {/* ================================================================
          FEATURES — category tabs + carousel
          ================================================================ */}
      <section className="landing-section landing-features" id="features">
        <div className="landing-container">
          <div className="lp-section-eyebrow">Everything you need</div>
          <h2 className="landing-section-title">Monitoring that actually works</h2>
          <p className="landing-section-subtitle">
            From basic uptime to AI-powered insights. Built for agencies managing hundreds of sites and teams who need reliability.
          </p>
          <FeatureCarousel />
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS
          ================================================================ */}
      <section className="landing-section landing-steps" id="how-it-works">
        <div className="landing-container">
          <div className="lp-section-eyebrow">Simple setup</div>
          <h2 className="landing-section-title">Up and running in 60 seconds</h2>
          <p className="landing-section-subtitle">Three steps. No complex setup. No credit card required.</p>
          <div className="steps-grid">
            {STEPS.map((step) => (
              <div key={step.number} className="step-card">
                <div className="step-number">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          AI SHOWCASE
          ================================================================ */}
      <section className="landing-section lp-ai-section">
        <div className="landing-container">
          <div className="lp-ai-inner">
            <div className="lp-ai-text">
              <div className="lp-section-eyebrow">Powered by Claude AI</div>
              <h2 className="lp-ai-title">Your monitoring gets smarter over time</h2>
              <p className="lp-ai-sub">Uptrue doesn&apos;t just tell you something went down — it tells you why, what it means for your business, and what to do next.</p>
              <div className="lp-ai-features">
                <div className="lp-ai-feature">
                  <div className="lp-ai-feature-icon lp-ai-icon-purple">🤖</div>
                  <div>
                    <h4 className="lp-ai-feature-title">Executive AI Reports</h4>
                    <p className="lp-ai-feature-desc">One click and Claude analyses 90 days of uptime data, incident patterns, and performance trends — generating a polished summary you can send to clients.</p>
                  </div>
                </div>
                <div className="lp-ai-feature">
                  <div className="lp-ai-feature-icon lp-ai-icon-cyan">🔍</div>
                  <div>
                    <h4 className="lp-ai-feature-title">Outage Pattern Detection</h4>
                    <p className="lp-ai-feature-desc">Uptrue learns your monitor&apos;s normal behaviour and flags anomalies before they become incidents.</p>
                  </div>
                </div>
                <div className="lp-ai-feature">
                  <div className="lp-ai-feature-icon lp-ai-icon-pink">📰</div>
                  <div>
                    <h4 className="lp-ai-feature-title">AI Outage Blog</h4>
                    <p className="lp-ai-feature-desc">When a public service goes down, Uptrue researches and publishes an outage report automatically. Real-time SEO content on autopilot.</p>
                  </div>
                </div>
                <div className="lp-ai-feature">
                  <div className="lp-ai-feature-icon lp-ai-icon-blue">💡</div>
                  <div>
                    <h4 className="lp-ai-feature-title">Plain Language Summaries</h4>
                    <p className="lp-ai-feature-desc">Every incident gets a human-readable summary. No log-diving. Just &quot;your checkout was down for 8 minutes on Tuesday.&quot;</p>
                  </div>
                </div>
              </div>
            </div>
            {/* AI Report Card mockup */}
            <div className="lp-ai-card">
              <div className="lp-ai-card-header">
                <div className="lp-ai-card-title">Monthly Performance Report</div>
                <div className="lp-ai-card-badge">
                  <span className="lp-ai-card-dot" />
                  AI Generated
                </div>
              </div>
              <div className="lp-ai-card-meta">March 2026 · 24 monitors · Generated by Claude</div>
              <div className="lp-ai-card-section">
                <div className="lp-ai-card-section-label">Executive Summary</div>
                <div className="lp-ai-line lp-ai-line-long" />
                <div className="lp-ai-line lp-ai-line-med" />
                <div className="lp-ai-line lp-ai-line-long" />
                <div className="lp-ai-line lp-ai-line-short" />
              </div>
              <div className="lp-ai-stat-row">
                <div className="lp-ai-stat lp-ai-stat-green">
                  <div className="lp-ai-stat-val">99.94%</div>
                  <div className="lp-ai-stat-lbl">Avg Uptime</div>
                </div>
                <div className="lp-ai-stat lp-ai-stat-red">
                  <div className="lp-ai-stat-val">3</div>
                  <div className="lp-ai-stat-lbl">Incidents</div>
                </div>
                <div className="lp-ai-stat lp-ai-stat-blue">
                  <div className="lp-ai-stat-val">142ms</div>
                  <div className="lp-ai-stat-lbl">Avg Response</div>
                </div>
              </div>
              <div className="lp-ai-insight">
                <span className="lp-ai-insight-icon">💡</span>
                <div className="lp-ai-insight-text">
                  <strong>AI Insight:</strong> checkout.shop.io has experienced 3 slowdowns on Tuesday mornings 09:00–10:00 UTC. This pattern suggests a scheduled job or traffic spike.
                </div>
              </div>
              <div className="lp-ai-card-section" style={{ marginTop: 16 }}>
                <div className="lp-ai-card-section-label">Recommendations</div>
                <div className="lp-ai-line lp-ai-line-long" />
                <div className="lp-ai-line lp-ai-line-med" />
                <div className="lp-ai-line lp-ai-line-short" />
              </div>
              <div className="lp-ai-card-footer">
                <span className="lp-ai-card-dot" />
                Powered by Claude (Anthropic) · Uptrue AI Reports
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          PRICING
          ================================================================ */}
      <PricingTable />
      <CompetePricing />

      {/* ================================================================
          AGENCY
          ================================================================ */}
      <section className="landing-section landing-agency" id="agency">
        <div className="landing-container">
          <div className="agency-grid">
            <div className="agency-content">
              <div className="agency-label-row">
                <span className="agency-label">Built for Agencies</span>
                <span className="agency-coming-soon-badge">Coming Soon</span>
              </div>
              <h2 className="agency-title">Monitor hundreds of client sites under your brand</h2>
              <p className="agency-description">
                White-label everything, manage multi-client workspaces, and unlock revenue sharing. Built from the ground up for agencies managing dozens — or hundreds — of client websites.
              </p>
              <ul className="agency-features">
                <li><span className="agency-check">✓</span>Full white-label — your brand, your domain</li>
                <li><span className="agency-check">✓</span>Multi-tenant workspaces for each client</li>
                <li><span className="agency-check">✓</span>Revenue sharing via Stripe Connect</li>
                <li><span className="agency-check">✓</span>Your own analytics on every client page</li>
                <li><span className="agency-check">✓</span>AI reports branded with your agency name</li>
              </ul>
              <AgencyWaitlistCta />
            </div>
            <div className="agency-visual">
              <div className="agency-mock">
                <div className="agency-mock-header">
                  <div className="agency-mock-logo">YourAgency</div>
                  <span className="agency-mock-badge">White-labelled</span>
                </div>
                <div className="agency-mock-clients">
                  <div className="agency-mock-client"><span className="agency-mock-dot agency-mock-dot-green" /><span>Client A — 12 monitors</span><span className="agency-mock-uptime">99.98%</span></div>
                  <div className="agency-mock-client"><span className="agency-mock-dot agency-mock-dot-green" /><span>Client B — 8 monitors</span><span className="agency-mock-uptime">100%</span></div>
                  <div className="agency-mock-client"><span className="agency-mock-dot agency-mock-dot-yellow" /><span>Client C — 23 monitors</span><span className="agency-mock-uptime">99.87%</span></div>
                  <div className="agency-mock-client"><span className="agency-mock-dot agency-mock-dot-green" /><span>Client D — 5 monitors</span><span className="agency-mock-uptime">100%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          TESTIMONIALS
          ================================================================ */}
      <section className="landing-section lp-testimonials-section">
        <div className="landing-container">
          <div className="lp-section-eyebrow">Trusted by teams</div>
          <h2 className="landing-section-title">What our users say</h2>
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="lp-testimonial-card">
                <div className="lp-testimonial-stars">★★★★★</div>
                <p className="lp-testimonial-text">&ldquo;{t.quote}&rdquo;</p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar" style={{ background: t.color }}>{t.initials}</div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
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
      <section className="landing-section lp-comparison-section">
        <div className="landing-container">
          <div className="lp-section-eyebrow">How we compare</div>
          <h2 className="landing-section-title">Uptrue vs the alternatives</h2>
          <p className="landing-section-subtitle">Not all uptime monitoring is equal. Here&apos;s how Uptrue stacks up against the most popular tools.</p>
          <div className="lp-comparison-wrap">
            <table className="lp-comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="lp-col-uptrue"><div className="lp-uptrue-header">Uptrue<span className="lp-uptrue-badge">Best value</span></div></th>
                  <th>BetterUptime</th>
                  <th>UptimeRobot</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Fastest check interval</td><td className="lp-col-uptrue"><span className="lp-comp-highlight">30 seconds</span></td><td>30 seconds</td><td>5 minutes</td></tr>
                <tr><td>Two-region false alarm prevention</td><td className="lp-col-uptrue"><span className="lp-comp-yes">✓</span></td><td><span className="lp-comp-yes">✓</span></td><td><span className="lp-comp-no">—</span></td></tr>
                <tr><td>AI-powered reports (Claude)</td><td className="lp-col-uptrue"><span className="lp-comp-yes">✓</span></td><td><span className="lp-comp-no">—</span></td><td><span className="lp-comp-no">—</span></td></tr>
                <tr><td>Competitor intelligence</td><td className="lp-col-uptrue"><span className="lp-comp-yes">✓</span></td><td><span className="lp-comp-no">—</span></td><td><span className="lp-comp-no">—</span></td></tr>
                <tr><td>Price &amp; stock tracking (Compete)</td><td className="lp-col-uptrue"><span className="lp-comp-yes">✓</span></td><td><span className="lp-comp-no">—</span></td><td><span className="lp-comp-no">—</span></td></tr>
                <tr><td>Public status pages</td><td className="lp-col-uptrue"><span className="lp-comp-yes">✓</span></td><td><span className="lp-comp-yes">✓</span></td><td><span className="lp-comp-yes">✓</span></td></tr>
                <tr><td>Monitor types</td><td className="lp-col-uptrue"><span className="lp-comp-highlight">10 types</span></td><td>7 types</td><td>6 types</td></tr>
                <tr><td>Starting price</td><td className="lp-col-uptrue"><span className="lp-comp-highlight">£10/yr Lite</span></td><td>$24/mo</td><td>$7/mo</td></tr>
                <tr><td>GDPR · EU data storage</td><td className="lp-col-uptrue"><span className="lp-comp-yes">✓</span></td><td><span className="lp-comp-yes">✓</span></td><td><span className="lp-comp-no">—</span></td></tr>
                <tr><td>AI outage blog auto-publish</td><td className="lp-col-uptrue"><span className="lp-comp-yes">✓</span></td><td><span className="lp-comp-no">—</span></td><td><span className="lp-comp-no">—</span></td></tr>
              </tbody>
            </table>
          </div>
          <p className="lp-comparison-note">Comparison based on publicly available information as of April 2026. Features may vary by plan.</p>
        </div>
      </section>

      {/* ================================================================
          BLOG PREVIEW
          ================================================================ */}
      <BlogPreview />

      {/* ================================================================
          FAQ
          ================================================================ */}
      <Faq />

      {/* ================================================================
          CTA BAND — animated blue→cyan gradient (agreed design)
          ================================================================ */}
      <section className="cta-band">
        <div className="cta-band-inner">
          <div className="cta-band-eyebrow">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            START IN 2 MINUTES
          </div>
          <h2 className="cta-band-title">Don&apos;t find out you&apos;re down<br />from a customer tweet.</h2>
          <p className="cta-band-sub">
            Uptrue watches your sites, APIs, and infrastructure 24/7 —<br />
            and tells you first. Free plan included. No credit card required.
          </p>
          <div className="cta-band-btns">
            <Link href="/signup" className="btn cta-band-btn-primary btn-lg">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Start Monitoring Free
            </Link>
            <Link href="/#features" className="btn cta-band-btn-outline btn-lg">
              See All Features →
            </Link>
          </div>
          <div className="cta-band-trust">
            <span><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> 3 monitors free forever</span>
            <span className="cta-band-dot">·</span>
            <span><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> No credit card required</span>
            <span className="cta-band-dot">·</span>
            <span><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> GDPR compliant · EU data</span>
            <span className="cta-band-dot">·</span>
            <span><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> 30-second check intervals</span>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

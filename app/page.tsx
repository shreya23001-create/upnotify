import './landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'
import { Ticker } from '@/components/landing/ticker'
import { BlogPreview } from '@/components/landing/blog-preview'
import PricingTable from '@/components/landing/pricing-table'
import CompetePricing from '@/components/landing/compete-pricing'
import { HeroCanvas } from '@/components/landing/hero-canvas'
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

// Revalidate every 5 minutes so Ticker + BlogPreview stay fresh from DB
export const revalidate = 300

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
  {
    number: '1',
    title: 'Add a Monitor',
    description:
      'Enter your URL, choose a monitor type, and set a check interval as low as 30 seconds. No config files, no agents, no setup scripts.',
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

export default function LandingPage(): React.ReactElement {
  return (
    <>
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <WebSiteJsonLd />
      <FaqPageJsonLd items={FAQ_ITEMS} />

      {/* NAV */}
      <PublicNav />

      {/* LIVE TICKER */}
      <Ticker />

      {/* ================================================================
          HERO
          ================================================================ */}
      <section className="hero" id="heroSection">
        <HeroCanvas />
        <div className="hero-grid" />
        <div className="container">
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
              <div className="trust-item"><strong>30-second</strong> check intervals</div>
              <div className="trust-item">·</div>
              <div className="trust-item"><strong>GDPR</strong> compliant · EU data</div>
            </div>

            {/* Dashboard Mockup */}
            <div className="hero-mockup fade-up delay-3">
              <div className="hero-mockup-shadow" />
              <div className="mockup-window">
                <div className="mockup-titlebar">
                  <div className="titlebar-dot td-red" />
                  <div className="titlebar-dot td-yellow" />
                  <div className="titlebar-dot td-green" />
                  <div className="mockup-url">app.uptrue.io/dashboard</div>
                </div>
                <div className="mockup-body">

                  {/* SIDEBAR */}
                  <div className="mockup-sidebar">
                    <div className="ms-top">
                      <div className="ms-logo">
                        <div className="ms-logo-icon">
                          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        Uptrue
                      </div>
                      <div className="ms-org-btn">
                        <div>
                          <div className="ms-org-name">Acme Agency</div>
                          <div className="ms-org-sub">Main workspace · Builder</div>
                        </div>
                        <svg width="10" height="10" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                    <div className="ms-nav">
                      <div className="ms-section">Monitoring</div>
                      <div className="ms-item active">
                        <div className="ms-item-left">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                          </svg>
                          Dashboard
                        </div>
                      </div>
                      <div className="ms-item">
                        <div className="ms-item-left">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                          </svg>
                          Monitors
                        </div>
                        <span className="ms-badge-blue">24</span>
                      </div>
                      <div className="ms-item">
                        <div className="ms-item-left">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          Alerts
                        </div>
                      </div>
                      <div className="ms-item">
                        <div className="ms-item-left">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Incidents
                        </div>
                        <span className="ms-badge">2</span>
                      </div>
                      <div className="ms-section">Reporting</div>
                      <div className="ms-item">
                        <div className="ms-item-left">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Reports
                        </div>
                      </div>
                      <div className="ms-item">
                        <div className="ms-item-left">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                          </svg>
                          Status Pages
                        </div>
                      </div>
                      <div className="ms-section">Intelligence</div>
                      <div className="ms-item">
                        <div className="ms-item-left">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                          </svg>
                          Competitors
                        </div>
                      </div>
                      <div className="ms-item">
                        <div className="ms-item-left">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Compete
                        </div>
                      </div>
                    </div>
                    <div className="ms-bottom">
                      <div className="ms-credits">
                        <div className="ms-credits-title">✨ Earn Credits</div>
                        <div className="ms-credits-sub">Get up to £10/mo off your plan</div>
                      </div>
                    </div>
                  </div>

                  {/* MAIN */}
                  <div className="mockup-main">
                    {/* Header */}
                    <div className="mm-header">
                      <div className="mm-header-left">
                        <span className="mm-org-label">Acme Agency</span>
                        <div className="mm-ws-chip">
                          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                          </svg>
                          Main workspace
                          <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>
                      <div className="mm-header-right">
                        <div className="mm-icon-btn">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        </div>
                        <div className="mm-icon-btn">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                          </svg>
                        </div>
                        <div className="mm-icon-btn" style={{ position: 'relative' }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <div className="mm-notif-dot" />
                        </div>
                        <div className="mm-avatar">A</div>
                      </div>
                    </div>

                    {/* Breadcrumbs */}
                    <div className="mm-breadcrumbs">
                      <span>Acme Agency</span>
                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                      <span>Main workspace</span>
                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                      <span className="crumb-current">Dashboard</span>
                    </div>

                    {/* Content */}
                    <div className="mm-content">
                      {/* Page header */}
                      <div className="mm-page-hdr">
                        <div className="mm-page-title">Dashboard</div>
                        <div className="mm-page-actions">
                          <div className="mm-btn-ghost">
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generate Report
                          </div>
                          <div className="mm-btn-primary">
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Monitor
                          </div>
                        </div>
                      </div>

                      {/* Stat cards */}
                      <div className="mm-stats">
                        <div className="mm-stat all">
                          <div className="mm-stat-icon all">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                          </div>
                          <div className="mm-stat-label">Total Monitors</div>
                          <div className="mm-stat-value">24</div>
                        </div>
                        <div className="mm-stat up">
                          <div className="mm-stat-icon up">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                          <div className="mm-stat-label">Healthy</div>
                          <div className="mm-stat-value" style={{ color: 'var(--color-up)' }}>22</div>
                        </div>
                        <div className="mm-stat down">
                          <div className="mm-stat-icon down">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                          </div>
                          <div className="mm-stat-label">Down</div>
                          <div className="mm-stat-value" style={{ color: 'var(--color-down)' }}>1</div>
                        </div>
                        <div className="mm-stat warn">
                          <div className="mm-stat-icon warn">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          </div>
                          <div className="mm-stat-label">Degraded</div>
                          <div className="mm-stat-value" style={{ color: 'var(--color-warn)' }}>1</div>
                        </div>
                      </div>

                      {/* Monitor table */}
                      <div className="mm-card">
                        <div className="mm-card-hdr">
                          <div className="mm-card-title">Monitors</div>
                          <div className="mm-card-search">
                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            Search monitors…
                          </div>
                        </div>
                        <table className="mm-table">
                          <thead>
                            <tr>
                              <th style={{ width: '18px' }}><input type="checkbox" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} /></th>
                              <th>Monitor</th>
                              <th>Type</th>
                              <th>Status</th>
                              <th>Uptime (90d)</th>
                              <th>Response</th>
                              <th>Last check</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><input type="checkbox" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} /></td>
                              <td>
                                <div className="mm-monitor-name">api.acmecorp.com</div>
                                <div className="mm-monitor-url">https://api.acmecorp.com/health</div>
                              </td>
                              <td><span className="mm-type-tag">HTTP</span></td>
                              <td>
                                <span className="badge badge-up" style={{ fontSize: '9px', padding: '2px 7px' }}>
                                  <span style={{ width: '5px', height: '5px', background: 'var(--color-up)', borderRadius: '50%', display: 'inline-block' }} />
                                  {' '}Up
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <div className="mm-uptime-bars">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                      <div key={i} className="mm-uptick" style={{ height: `${8 + Math.random() * 12}px`, background: 'var(--color-up)' }} />
                                    ))}
                                  </div>
                                  <span className="mm-uptime-pct">99.98%</span>
                                </div>
                              </td>
                              <td><span className="mm-response fast">142ms</span></td>
                              <td style={{ fontSize: '9px', color: 'var(--text-muted)' }}>8s ago</td>
                            </tr>
                            <tr style={{ background: 'rgba(239,68,68,0.025)' }}>
                              <td><input type="checkbox" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} /></td>
                              <td>
                                <div className="mm-monitor-name">checkout.shop.io</div>
                                <div className="mm-monitor-url">https://checkout.shop.io</div>
                              </td>
                              <td><span className="mm-type-tag">HTTP</span></td>
                              <td>
                                <span className="badge badge-down" style={{ fontSize: '9px', padding: '2px 7px' }}>
                                  <span style={{ width: '5px', height: '5px', background: 'var(--color-down)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                                  {' '}Down
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <div className="mm-uptime-bars">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                      <div key={i} className="mm-uptick" style={{ height: `${8 + Math.random() * 12}px`, background: i >= 18 ? 'var(--color-down)' : 'var(--color-up)' }} />
                                    ))}
                                  </div>
                                  <span className="mm-uptime-pct bad">98.2%</span>
                                </div>
                              </td>
                              <td><span className="mm-response slow">timeout</span></td>
                              <td style={{ fontSize: '9px', color: 'var(--color-down)' }}>Down · 8m</td>
                            </tr>
                            <tr>
                              <td><input type="checkbox" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} /></td>
                              <td>
                                <div className="mm-monitor-name">cdn.assets.io</div>
                                <div className="mm-monitor-url">https://cdn.assets.io</div>
                              </td>
                              <td><span className="mm-type-tag">HTTP</span></td>
                              <td>
                                <span className="badge badge-warn" style={{ fontSize: '9px', padding: '2px 7px' }}>
                                  <span style={{ width: '5px', height: '5px', background: 'var(--color-warn)', borderRadius: '50%', display: 'inline-block' }} />
                                  {' '}Slow
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <div className="mm-uptime-bars">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                      <div key={i} className="mm-uptick" style={{ height: `${8 + Math.random() * 12}px`, background: 'var(--color-up)' }} />
                                    ))}
                                  </div>
                                  <span className="mm-uptime-pct">99.9%</span>
                                </div>
                              </td>
                              <td><span className="mm-response med">1,842ms</span></td>
                              <td style={{ fontSize: '9px', color: 'var(--text-muted)' }}>1m ago</td>
                            </tr>
                            <tr>
                              <td><input type="checkbox" style={{ accentColor: 'var(--brand-blue)', width: '10px', height: '10px' }} /></td>
                              <td>
                                <div className="mm-monitor-name">blog.example.com</div>
                                <div className="mm-monitor-url">https://blog.example.com</div>
                              </td>
                              <td><span className="mm-type-tag">SSL</span></td>
                              <td>
                                <span className="badge badge-up" style={{ fontSize: '9px', padding: '2px 7px' }}>
                                  <span style={{ width: '5px', height: '5px', background: 'var(--color-up)', borderRadius: '50%', display: 'inline-block' }} />
                                  {' '}Up
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <div className="mm-uptime-bars">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                      <div key={i} className="mm-uptick" style={{ height: `${8 + Math.random() * 12}px`, background: 'var(--color-up)' }} />
                                    ))}
                                  </div>
                                  <span className="mm-uptime-pct">100%</span>
                                </div>
                              </td>
                              <td><span className="mm-response fast">89ms</span></td>
                              <td style={{ fontSize: '9px', color: 'var(--text-muted)' }}>3m ago</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>{/* /mm-content */}
                  </div>{/* /mockup-main */}
                </div>{/* /mockup-body */}
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
          <div className="stat-item">
            <div className="stat-value gradient-text">10</div>
            <div className="stat-label">Monitor types</div>
          </div>
          <div className="stat-item">
            <div className="stat-value gradient-text">30s</div>
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
              <div className="section-eyebrow">Powered by Claude AI</div>
              <h2 className="section-title">Your monitoring gets smarter over time</h2>
              <p className="section-sub">
                Uptrue doesn&apos;t just tell you something went down — it tells you why, what it means for your business, and what to do next. Powered by Claude, Anthropic&apos;s AI.
              </p>
              <div className="ai-features-list">
                <div className="ai-feature-item">
                  <div className="ai-feature-icon purple">🤖</div>
                  <div className="ai-feature-body">
                    <h4>Executive AI Reports</h4>
                    <p>One click and Claude analyses 90 days of uptime data, incident patterns, and performance trends — generating a polished summary you can send to clients or stakeholders.</p>
                  </div>
                </div>
                <div className="ai-feature-item">
                  <div className="ai-feature-icon cyan">🔍</div>
                  <div className="ai-feature-body">
                    <h4>Outage Pattern Detection</h4>
                    <p>Uptrue learns your monitor&apos;s normal behaviour and flags anomalies before they become incidents. Recurring issues are spotted and surfaced automatically.</p>
                  </div>
                </div>
                <div className="ai-feature-item">
                  <div className="ai-feature-icon pink">📰</div>
                  <div className="ai-feature-body">
                    <h4>AI Outage News &amp; Blog</h4>
                    <p>When a public service goes down, Uptrue researches and publishes an outage report automatically — with your logo and brand. Real-time SEO content on autopilot.</p>
                  </div>
                </div>
                <div className="ai-feature-item">
                  <div className="ai-feature-icon blue">💡</div>
                  <div className="ai-feature-body">
                    <h4>Plain Language Incident Summaries</h4>
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
                  <span>Generated by Claude</span>
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
                  Powered by Claude (Anthropic) · Uptrue AI Reports
                </div>
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
                  <td className="col-uptrue"><span className="comp-val highlight">30 seconds</span></td>
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
                  <td>AI-powered reports (Claude)</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-no">—</span></td>
                  <td><span className="comp-no">—</span></td>
                </tr>
                <tr>
                  <td>Competitor intelligence</td>
                  <td className="col-uptrue"><span className="comp-yes">✓</span></td>
                  <td><span className="comp-no">—</span></td>
                  <td><span className="comp-no">—</span></td>
                </tr>
                <tr>
                  <td>Price &amp; stock tracking (Compete)</td>
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
                  <td>Monitor types (HTTP, SSL, DNS, Keyword…)</td>
                  <td className="col-uptrue"><span className="comp-val highlight">10 types</span></td>
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
              </tbody>
            </table>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: 'var(--space-5)' }}>
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
                30-second check intervals
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <PublicFooter />
    </>
  )
}

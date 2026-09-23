import './landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, Info, Check, FileBarChart, Search, Lightbulb, AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BlogPreview } from '@/components/landing/blog-preview'
import ProPlanPricing from '@/components/landing/pro-plan-pricing'
import { getDefaultCurrency } from '@/lib/utils/geo.server'
import { HeroDashboardMockup } from '@/components/landing/hero-dashboard-mockup'
import { FeatureCarousel } from '@/components/landing/feature-carousel'
import { DowntimeCalculator } from '@/components/landing/downtime-calculator'
import Faq from '@/components/landing/faq'
import { AgencyCommandCenter } from '@/components/landing/agency-command-center'
import { ComparisonMatrix } from '@/components/landing/comparison-matrix'
import { TrustedLogos } from '@/components/landing/trusted-logos'
import { TestimonialsShowcase } from './testimonials-showcase'
import { ScrollReveal } from '@/components/landing/scroll-reveal'
import { CtaCanvas } from '@/components/landing/cta-canvas'
import { CustomSection } from '@/components/landing/custom-section'
import type { CustomContent } from '@/components/landing/custom-section'
import {
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  WebSiteJsonLd,
  FaqPageJsonLd,
} from '@/components/seo/json-ld'
import { FAQ_ITEMS } from '@/lib/constants/faq'
import { getAllLandingSections } from '@/lib/db/page-sections'
import type {
  HeroContent,
  StatsBarContent,
  FeaturesContent,
  HowItWorksContent,
  AiFeaturesContent,
  AgencyContent,
  FaqContent,
  TestimonialsContent,
  ComparisonTableContent,
  CtaBandContent,
  TrustedLogosContent,
  PageSection,
} from '@/lib/types/cms'

// engineering-app#69 — homepage was force-dynamic, which caused every visitor
// to trigger a fresh SSR + multiple Supabase queries (Ticker, BlogPreview,
// TrustedLogos, CMS sections). At Product Hunt launch traffic (500-2,000
// concurrent users) the page failed to serve. Switched to ISR with a 600s
// (10-minute) revalidate — Vercel serves the cached page from the edge,
// queries only run once per 10 minutes, ticker/blog updates land within
// 10 min without a deploy.
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Monitoring Suite for Agencies & Teams — Upnotify',
  description:
    'Monitor uptime, SSL, DNS, APIs & more across all your sites. 1-min checks, 2-region confirm, zero false alarms. Plans from ₹999/website/year.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app' },
  openGraph: {
    title: 'Monitoring Suite for Agencies & Teams — Upnotify',
    description:
      'Monitor uptime, SSL, DNS, APIs & more across all your sites. 1-min checks, 2-region confirm, zero false alarms. Plans from ₹999/website/year.',
    url: 'https://upnotify-monitoring.vercel.app',
  },
}

// ── Fallback content (mirrors what's in the DB seed) ─────────────────────────

// AI features icons are always rendered from this fixed list, by position —
// the CMS `icon` field still stores legacy emoji strings (DB row seeded before
// icons existed) but React components can't be stored in JSON, so we ignore
// that field entirely rather than trying to keep it in sync.
const AI_FEATURE_ICONS: LucideIcon[] = [FileBarChart, Search, Lightbulb]

const DEFAULT_STEPS = [
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
      'When something goes wrong, Upnotify confirms from a second region and fires an alert to your preferred channel — Slack, email, Teams, or webhook.',
  },
  {
    number: '3',
    title: 'Share Status & Reports',
    description:
      'Publish branded status pages your customers can check themselves. Generate AI-powered reports to share uptime SLAs with stakeholders.',
  },
]

const DEFAULT_TESTIMONIALS = [
  {
    quote:
      "We caught three client outages before their users noticed. Our clients still don't know how close it was. Upnotify paid for itself in the first week.",
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
  {
    quote:
      'We manage uptime for 40+ client sites. Upnotify is the only tool that made that manageable from a single dashboard — the alert grouping alone saved us hours every week.',
    name: 'Priya Nair',
    role: 'Ops Manager · Northline Agency',
    initials: 'PN',
    cardClass: 't1',
    avatarClass: 'a4',
  },
  {
    quote:
      "Simple pricing, no surprise overages, and support that actually responds. We evaluated five tools before this one — it's the only one we didn't have to fight with.",
    name: 'Marcus Webb',
    role: 'Founder · Webb & Co',
    initials: 'MW',
    cardClass: 't2',
    avatarClass: 'a5',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSection<T>(sectionMap: Map<string, PageSection>, key: string): T | null {
  const s = sectionMap.get(key)
  return s ? (s.content as T) : null
}

function isVisible(sectionMap: Map<string, PageSection>, key: string): boolean {
  // If not in DB yet → show by default. If in DB → respect is_visible.
  const s = sectionMap.get(key)
  return s ? s.is_visible : true
}

export default async function LandingPage(): Promise<React.ReactElement> {
  const [defaultCurrency, rawSections] = await Promise.all([
    getDefaultCurrency(),
    getAllLandingSections(),  // fetch ALL sections so we know which are explicitly hidden
  ])

  // Build a map of ALL sections (visible + hidden) for O(1) lookup.
  // - Section in map + is_visible=true  → render with CMS content
  // - Section in map + is_visible=false → hide entirely (don't fall back to hardcoded)
  // - Section not in map (not seeded)   → render with hardcoded defaults
  const sectionMap = new Map<string, PageSection>()
  for (const s of rawSections) {
    sectionMap.set(s.section_key, s)
  }

  // Pull typed content — null means either hidden or not seeded
  const hero = getSection<HeroContent>(sectionMap, 'hero')
  const statsBar = getSection<StatsBarContent>(sectionMap, 'stats_bar')
  const features = getSection<FeaturesContent>(sectionMap, 'features')
  const howItWorks = getSection<HowItWorksContent>(sectionMap, 'how_it_works')
  const aiFeatures = getSection<AiFeaturesContent>(sectionMap, 'ai_features')
  const agency = getSection<AgencyContent>(sectionMap, 'agency')
  const faq = getSection<FaqContent>(sectionMap, 'faq')
  const testimonials = getSection<TestimonialsContent>(sectionMap, 'testimonials')
  const comparison = getSection<ComparisonTableContent>(sectionMap, 'comparison_table')
  const ctaBand = getSection<CtaBandContent>(sectionMap, 'cta_band')
  const trustedLogos = getSection<TrustedLogosContent>(sectionMap, 'trusted_logos')

  // Steps & testimonials with CSS class fallbacks
  const steps = howItWorks?.steps ?? DEFAULT_STEPS
  const testimonialItems = (testimonials?.items ?? DEFAULT_TESTIMONIALS).map((t, i) => ({
    ...t,
    cardClass: `t${(i % 3) + 1}`,
    avatarClass: `a${(i % 5) + 1}`,
  }))

  // FAQ items: use CMS if present, else fall back to local constants
  const faqItems = faq?.items ?? FAQ_ITEMS

  // Comparison table columns
  const compCols = comparison?.competitors ?? ['Upnotify', 'BetterUptime', 'UptimeRobot']

  // ── Dynamic section render order ──────────────────────────────────────────
  // Nav/footer (page='global') are always pinned top/bottom — only landing sections are reorderable.
  const DEFAULT_SECTION_ORDER = [
    'ticker', 'hero', 'trusted_logos', 'stats_bar', 'features',
    'how_it_works', 'ai_features', 'pricing', 'agency', 'faq',
    'downtime_calculator', 'testimonials', 'comparison_table', 'blog_preview', 'cta_band',
    // 'ai_visibility_teaser' deliberately NOT in fallback list — only renders
    // when explicitly seeded in page_sections with is_visible=true. Prevents the
    // teaser CTA pointing at https://aivisibility.uptrue.io while that subdomain
    // is not yet live (Boss flips visibility once AIV-2 infra is up).
  ]

  const landingSections = rawSections
    .filter(s => s.page === 'landing')
    .sort((a, b) => a.sort_order - b.sort_order)

  const dbKeys = new Set(landingSections.map(s => s.section_key))

  // Sections in DB come first (sorted by sort_order); unseeded sections appended at end in default order
  const renderOrder = [
    ...landingSections.map(s => s.section_key),
    ...DEFAULT_SECTION_ORDER.filter(k => !dbKeys.has(k)),
  ]

  // ── Per-section JSX renderer ──────────────────────────────────────────────
  function renderSection(key: string): React.ReactElement | null {
    if (!isVisible(sectionMap, key)) return null

    switch (key) {

      case 'ticker':
        return null

      case 'hero':
        return (
          <section key="hero" className="hero" id="heroSection">
            <div className="hero-grid" />
            <svg className="hero-chart-graphic" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs>
                <linearGradient id="heroChartLine" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1392FB" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0068DB" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="heroChartFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1392FB" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#1392FB" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 420 L120 400 L220 430 L340 360 L440 380 L560 300 L680 320 L800 220 L920 250 L1040 140 L1160 60 L1200 40 L1200 500 L0 500 Z"
                fill="url(#heroChartFill)"
              />
              <path
                d="M0 420 L120 400 L220 430 L340 360 L440 380 L560 300 L680 320 L800 220 L920 250 L1040 140 L1160 60 L1200 40"
                fill="none"
                stroke="url(#heroChartLine)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1120 40 L1200 40 L1200 120"
                fill="none"
                stroke="#0068DB"
                strokeOpacity="0.7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="container">
              <div className="hero-content">
                <div className="hero-split">
                  <div className="hero-text-col">
                    <div className="hero-eyebrow fade-up">
                      <div className="hero-eyebrow-text">
                        <span className="hero-eyebrow-dot" />
                        24 monitor types · 1-minute checks · AI-powered reports
                      </div>
                    </div>
                    <h1 className="hero-headline fade-up delay-1">
                      Catch downtime before<br />
                      <span className="gradient-text hero-tweets-gradient">your customers notice.</span>
                    </h1>
                    <p className="hero-sub fade-up delay-2">
                      24 monitor types, 60-second checks, and instant Slack and email alerts — built for agencies and dev teams.
                    </p>
                    <div className="hero-ctas hero-ctas-desktop fade-up delay-3">
                      <Link href={hero?.cta_primary?.href ?? '/signup'} className="btn btn-primary btn-lg">
                        <Zap size={16} strokeWidth={2} />
                        {hero?.cta_primary?.text ?? 'Start Monitoring'}
                      </Link>
                      <Link href={hero?.cta_secondary?.href ?? '/#how-it-works'} className="btn btn-ghost btn-lg">
                        {hero?.cta_secondary?.text ?? 'See How It Works'}
                      </Link>
                      <Link href={hero?.cta_tertiary?.href ?? '/score'} className="btn btn-outline-brand btn-lg hero-score-cta">
                        <Info size={14} strokeWidth={2} />
                        {hero?.cta_tertiary?.text ?? 'Score Your Site Free'}
                      </Link>
                    </div>
                    <div className="hero-trust hero-trust-desktop fade-up delay-3">
                      {(hero?.trust_items ?? ['Plans from ₹999/year', '1-minute check intervals', 'GDPR compliant · EU data']).map((item, i, arr) => (
                        <span key={item} style={{ display: 'contents' }}>
                          <div className="trust-item">{item}</div>
                          {i < arr.length - 1 && <div className="trust-item trust-item-sep">·</div>}
                        </span>
                      ))}
                    </div>

                    {/* Mobile-only: dark checklist card + neon CTA pill */}
                    <div className="hero-mobile-card fade-up delay-3">
                      <ul className="hero-mobile-checklist">
                        {(hero?.trust_items ?? ['24 monitor types', 'Real-time alerts, email & Slack', 'Public status pages']).map((item) => (
                          <li key={item}>
                            <Check size={13} strokeWidth={3} />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <Link href={hero?.cta_primary?.href ?? '/signup'} className="hero-mobile-cta">
                        {hero?.cta_primary?.text ?? 'Start monitoring in 30 seconds'}
                      </Link>
                      <div className="hero-mobile-links">
                        <Link href={hero?.cta_secondary?.href ?? '/#how-it-works'}>
                          {hero?.cta_secondary?.text ?? 'See How It Works'}
                        </Link>
                        <Link href={hero?.cta_tertiary?.href ?? '/score'}>
                          {hero?.cta_tertiary?.text ?? 'Score Your Site Free'}
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="hero-image-col fade-up delay-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/homepage.png" alt="Upnotify" className="hero-image" />
                  </div>
                </div>

                <HeroDashboardMockup />
              </div>
            </div>
          </section>
        )

      case 'trusted_logos':
        return (
          <div key="trusted_logos" className="social-proof-strip">
            <div className="container">
              <div className="sp-label">{trustedLogos?.label ?? "Trusted by teams monitoring the web's most-used platforms"}</div>
              <TrustedLogos />
            </div>
          </div>
        )

      case 'stats_bar':
        return (
          <div key="stats_bar" className="stats-bar">
            <div className="stats-bar-inner">
              {(statsBar?.stats ?? [
                { value: '24', label: 'Monitor types' },
                { value: '1 min', label: 'Fastest check interval' },
                { value: '99.9%', label: 'Uptime SLA' },
                { value: '0', label: 'False alarms (2-region confirm)' },
              ]).map((stat) => (
                <div key={stat.label} className="stat-item">
                  <div className="stat-value gradient-text hero-tweets-gradient">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'features':
        return (
          <section key="features" className="section" id="features">
            <div className="container">
              <div className="section-header reveal-title">
                <div className="section-eyebrow">{features?.eyebrow ?? '24 monitor types'}</div>
                <h2 className="section-title">{features?.headline ?? (<>One dashboard.<br /><em>Every</em> signal that matters.</>)}</h2>
                <p className="section-sub">
                  {features?.subheadline ?? (
                    <>
                      <Link href="/monitoring/http-uptime-monitoring">HTTP uptime</Link>,{' '}
                      <Link href="/monitoring/ssl-certificate-monitoring">SSL certificates</Link>,{' '}
                      <Link href="/monitoring/dns-monitoring">DNS records</Link>, keyword detection, APIs, blacklists, sitemaps, and more. Most tools give you one or two. Upnotify gives you all of them.
                    </>
                  )}
                </p>
              </div>
              <FeatureCarousel />
            </div>
          </section>
        )

      case 'how_it_works':
        return (
          <section key="how_it_works" className="section hiw-section" id="how-it-works">
            <div className="container">
              <div className="section-header reveal-title">
                <div className="section-eyebrow">{howItWorks?.eyebrow ?? 'No setup scripts. No agents.'}</div>
                <h2 className="section-title hiw-title-gradient">{howItWorks?.headline ?? (<>From signup to alert<br />in <em>2 minutes</em>.</>)}</h2>
              </div>
              <div className="hiw-steps reveal-stagger">
                {steps.map((step) => (
                  <div key={step.number} className="hiw-step">
                    <div className="hiw-number">{step.number}</div>
                    <div className="hiw-title">{step.title}</div>
                    <div className="hiw-desc">{step.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )

      case 'ai_features':
        return (
          <section key="ai_features" className="ai-section">
            <div className="container">
              <div className="ai-inner">
                <div className="ai-text reveal-title">
                  <div className="section-eyebrow">{aiFeatures?.eyebrow ?? 'Powered by Claude AI'}</div>
                  <h2 className="section-title ai-title-gradient">{aiFeatures?.headline ?? (<>Alerts that <em>explain</em><br />themselves.</>)}</h2>
                  <p className="section-sub">
                    {aiFeatures?.subheadline ?? "Most tools just tell you something broke. Upnotify tells you why, what it means for your business, and what to fix — in plain English."}
                  </p>
                  <div className="ai-features-list reveal-stagger">
                    {(aiFeatures?.features ?? [
                      { icon: '📊', color: 'purple', title: 'Instant Health Reports', description: 'Pick a website and a period — daily, weekly, monthly, or yearly — and get a clean report built straight from your real uptime, response time, and incident data. No waiting, no AI black box.' },
                      { icon: '🔍', color: 'cyan', title: 'Outage Pattern Detection', description: "Upnotify learns your monitor's normal behaviour and flags anomalies before they become incidents. Recurring issues are spotted and surfaced automatically." },
                      { icon: '💡', color: 'blue', title: 'Plain Language Incident Summaries', description: 'Every incident automatically gets a human-readable summary. No log-diving, no decoding stack traces. Just "your checkout was down for 8 minutes on Tuesday."' },
                    ]).map((f, i) => {
                      const AiFeatureIcon = AI_FEATURE_ICONS[i % AI_FEATURE_ICONS.length]
                      return (
                        <div key={f.title} className="ai-feature-item">
                          <div className={`ai-feature-icon ${f.color}`}>
                            <AiFeatureIcon size={20} strokeWidth={2} />
                          </div>
                          <div className="ai-feature-body">
                            {/* engineering-app#75 — was an h4 directly after an
                                h2, skipping h3. Demoted to h3 so screen-reader
                                users get a sequential heading hierarchy. */}
                            <h3>{f.title}</h3>
                            <p>{f.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <div className="ai-report-card">
                    <div className="ai-report-chrome">
                      <div className="ai-report-chrome-dots">
                        <span /><span /><span />
                      </div>
                      <div className="ai-report-badge">
                        <Check size={11} strokeWidth={2.5} />
                        Live Report
                      </div>
                    </div>

                    <div className="ai-report-body rpt-page" style={{ padding: '20px 22px', gap: 16 }}>
                      <div className="rpt-header" style={{ paddingBottom: 12 }}>
                        <div className="rpt-header-left">
                          <span className="favicon-fallback" style={{ width: 24, height: 24, fontSize: 13, lineHeight: '24px' }}>A</span>
                          <div>
                            <div className="rpt-header-domain" style={{ fontSize: 14 }}>acmecorp.com</div>
                            <div className="rpt-header-monitor">24 monitors</div>
                          </div>
                        </div>
                        <div className="rpt-header-right">
                          <div className="rpt-header-period-label">Monthly Report</div>
                          <div className="rpt-header-period-range">March 2026</div>
                          <span className="rpt-health-badge rpt-health-badge--operational">
                            <span className="status-dot" style={{ background: 'var(--color-up)' }} />
                            Operational
                          </span>
                        </div>
                      </div>

                      <div className="rpt-hero">
                        <div className="rpt-health-ring" style={{ width: 108 }}>
                          <svg width="88" height="88" viewBox="0 0 88 88">
                            <circle cx="44" cy="44" r="36" fill="none" stroke="var(--border-primary)" strokeWidth={8} />
                            <circle cx="44" cy="44" r="36" fill="none" stroke="var(--color-up)" strokeWidth={8}
                              strokeDasharray="221 226" strokeLinecap="round" transform="rotate(-90 44 44)" />
                            <text x="44" y="40" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--text-primary)">99.94%</text>
                            <text x="44" y="53" textAnchor="middle" fontSize="9" fill="var(--text-muted)">Health</text>
                          </svg>
                          <div className="rpt-health-ring-text">
                            <div className="rpt-health-ring-label" style={{ color: 'var(--color-up)' }}>Excellent</div>
                          </div>
                        </div>
                        <div className="rpt-hero-stats">
                          <div className="rpt-hero-stat"><span className="rpt-hero-stat-value">99.94%</span><span className="rpt-hero-stat-label">Uptime</span></div>
                          <div className="rpt-hero-stat"><span className="rpt-hero-stat-value">12m</span><span className="rpt-hero-stat-label">Total Downtime</span></div>
                          <div className="rpt-hero-stat"><span className="rpt-hero-stat-value">142ms</span><span className="rpt-hero-stat-label">Avg Response Time</span></div>
                          <div className="rpt-hero-stat"><span className="rpt-hero-stat-value">3</span><span className="rpt-hero-stat-label">Incidents</span></div>
                        </div>
                      </div>

                      <div className="rpt-panel">
                        <div className="rpt-panel-title">Key Insights</div>
                        <ul className="rpt-insights-list">
                          <li className="rpt-insight-row rpt-insight-row--warning">
                            <AlertTriangle size={14} strokeWidth={2.25} />
                            <span>3 downtime incidents recorded, totalling 12m of downtime.</span>
                          </li>
                          <li className="rpt-insight-row rpt-insight-row--positive">
                            <Lightbulb size={14} strokeWidth={2.25} />
                            <span>Average response time was 142ms — fast and consistent.</span>
                          </li>
                        </ul>
                      </div>

                      <div className="rpt-panel rpt-panel--breakdown">
                        <div className="rpt-panel-title">Monitor Breakdown</div>
                        <table className="rpt-breakdown-table">
                          <thead>
                            <tr><th>Monitor</th><th>Status</th><th>Uptime</th><th>Incidents</th></tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="rpt-breakdown-name-cell"><span className="rpt-breakdown-name">checkout.shop.io — HTTP Uptime</span></td>
                              <td><span className="status-dot rpt-breakdown-dot" style={{ background: 'var(--color-up)' }} /></td>
                              <td className="rpt-breakdown-uptime">99.9%</td>
                              <td className="rpt-breakdown-incidents">—</td>
                            </tr>
                            <tr>
                              <td className="rpt-breakdown-name-cell"><span className="rpt-breakdown-name">api.acmecorp.com — SSL Certificate</span></td>
                              <td><span className="status-dot rpt-breakdown-dot" style={{ background: 'var(--color-up)' }} /></td>
                              <td className="rpt-breakdown-uptime">100.0%</td>
                              <td className="rpt-breakdown-incidents">—</td>
                            </tr>
                            <tr>
                              <td className="rpt-breakdown-name-cell"><span className="rpt-breakdown-name">cdn.assets.io — Response Time</span></td>
                              <td><span className="status-dot rpt-breakdown-dot" style={{ background: 'var(--color-warn)' }} /></td>
                              <td className="rpt-breakdown-uptime">97.4%</td>
                              <td className="rpt-breakdown-incidents">2</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="ai-report-cta">
                        <button className="btn-ai-primary">Download PDF Report</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )

      case 'ai_visibility_teaser':
        return (
          <section key="ai_visibility_teaser" className="section" style={{ paddingTop: 0, paddingBottom: 'var(--space-10)' }}>
            <div className="container">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-6) var(--space-8)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #0068DB 0%, #1392FB 60%, #FBA830 100%)',
                  color: '#fff',
                }}
              >
                <div style={{ flex: '1 1 480px', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#fff',
                      marginBottom: 6,
                    }}
                  >
                    🆕 New product
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                    Upnotify AI Visibility&trade;
                  </div>
                  <p style={{ fontSize: 15, color: '#cbd5e1', margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
                    See how ChatGPT, Claude, Perplexity, Gemini, Grok and Copilot cite your brand.
                    Track AI search citations the way you track Google rankings — with weekly reports, competitor benchmarks, and citation alerts.
                  </p>
                </div>
                {/* <a
                  href="https://aivisibility.uptrue.io"
                  className="btn btn-lg"
                  style={{ flex: '0 0 auto', background: '#fff', color: '#0068DB', fontWeight: 700 }}
                >
                  Explore AI Visibility&trade; →
                </a> */}
              </div>
            </div>
          </section>
        )

      case 'pricing':
        return <ProPlanPricing key="pricing" />

      case 'agency':
        return (
          <AgencyCommandCenter
            key="agency"
            badge={agency?.badge}
            headline={agency?.headline ?? 'Monitor hundreds of client sites under your brand'}
            description={agency?.description ?? 'The Agency tier gives you full white-label, multi-tenant workspaces, revenue sharing, custom analytics, and AI reports branded with your agency name. Built for agencies managing dozens of clients.'}
            badges={agency?.badges}
            ctaNote={agency?.cta_note}
          />
        )

      case 'faq':
        return <Faq key="faq" items={faqItems} eyebrow={faq?.eyebrow} headline={faq?.headline} />

      case 'downtime_calculator':
        return <DowntimeCalculator key="downtime_calculator" />

      case 'testimonials':
        return (
          <section key="testimonials" className="testimonials-section">
            <div className="container">
              {/* Social proof header */}
              <div className="testimonials-hero reveal-title">
                <div className="testimonials-hero-left">
                  <div className="section-eyebrow">{testimonials?.eyebrow ?? 'What our users say'}</div>
                  <h2 className="testimonials-big-claim">
                    Trusted by agencies,<br />
                    <span className="gradient-text testimonials-title-gradient">SaaS teams & developers.</span>
                  </h2>
                </div>
              </div>

              <div className="reveal">
                <TestimonialsShowcase items={testimonialItems} />
              </div>
            </div>
          </section>
        )

      case 'comparison_table':
        return (
          <ComparisonMatrix
            key="comparison_table"
            eyebrow={comparison?.eyebrow ?? 'Side by side'}
            headline={(() => {
              const headline = comparison?.headline
              if (typeof headline === 'string' && headline.startsWith('Upnotify ')) {
                return (
                  <>
                    <span className="cmx-headline-brand">Upnotify</span>{headline.slice('Upnotify'.length)}
                  </>
                )
              }
              return headline ?? (<>The honest comparison<br />nobody <em>else</em> will show you.</>)
            })()}
            subheadline={comparison?.subheadline ?? "We checked. The others don't offer AI reports, citation monitoring, or 24 monitor types. Upnotify does."}
            competitors={compCols}
            rows={comparison?.rows ?? [
              { feature: 'Fastest check interval', values: ['1 minute', '30 seconds', '5 minutes'], type: 'text', highlight: 0 },
              { feature: 'Two-region false alarm prevention', values: [true, true, false], type: 'boolean' },
              { feature: 'AI-powered reports', values: [true, false, false], type: 'boolean' },
              { feature: 'Watchdog (competitor tracking)', values: [true, false, false], type: 'boolean' },
              { feature: 'Public uptime leaderboard / tracker', values: [true, false, false], type: 'boolean' },
              { feature: 'Public status pages', values: [true, true, true], type: 'boolean' },
              { feature: 'Monitor types (HTTP, SSL, DNS, Keyword…)', values: ['24 types', '7 types', '6 types'], type: 'text', highlight: 0 },
              { feature: 'Alert channels (email, Slack, Teams, Telegram, webhook)', values: ['5 channels', '4 channels', '3 channels'], type: 'text', highlight: 0 },
              { feature: 'Starting price (paid plan)', values: [defaultCurrency === 'inr' ? '₹999/yr Lite' : '£10/yr Lite', '$24/mo', '$7/mo'], type: 'text', highlight: 0 },
              { feature: 'GDPR · EU data storage', values: [true, true, false], type: 'boolean' },
              { feature: 'AI outage blog auto-publish', values: [true, false, false], type: 'boolean' },
              { feature: 'Free AI SEO Checker (4-category audit)', values: [true, false, false], type: 'boolean' },
              { feature: 'llms.txt Generator', values: [true, false, false], type: 'boolean' },
              { feature: 'AI Citation Monitoring (Perplexity, ChatGPT…)', values: [true, false, false], type: 'boolean' },
            ]}
            footnote={comparison?.footnote}
          />
        )

      case 'blog_preview':
        return <BlogPreview key="blog_preview" />

      case 'cta_band':
        return (
          <section key="cta_band" className="cta-band" id="ctaSection">
            <CtaCanvas />
            <div className="container">
              <div className="cta-band-inner">
                <div className="cta-band-eyebrow">
                  <Zap size={12} strokeWidth={2.5} />
                  {ctaBand?.eyebrow ?? 'Start in 2 minutes'}
                </div>
                <h2>{ctaBand?.headline ?? (<>Get the alert first.<br />Fix it before <em>anyone notices.</em></>)}</h2>
                <p>{ctaBand?.subheadline ?? 'Upnotify watches your sites, APIs, and infrastructure 24/7 — and tells you first. Plans from ₹999/year. Up in 2 minutes.'}</p>
                <div className="cta-band-buttons">
                  <Link href={ctaBand?.cta_primary?.href ?? '/signup'} className="btn-cta-white">
                    <Zap size={16} strokeWidth={2.5} />
                    {ctaBand?.cta_primary?.text ?? 'Start Monitoring'}
                  </Link>
                  <Link href={ctaBand?.cta_secondary?.href ?? '/#features'} className="btn-cta-outline">
                    {ctaBand?.cta_secondary?.text ?? 'See All Features →'}
                  </Link>
                </div>
                <div className="cta-band-trust">
                  {(ctaBand?.trust_items ?? ['Plans from ₹999/year', 'GDPR compliant · EU data', '1-minute check intervals']).map((item, i, arr) => (
                    <span key={item} style={{ display: 'contents' }}>
                      <span className="cta-band-trust-item">
                        <Check size={13} strokeWidth={2.5} />
                        {item}
                      </span>
                      {i < arr.length - 1 && <span className="cta-band-trust-dot" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )

      default: {
        // Custom / unknown section keys — render via the generic CustomSection component
        const s = sectionMap.get(key)
        if (!s) return null
        return <CustomSection key={key} sectionKey={key} content={s.content as CustomContent} />
      }
    }
  }

  return (
    <div className="homepage-orange-cta">
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <WebSiteJsonLd />
      <FaqPageJsonLd items={faqItems} />
      <ScrollReveal />

      {/* NAV — always pinned to top (global section, not reorderable) */}


      {/* Landing sections rendered in DB sort_order */}
      {renderOrder.map(key => renderSection(key))}

      {/* FOOTER — always pinned to bottom (global section, not reorderable) */}


    </div>
  )
}

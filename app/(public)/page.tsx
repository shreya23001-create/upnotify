import './landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
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
  title: 'Free Uptime Monitoring for Agencies, SaaS & Dev Teams — Uptrue',
  description:
    'Monitor uptime, SSL, DNS, APIs & more across all your sites. 1-min checks, 2-region confirm, zero false alarms. Free — no card needed.',
  alternates: { canonical: 'https://uptrue.io' },
  openGraph: {
    title: 'Free Uptime Monitoring for Agencies, SaaS & Dev Teams — Uptrue',
    description:
      'Monitor uptime, SSL, DNS, APIs & more across all your sites. 1-min checks, 2-region confirm, zero false alarms. Free — no card needed.',
    url: 'https://uptrue.io',
  },
}

// ── Fallback content (mirrors what's in the DB seed) ─────────────────────────

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
      'When something goes wrong, Uptrue confirms from a second region and fires an alert to your preferred channel — Slack, email, Teams, or webhook.',
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
  const hero       = getSection<HeroContent>(sectionMap, 'hero')
  const statsBar   = getSection<StatsBarContent>(sectionMap, 'stats_bar')
  const features   = getSection<FeaturesContent>(sectionMap, 'features')
  const howItWorks = getSection<HowItWorksContent>(sectionMap, 'how_it_works')
  const aiFeatures = getSection<AiFeaturesContent>(sectionMap, 'ai_features')
  const agency     = getSection<AgencyContent>(sectionMap, 'agency')
  const faq        = getSection<FaqContent>(sectionMap, 'faq')
  const testimonials = getSection<TestimonialsContent>(sectionMap, 'testimonials')
  const comparison = getSection<ComparisonTableContent>(sectionMap, 'comparison_table')
  const ctaBand    = getSection<CtaBandContent>(sectionMap, 'cta_band')
  const trustedLogos = getSection<TrustedLogosContent>(sectionMap, 'trusted_logos')

  // Steps & testimonials with CSS class fallbacks
  const steps = howItWorks?.steps ?? DEFAULT_STEPS
  const testimonialItems = (testimonials?.items ?? DEFAULT_TESTIMONIALS).map((t, i) => ({
    ...t,
    cardClass: `t${(i % 3) + 1}`,
    avatarClass: `a${(i % 3) + 1}`,
  }))

  // FAQ items: use CMS if present, else fall back to local constants
  const faqItems = faq?.items ?? FAQ_ITEMS

  // Comparison table columns
  const compCols   = comparison?.competitors ?? ['Uptrue', 'BetterUptime', 'UptimeRobot']

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
        return <Ticker key="ticker" />

      case 'hero':
        return (
          <section key="hero" className="hero" id="heroSection">
            <div className="hero-grid" />
            <div className="container">
              <div className="hero-content">
                <div className="hero-eyebrow fade-up">
                  <div className="hero-eyebrow-text">
                    <span className="hero-eyebrow-dot" />
                    {hero?.eyebrow ?? '24 monitor types · 1-minute checks · AI-powered reports'}
                  </div>
                </div>
                <h1 className="hero-headline fade-up delay-1">
                  {hero?.headline_line1 ?? 'Free Uptime & Website Monitoring'}<br />
                  <span className="gradient-text">{hero?.headline_line2 ?? 'for Agencies, SaaS & Dev Teams'}</span>
                </h1>
                <p className="hero-sub fade-up delay-2">
                  {hero?.subheadline ?? 'Uptime, performance & infrastructure monitoring for agencies and teams. Multi-channel alerts, public status pages, and AI-powered reports — all in one platform.'}
                </p>
                <div className="hero-ctas fade-up delay-3">
                  <Link href={hero?.cta_primary?.href ?? '/signup'} className="btn btn-primary btn-lg">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {hero?.cta_primary?.text ?? 'Start Monitoring Free'}
                  </Link>
                  <Link href={hero?.cta_secondary?.href ?? '/#how-it-works'} className="btn btn-ghost btn-lg">
                    {hero?.cta_secondary?.text ?? 'See How It Works'}
                  </Link>
                  <Link href={hero?.cta_tertiary?.href ?? '/score'} className="btn btn-outline-brand btn-lg">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {hero?.cta_tertiary?.text ?? 'Score Your Site Free'}
                  </Link>
                </div>
                <div className="hero-trust fade-up delay-3">
                  {(hero?.trust_items ?? ['No credit card required', '3 monitors free forever', '1-minute check intervals', 'GDPR compliant · EU data']).map((item, i, arr) => (
                    <span key={item} style={{ display: 'contents' }}>
                      <div className="trust-item">{item}</div>
                      {i < arr.length - 1 && <div className="trust-item">·</div>}
                    </span>
                  ))}
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
              <div className="sp-label">{trustedLogos?.label ?? "Tracking uptime for the world's most-used platforms"}</div>
              <TrustedLogos />
            </div>
          </div>
        )

      case 'stats_bar':
        return (
          <div key="stats_bar" className="stats-bar">
            <div className="stats-bar-inner">
              {(statsBar?.stats ?? [
                { value: '24',    label: 'Monitor types' },
                { value: '1 min', label: 'Fastest check interval' },
                { value: '99.9%', label: 'Uptime SLA' },
                { value: '0',     label: 'False alarms (2-region confirm)' },
              ]).map((stat) => (
                <div key={stat.label} className="stat-item">
                  <div className="stat-value gradient-text">{stat.value}</div>
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
              <div className="section-header">
                <div className="section-eyebrow">{features?.eyebrow ?? 'Everything you need'}</div>
                <h2 className="section-title">{features?.headline ?? 'Website monitoring that actually works'}</h2>
                <p className="section-sub">
                  {features?.subheadline ?? (
                    <>
                      From <Link href="/monitoring/http-uptime-monitoring">HTTP uptime monitoring</Link>,{' '}
                      <Link href="/monitoring/ssl-certificate-monitoring">SSL certificate monitoring</Link>, and{' '}
                      <Link href="/monitoring/dns-monitoring">DNS monitoring</Link> to AI-powered insights — site monitoring built for agencies managing hundreds of sites and teams who need reliable website uptime monitoring.
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
              <div className="section-header">
                <div className="section-eyebrow">{howItWorks?.eyebrow ?? 'Simple by design'}</div>
                <h2 className="section-title">{howItWorks?.headline ?? 'Up and running in 2 minutes'}</h2>
              </div>
              <div className="hiw-steps">
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
                <div className="ai-text">
                  <div className="section-eyebrow">{aiFeatures?.eyebrow ?? 'AI-Powered Intelligence'}</div>
                  <h2 className="section-title">{aiFeatures?.headline ?? 'Your monitoring gets smarter over time'}</h2>
                  <p className="section-sub">
                    {aiFeatures?.subheadline ?? "Uptrue doesn't just tell you something went down — it tells you why, what it means for your business, and what to do next."}
                  </p>
                  <div className="ai-features-list">
                    {(aiFeatures?.features ?? [
                      { icon: '🤖', color: 'purple', title: 'Executive AI Reports',             description: 'One click and Claude analyses 90 days of uptime data, incident patterns, and performance trends — generating a polished summary you can send to clients or stakeholders.' },
                      { icon: '🔍', color: 'cyan',   title: 'Outage Pattern Detection',          description: "Uptrue learns your monitor's normal behaviour and flags anomalies before they become incidents. Recurring issues are spotted and surfaced automatically." },
                      { icon: '📰', color: 'pink',   title: 'AI Outage News & Blog',             description: 'When a public service goes down, Uptrue researches and publishes an outage report automatically — with your logo and brand. Real-time SEO content on autopilot.' },
                      { icon: '💡', color: 'blue',   title: 'Plain Language Incident Summaries', description: 'Every incident automatically gets a human-readable summary. No log-diving, no decoding stack traces. Just "your checkout was down for 8 minutes on Tuesday."' },
                    ]).map((f) => (
                      <div key={f.title} className="ai-feature-item">
                        <div className={`ai-feature-icon ${f.color}`}>{f.icon}</div>
                        <div className="ai-feature-body">
                          {/* engineering-app#75 — was an h4 directly after an
                              h2, skipping h3. Demoted to h3 so screen-reader
                              users get a sequential heading hierarchy. */}
                          <h3>{f.title}</h3>
                          <p>{f.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                      <span>March 2026</span><span>·</span><span>24 monitors</span><span>·</span><span>AI Generated</span>
                    </div>
                    <div className="ai-report-section">
                      <div className="ai-report-section-label">Executive Summary</div>
                      <div className="ai-report-line long" /><div className="ai-report-line med" />
                      <div className="ai-report-line long" /><div className="ai-report-line short" />
                    </div>
                    <div className="ai-stat-row">
                      <div className="ai-stat-box green"><div className="val">99.94%</div><div className="lbl">Avg Uptime</div></div>
                      <div className="ai-stat-box red"><div className="val">3</div><div className="lbl">Incidents</div></div>
                      <div className="ai-stat-box blue"><div className="val">142ms</div><div className="lbl">Avg Response</div></div>
                    </div>
                    <div className="ai-report-insight">
                      <div className="ai-insight-icon">💡</div>
                      <div className="ai-insight-text">
                        <strong>AI Insight:</strong> checkout.shop.io has experienced 3 slowdowns on Tuesday mornings between 09:00–10:00 UTC. This pattern suggests a scheduled job or traffic spike. Recommend investigating backend cron tasks.
                      </div>
                    </div>
                    <div className="ai-report-section" style={{ marginTop: 'var(--space-4)' }}>
                      <div className="ai-report-section-label">Recommendations</div>
                      <div className="ai-report-line long" /><div className="ai-report-line med" /><div className="ai-report-line xs" />
                    </div>
                    <div className="ai-report-cta">
                      <button className="btn-ai-primary">Download PDF Report</button>
                      <button className="btn-ai-ghost">Share</button>
                    </div>
                    <div className="ai-powered-by">
                      <span className="ai-powered-dot" />Uptrue AI Reports
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
                  background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)',
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
                      color: '#a5b4fc',
                      marginBottom: 6,
                    }}
                  >
                    🆕 New product
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                    Uptrue AI Visibility&trade;
                  </div>
                  <p style={{ fontSize: 15, color: '#cbd5e1', margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
                    See how ChatGPT, Claude, Perplexity, Gemini, Grok and Copilot cite your brand.
                    Track AI search citations the way you track Google rankings — with weekly reports, competitor benchmarks, and citation alerts.
                  </p>
                </div>
                <a
                  href="https://aivisibility.uptrue.io"
                  className="btn btn-primary btn-lg"
                  style={{ flex: '0 0 auto' }}
                >
                  Explore AI Visibility&trade; →
                </a>
              </div>
            </div>
          </section>
        )

      case 'pricing':
        return <PricingTable key="pricing" defaultCurrency={defaultCurrency} />

      case 'agency':
        return (
          <section key="agency" className="agency-section" id="agency">
            <div className="container">
              <div className="agency-card">
                <div className="agency-text">
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <span className="agency-coming-badge">{agency?.badge ?? 'Coming Soon · Join Waitlist'}</span>
                  </div>
                  <h2>{agency?.headline ?? 'Monitor hundreds of client sites under your brand'}</h2>
                  <p>{agency?.description ?? 'The Agency tier gives you full white-label, multi-tenant workspaces, revenue sharing, custom analytics, and AI reports branded with your agency name. Built for agencies managing dozens of clients.'}</p>
                  <div className="agency-badges">
                    {(agency?.badges ?? ['🏷️ Full white-label', '👥 Multi-tenant workspaces', '💰 Revenue sharing', '🤖 Branded AI reports', '📊 Custom analytics']).map((badge) => (
                      <div key={badge} className="agency-badge">{badge}</div>
                    ))}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <AgencyWaitlistCta />
                  <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.4)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
                    {agency?.cta_note ?? 'No commitment · Early access pricing'}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )

      case 'faq':
        return <Faq key="faq" items={faqItems} eyebrow={faq?.eyebrow} headline={faq?.headline} />

      case 'downtime_calculator':
        return <DowntimeCalculator key="downtime_calculator" />

      case 'testimonials':
        return (
          <section key="testimonials" className="testimonials-section">
            <div className="container">
              <div className="section-header">
                <div className="section-eyebrow">{testimonials?.eyebrow ?? 'Trusted by teams'}</div>
                <h2 className="section-title">{testimonials?.headline ?? 'What our users say'}</h2>
              </div>
              <div className="testimonials-grid">
                {testimonialItems.map((t) => (
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
                        <div className="testimonial-role">{'role' in t && typeof t.role === 'string' ? t.role : `${(t as {role?: string; company?: string}).company ?? ''}`}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )

      case 'comparison_table':
        return (
          <section key="comparison_table" className="comparison-section">
            <div className="container">
              <div className="section-header">
                <div className="section-eyebrow">{comparison?.eyebrow ?? 'How we compare'}</div>
                <h2 className="section-title">{comparison?.headline ?? 'Uptrue vs the alternatives'}</h2>
                <p className="section-sub">{comparison?.subheadline ?? "Not all uptime monitoring is equal. Here's how Uptrue stacks up against the most popular tools."}</p>
              </div>
              <div className="comparison-table-wrap">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      {compCols.map((col, i) => (
                        <th key={col} className={i === 0 ? 'col-uptrue' : undefined}>
                          {i === 0 ? (
                            <div className="uptrue-col-header">
                              {col}<span className="uptrue-col-badge">Best value</span>
                            </div>
                          ) : col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(comparison?.rows ?? [
                      { feature: 'Fastest check interval',                        values: ['1 minute', '30 seconds', '5 minutes'],    type: 'text',    highlight: 0 },
                      { feature: 'Two-region false alarm prevention',              values: [true, true, false],                         type: 'boolean' },
                      { feature: 'AI-powered reports',                             values: [true, false, false],                        type: 'boolean' },
                      { feature: 'Watchdog (competitor tracking)',                 values: [true, false, false],                        type: 'boolean' },
                      { feature: 'Public uptime leaderboard / tracker',            values: [true, false, false],                        type: 'boolean' },
                      { feature: 'Public status pages',                            values: [true, true, true],                          type: 'boolean' },
                      { feature: 'Monitor types (HTTP, SSL, DNS, Keyword…)',       values: ['24 types', '7 types', '6 types'],          type: 'text',    highlight: 0 },
                      { feature: 'Free plan monitors',                             values: ['3 monitors', '3 monitors', '50 monitors'], type: 'text',    highlight: 0 },
                      { feature: 'Starting price (paid plan)',                     values: [defaultCurrency === 'inr' ? '₹999/yr Lite' : '£10/yr Lite', '$24/mo', '$7/mo'], type: 'text', highlight: 0 },
                      { feature: 'GDPR · EU data storage',                        values: [true, true, false],                         type: 'boolean' },
                      { feature: 'AI outage blog auto-publish',                    values: [true, false, false],                        type: 'boolean' },
                      { feature: 'Free AI SEO Checker (4-category audit)',         values: [true, false, false],                        type: 'boolean' },
                      { feature: 'llms.txt Generator',                             values: [true, false, false],                        type: 'boolean' },
                      { feature: 'AI Citation Monitoring (Perplexity, ChatGPT…)', values: [true, false, false],                        type: 'boolean' },
                    ] as Array<{ feature: string; values: Array<boolean | string>; type: string; highlight?: number }>).map((row) => (
                      <tr key={row.feature}>
                        <td>{row.feature}</td>
                        {row.values.map((val, colIdx) => (
                          <td key={colIdx} className={colIdx === 0 ? 'col-uptrue' : undefined}>
                            {row.type === 'boolean' ? (
                              <span className={val ? 'comp-yes' : 'comp-no'}>{val ? '✓' : '—'}</span>
                            ) : (
                              <span className={`comp-val${row.highlight === colIdx ? ' highlight' : ''}`}>{String(val)}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: 'var(--space-5)' }}>
                {comparison?.footnote ?? 'Comparison based on publicly available information as of April 2026. Features may vary by plan.'}
              </p>
            </div>
          </section>
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
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {ctaBand?.eyebrow ?? 'Start in 2 minutes'}
                </div>
                <h2>{ctaBand?.headline ?? "Don't find out you're down\nfrom a customer tweet."}</h2>
                <p>{ctaBand?.subheadline ?? 'Uptrue watches your sites, APIs, and infrastructure 24/7 — and tells you first. Free plan included. No credit card required.'}</p>
                <div className="cta-band-buttons">
                  <Link href={ctaBand?.cta_primary?.href ?? '/signup'} className="btn-cta-white">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {ctaBand?.cta_primary?.text ?? 'Start Monitoring Free'}
                  </Link>
                  <Link href={ctaBand?.cta_secondary?.href ?? '/#features'} className="btn-cta-outline">
                    {ctaBand?.cta_secondary?.text ?? 'See All Features →'}
                  </Link>
                </div>
                <div className="cta-band-trust">
                  {(ctaBand?.trust_items ?? ['3 monitors free forever', 'No credit card required', 'GDPR compliant · EU data', '1-minute check intervals']).map((item, i, arr) => (
                    <span key={item} style={{ display: 'contents' }}>
                      <span className="cta-band-trust-item">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
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
    <>
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <WebSiteJsonLd />
      <FaqPageJsonLd items={faqItems} />

      {/* NAV — always pinned to top (global section, not reorderable) */}
      

      {/* Landing sections rendered in DB sort_order */}
      {renderOrder.map(key => renderSection(key))}

      {/* FOOTER — always pinned to bottom (global section, not reorderable) */}
      

    </>
  )
}

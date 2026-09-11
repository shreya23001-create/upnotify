/**
 * ToolPillarLanding — shared template for the 4 /tools/<pillar> landings.
 *
 * Each pillar (uptime, security, dns, ai-seo) groups 3–4 of the 14 free
 * Upnotify tools by intent. The landing page is an SEO surface for "free
 * <category> tools" searches AND an internal hub that cross-links to the
 * matching continuous monitor types under /monitoring/*.
 */

import Link from 'next/link'
import {
  Activity,
  ChevronRight,
  Gauge,
  Globe,
  Lock,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { ScrollReveal } from '@/components/landing/scroll-reveal'
import Faq from '@/components/landing/faq'

export interface PillarTool {
  /** Slug under /tools/<slug>. Must match an existing tool page directory.
   *  If the canonical URL differs (e.g. Score lives at /score, not
   *  /tools/score), set `href` to override. */
  slug: string
  label: string
  /** One-line description shown on the pillar card. */
  oneLiner: string
  /** Optional badge (Featured / New / Popular / Free Plugin). */
  badge?: string
  /** Optional href override — when set, used verbatim as the link target.
   *  Use for tools that don't live at /tools/<slug>. */
  href?: string
}

export interface PillarMonitor {
  /** Slug under /monitoring/<slug>. Must match monitor-types.ts. */
  slug: string
  label: string
  /** Why this continuous monitor matters for this pillar. */
  why: string
}

export interface PillarFaq {
  q: string
  a: string
}

export interface ToolPillarData {
  /** URL slug — `/tools/<pillarSlug>`. */
  pillarSlug: string
  /** SEO meta title, keyword-targeted. */
  seoTitle: string
  /** SEO meta description. */
  seoDescription: string
  /** Hero headline. */
  heroTitle: string
  /** Hero sub-headline. */
  heroSubtitle: string
  /** Two-paragraph "Why this pillar matters" body. */
  whyItMatters: string[]
  /** The 3–4 free tools in this pillar. */
  tools: PillarTool[]
  /** The 3–5 most-relevant continuous monitor types. */
  monitors: PillarMonitor[]
  /** 5-question FAQ targeting pillar-specific keywords. */
  faq: PillarFaq[]
}

/** Pick a sensible Lucide icon for a tool/monitor card based on its label.
 *  Best-effort keyword match — not exhaustive, falls back to a generic icon. */
function iconForLabel(label: string): LucideIcon {
  const l = label.toLowerCase()
  if (l.includes('ssl') || l.includes('cert')) return Lock
  if (l.includes('dns') || l.includes('sitemap') || l.includes('domain')) return Globe
  if (l.includes('uptime') || l.includes('http') || l.includes('status')) return Activity
  if (l.includes('security') || l.includes('header') || l.includes('blacklist')) return ShieldCheck
  if (l.includes('speed') || l.includes('performance') || l.includes('response time')) return Gauge
  if (l.includes('ai') || l.includes('llm')) return Sparkles
  if (l.includes('seo') || l.includes('robots') || l.includes('redirect')) return Search
  if (l.includes('keyword') || l.includes('page size')) return Radar
  if (l.includes('sla') || l.includes('calculator')) return Timer
  return Activity
}

/** Wrap the last word of a headline in the site's violet gradient span,
 *  mirroring `.gradient-text`. Falls back to plain text if splitting would
 *  look awkward (single-word titles). */
function renderGradientTitle(title: string): React.ReactNode {
  const words = title.trim().split(' ')
  if (words.length < 2) return title
  const lastWord = words.pop()
  return (
    <>
      {words.join(' ')}{' '}
      <span className="pillar-hero-title-gradient">{lastWord}</span>
    </>
  )
}

export function ToolPillarLanding({ data }: { data: ToolPillarData }): React.ReactElement {
  return (
    <>
      <ScrollReveal />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebPage',
                name: data.seoTitle,
                description: data.seoDescription,
                url: `https://upnotify-monitoring.vercel.app/tools/${data.pillarSlug}`,
                isPartOf: {
                  '@type': 'WebSite',
                  name: 'Upnotify',
                  url: 'https://upnotify-monitoring.vercel.app',
                },
              },
              {
                '@type': 'FAQPage',
                mainEntity: data.faq.map((item) => ({
                  '@type': 'Question',
                  name: item.q,
                  acceptedAnswer: { '@type': 'Answer', text: item.a },
                })),
              },
            ],
          }),
        }}
      />

      {/* Hero */}
      <section className="pillar-hero">
        <div className="pillar-hero-inner">
          <nav className="pillar-breadcrumb reveal-title">
            <Link href="/tools">All Free Tools</Link>
            <ChevronRight size={12} strokeWidth={2} />
            <span>{data.heroTitle}</span>
          </nav>

          <div className="pillar-hero-badge reveal-title">FREE — NO SIGNUP</div>

          <h1 className="pillar-hero-title reveal-title">
            {renderGradientTitle(data.heroTitle)}
          </h1>
          <p className="pillar-hero-subtitle reveal-title">
            {data.heroSubtitle}
          </p>
        </div>
      </section>

      <main className="pillar-main pillar-orange-cta">
        {/* Why it matters */}
        <section className="pillar-section">
          <h2 className="pillar-section-title reveal-title">Why this matters</h2>
          {data.whyItMatters.map((para, i) => (
            <p key={i} className="pillar-why-para reveal">
              {para}
            </p>
          ))}
        </section>

        {/* Tools in this pillar */}
        <section className="pillar-section">
          <h2 className="pillar-section-title reveal-title">Free tools in this category</h2>
          <div className="pillar-tools-grid reveal-stagger">
            {data.tools.map((tool) => {
              const Icon = iconForLabel(tool.label)
              return (
                <Link
                  key={tool.slug}
                  href={tool.href ?? `/tools/${tool.slug}`}
                  className="pillar-tool-card"
                >
                  <div className="pillar-tool-card-head">
                    <span className="pillar-tool-card-title">
                      <span className="pillar-icon-badge">
                        <Icon size={16} strokeWidth={2.2} />
                      </span>
                      {tool.label}
                    </span>
                    {tool.badge && (
                      <span className="pillar-tool-card-badge">{tool.badge}</span>
                    )}
                  </div>
                  <p className="pillar-tool-card-desc">{tool.oneLiner}</p>
                  <span className="pillar-tool-card-cta">Use this tool →</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Continuous monitors */}
        <section className="pillar-section">
          <h2 className="pillar-section-title reveal-title" style={{ marginBottom: 8 }}>
            Want continuous monitoring instead of one-off?
          </h2>
          <p className="pillar-section-lede reveal-title">
            Each tool above runs a one-off check. To get alerted whenever something changes,
            set up a continuous monitor:
          </p>
          <div className="pillar-monitor-list reveal-stagger">
            {data.monitors.map((m) => {
              const Icon = iconForLabel(m.label)
              return (
                <div key={m.slug} className="pillar-monitor-card">
                  <div className="pillar-monitor-card-head">
                    <span className="pillar-icon-badge">
                      <Icon size={16} strokeWidth={2.2} />
                    </span>
                    <Link href={`/monitoring/${m.slug}`}>{m.label} →</Link>
                  </div>
                  <p className="pillar-monitor-card-why">{m.why}</p>
                </div>
              )
            })}
          </div>
          <p className="pillar-monitor-footer">
            Or browse <Link href="/monitoring">all 24 monitor types</Link> · run a one-off{' '}
            <Link href="/score">Website Health Score</Link> · see all{' '}
            <Link href="/tools">free monitoring tools</Link>.
          </p>
        </section>

        {/* Inline CTA */}
        <div className="pillar-cta reveal">
          <div>
            <div className="pillar-cta-copy-title">Stop running one-off checks. Start monitoring.</div>
            <div className="pillar-cta-copy-sub">Free plan · 3 monitors · No credit card required</div>
          </div>
          <Link href="/signup" className="pillar-cta-button">
            Start Free →
          </Link>
        </div>

        {/* FAQ */}
        <Faq
          items={data.faq.map((item) => ({ question: item.q, answer: item.a }))}
          headline="Frequently asked questions"
        />
      </main>
    </>
  )
}

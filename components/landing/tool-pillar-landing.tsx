/**
 * ToolPillarLanding — shared template for the 4 /tools/<pillar> landings.
 *
 * Each pillar (uptime, security, dns, ai-seo) groups 3–4 of the 14 free
 * Uptrue tools by intent. The landing page is an SEO surface for "free
 * <category> tools" searches AND an internal hub that cross-links to the
 * matching continuous monitor types under /monitoring/*.
 */

import Link from 'next/link'

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

export function ToolPillarLanding({ data }: { data: ToolPillarData }): React.ReactElement {
  return (
    <>
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
                url: `https://uptrue.io/tools/${data.pillarSlug}`,
                isPartOf: {
                  '@type': 'WebSite',
                  name: 'Uptrue',
                  url: 'https://uptrue.io',
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
      <section style={{
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border)',
        padding: '56px 24px 52px',
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href="/tools" style={{ color: 'var(--accent)', fontWeight: 500 }}>All Free Tools</Link>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            <span>{data.heroTitle}</span>
          </nav>

          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            background: 'var(--brand-gradient-soft)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '0.04em',
            marginBottom: 18,
          }}>FREE — NO SIGNUP</div>

          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            marginBottom: 14,
          }}>
            {data.heroTitle}
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28, maxWidth: 720 }}>
            {data.heroSubtitle}
          </p>
        </div>
      </section>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '52px 24px 80px' }}>
        {/* Why it matters */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 16 }}>
            Why this matters
          </h2>
          {data.whyItMatters.map((para, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--text-secondary)', marginBottom: 14 }}>
              {para}
            </p>
          ))}
        </section>

        {/* Tools in this pillar */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 16 }}>
            Free tools in this category
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 14 }}>
            {data.tools.map((tool) => (
              <Link
                key={tool.slug}
                href={tool.href ?? `/tools/${tool.slug}`}
                style={{
                  padding: '20px 22px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{tool.label}</span>
                  {tool.badge && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: 'var(--accent)',
                      textTransform: 'uppercase',
                      background: 'var(--brand-gradient-soft)',
                      padding: '2px 8px',
                      borderRadius: 999,
                    }}>{tool.badge}</span>
                  )}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{tool.oneLiner}</p>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginTop: 4 }}>Use this tool →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Continuous monitors */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            Want continuous monitoring instead of one-off?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Each tool above runs a one-off check. To get alerted whenever something changes,
            set up a continuous monitor:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.monitors.map((m) => (
              <div key={m.slug} style={{
                padding: '14px 18px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}>
                <div style={{ marginBottom: 4 }}>
                  <Link href={`/monitoring/${m.slug}`} style={{
                    fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
                    textDecoration: 'none',
                  }}>
                    {m.label} →
                  </Link>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{m.why}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            Or browse <Link href="/monitoring">all 24 monitor types</Link> · run a one-off{' '}
            <Link href="/score">Website Health Score</Link> · see all{' '}
            <Link href="/tools">free monitoring tools</Link>.
          </p>
        </section>

        {/* Inline CTA */}
        <div style={{
          background: 'var(--brand-gradient)',
          borderRadius: 14,
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 56,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 4 }}>Stop running one-off checks. Start monitoring.</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Free plan · 3 monitors · No credit card required</div>
          </div>
          <Link href="/signup" style={{
            background: '#fff',
            color: 'var(--brand-blue)',
            padding: '10px 22px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Start Free →
          </Link>
        </div>

        {/* FAQ */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 20 }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.faq.map((item, i) => (
              <div key={i} style={{
                padding: '16px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>{item.q}</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{item.a}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

/**
 * IndustryLanding — shared template for D4-B industry landing pages.
 *
 * Each industry page (/monitoring/<industry>-uptime-monitoring) renders this
 * template with industry-specific data: who the page is for, why uptime
 * matters in that industry, which Uptrue monitor types matter most, and
 * an FAQ block targeting industry keywords.
 *
 * The 24-monitor /monitoring/[slug] dynamic route remains the canonical
 * monitor-type pages. Industry pages SIT IN /monitoring/* but are NOT real
 * monitor types — they are SEO-only landings. They never appear in the
 * /monitoring index list (which sources from monitor-types.ts), nor in the
 * create-monitor flow. They are sitemap-discoverable via the static
 * `industryPages` block in app/sitemap.ts.
 */

import Link from 'next/link'

export interface IndustryMonitor {
  /** Slug under /monitoring/<slug> — must match monitor-types.ts. */
  slug: string
  /** Display name shown next to the link. */
  label: string
  /** One-line description of why this monitor matters in this industry. */
  why: string
}

export interface IndustryFaq {
  q: string
  a: string
}

export interface IndustryLandingData {
  /** URL slug — matches the page directory name. */
  slug: string
  /** Industry-friendly hero title (h1). */
  heroTitle: string
  /** Sub-headline below the hero title. */
  heroSubtitle: string
  /** SEO meta title — keyword-targeted. */
  seoTitle: string
  /** SEO meta description — keyword-targeted. */
  seoDescription: string
  /** Two-paragraph "Why this matters in <industry>" body. */
  whyItMatters: string[]
  /** Pain points teams in this industry typically face. */
  painPoints: string[]
  /** Industry-specific monitors that matter most (linked to /monitoring/<slug>). */
  monitors: IndustryMonitor[]
  /** 6-question FAQ targeting industry keywords. */
  faq: IndustryFaq[]
  /** Stats / SLA framing for the industry — used in a sidebar callout. */
  slaCallout: { label: string; value: string }[]
}

export function IndustryLandingPage({ data }: { data: IndustryLandingData }): React.ReactElement {
  return (
    <>
      {/* JSON-LD: SoftwareApplication + FAQPage in @graph for combined recognition */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'SoftwareApplication',
                name: `${data.heroTitle} — Upnotify`,
                description: data.seoDescription,
                url: `https://uptrue.io/monitoring/${data.slug}`,
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Web',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'GBP',
                  description: 'Free plan available',
                },
                publisher: {
                  '@type': 'Organization',
                  name: 'Upnotify',
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
            <Link href="/monitoring" style={{ color: 'var(--accent)', fontWeight: 500 }}>All Monitor Types</Link>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            <span>{data.heroTitle}</span>
          </nav>

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
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-primary">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Monitoring Free
            </Link>
            <Link href="/score" className="btn btn-ghost">Run Free Health Score</Link>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '52px 24px 80px' }}>
        {/* Why it matters */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
            color: 'var(--text-primary)', marginBottom: 16,
          }}>
            Why uptime matters
          </h2>
          {data.whyItMatters.map((para, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--text-secondary)', marginBottom: 14 }}>
              {para}
            </p>
          ))}

          {/* SLA callout */}
          {data.slaCallout.length > 0 && (
            <div style={{
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns: `repeat(${data.slaCallout.length}, 1fr)`,
              gap: 14,
            }}>
              {data.slaCallout.map((stat, i) => (
                <div key={i} style={{
                  padding: '18px 20px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pain points */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
            color: 'var(--text-primary)', marginBottom: 16,
          }}>
            What goes wrong
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.painPoints.map((item, i) => (
              <li key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 16px',
                background: 'var(--color-down-bg)',
                border: '1px solid var(--color-down-border)',
                borderRadius: 8,
                fontSize: 14,
                color: 'var(--text-primary)',
              }}>
                <svg width="14" height="14" fill="none" stroke="var(--color-down)" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Monitors that matter */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
            color: 'var(--text-primary)', marginBottom: 8,
          }}>
            Monitors that matter
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>
            These are the Upnotify monitor types that map most directly to the failures
            above. Each links to a full setup guide.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.monitors.map((m) => (
              <div key={m.slug} style={{
                padding: '16px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}>
                <div style={{ marginBottom: 6 }}>
                  <Link href={`/monitoring/${m.slug}`} style={{
                    fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
                    textDecoration: 'none',
                  }}>
                    {m.label} →
                  </Link>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>{m.why}</p>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            Want a one-off check before signing up? Run our{' '}
            <Link href="/score">free Website Health Score</Link> or browse all{' '}
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
            <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 4 }}>Set up in 60 seconds</div>
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
            Get Started Free →
          </Link>
        </div>

        {/* FAQ */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
            color: 'var(--text-primary)', marginBottom: 20,
          }}>
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

        {/* Final CTA */}
        <div style={{
          textAlign: 'center',
          padding: '44px 32px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            Ready to set up monitoring?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 520, margin: '0 auto 24px' }}>
            Join teams who monitor their infrastructure with Upnotify. Free plan, no
            credit card required. Or browse all{' '}
            <Link href="/monitoring">24 monitor types</Link> first.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Monitoring Free
          </Link>
        </div>
      </main>
    </>
  )
}

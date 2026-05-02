import Link from 'next/link'

// ── Content schema for custom CMS sections ────────────────────────────────────
//
// Supports two rendering modes:
//   1. Structured — fill in the fields below and the component builds the UI
//   2. Raw HTML   — set `html` to a full HTML string (overrides all other fields)
//
// Supported fields:
//   eyebrow?    Small label above the headline
//   headline?   Main heading (h2)
//   body?       Paragraph text below the heading
//   cta_text?   Button label (requires cta_href)
//   cta_href?   Button link URL
//   align?      Text alignment: "left" | "center" | "right"  (default: "center")
//   background? CSS background value, e.g. "#0f172a" or "linear-gradient(...)"
//   html?       Raw HTML string — takes priority over all other fields

export interface CustomContent {
  eyebrow?:    string
  headline?:   string
  body?:       string
  cta_text?:   string
  cta_href?:   string
  align?:      'left' | 'center' | 'right'
  background?: string
  html?:       string
}

interface Props {
  sectionKey: string
  content:    CustomContent | null
}

export function CustomSection({ sectionKey, content }: Props): React.ReactElement | null {
  if (!content) return null

  const align = content.align ?? 'center'

  // ── Raw HTML mode ─────────────────────────────────────────────────────────
  if (content.html) {
    return (
      <section
        id={sectionKey}
        style={{ background: content.background ?? undefined }}
        // Admin-only feature; content is authored by trusted admins
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
    )
  }

  // ── Structured mode ───────────────────────────────────────────────────────
  if (!content.headline && !content.body) return null

  const isExternalLink = content.cta_href?.startsWith('http')

  return (
    <section
      className="section"
      id={sectionKey}
      style={{ background: content.background ?? undefined }}
    >
      <div className="container">
        <div
          className="section-header"
          style={{
            textAlign: align,
            alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
          }}
        >
          {content.eyebrow && (
            <div className="section-eyebrow">{content.eyebrow}</div>
          )}
          {content.headline && (
            <h2 className="section-title">{content.headline}</h2>
          )}
          {content.body && (
            <p className="section-sub">{content.body}</p>
          )}
          {content.cta_text && content.cta_href && (
            <div style={{ marginTop: 'var(--space-6)' }}>
              {isExternalLink ? (
                <a
                  href={content.cta_href}
                  className="btn btn-primary btn-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {content.cta_text}
                </a>
              ) : (
                <Link href={content.cta_href} className="btn btn-primary btn-lg">
                  {content.cta_text}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

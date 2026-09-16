/**
 * TrackerSoftNotFound — graceful "we don't track this site yet" page.
 *
 * Renders when /tracker/<domain> hits a domain that doesn't exist in
 * `public_monitors`. Returns 200 with helpful content (related sites,
 * "start monitoring free" CTA) instead of a hard 404 — preserves any
 * inbound link equity and gives the user a useful next action.
 *
 * Distinct from `TrackerDeactivated`, which is the same shape but for
 * domains that previously existed and were deactivated. The deactivated
 * path additionally emits robots:noindex,nofollow to deindex the URL.
 */

import Link from 'next/link'
import { TRACKED_SITES } from '@/lib/constants/tracked-sites'

export function TrackerSoftNotFound({
  requestedDomain,
  variant = 'not-tracked',
}: {
  requestedDomain: string
  variant?: 'not-tracked' | 'deactivated'
}): React.ReactElement {
  // Pick 6 popular sites to show as alternatives — first 6 from TRACKED_SITES
  // (which is hand-ordered with the most-recognisable services up front).
  const suggestions = TRACKED_SITES.slice(0, 6)

  const heading =
    variant === 'deactivated'
      ? `We no longer track ${requestedDomain}`
      : `We don't track ${requestedDomain} yet`

  const subhead =
    variant === 'deactivated'
      ? `This site was previously on our public tracker and has been removed. You can monitor it yourself with an Upnotify plan, or browse other tracked services below.`
      : `It's not on our public tracker right now. You can monitor it yourself in 2 minutes with an Upnotify plan, or browse popular services we do track.`

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '64px 24px 80px' }}>
      <div style={{
        padding: '36px 36px 32px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        marginBottom: 40,
      }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 10px',
          background: variant === 'deactivated' ? 'rgba(239,68,68,0.1)' : 'var(--brand-gradient-soft)',
          border: '1px solid',
          borderColor: variant === 'deactivated' ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.2)',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: variant === 'deactivated' ? 'var(--color-down, #ef4444)' : 'var(--accent)',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          {variant === 'deactivated' ? 'No Longer Tracked' : 'Not in Tracker'}
        </div>
        <h1 style={{
          fontSize: 'clamp(24px, 3vw, 36px)',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          lineHeight: 1.2,
          marginBottom: 12,
        }}>
          {heading}
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 640 }}>
          {subhead}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/signup" className="btn btn-primary">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Monitor it free
          </Link>
          <Link href="/tracker" className="btn btn-ghost">Browse all tracked sites</Link>
        </div>
      </div>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 14,
        }}>
          Popular sites we track
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}>
          {suggestions.map((s) => (
            <Link
              key={s.domain}
              href={`/tracker/${s.domain}`}
              style={{
                padding: '14px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{s.display_name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.domain}</span>
            </Link>
          ))}
        </div>
      </section>

      <section style={{
        padding: '24px 28px',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Want to monitor {requestedDomain} continuously?
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Upnotify lets you monitor any public URL — including {requestedDomain} — with
          email alerts, response-time tracking, SSL expiry warnings and DNS change detection.
          Plans start at &#8377;999/year.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Or run a one-off <Link href="/score">free Website Health Score</Link> on{' '}
          {requestedDomain} — five categories, instant grade, no signup.
        </p>
      </section>
    </div>
  )
}

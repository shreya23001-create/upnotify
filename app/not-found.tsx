import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found — Upnotify',
  robots: { index: false, follow: false },
}

export default function NotFound(): React.ReactElement {
  return (
    <div className="notfound-page">
      <div className="notfound-glow" aria-hidden="true" />

      <Link href="/" className="notfound-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" height="28" aria-hidden="true">
          <defs>
            <linearGradient id="nf404G" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#06b6d4"/>
            </linearGradient>
          </defs>
          <path d="M20 6 L36 12 L36 24 C36 32 28 38 20 42 C12 38 4 32 4 24 L4 12 Z" fill="url(#nf404G)"/>
          <text x="10" y="30" fontFamily="system-ui,-apple-system,sans-serif" fontSize="16" fontWeight="800" fill="white" letterSpacing="0.5">
            <tspan dy="0">U</tspan><tspan dy="-5">p</tspan>
          </text>
          <text x="46" y="34" fontFamily="system-ui,-apple-system,sans-serif" fontSize="28" fontWeight="700" fill="currentColor" letterSpacing="-0.5">Upnotify</text>
        </svg>
      </Link>

      <div className="notfound-card">
        <div className="notfound-card-header">
          <span className="notfound-status-dot" aria-hidden="true" />
          <span className="notfound-status-label">DOWN</span>
          <span className="notfound-card-url">uptrue.io/this-page</span>
        </div>

        <div className="notfound-card-body">
          <p className="notfound-eyebrow">404 &middot; Monitor Check Failed</p>
          <h1 className="notfound-title">This endpoint isn&apos;t responding</h1>
          <p className="notfound-desc">
            We checked, and this page doesn&apos;t exist or may have been moved. The good news —
            unlike this URL, your actual website is (hopefully) still up.
          </p>

          <div className="notfound-metrics">
            <div className="notfound-metric">
              <span className="notfound-metric-label">Status</span>
              <span className="notfound-metric-value notfound-metric-error">404 Not Found</span>
            </div>
            <div className="notfound-metric">
              <span className="notfound-metric-label">Response time</span>
              <span className="notfound-metric-value">11ms</span>
            </div>
            <div className="notfound-metric">
              <span className="notfound-metric-label">Checked</span>
              <span className="notfound-metric-value">Just now</span>
            </div>
          </div>
        </div>
      </div>

      <div className="notfound-actions">
        <Link href="/" className="btn btn-primary btn-lg">Back to home</Link>
        <Link href="/help" className="btn btn-ghost btn-lg">Help centre</Link>
      </div>

      <p className="notfound-footnote">
        Want alerts like this the moment your <em>real</em> site goes down?{' '}
        <Link href="/signup">Start monitoring free</Link>
      </p>
    </div>
  )
}

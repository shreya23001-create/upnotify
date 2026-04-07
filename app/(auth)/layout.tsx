import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="auth-split">

      {/* ── Left panel — brand ── */}
      <div className="auth-split-left">
        <div className="auth-split-left-inner">

          {/* Logo */}
          <Link href="/" className="auth-brand-logo">
            <div className="auth-brand-logo-icon">
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="auth-brand-logo-name">Uptrue</span>
          </Link>

          {/* Headline */}
          <div className="auth-brand-headline">
            <h1>Know when your sites go down.</h1>
            <p>Before your customers do.</p>
          </div>

          {/* Feature list */}
          <ul className="auth-brand-features">
            <li>
              <span className="auth-brand-check">✓</span>
              10 monitor types — HTTP, SSL, DNS, keyword, port &amp; more
            </li>
            <li>
              <span className="auth-brand-check">✓</span>
              Two-confirmation detection — zero false alarms
            </li>
            <li>
              <span className="auth-brand-check">✓</span>
              Multi-channel alerts — Email, Slack, Teams, webhooks
            </li>
            <li>
              <span className="auth-brand-check">✓</span>
              Public status pages with real-time uptime bars
            </li>
            <li>
              <span className="auth-brand-check">✓</span>
              AI-powered reports — share with clients in one click
            </li>
          </ul>

          {/* Mini status mock */}
          <div className="auth-brand-mock">
            <div className="auth-mock-row auth-mock-row-up">
              <span className="auth-mock-dot auth-mock-dot-up" />
              <span className="auth-mock-site">api.example.com</span>
              <span className="auth-mock-badge auth-mock-badge-up">UP</span>
              <span className="auth-mock-ms">124ms</span>
            </div>
            <div className="auth-mock-row auth-mock-row-up">
              <span className="auth-mock-dot auth-mock-dot-up" />
              <span className="auth-mock-site">app.clientsite.io</span>
              <span className="auth-mock-badge auth-mock-badge-up">UP</span>
              <span className="auth-mock-ms">89ms</span>
            </div>
            <div className="auth-mock-row auth-mock-row-down">
              <span className="auth-mock-dot auth-mock-dot-down" />
              <span className="auth-mock-site">store.brand.co</span>
              <span className="auth-mock-badge auth-mock-badge-down">DOWN</span>
              <span className="auth-mock-ms">—</span>
            </div>
          </div>

          {/* Bottom trust line */}
          <p className="auth-brand-trust">
            Free plan · No credit card required · Cancel any time
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="auth-split-right">
        <div className="auth-split-right-inner">
          {children}
        </div>
        <p className="auth-split-back">
          <Link href="/">← Back to Uptrue.io</Link>
        </p>
      </div>

    </div>
  )
}

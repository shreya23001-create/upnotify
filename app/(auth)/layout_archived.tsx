import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="auth-page">

      {/* ── Left panel — dark brand panel ── */}
      <div className="auth-left">

        {/* Logo */}
        <Link href="/" className="auth-left-logo">
          <div className="auth-left-logo-icon">
            <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          Upnotify
        </Link>

        {/* Caption — centred visually */}
        <div className="auth-canvas-placeholder">
          {/* Decorative grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }} />
          {/* Glowing orb */}
          <div style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }} />
        </div>

        <div className="auth-caption">
          <div className="auth-caption-title" id="authCaptionTitle">Your monitors are watching.</div>
          <div className="auth-caption-sub" id="authCaptionSub">We check every 30 seconds, around the clock.</div>
        </div>

        {/* Scene dots */}
        <div className="auth-scene-dots">
          <div className="auth-scene-dot active" />
          <div className="auth-scene-dot" />
          <div className="auth-scene-dot" />
          <div className="auth-scene-dot" />
          <div className="auth-scene-dot" />
        </div>

        {/* Proof bar */}
        <div className="auth-proof">
          <span className="auth-proof-item">
            <span className="auth-proof-dot" />
            2,800+ checks per minute
          </span>
          <span className="auth-proof-item">EU data · GDPR</span>
          <span className="auth-proof-item">99.97% accuracy</span>
        </div>

      </div>

      {/* ── Right panel — form ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          {children}
        </div>
        {/* <p style={{ position: 'absolute', bottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to Uptrue.io</Link>
        </p> */}
      </div>

    </div>
  )
}

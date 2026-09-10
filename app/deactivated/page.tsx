import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Account Deactivated',
  robots: { index: false, follow: false },
}

export default function DeactivatedPage(): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83D\uDEAB'}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>
          Account Deactivated
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
          Your account has been deactivated by an administrator.
          You no longer have access to the dashboard, monitors, or settings.
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32 }}>
          If you believe this is a mistake or would like to appeal,
          please contact our support team.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href="mailto:shreya23001@gmail.com" className="btn btn-primary">
            Contact Support
          </a>
          <Link href="/" className="btn btn-secondary">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { AuthLeftPanel } from '@/components/auth/auth-left-panel'

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="auth-page">
      <AuthLeftPanel />

      {/* ── Right panel — form ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          {children}
        </div>
        <p style={{ position: 'absolute', bottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to Uptrue.io</Link>
        </p>
      </div>
    </div>
  )
}

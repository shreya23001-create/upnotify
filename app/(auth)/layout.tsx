import Link from 'next/link'
import { AuthLeftPanel } from '@/components/auth/auth-left-panel'
import { getDefaultCurrency } from '@/lib/utils/geo.server'

export default async function AuthLayout({ children }: { children: React.ReactNode }): Promise<React.ReactElement> {
  const currency = await getDefaultCurrency()
  return (
    <div className="auth-page">
      <AuthLeftPanel currency={currency} />

      {/* ── Right panel — form ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          {children}
        </div>
        <p style={{ position: 'absolute', bottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to Upnotify.io</Link>
        </p>
      </div>
    </div>
  )
}

import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="auth-page">
      <div className="auth-page-bg" aria-hidden="true" />
      <div className="auth-card-wrap">
        <div className="auth-card">
          <Link href="/" className="auth-card-logo" aria-label="Upnotify home">
            <img src="/Logo_1.png" alt="Upnotify" height={75} style={{ height: 75, width: 'auto' }} />
          </Link>
          {children}
        </div>
        {/* <p className="auth-back-link">
          <Link href="/">← Back to Upnotify.io</Link>
        </p> */}
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found — Uptrue',
  robots: { index: false, follow: false },
}

export default function NotFound(): React.ReactElement {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: 'var(--font-display, system-ui, sans-serif)',
      background: 'var(--bg-page, #0f172a)',
      color: 'var(--text-primary, #f1f5f9)',
      textAlign: 'center',
    }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 48, textDecoration: 'none' }}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#3b82f6"/>
          <path d="M8 20L14 10L20 18L24 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary, #f1f5f9)' }}>Uptrue</span>
      </Link>

      <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--brand, #3b82f6)', textTransform: 'uppercase', marginBottom: 12 }}>
        404
      </p>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, marginBottom: 16, lineHeight: 1.1 }}>
        Page not found
      </h1>
      <p style={{ fontSize: 17, color: 'var(--text-muted, #94a3b8)', maxWidth: 420, marginBottom: 40, lineHeight: 1.6 }}>
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: '#3b82f6',
            color: '#fff',
            fontWeight: 600,
            fontSize: 15,
            padding: '10px 24px',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          Back to home
        </Link>
        <Link
          href="/help"
          style={{
            display: 'inline-block',
            background: 'transparent',
            color: 'var(--text-secondary, #cbd5e1)',
            fontWeight: 500,
            fontSize: 15,
            padding: '10px 24px',
            borderRadius: 8,
            textDecoration: 'none',
            border: '1px solid var(--border, #1e293b)',
          }}
        >
          Help centre
        </Link>
      </div>
    </div>
  )
}

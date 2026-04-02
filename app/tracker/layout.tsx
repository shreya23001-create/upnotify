import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: {
    template: '%s | Uptrue Tracker',
    default: 'Website Status Tracker | Uptrue',
  },
  description: 'Real-time uptime monitoring for popular websites and services. Check if sites are down right now.',
}

export default function TrackerLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="tracker-layout">
      <header className="tracker-header">
        <Link href="/" className="tracker-logo">
          <img src="/logo.svg" alt="Uptrue" width={120} height={30} />
        </Link>
        <nav className="tracker-nav">
          <Link href="/tracker">All Sites</Link>
          <a href="https://uptrue.io" target="_blank" rel="noopener noreferrer">Monitor Your Site</a>
        </nav>
      </header>
      <main className="tracker-main">
        {children}
      </main>
      <footer className="tracker-footer">
        <p>Powered by <a href="https://uptrue.io" target="_blank" rel="noopener noreferrer">Uptrue</a> — Professional uptime monitoring for agencies and businesses.</p>
        <p className="tracker-footer-links">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
        </p>
      </footer>
    </div>
  )
}

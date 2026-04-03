import Link from 'next/link'
import { UptrueLogo } from '@/components/ui/uptrue-logo'

/**
 * PublicNav — consistent navigation for all public pages.
 * Layout: logo LEFT, nav links CENTER, login/signup RIGHT.
 * Matches the landing page navigation pattern.
 */
export function PublicNav(): React.ReactElement {
  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-logo" aria-label="Uptrue home">
          <UptrueLogo />
        </Link>
        <div className="landing-nav-links">
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/score">Score</Link>
          <Link href="/tracker">Tracker</Link>
          <Link href="/tools">Tools</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/blog">Blog</Link>
        </div>
        <div className="landing-nav-actions">
          <Link href="/login" className="btn btn-ghost">Log in</Link>
          <Link href="/signup" className="btn btn-primary">Start Free</Link>
        </div>
      </div>
    </nav>
  )
}

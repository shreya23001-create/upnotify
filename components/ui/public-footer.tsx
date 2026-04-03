import Link from 'next/link'
import { UptrueLogo } from '@/components/ui/uptrue-logo'

/**
 * PublicFooter — single source of truth for all public page footers.
 * Used on: landing, about, contact, blog, score, tracker, tools, leaderboard.
 */
export function PublicFooter(): React.ReactElement {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <UptrueLogo />
            <p className="footer-tagline">
              Uptime, performance &amp; infrastructure monitoring for agencies
              and teams.
            </p>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Product</h4>
            <Link href="/#features">Features</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/score">
              Score <span className="free-badge">FREE</span>
            </Link>
            <Link href="/tracker">
              Tracker <span className="free-badge">FREE</span>
            </Link>
            <Link href="/leaderboard">
              Leaderboard <span className="free-badge">FREE</span>
            </Link>
            <Link href="/tools">
              Tools <span className="free-badge">FREE</span>
            </Link>
            <Link href="/blog">Blog</Link>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Legal</h4>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/cookies">Cookie Policy</Link>
            <Link href="/dpa">Data Processing Agreement</Link>
            <Link href="/acceptable-use">Acceptable Use Policy</Link>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            {'\u00A9'} {new Date().getFullYear()} Vision Software Solutions
            Limited. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

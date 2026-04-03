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
            <p className="footer-company-info">
              Vision Software Solutions Limited {'\u00B7'} Brentford, UK {'\u00B7'} Company No. 02710980
            </p>
            <div className="footer-trust-badges">
              <span className="footer-trust-badge">{'\uD83D\uDD12'} Secure Payments</span>
              <span className="footer-trust-badge">{'\uD83D\uDEE1\uFE0F'} GDPR Compliant</span>
              <span className="footer-trust-badge">{'\u26A1'} 99.9% SLA</span>
            </div>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Product</h4>
            <Link href="/#features">Features</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/score">
              Score <sup className="nav-free-tag">Free</sup>
            </Link>
            <Link href="/tracker">
              Tracker <sup className="nav-free-tag">Free</sup>
            </Link>
            <Link href="/leaderboard">
              Leaderboard <sup className="nav-free-tag">Free</sup>
            </Link>
            <Link href="/tools">
              Tools <sup className="nav-free-tag">Free</sup>
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
            <Link href="/refund-policy">Refund Policy</Link>
            <Link href="/gdpr">GDPR Compliance</Link>
            <Link href="/ai-disclaimer">AI Disclaimer</Link>
            <Link href="/sla">SLA</Link>
            <Link href="/subprocessors">Sub-processors</Link>
            <Link href="/security">Security</Link>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Community</h4>
            <Link href="/credits">Community Credits</Link>
            <Link href="/referrals">Referral Program</Link>
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

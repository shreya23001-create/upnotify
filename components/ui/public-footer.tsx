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
            <Link href="/compete">Compete</Link>
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
            <Link href="/automated-pricing-policy">Automated Pricing Policy</Link>
            <Link href="/sla">SLA</Link>
            <Link href="/subprocessors">Sub-processors</Link>
            <Link href="/security">Security</Link>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/credits">Community Credits</Link>
            <Link href="/referrals">Referral Program</Link>
            <a href="https://x.com/uptrue_io" target="_blank" rel="noopener noreferrer" className="footer-social-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @uptrue_io
            </a>
            <a href="https://www.linkedin.com/company/uptrue-io/" target="_blank" rel="noopener noreferrer" className="footer-social-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
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

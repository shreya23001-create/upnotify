import Link from 'next/link'

export function PublicFooter(): React.ReactElement {
  return (
    <footer className="pub-footer">
      <div className="container">

        <div className="footer-top">

          {/* Brand */}
          <div className="footer-brand">
            <Link href="/" className="nav-logo" style={{ marginBottom: 'var(--space-4)', display: 'inline-flex' }}>
              <div className="nav-logo-icon">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span style={{ marginLeft: 8 }}>Uptrue</span>
            </Link>
            <p className="footer-desc">
              Uptime, performance &amp; infrastructure monitoring for agencies and teams.
            </p>
            <div className="footer-trust">
              <div className="footer-trust-item">🔒 Secure Payments via Stripe</div>
              <div className="footer-trust-item">🛡️ GDPR Compliant · EU Data (Frankfurt)</div>
              <div className="footer-trust-item">⚡ 99.9% SLA</div>
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="footer-col-title">Product</div>
            <ul className="footer-links">
              <li><Link href="/#features">Features</Link></li>
              <li><Link href="/#pricing">Pricing</Link></li>
              <li><Link href="/score">Score <span style={{ color: 'var(--color-up)', fontSize: 10 }}>Free</span></Link></li>
              <li><Link href="/tracker">Tracker <span style={{ color: 'var(--color-up)', fontSize: 10 }}>Free</span></Link></li>
              <li><Link href="/leaderboard">Leaderboard</Link></li>
              <li><Link href="/compete">Compete</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/changelog">Changelog</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="footer-col-title">Legal</div>
            <ul className="footer-links">
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/cookies">Cookie Policy</Link></li>
              <li><Link href="/dpa">DPA</Link></li>
              <li><Link href="/acceptable-use">Acceptable Use</Link></li>
              <li><Link href="/refund-policy">Refund Policy</Link></li>
              <li><Link href="/sla">SLA</Link></li>
              <li><Link href="/ai-disclaimer">AI Disclaimer</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="footer-col-title">Company</div>
            <ul className="footer-links">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/referrals">Referral Program</Link></li>
              <li><Link href="/credits">Community Credits</Link></li>
              <li><a href="https://x.com/uptrue_io" target="_blank" rel="noopener noreferrer">X @uptrue_io</a></li>
              <li><a href="https://www.linkedin.com/company/uptrue-io/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="footer-col-title">Support</div>
            <ul className="footer-links">
              <li><Link href="/help">Help Centre</Link></li>
              <li><Link href="/docs">API Docs</Link></li>
              <li><Link href="/status">Status</Link></li>
              <li><Link href="/security">Security</Link></li>
              <li><Link href="/subprocessors">Sub-processors</Link></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} Vision Software Solutions Limited · Brentford, UK · Company No. 02710980</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            <Link href="/terms" style={{ color: 'var(--text-muted)' }}>Terms</Link>
            <Link href="/privacy" style={{ color: 'var(--text-muted)' }}>Privacy</Link>
            <Link href="/cookies" style={{ color: 'var(--text-muted)' }}>Cookies</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}

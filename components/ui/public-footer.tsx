import Link from 'next/link'
import { getLandingSection } from '@/lib/db/page-sections'
import type { FooterContent } from '@/lib/types/cms'

type FooterLink = { label: string; href: string; badge?: string; external?: boolean }
type FooterColumn = { title: string; links: FooterLink[] }

// ── Defaults (mirrors the seeded DB content) ──────────────────────────────────

const DEFAULT_DESCRIPTION = 'Uptime, performance & infrastructure monitoring for agencies and teams.'

const DEFAULT_TRUST_ITEMS = [
  '🔒 Secure Payments via Stripe',
  '🛡️ GDPR Compliant · EU Data (Frankfurt)',
  '⚡ 99.9% SLA',
]

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features',        href: '/#features' },
      { label: 'Pricing',         href: '/#pricing' },
      { label: 'Score',           href: '/score',                    badge: 'Free' },
      { label: 'Tracker',         href: '/tracker',                  badge: 'Free' },
      { label: 'AI SEO Checker',  href: '/tools/ai-seo-checker',    badge: 'Free' },
      { label: 'All Free Tools',  href: '/tools' },
      { label: 'Leaderboard',     href: '/leaderboard' },
      { label: 'Blog',            href: '/blog' },
      { label: 'Changelog',       href: '/changelog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service',  href: '/terms' },
      { label: 'Privacy Policy',    href: '/privacy' },
      { label: 'Cookie Policy',     href: '/cookies' },
      { label: 'DPA',               href: '/dpa' },
      { label: 'Acceptable Use',    href: '/acceptable-use' },
      { label: 'Refund Policy',     href: '/refund-policy' },
      { label: 'SLA',               href: '/sla' },
      { label: 'AI Disclaimer',     href: '/ai-disclaimer' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',             href: '/about' },
      { label: 'Contact',           href: '/contact' },
      { label: 'Referral Program',  href: '/referrals' },
      { label: 'Community Credits', href: '/credits' },
      { label: 'X @uptrue_io',      href: 'https://x.com/uptrue_io',                                  external: true },
      { label: 'LinkedIn',          href: 'https://www.linkedin.com/company/uptrue-io/', external: true },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Centre',    href: '/help' },
      { label: 'API Docs',       href: '/docs' },
      { label: 'Status',         href: '/status' },
      { label: 'Security',       href: '/security' },
      { label: 'Sub-processors', href: '/subprocessors' },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export async function PublicFooter(): Promise<React.ReactElement> {
  const section = await getLandingSection('footer')

  // If section exists in DB and is explicitly hidden, render nothing
  if (section && !section.is_visible) return <></>

  const cms = section?.content as FooterContent | undefined

  const description = cms?.description  ?? DEFAULT_DESCRIPTION
  const trustItems  = cms?.trust_items  ?? DEFAULT_TRUST_ITEMS
  const columns     = (cms?.columns ?? DEFAULT_COLUMNS) as FooterColumn[]

  return (
    <footer className="pub-footer">
      <div className="container">

        <div className="footer-top">

          {/* Brand */}
          <div className="footer-brand">
            <Link href="/" className="nav-logo" aria-label="Uptrue home" style={{ marginBottom: 'var(--space-4)', display: 'inline-flex' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" height="28" aria-hidden="true">
                <defs>
                  <linearGradient id="ftG" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6"/>
                    <stop offset="100%" stopColor="#06b6d4"/>
                  </linearGradient>
                </defs>
                <path d="M20 6 L36 12 L36 24 C36 32 28 38 20 42 C12 38 4 32 4 24 L4 12 Z" fill="url(#ftG)"/>
                <text x="10" y="30" fontFamily="system-ui,-apple-system,sans-serif" fontSize="16" fontWeight="800" fill="white" letterSpacing="0.5">
                  <tspan dy="0">U</tspan><tspan dy="-5">p</tspan>
                </text>
                <text x="46" y="34" fontFamily="system-ui,-apple-system,sans-serif" fontSize="28" fontWeight="700" fill="#ffffff" letterSpacing="-0.5">Uptrue</text>
              </svg>
            </Link>
            <p className="footer-desc">{description}</p>
            <div className="footer-trust">
              {trustItems.map((item) => (
                <div key={item} className="footer-trust-item">{item}</div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <div className="footer-col-title">{col.title}</div>
              <ul className="footer-links">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                        {link.badge && <span style={{ color: 'var(--color-up)', fontSize: 10 }}> {link.badge}</span>}
                      </a>
                    ) : (
                      <Link href={link.href}>
                        {link.label}
                        {link.badge && <span style={{ color: 'var(--color-up)', fontSize: 10 }}> {link.badge}</span>}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()}{' '}
            <a href="https://find-and-update.company-information.service.gov.uk/company/02710980" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
              Vision Software Solutions Limited
            </a>
            {' '}· Brentford, UK · Company No. 02710980
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}

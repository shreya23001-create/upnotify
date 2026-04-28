import '../landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'

export const metadata: Metadata = {
  title: 'Website Monitoring Suite — 24 Monitor Types | Uptrue',
  description: 'Uptrue monitors 24 types of infrastructure — HTTP uptime, SSL certificates, DNS records, security headers, WordPress site health, MX, SPF/DMARC, blacklists, and more. See every monitoring type explained.',
  alternates: { canonical: 'https://uptrue.io/monitoring' },
}

const coreTypes = ['http', 'ssl', 'dns', 'keyword', 'domain', 'port', 'ping', 'api', 'heartbeat', 'competitor']
const coreMonitorTypes = MONITOR_TYPES.filter(t => coreTypes.includes(t.type))
const agentTypes = MONITOR_TYPES.filter(t => t.type === 'wordpress')
const advancedTypes = MONITOR_TYPES.filter(t => !coreTypes.includes(t.type) && t.type !== 'wordpress')

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Website Monitoring Suite — 24 Monitor Types',
  description: 'Uptrue monitors 24 types of infrastructure — HTTP uptime, SSL certificates, DNS records, security headers, WordPress site health, MX health, SPF/DMARC, blacklists, and more.',
  url: 'https://uptrue.io/monitoring',
  publisher: {
    '@type': 'Organization',
    name: 'Uptrue',
    url: 'https://uptrue.io',
  },
}

export default function MonitoringIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav />

      {/* Hero */}
      <section style={{
        background: 'var(--bg-subtle)',
        padding: '72px 24px 64px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="hero-eyebrow" style={{ justifyContent: 'center', marginBottom: 24 }}>
            <div className="hero-eyebrow-text">
              <span className="hero-eyebrow-dot" />
              Website Monitoring Suite
            </div>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: 16 }}>
            24 ways to monitor<br />
            <span className="gradient-text">your website</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
            From HTTP uptime to WordPress internals, security headers, SPF/DMARC, blacklists, and cookie consent —
            Uptrue is the only monitoring suite that covers every layer of your stack in one place.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-primary btn-lg">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Monitoring Free
            </Link>
            <Link href="/score" className="btn btn-ghost btn-lg">Score Your Site Free</Link>
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            {['No credit card required', '3 monitors free forever', 'WordPress plugin included'].map(t => (
              <span key={t} style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>✓ {t}</span>
            ))}
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* Core monitors */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-up-bg)', border: '1px solid var(--color-up-border)', borderRadius: 'var(--radius-full)', padding: '4px 12px', marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-up)', display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-up)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Core Monitors</span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 6 }}>The essentials every site needs</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Start with these — they cover uptime, security, and DNS from day one.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {coreMonitorTypes.map(t => (
              <MonitorCard key={t.slug} t={t} />
            ))}
          </div>
        </section>

        {/* Advanced monitors */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--brand-gradient-soft)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-full)', padding: '4px 12px', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>✦ New — Advanced Monitors</span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 6 }}>Security, compliance & change detection</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>For teams who need to go beyond basic uptime.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {advancedTypes.map(t => (
              <MonitorCard key={t.slug} t={t} />
            ))}
          </div>
        </section>

        {/* Agent-based monitors */}
        {agentTypes.length > 0 && (
          <section style={{ marginBottom: 64 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #667eea18, #764ba212)', border: '1px solid #667eea35', borderRadius: 'var(--radius-full)', padding: '4px 12px', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#667eea', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔌 New — Agent-Based Monitors</span>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 6 }}>Monitor from inside your site</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Plugin-based monitors that check what external tools can&apos;t see — file injections, rogue users, and internal compromises.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {agentTypes.map(t => (
                <MonitorCard key={t.slug} t={t} />
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <div style={{
          background: 'var(--brand-gradient)',
          borderRadius: 16,
          padding: '40px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Set up all 24 monitor types in minutes</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>Free plan included. No credit card. WordPress plugin included.</div>
          </div>
          <Link href="/signup" style={{
            background: '#fff',
            color: 'var(--brand-blue)',
            padding: '12px 28px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Start Free →
          </Link>
        </div>

      </main>
      <PublicFooter />
    </>
  )
}

function WpIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#21759b" />
      <text x="12" y="16.5" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Georgia, serif">W</text>
    </svg>
  )
}

function MonitorCard({ t }: { t: typeof MONITOR_TYPES[number] }) {
  return (
    <Link
      href={`/monitoring/${t.slug}`}
      className="monitor-type-card"
      style={{
        display: 'block',
        padding: '20px 22px',
        borderRadius: 12,
        border: t.type === 'wordpress' ? '1px solid #21759b30' : '1px solid var(--border)',
        background: t.type === 'wordpress' ? 'linear-gradient(135deg, #21759b08, #0073aa06)' : 'var(--bg-card)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{
        width: 40, height: 40,
        background: t.type === 'wordpress' ? '#21759b' : 'var(--brand-gradient-soft)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, marginBottom: 12,
      }}>
        {t.type === 'wordpress' ? <WpIcon size={22} /> : t.emoji}
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>{t.name}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.55 }}>{t.tagline}</div>
      <div style={{
        position: 'absolute', bottom: 18, right: 18,
        fontSize: 12, color: 'var(--brand-blue)', fontWeight: 600, opacity: 0,
        transition: 'opacity 0.15s',
      }} className="card-arrow">
        Learn more →
      </div>
    </Link>
  )
}

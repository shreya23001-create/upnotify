import '../landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'
import { MonitorTypeIcon, MonitorIconGradientDefs } from './monitor-type-icons'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Website Monitoring Suite — 23 Monitor Types | Upnotify',
  description: 'Upnotify tracks 23 different layers of your infrastructure — HTTP uptime, SSL certificates, DNS records, security headers, MX, SPF/DMARC, blacklists, and more. Every monitor type explained.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/monitoring' },
}

const coreTypes = ['http', 'ssl', 'dns', 'keyword', 'domain', 'port', 'ping', 'api', 'heartbeat', 'competitor']
const coreMonitorTypes = MONITOR_TYPES.filter(t => coreTypes.includes(t.type) && t.type !== 'wordpress')
const advancedTypes = MONITOR_TYPES.filter(t => !coreTypes.includes(t.type) && t.type !== 'wordpress')

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Website Monitoring Suite — 23 Monitor Types',
  description: 'Upnotify tracks 23 different layers of your infrastructure — HTTP uptime, SSL certificates, DNS records, security headers, MX health, SPF/DMARC, blacklists, and more.',
  url: 'https://upnotify-monitoring.vercel.app/monitoring',
  publisher: {
    '@type': 'Organization',
    name: 'Upnotify',
    url: 'https://upnotify-monitoring.vercel.app',
  },
}

export default function MonitoringIndexPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MonitorIconGradientDefs />

      {/* Hero */}
      <section style={{
        background: 'var(--bg-subtle)',
        padding: '72px 24px 64px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 48,
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 380px', minWidth: 0 }}>
            <div className="hero-eyebrow" style={{ marginBottom: 24 }}>
              <div className="hero-eyebrow-text">
                <span className="hero-eyebrow-dot" />
                Website Monitoring Suite
              </div>
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: 16 }}>
              23 ways to monitor<br />
              <span className="gradient-text monitoring-hero-gradient">your website</span>
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480 }}>
              HTTP uptime, security headers, SPF/DMARC, blacklists, cookie consent —
              Upnotify is the one monitoring suite built to cover your entire stack at once.
            </p>
          </div>

          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
              <Link href="/signup" className="btn btn-primary btn-lg" style={{ whiteSpace: 'nowrap' }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Monitoring
              </Link>
              <Link href="/tools" className="btn btn-ghost btn-lg" style={{ whiteSpace: 'nowrap' }}>Try a Free Tool</Link>
              <Link href="/score" className="btn btn-ghost btn-lg" style={{ whiteSpace: 'nowrap' }}>Score Your Site Free</Link>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {['Plans from ₹999/year', '1-minute check intervals'].map(t => (
                <span key={t} style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>✓ {t}</span>
              ))}
            </div>
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
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 6 }}>What every site should have running</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>These cover uptime, security, and DNS from the moment you turn them on.</p>
          </div>
          <div className="monitor-type-grid">
            {coreMonitorTypes.map(t => (
              <MonitorCard key={t.slug} t={t} />
            ))}
          </div>
        </section>

        {/* Advanced monitors */}
        <section className="monitor-adv-panel" style={{ marginBottom: 64 }}>
          <div className="monitor-adv-hdr">
            <div className="monitor-adv-badge">
              <Sparkles size={12} />
              New — Advanced Monitors
            </div>
            <h2 className="monitor-adv-title">Security, compliance & change detection</h2>
            <p className="monitor-adv-sub">For when plain uptime checks aren&apos;t enough.</p>
          </div>
          <div className="monitor-adv-list">
            {advancedTypes.map(t => (
              <Link key={t.slug} href={`/monitoring/${t.slug}`} className="monitor-adv-row">
                <span className="monitor-adv-row-icon">
                  <MonitorTypeIcon type={t.type} size={17} white />
                </span>
                <span className="monitor-adv-row-body">
                  <span className="monitor-adv-row-title">{t.name}</span>
                  <span className="monitor-adv-row-tagline">{t.tagline}</span>
                </span>
                <span className="monitor-adv-row-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #0068DB 0%, #1392FB 100%)',
          borderRadius: 16,
          padding: '40px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>All 23 monitor types, live in minutes</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>Simple per-website pricing, from ₹999/year.</div>
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
            Start Monitoring →
          </Link>
        </div>

      </main>

    </div>
  )
}

function MonitorCard({ t }: { t: typeof MONITOR_TYPES[number] }) {
  return (
    <Link
      href={`/monitoring/${t.slug}`}
      className="monitor-type-card"
      style={{
        '--mtc-accent': 'var(--brand-gradient)',
        border: '1px solid var(--card-border)',
        background: 'var(--bg-card)',
      } as React.CSSProperties}
    >
      <div className="monitor-type-card-icon" style={{ background: 'var(--brand-gradient)', color: '#fff' }}>
        <MonitorTypeIcon type={t.type} size={20} white />
      </div>
      <div className="monitor-type-card-title">{t.name}</div>
      <div className="monitor-type-card-tagline">{t.tagline}</div>
      <div className="monitor-type-card-link">
        Learn more
        <span aria-hidden="true">→</span>
      </div>
    </Link>
  )
}

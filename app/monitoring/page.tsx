import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'
import { MONITOR_TYPES } from '@/lib/constants/monitor-types'

export const metadata: Metadata = {
  title: 'Website Monitoring Suite — 23 Monitor Types | Uptrue',
  description: 'Uptrue monitors 23 types of infrastructure — HTTP uptime, SSL certificates, DNS records, security headers, MX health, SPF/DMARC, blacklists, and more. See every monitoring type explained.',
  alternates: { canonical: 'https://uptrue.io/monitoring' },
}

const coreTypes = ['http', 'ssl', 'dns', 'keyword', 'domain', 'port', 'ping', 'api', 'heartbeat', 'competitor']
const advancedTypes = MONITOR_TYPES.filter(t => !coreTypes.includes(t.type))
const coreMonitorTypes = MONITOR_TYPES.filter(t => coreTypes.includes(t.type))

export default function MonitoringIndexPage() {
  return (
    <>
      <PublicNav />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16, letterSpacing: -1 }}>
            23 Ways to Monitor Your Website
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
            From basic HTTP uptime to security headers, SPF/DMARC, blacklists, and cookie consent —
            Uptrue is the only Website Monitoring Suite that covers every layer of your stack in one place.
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/signup"
              style={{
                background: 'var(--accent)', color: '#fff',
                padding: '12px 28px', borderRadius: 8, fontWeight: 600,
                textDecoration: 'none', fontSize: 15,
              }}
            >
              Start Monitoring Free
            </Link>
            <Link
              href="/score"
              style={{
                border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)',
                padding: '12px 28px', borderRadius: 8, fontWeight: 600,
                textDecoration: 'none', fontSize: 15,
              }}
            >
              Check Your Site Score
            </Link>
          </div>
        </div>

        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Core Monitors</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>The essentials every site needs from day one.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {coreMonitorTypes.map(t => (
              <Link
                key={t.slug}
                href={`/monitoring/${t.slug}`}
                style={{
                  display: 'block', padding: '20px 24px', borderRadius: 12,
                  border: '1.5px solid var(--border-primary)',
                  textDecoration: 'none', color: 'inherit',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{t.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{t.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.55 }}>{t.tagline}</div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Advanced Monitors
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '2px 10px', borderRadius: 20 }}>New</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Security, compliance, and infrastructure change detection.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {advancedTypes.map(t => (
              <Link
                key={t.slug}
                href={`/monitoring/${t.slug}`}
                style={{
                  display: 'block', padding: '20px 24px', borderRadius: 12,
                  border: '1.5px solid var(--border-primary)',
                  textDecoration: 'none', color: 'inherit',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{t.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{t.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.55 }}>{t.tagline}</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}

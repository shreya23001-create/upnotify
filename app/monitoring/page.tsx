import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: 'Monitoring Types | Uptrue — Uptime & Infrastructure Monitoring',
  description: 'Uptrue monitors 23 types of infrastructure — HTTP uptime, SSL certificates, DNS records, security headers, MX health, SPF/DMARC, blacklists, and more. See every monitoring type explained.',
  alternates: { canonical: 'https://uptrue.io/monitoring' },
}

const monitorTypes = [
  {
    slug: 'http-uptime-monitoring',
    name: 'HTTP/HTTPS Uptime',
    emoji: '🌐',
    description: 'Check if your website is up and responding. Detects 4xx and 5xx errors with two-confirmation logic to eliminate false alerts.',
    tier: 'core',
  },
  {
    slug: 'ssl-certificate-monitoring',
    name: 'SSL Certificate',
    emoji: '🔒',
    description: 'Monitor SSL/TLS certificate expiry and chain validity. Get alerted before your certificate expires and causes browser warnings.',
    tier: 'core',
  },
  {
    slug: 'dns-monitoring',
    name: 'DNS Records',
    emoji: '📡',
    description: 'Detect unexpected DNS record changes across A, MX, NS, and TXT records. Critical for catching misconfigurations and attacks.',
    tier: 'core',
  },
  {
    slug: 'keyword-monitoring',
    name: 'Keyword Detection',
    emoji: '🔍',
    description: 'Verify specific content is present or absent on your page. Confirm checkout flows, API responses, or compliance text.',
    tier: 'core',
  },
  {
    slug: 'domain-expiry-monitoring',
    name: 'Domain Expiry',
    emoji: '📅',
    description: 'Never let your domain expire unexpectedly. Get advance warnings weeks before your registration lapses.',
    tier: 'core',
  },
  {
    slug: 'port-monitoring',
    name: 'Port Check',
    emoji: '🔌',
    description: 'Verify TCP ports are open and accepting connections. Essential for databases, mail servers, and custom services.',
    tier: 'core',
  },
  {
    slug: 'ping-monitoring',
    name: 'Ping / Reachability',
    emoji: '📶',
    description: 'Basic ICMP reachability check for servers and network devices. Fastest way to confirm a host is online.',
    tier: 'core',
  },
  {
    slug: 'api-endpoint-monitoring',
    name: 'API Endpoint',
    emoji: '⚡',
    description: 'Test REST API endpoints with custom assertions on status codes, response body, and latency.',
    tier: 'core',
  },
  {
    slug: 'heartbeat-monitoring',
    name: 'Heartbeat Monitor',
    emoji: '💓',
    description: 'Detect silent cron job and background task failures. Your jobs ping Uptrue on success — silence triggers an alert.',
    tier: 'core',
  },
  {
    slug: 'page-change-detection',
    name: 'Page Change Detection',
    emoji: '👁️',
    description: 'Alert when a competitor or partner page content changes. Track pricing, terms, or key sections.',
    tier: 'core',
  },
  {
    slug: 'security-headers-monitoring',
    name: 'Security Headers',
    emoji: '🛡️',
    description: 'Verify HTTP security headers are set correctly — HSTS, CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy.',
    tier: 'new',
  },
  {
    slug: 'response-time-monitoring',
    name: 'Response Time Threshold',
    emoji: '⏱️',
    description: 'Alert when your site exceeds a latency threshold. Separate warn and critical thresholds for gradual degradation detection.',
    tier: 'new',
  },
  {
    slug: 'robots-txt-monitoring',
    name: 'robots.txt Change',
    emoji: '🤖',
    description: 'Detect changes to your robots.txt file. Accidental blocks can de-index your site from Google overnight.',
    tier: 'new',
  },
  {
    slug: 'ip-change-monitoring',
    name: 'IP Address Change',
    emoji: '🗺️',
    description: 'Alert when your domain resolves to a different IP. Catch unexpected CDN failovers, BGP hijacking, or misconfigured DNS.',
    tier: 'new',
  },
  {
    slug: 'mx-health-monitoring',
    name: 'MX Health',
    emoji: '📧',
    description: 'Verify MX records exist and primary mail server resolves. Broken MX means lost email — often unnoticed for days.',
    tier: 'new',
  },
  {
    slug: 'whois-registrar-monitoring',
    name: 'WHOIS Registrar Change',
    emoji: '📋',
    description: 'Detect SOA and nameserver changes that indicate registrar or registrant transfers. Early warning for domain hijacking.',
    tier: 'new',
  },
  {
    slug: 'sitemap-monitoring',
    name: 'Sitemap Validity',
    emoji: '🗺️',
    description: 'Verify sitemap.xml is accessible and valid XML. A broken sitemap silently stops Google from discovering new pages.',
    tier: 'new',
  },
  {
    slug: 'redirect-chain-monitoring',
    name: 'Redirect Chain',
    emoji: '🔗',
    description: 'Analyse redirect hops and alert on chains that are too long or end in an error. Excessive redirects hurt Core Web Vitals.',
    tier: 'new',
  },
  {
    slug: 'spf-dmarc-monitoring',
    name: 'SPF / DMARC Validity',
    emoji: '✉️',
    description: 'Check SPF and DMARC DNS records are present and correctly configured. Missing or weak policies enable spoofing attacks.',
    tier: 'new',
  },
  {
    slug: 'blacklist-monitoring',
    name: 'Blacklist Check',
    emoji: '🚫',
    description: 'Check your server IP against major DNS block lists (Spamhaus, SpamCop, Barracuda). Being listed destroys email deliverability.',
    tier: 'new',
  },
  {
    slug: 'page-size-monitoring',
    name: 'Page Size',
    emoji: '📦',
    description: 'Alert when page weight exceeds a threshold. Page bloat slows load times, hurts Core Web Vitals, and increases CDN costs.',
    tier: 'new',
  },
  {
    slug: 'cookie-consent-monitoring',
    name: 'Cookie Consent Presence',
    emoji: '🍪',
    description: 'Verify a cookie consent banner is still present on your pages. Missing consent can trigger GDPR/CCPA compliance issues.',
    tier: 'new',
  },
  {
    slug: 'nameserver-monitoring',
    name: 'Nameserver Change',
    emoji: '🖥️',
    description: 'Alert when authoritative nameservers change. Nameserver changes can cause global DNS propagation and service outages.',
    tier: 'new',
  },
]

const coreTypes = monitorTypes.filter(t => t.tier === 'core')
const newTypes = monitorTypes.filter(t => t.tier === 'new')

export default function MonitoringIndexPage() {
  return (
    <>
      <PublicNav />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16, letterSpacing: -1 }}>
            23 Ways to Monitor Your Infrastructure
          </h1>
          <p style={{ fontSize: 18, color: 'var(--color-muted)', maxWidth: 600, margin: '0 auto' }}>
            From basic HTTP uptime to security headers, SPF/DMARC, blacklists, and cookie consent —
            Uptrue gives you complete visibility across every layer of your stack.
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="https://app.uptrue.io/signup"
              style={{
                background: 'var(--color-accent)', color: '#fff',
                padding: '12px 28px', borderRadius: 8, fontWeight: 600,
                textDecoration: 'none', fontSize: 15,
              }}
            >
              Start Monitoring Free
            </Link>
            <Link
              href="/score"
              style={{
                border: '1.5px solid var(--color-border)', color: 'var(--color-fg)',
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
          <p style={{ color: 'var(--color-muted)', marginBottom: 28 }}>The essentials every site needs from day one.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {coreTypes.map(t => (
              <Link
                key={t.slug}
                href={`/monitoring/${t.slug}`}
                style={{
                  display: 'block', padding: '20px 24px', borderRadius: 12,
                  border: '1.5px solid var(--color-border)',
                  textDecoration: 'none', color: 'inherit',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{t.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{t.name}</div>
                <div style={{ color: 'var(--color-muted)', fontSize: 14, lineHeight: 1.55 }}>{t.description}</div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Advanced Monitors
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 600, background: 'var(--color-accent)', color: '#fff', padding: '2px 10px', borderRadius: 20 }}>New</span>
          </h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: 28 }}>Security, compliance, and infrastructure change detection.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {newTypes.map(t => (
              <Link
                key={t.slug}
                href={`/monitoring/${t.slug}`}
                style={{
                  display: 'block', padding: '20px 24px', borderRadius: 12,
                  border: '1.5px solid var(--color-border)',
                  textDecoration: 'none', color: 'inherit',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{t.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{t.name}</div>
                <div style={{ color: 'var(--color-muted)', fontSize: 14, lineHeight: 1.55 }}>{t.description}</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}

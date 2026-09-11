import '../../landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Bug, UserX, Plug, FileWarning, Settings, KeyRound, ShieldAlert, Bug as DebugBug,
  Search, ShieldCheck, Zap, Bot, Check, AlertTriangle, Bell, Link2,
  Globe, Lock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Faq from '@/components/landing/faq'
import { ScrollReveal } from '@/components/landing/scroll-reveal'
import { AlertConditionsAccordion } from './alert-conditions-accordion'
import { ChecksMarquee } from './checks-marquee'

export const metadata: Metadata = {
  title: 'WordPress Site Monitor — Plugin-Based Security & Health Monitoring | Upnotify',
  description: 'Upnotify\'s WordPress Monitor plugin checks your site from the inside — detecting file injections, rogue admin users, outdated plugins, suspicious pages, and more. Get alerted before hackers cause damage.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/monitoring/wordpress-site-monitor' },
  openGraph: {
    title: 'WordPress Site Monitor — Plugin-Based Security & Health Monitoring | Upnotify',
    description: 'Detect file injections, rogue admin users, outdated plugins, and suspicious content — from inside your WordPress site. Free Upnotify plugin.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Upnotify WordPress Monitor',
  description: 'A lightweight WordPress plugin that monitors your site from the inside — detecting file injections, rogue admin users, outdated plugins, and suspicious pages.',
  url: 'https://upnotify-monitoring.vercel.app/monitoring/wordpress-site-monitor',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'WordPress',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', description: 'Free plan available' },
  publisher: { '@type': 'Organization', name: 'Upnotify', url: 'https://upnotify-monitoring.vercel.app' },
}

const threats: { icon: LucideIcon; title: string; desc: string; severity: string }[] = [
  {
    icon: Bug,
    title: 'File Injection Attacks',
    desc: 'PHP and JavaScript files planted in your uploads folder — the most common WordPress hack. Attackers upload shells disguised as images to run arbitrary code on your server.',
    severity: 'critical',
  },
  {
    icon: UserX,
    title: 'Rogue Admin Users',
    desc: 'New administrator accounts created without your knowledge. Attackers often create hidden admin users after an initial compromise to maintain access even after you change your password.',
    severity: 'critical',
  },
  {
    icon: Plug,
    title: 'Outdated Plugins & Themes',
    desc: 'Over 90% of hacked WordPress sites were running outdated plugins with known vulnerabilities. Upnotify alerts you the moment an update is available — before attackers exploit the gap.',
    severity: 'high',
  },
  {
    icon: FileWarning,
    title: 'Foreign-Language Content Injection',
    desc: 'SEO spam attacks inject hidden pages with Chinese, Russian, Korean, Arabic, and 6 other scripts to hijack your search rankings. Upnotify scans every published page — title, slug, and body — on each push.',
    severity: 'high',
  },
  {
    icon: Settings,
    title: '.htaccess & wp-config Tampering',
    desc: 'Modifications to .htaccess and wp-config.php are a sign of a serious compromise — attackers use these to redirect visitors, hide malware, or extract database credentials.',
    severity: 'critical',
  },
  {
    icon: KeyRound,
    title: 'Security Configuration Weaknesses',
    desc: 'XML-RPC enabled, REST API user enumeration exposed, no 2FA, no backup plugin, world-writable directories, disabled auto-updates — Upnotify checks all of these on every push and scores your configuration.',
    severity: 'high',
  },
  {
    icon: ShieldAlert,
    title: 'Brute Force Login Attacks',
    desc: 'Upnotify counts failed login attempts every 24 hours. A spike in failures means your wp-login.php is under attack — alerting you before an account is compromised.',
    severity: 'high',
  },
  {
    icon: DebugBug,
    title: 'Debug Mode & Misconfigurations',
    desc: 'WordPress debug mode exposes sensitive error messages, file paths, and database structure to any visitor. It\'s frequently forgotten after a developer fixes an issue.',
    severity: 'medium',
  },
]

const howItWorks = [
  {
    step: '1',
    title: 'Install the free plugin',
    desc: 'Download Upnotify-monitor.php, upload it to your wp-content/plugins folder, and activate it in WordPress Admin. Takes under 2 minutes.',
  },
  {
    step: '2',
    title: 'Connect to Upnotify',
    desc: 'Add your WordPress Monitor in Upnotify. You\'ll get a secure API token — paste it into Upnotify → Settings in your WordPress Admin.',
  },
  {
    step: '3',
    title: 'Plugin scans from inside',
    desc: 'WordPress Cron runs staggered security scans every hour — PHP files, JS files, .htaccess, core files, theme files. Each scan type runs independently to avoid server load spikes.',
  },
  {
    step: '4',
    title: 'Findings pushed to Upnotify',
    desc: 'The plugin pushes scan results to Upnotify via encrypted HTTPS. It works behind Cloudflare, CDNs, and firewalls — no inbound ports needed.',
  },
  {
    step: '5',
    title: 'Alerts fire on new threats',
    desc: 'Upnotify compares each snapshot to the previous one. New threats trigger alerts. Resolved threats are automatically closed. No noise, just signal.',
  },
]

const whyInternal: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Search,
    title: 'External tools can\'t see what\'s inside',
    desc: 'External uptime monitors only see your homepage. They can\'t detect a PHP shell in your uploads folder, a new admin user, or a modified wp-config.php — until it\'s too late.',
  },
  {
    icon: ShieldCheck,
    title: 'Works behind any firewall or CDN',
    desc: 'Because the plugin pushes data out (not the other way around), it works on any hosting — shared hosting, Cloudflare-protected sites, password-protected staging environments.',
  },
  {
    icon: Zap,
    title: 'Zero impact on site performance',
    desc: 'Scans run via WordPress Cron — they happen in the background, staggered across hours. Your visitors never notice.',
  },
  {
    icon: Bot,
    title: 'AI-powered remediation',
    desc: 'Every issue comes with an AI-generated plain-English explanation and step-by-step fix instructions — written for site owners, not developers.',
  },
]

const faq = [
  {
    q: 'Does this replace my security plugin (Wordfence, Sucuri, etc.)?',
    a: 'It complements them. Security plugins focus on blocking attacks in real time. Upnotify WordPress Monitor is about continuous visibility and alerting — knowing when something changed, getting notified, and having a dashboard that shows your site\'s health score over time. Many Upnotify users run both.',
  },
  {
    q: 'What happens if my WordPress site goes down?',
    a: 'Upnotify already monitors your site\'s HTTP uptime separately. If the site goes down, your standard uptime alerts fire. If the WP plugin stops pushing data, Upnotify will alert you after a configurable silence window — so you know the connection is broken.',
  },
  {
    q: 'Will the plugin slow down my WordPress site?',
    a: 'No. All scans run via WordPress Cron — a background task system. File scans are staggered across the day so no single cron run is heavy. Your visitors will never notice.',
  },
  {
    q: 'What PHP version does the plugin require?',
    a: 'PHP 7.4 or higher. The plugin also checks your PHP version and alerts you if you\'re running an end-of-life version that no longer receives security patches.',
  },
  {
    q: 'I don\'t have an Upnotify account. Can I still use the plugin?',
    a: 'Yes. The plugin is useful even without Upnotify — it generates a monthly security report emailed to your WordPress admin email address. Connect to Upnotify for real-time alerts, a health score dashboard, and AI-powered fix instructions.',
  },
  {
    q: 'How many WordPress sites can I monitor?',
    a: 'Free plan: 0 sites. Lite plan: 1 site. Builder plan: up to 5 sites. Scale plan: up to 10 sites.',
  },
  {
    q: 'What checks does the plugin run?',
    a: 'File injection (PHP/JS/executables in uploads), .htaccess and wp-config.php changes, core and theme file modifications, new admin/editor users, foreign-language content injection (10 scripts: Chinese, Russian, Korean, Arabic, Hindi, Japanese, Thai, Hebrew, Bengali, Georgian), outdated plugins and themes, debug mode, PHP version, brute force login attempts, world-writable directories, XML-RPC status, REST API user enumeration, application passwords, auto-update settings, spam comment volume, 2FA status, recently modified plugin files, backup plugin presence, and disk usage.',
  },
]

const severityBadge: Record<string, { bg: string; darkBg: string; color: string; darkColor: string; label: string }> = {
  critical: { bg: '#fef2f2', darkBg: 'rgba(220,38,38,0.12)', color: '#dc2626', darkColor: '#f87171', label: 'Critical' },
  high: { bg: '#fff7ed', darkBg: 'rgba(234,88,12,0.12)', color: '#ea580c', darkColor: '#fb923c', label: 'High' },
  medium: { bg: '#fefce8', darkBg: 'rgba(202,138,4,0.12)', color: '#ca8a04', darkColor: '#facc15', label: 'Medium' },
  low: { bg: '#f0fdf4', darkBg: 'rgba(22,163,74,0.12)', color: '#16a34a', darkColor: '#4ade80', label: 'Low' },
  info: { bg: '#f8fafc', darkBg: 'rgba(100,116,139,0.12)', color: '#64748b', darkColor: '#94a3b8', label: 'Info' },
}

export default function WordPressMonitorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollReveal />

      {/* Hero */}
      <section className="wp-monitor-hero" style={{
        padding: '72px 24px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="wp-monitor-hero-glow" style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <nav className="wp-monitor-hero-breadcrumb" style={{ fontSize: 13, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href="/monitoring" className="wp-monitor-hero-breadcrumb-link" style={{ fontWeight: 500 }}>All Monitor Types</Link>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
            <span>WordPress Site Monitor</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgb(26 181 78)', background: 'rgba(0, 104, 219,0.15)', border: '1px solid rgba(0, 104, 219,0.3)', padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1 }}>
              Plugin-Based · Agent Monitor
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', padding: '3px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Check size={11} strokeWidth={3} /> Works behind Cloudflare
            </span>
          </div>

          <h1 className="wp-monitor-hero-title" style={{
            fontSize: 'clamp(30px, 5vw, 52px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 18,
          }}>
            <span className="wp-monitor-hero-icon" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, marginBottom: 14,
              borderRadius: 12,
            }}>
              <Plug size={22} strokeWidth={2} />
            </span>
            Upnotify WordPress Monitor
          </h1>
          <p className="wp-monitor-hero-sub" style={{ fontSize: 19, lineHeight: 1.65, marginBottom: 10, maxWidth: 640 }}>
            External uptime tools only see your homepage. This plugin monitors from inside your WordPress site — detecting file injections, rogue users, and silent compromises before your visitors do.
          </p>
          <p className="wp-monitor-hero-meta" style={{ fontSize: 14, marginBottom: 36 }}>
            Free 2-minute install · No inbound ports · Works on shared hosting
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              background: 'linear-gradient(135deg, #FBA830, #f59e0b)',
              color: '#1a1200',
              padding: '13px 28px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Add WordPress Monitor Free
            </Link>
            <a href="/downloads/Upnotify-monitor.zip" className="wp-monitor-hero-secondary-btn" style={{
              padding: '13px 24px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download Plugin
            </a>
          </div>
        </div>
      </section>

      {/* Health score preview */}
      <section className="wp-monitor-stats-strip" style={{ padding: '20px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          {[
            { value: '100', label: 'Health Score', color: '#10b981' },
            { value: '8', label: 'Threat Categories', color: '#1392FB' },
            { value: '25+', label: 'Checks Per Scan', color: '#f59e0b' },
            { value: '2 min', label: 'Setup Time', color: '#06b6d4' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '8px 20px' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div className="wp-monitor-stats-label" style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* Why external monitoring isn't enough */}
        <section className="reveal" style={{ marginBottom: 64 }}>
          <LandingSection title="Why external monitoring isn't enough" icon={AlertTriangle}>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Standard uptime monitors check whether your website responds to an HTTP request. That tells you if your site is reachable — but nothing about whats happening inside. Most WordPress compromises are invisible to external tools:
            </p>
            <div className="reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {whyInternal.map(item => (
                <div key={item.title} style={{
                  padding: '20px 20px',
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: 12,
                  boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.03)',
                  display: 'flex',
                  gap: 14,
                }}>
                  <div style={{
                    width: 40, height: 40, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1392FB18, #0068DB12)',
                    borderRadius: 10, color: '#1392FB',
                  }}><item.icon size={19} strokeWidth={2} /></div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </LandingSection>
        </section>

        {/* Threat categories */}
        <section className="reveal" style={{ marginBottom: 64 }}>
          <LandingSection title="What Upnotify WordPress Monitor detects" icon={Search}>
            <div className="wp-showcase-card" style={{
              borderRadius: 16,
              padding: '16px 40px',
            }}>
              {threats.map((threat, i) => {
                const sev = severityBadge[threat.severity]
                const reversed = i % 2 === 1
                return (
                  <div key={threat.title} className="wp-showcase-row" style={{
                    display: 'flex',
                    flexDirection: reversed ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 40,
                    padding: '36px 0',
                    borderBottom: i < threats.length - 1 ? '1px solid var(--wp-showcase-divider)' : 'none',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ flex: '1 1 320px', minWidth: 260 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6,
                        color: sev.darkColor,
                        background: sev.darkBg,
                        padding: '3px 10px', borderRadius: 10,
                        marginBottom: 12,
                      }}>
                        {sev.label}
                      </span>
                      <div className="wp-showcase-title" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, marginBottom: 10, letterSpacing: '-0.01em' }}>
                        {threat.title}
                      </div>
                      <div className="wp-showcase-desc" style={{ fontSize: 14.5, lineHeight: 1.7 }}>
                        {threat.desc}
                      </div>
                    </div>
                    <div style={{ flex: '0 0 auto' }}>
                      <div style={{
                        width: 120, height: 120,
                        borderRadius: 24,
                        background: `linear-gradient(135deg, ${sev.color}22, ${sev.color}0a)`,
                        border: `1px solid ${sev.color}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: sev.darkColor,
                      }}>
                        <threat.icon size={44} strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </LandingSection>
        </section>

        {/* Full checks list */}
        <section className="reveal" style={{ marginBottom: 64 }}>
          <LandingSection title="Every check Upnotify runs" icon={Check}>
            <ChecksMarquee />
          </LandingSection>
        </section>

        {/* How it works */}
        <section className="reveal" style={{ marginBottom: 64 }}>
          <LandingSection title="How it works" icon={Settings}>
            <div className="wp-showcase-card" style={{
              borderRadius: 16,
              padding: '8px 36px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}>
              {howItWorks.map((step) => (
                <div key={step.step} className="wp-hiw-cell" style={{ padding: '28px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{
                      width: 20, height: 20, flexShrink: 0, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(22,163,74,0.12)', color: '#16a34a',
                      fontSize: 11, fontWeight: 800,
                    }}>
                      {step.step}
                    </span>
                    <span className="wp-showcase-title" style={{ fontSize: 15, fontWeight: 700 }}>{step.title}</span>
                  </div>
                  <div className="wp-showcase-desc" style={{ fontSize: 13.5, lineHeight: 1.65 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </LandingSection>
        </section>

        {/* Health score callout */}
        <div className="reveal" style={{
          marginBottom: 64,
          padding: '28px 32px',
          background: 'linear-gradient(135deg, #1392FB12, #0068DB10)',
          border: '1px solid #1392FB30',
          borderRadius: 14,
          display: 'grid',
          gridTemplateColumns: '80px 1fr',
          gap: 24,
          alignItems: 'center',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'conic-gradient(#10b981 87%, #e5e7eb 0%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 62, height: 62, borderRadius: '50%', background: '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#10b981', lineHeight: 1 }}>87</span>
              <span style={{ fontSize: 9, color: '#6b7280', fontWeight: 600 }}>GOOD</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Live health score dashboard</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              Every scan updates your site&apos;s health score (0–100). Track it over time to see trends — whether security is improving or degrading. Critical findings hit hard: a PHP shell in uploads costs 30 points. Debug mode left on costs 10.
            </div>
          </div>
        </div>

        {/* AI report callout */}
        <div className="reveal" style={{
          marginBottom: 64,
          padding: '24px 28px',
          background: 'var(--bg-card, #fff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          borderLeft: '3px solid #1392FB',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 36, height: 36, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1392FB18, #0068DB12)',
            borderRadius: 9, color: '#1392FB', marginTop: 2,
          }}><Bot size={18} strokeWidth={2} /></div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>AI Security Report</div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
              On demand, Upnotify generates a plain-English AI security report for your WordPress site — explaining every open issue, ranking them by severity, and providing numbered step-by-step fix instructions. Written for business owners, not developers. Powered by Claude AI.
            </p>
          </div>
        </div>

        {/* Alert conditions */}
        <section className="reveal" style={{ marginBottom: 64 }}>
          <LandingSection title="When Upnotify alerts you" icon={Bell}>
            <AlertConditionsAccordion
              severityBadge={severityBadge}
              groups={[
                {
                  severity: 'critical', items: [
                    'PHP or executable file detected in uploads folder',
                    '.htaccess file modified since last scan',
                    'wp-config.php file modified since last scan',
                    'WordPress core file modified (may indicate compromise)',
                  ],
                },
                {
                  severity: 'high', items: [
                    'New administrator account created',
                    'Foreign-language content injected (Chinese, Russian, Korean, Arabic + 6 more scripts)',
                    'JavaScript file found in uploads folder',
                    'Active theme files modified',
                    'World-writable directory detected',
                    'More than 20 failed logins in 24 hours (brute force)',
                    'No 2FA plugin active on the site',
                    'No backup plugin installed',
                    'Plugin files modified in the last 24 hours',
                  ],
                },
                {
                  severity: 'medium', items: [
                    'Plugin update available (vulnerabilities exploited in the wild)',
                    'Active theme update available',
                    'PHP version end-of-life — no longer receiving security patches',
                    'XML-RPC enabled (brute force attack surface)',
                    'REST API exposes user list publicly',
                    'WordPress auto-updates disabled',
                    'Disk usage above 80%',
                  ],
                },
                {
                  severity: 'low', items: [
                    'WordPress debug mode (WP_DEBUG) left enabled',
                  ],
                },
              ]}
            />
          </LandingSection>
        </section>

      </main>

      {/* FAQ */}
      <Faq
        items={faq.map(item => ({ question: item.q, answer: item.a }))}
        eyebrow="Got questions?"
        headline="Frequently asked questions"
      />

      <div className="wp-monitor-tail-section" style={{ paddingTop: "36px" }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

          {/* Related monitors */}
          <section className="reveal" style={{ marginBottom: 64 }}>
            <LandingSection title="Pair with these monitors" icon={Link2}>
              <div className="reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                {[
                  { slug: 'http-uptime-monitoring', icon: Globe, name: 'HTTP Uptime Monitoring' },
                  { slug: 'ssl-certificate-monitoring', icon: Lock, name: 'SSL Certificate Monitoring' },
                  { slug: 'security-headers-monitoring', icon: ShieldCheck, name: 'Security Headers Monitoring' },
                  { slug: 'keyword-monitoring', icon: Search, name: 'Keyword Detection' },
                ].map(rel => (
                  <Link key={rel.slug} href={`/monitoring/${rel.slug}`} className="pair-monitor-card" style={{
                    padding: '18px',
                    background: 'var(--bg-card, #fff)',
                    border: '1px solid var(--border, #e5e7eb)',
                    borderRadius: 14,
                    boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                    textDecoration: 'none',
                    display: 'flex', flexDirection: 'column', gap: 14,
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        width: 38, height: 38, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #1392FB18, #0068DB12)',
                        borderRadius: 10, color: '#1392FB',
                      }}><rel.icon size={18} strokeWidth={2} /></span>
                      <span className="pair-monitor-arrow" style={{
                        color: '#1392FB', opacity: 0, transform: 'translateX(-4px)',
                        transition: 'opacity 0.2s, transform 0.2s',
                        display: 'flex',
                      }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      </span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{rel.name}</span>
                  </Link>
                ))}
              </div>
            </LandingSection>
          </section>

          {/* Bottom CTA */}
          <div className="reveal" style={{
            background: 'linear-gradient(135deg, #071a10 0%, #0a2016 50%, #0d2818 100%)',
            borderRadius: 20,
            padding: '52px 40px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.5,
              backgroundImage: 'radial-gradient(circle at 25% 30%, #1392FB 0%, transparent 55%), radial-gradient(circle at 75% 70%, #0068DB 0%, transparent 55%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 700, color: '#0068DB',
                background: 'rgba(0, 104, 219,0.15)', border: '1px solid rgba(0, 104, 219,0.3)',
                padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1,
                marginBottom: 18,
              }}>
                <Plug size={11} strokeWidth={2.5} /> Free plugin
              </span>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Start monitoring your WordPress site from the inside
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 30, maxWidth: 480, margin: '0 auto 30px' }}>
                Free plan · 2-minute plugin install · No inbound ports · Works on any WordPress host
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/signup" style={{
                  background: 'linear-gradient(135deg, #FBA830, #f59e0b)',
                  color: '#1a1200',
                  padding: '14px 30px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(251, 168, 48,0.4)',
                }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Create Free Account
                </Link>
                <a href="/downloads/Upnotify-monitor.zip" style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '14px 26px',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download Plugin
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

    </>
  )
}

function LandingSection({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <span style={{
          width: 40, height: 40, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #1392FB18, #0068DB12)',
          border: '1px solid #1392FB30',
          borderRadius: 10, color: '#1392FB',
        }}><Icon size={20} strokeWidth={2.25} /></span>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', opacity: 1, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

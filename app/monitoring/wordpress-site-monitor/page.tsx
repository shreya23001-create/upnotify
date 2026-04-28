import '../../landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: 'WordPress Site Monitor — Plugin-Based Security & Health Monitoring | Uptrue',
  description: 'Uptrue\'s WordPress Monitor plugin checks your site from the inside — detecting file injections, rogue admin users, outdated plugins, suspicious pages, and more. Get alerted before hackers cause damage.',
  alternates: { canonical: 'https://uptrue.io/monitoring/wordpress-site-monitor' },
  openGraph: {
    title: 'WordPress Site Monitor — Plugin-Based Security & Health Monitoring | Uptrue',
    description: 'Detect file injections, rogue admin users, outdated plugins, and suspicious content — from inside your WordPress site. Free Uptrue plugin.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Uptrue WordPress Monitor',
  description: 'A lightweight WordPress plugin that monitors your site from the inside — detecting file injections, rogue admin users, outdated plugins, and suspicious pages.',
  url: 'https://uptrue.io/monitoring/wordpress-site-monitor',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'WordPress',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', description: 'Free plan available' },
  publisher: { '@type': 'Organization', name: 'Uptrue', url: 'https://uptrue.io' },
}

const threats = [
  {
    icon: '🦠',
    title: 'File Injection Attacks',
    desc: 'PHP and JavaScript files planted in your uploads folder — the most common WordPress hack. Attackers upload shells disguised as images to run arbitrary code on your server.',
    severity: 'critical',
  },
  {
    icon: '👤',
    title: 'Rogue Admin Users',
    desc: 'New administrator accounts created without your knowledge. Attackers often create hidden admin users after an initial compromise to maintain access even after you change your password.',
    severity: 'critical',
  },
  {
    icon: '🔌',
    title: 'Outdated Plugins & Themes',
    desc: 'Over 90% of hacked WordPress sites were running outdated plugins with known vulnerabilities. Uptrue alerts you the moment an update is available — before attackers exploit the gap.',
    severity: 'high',
  },
  {
    icon: '📄',
    title: 'Suspicious & Foreign Pages',
    desc: 'SEO spam attacks create hundreds of hidden pages with foreign-language content (Russian, Chinese, Arabic) to hijack your search rankings. Uptrue detects these the moment they appear.',
    severity: 'high',
  },
  {
    icon: '⚙️',
    title: '.htaccess & wp-config Tampering',
    desc: 'Modifications to .htaccess and wp-config.php are a sign of a serious compromise — attackers use these to redirect visitors, hide malware, or extract database credentials.',
    severity: 'critical',
  },
  {
    icon: '🐛',
    title: 'Debug Mode Left On',
    desc: 'WordPress debug mode exposes sensitive error messages, file paths, and database structure to any visitor. It\'s frequently forgotten after a developer fixes an issue.',
    severity: 'medium',
  },
]

const howItWorks = [
  {
    step: '1',
    title: 'Install the free plugin',
    desc: 'Download uptrue-monitor.php, upload it to your wp-content/plugins folder, and activate it in WordPress Admin. Takes under 2 minutes.',
  },
  {
    step: '2',
    title: 'Connect to Uptrue',
    desc: 'Add your WordPress Monitor in Uptrue. You\'ll get a secure API token — paste it into Uptrue → Settings in your WordPress Admin.',
  },
  {
    step: '3',
    title: 'Plugin scans from inside',
    desc: 'WordPress Cron runs staggered security scans every hour — PHP files, JS files, .htaccess, core files, theme files. Each scan type runs independently to avoid server load spikes.',
  },
  {
    step: '4',
    title: 'Findings pushed to Uptrue',
    desc: 'The plugin pushes scan results to Uptrue via encrypted HTTPS. It works behind Cloudflare, CDNs, and firewalls — no inbound ports needed.',
  },
  {
    step: '5',
    title: 'Alerts fire on new threats',
    desc: 'Uptrue compares each snapshot to the previous one. New threats trigger alerts. Resolved threats are automatically closed. No noise, just signal.',
  },
]

const whyInternal = [
  {
    icon: '🔍',
    title: 'External tools can\'t see what\'s inside',
    desc: 'External uptime monitors only see your homepage. They can\'t detect a PHP shell in your uploads folder, a new admin user, or a modified wp-config.php — until it\'s too late.',
  },
  {
    icon: '🛡️',
    title: 'Works behind any firewall or CDN',
    desc: 'Because the plugin pushes data out (not the other way around), it works on any hosting — shared hosting, Cloudflare-protected sites, password-protected staging environments.',
  },
  {
    icon: '⚡',
    title: 'Zero impact on site performance',
    desc: 'Scans run via WordPress Cron — they happen in the background, staggered across hours. Your visitors never notice.',
  },
  {
    icon: '🤖',
    title: 'AI-powered remediation',
    desc: 'Every issue comes with an AI-generated plain-English explanation and step-by-step fix instructions — written for site owners, not developers.',
  },
]

const faq = [
  {
    q: 'Does this replace my security plugin (Wordfence, Sucuri, etc.)?',
    a: 'It complements them. Security plugins focus on blocking attacks in real time. Uptrue WordPress Monitor is about continuous visibility and alerting — knowing when something changed, getting notified, and having a dashboard that shows your site\'s health score over time. Many Uptrue users run both.',
  },
  {
    q: 'What happens if my WordPress site goes down?',
    a: 'Uptrue already monitors your site\'s HTTP uptime separately. If the site goes down, your standard uptime alerts fire. If the WP plugin stops pushing data, Uptrue will alert you after a configurable silence window — so you know the connection is broken.',
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
    q: 'I don\'t have an Uptrue account. Can I still use the plugin?',
    a: 'Yes. The plugin is useful even without Uptrue — it generates a monthly security report emailed to your WordPress admin email address. Connect to Uptrue for real-time alerts, a health score dashboard, and AI-powered fix instructions.',
  },
  {
    q: 'How many WordPress sites can I monitor?',
    a: 'Free plan: 1 site. Lite plan: 1 site. Builder plan: up to 5 sites. Scale plan: up to 20 sites. You can add more from your Uptrue dashboard.',
  },
  {
    q: 'What checks does the plugin run?',
    a: 'PHP files in uploads, JavaScript files in uploads, executable code patterns, .htaccess modifications, wp-config.php changes, WordPress core file changes, theme file changes, new admin/editor users, recently created pages, outdated plugins and themes, debug mode status, PHP version, and database size.',
  },
]

const severityBadge: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: '#fef2f2', color: '#dc2626', label: 'Critical' },
  high: { bg: '#fff7ed', color: '#ea580c', label: 'High' },
  medium: { bg: '#fefce8', color: '#ca8a04', label: 'Medium' },
  low: { bg: '#f0fdf4', color: '#16a34a', label: 'Low' },
  info: { bg: '#f8fafc', color: '#64748b', label: 'Info' },
}

export default function WordPressMonitorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0f1729 0%, #1a1f3a 50%, #0f2040 100%)',
        padding: '72px 24px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.07,
          backgroundImage: 'radial-gradient(circle at 30% 50%, #667eea 0%, transparent 60%), radial-gradient(circle at 70% 30%, #764ba2 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 820, margin: '0 auto', position: 'relative' }}>
          <nav style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href="/monitoring" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>All Monitor Types</Link>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            <span>WordPress Site Monitor</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1 }}>
              Plugin-Based · Agent Monitor
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', padding: '3px 10px', borderRadius: 20 }}>
              ✓ Works behind Cloudflare
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(30px, 5vw, 52px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#fff',
            lineHeight: 1.1,
            marginBottom: 18,
          }}>
            <span style={{ display: 'block', fontSize: '60%', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: 0, marginBottom: 6 }}>🔌</span>
            Uptrue WordPress Monitor
          </h1>
          <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, marginBottom: 10, maxWidth: 640 }}>
            External uptime tools only see your homepage. This plugin monitors from inside your WordPress site — detecting file injections, rogue users, and silent compromises before your visitors do.
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36 }}>
            Free 2-minute install · No inbound ports · Works on shared hosting
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              padding: '13px 28px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Add WordPress Monitor Free
            </Link>
            <a href="/downloads/uptrue-monitor.php" style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '13px 24px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Download Plugin
            </a>
          </div>
        </div>
      </section>

      {/* Health score preview */}
      <section style={{ background: '#f8faff', borderBottom: '1px solid #e8edf5', padding: '20px 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          {[
            { value: '100', label: 'Health Score', color: '#10b981' },
            { value: '6+', label: 'Threat Categories', color: '#667eea' },
            { value: '14', label: 'Checks Per Scan', color: '#f59e0b' },
            { value: '2 min', label: 'Setup Time', color: '#06b6d4' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '8px 20px' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* Why external monitoring isn't enough */}
        <section style={{ marginBottom: 64 }}>
          <LandingSection title="Why external monitoring isn't enough" icon="⚠️">
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Standard uptime monitors check whether your website responds to an HTTP request. That tells you if your site is reachable — but nothing about what's happening inside. Most WordPress compromises are invisible to external tools:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {whyInternal.map(item => (
                <div key={item.title} style={{
                  padding: '16px 18px',
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: 10,
                  display: 'flex',
                  gap: 14,
                }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
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
        <section style={{ marginBottom: 64 }}>
          <LandingSection title="What Uptrue WordPress Monitor detects" icon="🔍">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {threats.map(threat => (
                <div key={threat.title} style={{
                  padding: '16px 18px',
                  background: severityBadge[threat.severity].bg,
                  border: `1px solid ${severityBadge[threat.severity].color}22`,
                  borderLeft: `3px solid ${severityBadge[threat.severity].color}`,
                  borderRadius: 10,
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}>
                  <div style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{threat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{threat.title}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                        color: severityBadge[threat.severity].color,
                        background: `${severityBadge[threat.severity].color}18`,
                        padding: '2px 8px', borderRadius: 10,
                      }}>
                        {severityBadge[threat.severity].label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{threat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </LandingSection>
        </section>

        {/* Full checks list */}
        <section style={{ marginBottom: 64 }}>
          <LandingSection title="Every check Uptrue runs" icon="✓">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
              {[
                'PHP files in wp-content/uploads',
                'JavaScript files in wp-content/uploads',
                'Executable code patterns in uploads',
                '.htaccess modifications',
                'wp-config.php changes',
                'WordPress core file modifications',
                'Active theme file changes',
                'New administrator accounts',
                'New editor accounts',
                'Recently created pages (last 7 days)',
                'Foreign-language page content (SEO spam)',
                'Outdated plugins (with update available)',
                'Outdated active theme',
                'WordPress core version',
                'PHP version (flags end-of-life)',
                'Debug mode status (WP_DEBUG)',
                'Memory limit',
                'Database size',
              ].map((check, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '8px 12px',
                  background: 'var(--color-up-bg, #f0fdf4)',
                  border: '1px solid #bbf7d0',
                  borderRadius: 7,
                  fontSize: 13,
                }}>
                  <svg width="13" height="13" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{check}</span>
                </div>
              ))}
            </div>
          </LandingSection>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: 64 }}>
          <LandingSection title="How it works" icon="⚙️">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {howItWorks.map((step, i) => (
                <div key={step.step} style={{ display: 'flex', gap: 20, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 32 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: '#fff', fontWeight: 800, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, zIndex: 1,
                    }}>
                      {step.step}
                    </div>
                    {i < howItWorks.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: '#e5e7eb', marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < howItWorks.length - 1 ? 28 : 0, paddingTop: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>{step.title}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </LandingSection>
        </section>

        {/* Health score callout */}
        <div style={{
          marginBottom: 64,
          padding: '28px 32px',
          background: 'linear-gradient(135deg, #667eea12, #764ba210)',
          border: '1px solid #667eea30',
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
        <div style={{
          marginBottom: 64,
          padding: '24px 28px',
          background: 'var(--bg-card, #fff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          borderLeft: '3px solid #667eea',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>🤖 AI Security Report</div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
            On demand, Uptrue generates a plain-English AI security report for your WordPress site — explaining every open issue, ranking them by severity, and providing numbered step-by-step fix instructions. Written for business owners, not developers. Powered by Claude AI.
          </p>
        </div>

        {/* Alert conditions */}
        <section style={{ marginBottom: 64 }}>
          <LandingSection title="When Uptrue alerts you" icon="🔔">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { severity: 'critical', text: 'PHP or executable file detected in uploads folder' },
                { severity: 'critical', text: '.htaccess file modified since last scan' },
                { severity: 'critical', text: 'wp-config.php file modified since last scan' },
                { severity: 'critical', text: 'WordPress core file modified (may indicate compromise)' },
                { severity: 'high', text: 'New administrator account created' },
                { severity: 'high', text: 'Foreign-language page detected (SEO spam indicator)' },
                { severity: 'high', text: 'JavaScript file found in uploads folder' },
                { severity: 'high', text: 'Active theme files modified' },
                { severity: 'medium', text: 'Plugin update available (vulnerabilities exploited in the wild)' },
                { severity: 'medium', text: 'Active theme update available' },
                { severity: 'medium', text: 'PHP version end-of-life — no longer receiving security patches' },
                { severity: 'low', text: 'WordPress debug mode (WP_DEBUG) left enabled' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '10px 14px',
                  background: severityBadge[item.severity].bg,
                  border: `1px solid ${severityBadge[item.severity].color}22`,
                  borderRadius: 8,
                  fontSize: 14,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                    color: severityBadge[item.severity].color,
                    background: `${severityBadge[item.severity].color}18`,
                    padding: '2px 8px', borderRadius: 10, flexShrink: 0,
                    minWidth: 58, textAlign: 'center',
                  }}>
                    {severityBadge[item.severity].label}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </LandingSection>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 64 }}>
          <LandingSection title="Frequently asked questions" icon="💬">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--border, #e5e7eb)', borderRadius: 10, overflow: 'hidden' }}>
              {faq.map((item, i) => (
                <div key={i} style={{
                  padding: '18px 20px',
                  borderBottom: i < faq.length - 1 ? '1px solid var(--border, #e5e7eb)' : 'none',
                  background: 'var(--bg-card, #fff)',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{item.q}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.a}</div>
                </div>
              ))}
            </div>
          </LandingSection>
        </section>

        {/* Related monitors */}
        <section style={{ marginBottom: 64 }}>
          <LandingSection title="Pair with these monitors" icon="🔗">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {[
                { slug: 'http-uptime-monitoring', icon: '🌐', name: 'HTTP Uptime Monitoring' },
                { slug: 'ssl-certificate-monitoring', icon: '🔒', name: 'SSL Certificate Monitoring' },
                { slug: 'security-headers-monitoring', icon: '🛡️', name: 'Security Headers Monitoring' },
                { slug: 'keyword-monitoring', icon: '🔍', name: 'Keyword Detection' },
              ].map(rel => (
                <Link key={rel.slug} href={`/monitoring/${rel.slug}`} style={{
                  padding: '14px 16px',
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: 10,
                  textDecoration: 'none',
                  display: 'flex', gap: 10, alignItems: 'center',
                  fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                }}>
                  <span style={{ fontSize: 18 }}>{rel.icon}</span>
                  {rel.name}
                </Link>
              ))}
            </div>
          </LandingSection>
        </section>

        {/* Bottom CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: 16,
          padding: '40px 48px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>
            Start monitoring your WordPress site from the inside
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>
            Free plan · 2-minute plugin install · No inbound ports · Works on any WordPress host
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              background: '#fff',
              color: '#667eea',
              padding: '13px 32px',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 15,
              textDecoration: 'none',
            }}>
              Create Free Account →
            </Link>
            <a href="/downloads/uptrue-monitor.php" style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              padding: '13px 24px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
            }}>
              Download Plugin
            </a>
          </div>
        </div>

      </main>
      <PublicFooter />
    </>
  )
}

function LandingSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

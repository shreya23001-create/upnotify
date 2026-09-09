import '../landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Gauge, Plug, Sparkles, Lock, Radio, Landmark, ShieldCheck, MailCheck,
  Globe, Link2, Plug2, Bot, Ban, Zap, Calculator,
  Activity, ShieldAlert, Mail, ArrowRight, Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ScrollReveal } from '@/components/landing/scroll-reveal'
import Faq from '@/components/landing/faq'

export const metadata: Metadata = {
  title: 'Free Website Monitoring Tools — DNS, SSL, Speed, Security Headers | Upnotify',
  description:
    'Free website monitoring tools: SSL checker, DNS lookup, WHOIS, security headers, HTTP status checker, redirect chain tracer, SPF/DMARC, blacklist checker, speed test, robots.txt, port checker, uptime calculator, and the Upnotify WordPress plugin. No signup required.',
  alternates: { canonical: 'https://uptrue.io/tools' },
  openGraph: {
    title: 'Free Website Monitoring Tools | Upnotify',
    description:
      'DNS lookup, SSL checker, security headers, WHOIS, SPF/DMARC, speed test, and more — all free.',
    url: 'https://uptrue.io/tools',
    type: 'website',
  },
}

const FAQ = [
  {
    q: 'Are all of these tools really free?',
    a: 'Yes. Every tool on this page runs in your browser against our edge network — no signup, no email capture, no rate limit beyond basic abuse protection. You can run them on any public URL as many times as you want, and the results are shareable.',
  },
  {
    q: 'How are these tools different from continuous monitoring?',
    a: 'Each tool gives you a snapshot — the state of your site, certificate, or DNS records at the moment you click "check". Continuous monitoring runs the same checks every minute (or every 5 minutes) and alerts you the moment something changes. The Free Upnotify plan includes 3 continuous monitors with email alerts.',
  },
  {
    q: 'Which tool should I run first?',
    a: 'Run the Website Health Score — it bundles the five most important checks (uptime, SSL, DNS, security headers, performance) into a single A+ to F grade. It is the fastest way to spot what to fix first. From there, drill into individual tools (SSL Checker, Security Headers Checker, etc.) for the failing categories.',
  },
  {
    q: 'Do you store the results of my checks?',
    a: 'No. Tool results are computed on-demand and never persisted to a user account or shared with third parties. We may keep aggregate, anonymised counts for capacity planning, but never your specific URLs or results.',
  },
  {
    q: 'Can I embed a tool result on my own page?',
    a: 'Not yet — the tools are designed for one-off ad-hoc checks. If you need a permanent live status indicator, set up a public status page on the Free or Lite plan, or embed the badge from the Uptime Leaderboard if your site qualifies.',
  },
  {
    q: 'How do these tools relate to the WordPress plugin?',
    a: 'The browser tools check externally — what the public internet sees. The Upnotify WordPress plugin checks from inside your site, with privileged access to detect things external tools cannot: file injections, rogue admin users, plugin CVEs, brute force attacks, and security misconfigurations. The two are complementary.',
  },
]

const TOOLS: { slug: string; title: string; description: string; tag: string; href?: string; icon: LucideIcon; accent: string }[] = [
  {
    slug: 'score',
    href: '/score',
    title: 'Website Health Score',
    description:
      'Free multi-check grade across 5 categories — uptime, SSL, DNS, security headers, and performance. Enter any URL and get an instant A+ to F score with actionable recommendations. No signup required.',
    tag: 'Featured',
    icon: Gauge,
    accent: '#1392FB',
  },
  {
    slug: 'wordpress-monitor',
    href: '/monitoring/wordpress-site-monitor',
    title: 'WordPress Site Monitor Plugin',
    description:
      'Free plugin that monitors your WordPress site from the inside — detecting file injections, rogue admin users, foreign-language content, brute force attacks, security misconfigurations, and more. No inbound ports. Works behind Cloudflare.',
    tag: 'Free Plugin',
    icon: Plug,
    accent: '#0068DB',
  },
  {
    slug: 'ai-seo-checker',
    title: 'AI SEO Checker',
    description:
      'Is your website visible to ChatGPT, Perplexity, Claude, and Gemini? Get your AI readiness score, audit crawler access, generate your llms.txt, and see where to submit your site.',
    tag: 'New',
    icon: Sparkles,
    accent: '#ec4899',
  },
  {
    slug: 'ssl-checker',
    title: 'SSL Certificate Checker',
    description:
      'Check any SSL certificate instantly. See issuer, expiry date, days remaining, TLS version, and chain validity. Color-coded warnings for expiring certificates.',
    tag: 'Popular',
    icon: Lock,
    accent: '#3b82f6',
  },
  {
    slug: 'dns-lookup',
    title: 'DNS Lookup',
    description:
      'Look up A, AAAA, MX, NS, TXT, CNAME, and SOA records for any domain. Instant results with response time. No signup required.',
    tag: '',
    icon: Radio,
    accent: '#06b6d4',
  },
  {
    slug: 'whois-lookup',
    title: 'WHOIS Lookup',
    description:
      'Look up domain registration details, expiry date, registrar, nameservers, and RDAP data for any domain.',
    tag: '',
    icon: Landmark,
    accent: '#0068DB',
  },
  {
    slug: 'security-headers-checker',
    title: 'Security Headers Checker',
    description:
      'Check your website\'s security headers — HSTS, CSP, X-Frame-Options, CORS, Referrer-Policy, and more. Get a letter grade with missing header details.',
    tag: '',
    icon: ShieldCheck,
    accent: '#10b981',
  },
  {
    slug: 'spf-dmarc-checker',
    title: 'SPF & DMARC Checker',
    description:
      'Check your domain\'s SPF and DMARC email authentication records. See if your domain is protected against email spoofing and phishing.',
    tag: '',
    icon: MailCheck,
    accent: '#f59e0b',
  },
  {
    slug: 'http-status-checker',
    title: 'HTTP Status Code Checker',
    description:
      'Check any URL\'s HTTP response code, follow redirect chains, and inspect response headers. See 200, 301, 404, 500 and everything in between.',
    tag: '',
    icon: Globe,
    accent: '#3b82f6',
  },
  {
    slug: 'redirect-chain-checker',
    title: 'Redirect Chain Checker',
    description:
      'Trace the full redirect chain for any URL. Detect redirect loops, excessive hops, and SEO-damaging 302 redirects.',
    tag: '',
    icon: Link2,
    accent: '#06b6d4',
  },
  {
    slug: 'port-checker',
    title: 'Port Checker',
    description:
      'Check if any TCP port is open on any host. Test SSH, HTTP, HTTPS, SMTP, MySQL, PostgreSQL, Redis, and custom ports.',
    tag: '',
    icon: Plug2,
    accent: '#00873a',
  },
  {
    slug: 'robots-txt-checker',
    title: 'robots.txt Checker',
    description:
      'Fetch and analyse the robots.txt file for any website. See all rules, detect Googlebot blocks, missing sitemaps, and crawl issues.',
    tag: '',
    icon: Bot,
    accent: '#ea580c',
  },
  {
    slug: 'blacklist-checker',
    title: 'Blacklist Checker',
    description:
      'Check if your domain or IP is listed on major email blacklists — Spamhaus, SpamCop, Barracuda, SORBS, and more. Identify deliverability problems instantly.',
    tag: '',
    icon: Ban,
    accent: '#dc2626',
  },
  {
    slug: 'website-speed-test',
    title: 'Website Speed Test',
    description:
      'Test your website\'s speed. Measure TTFB, total load time, page size, compression, and CDN cache status. Get a grade and actionable performance tips.',
    tag: '',
    icon: Zap,
    accent: '#f59e0b',
  },
  {
    slug: 'uptime-calculator',
    title: 'Uptime & SLA Calculator',
    description:
      'Calculate allowed downtime for any uptime percentage. See how much downtime 99.9%, 99.99%, and other SLA levels actually mean in real time.',
    tag: '',
    icon: Calculator,
    accent: '#10b981',
  },
]

const CATEGORIES: { href: string; title: string; desc: string; icon: LucideIcon; accent: string }[] = [
  { href: '/tools/uptime', title: 'Uptime & Performance', desc: 'Status checker, speed test, health score, SLA calculator.', icon: Activity, accent: '#3b82f6' },
  { href: '/tools/security', title: 'Website Security', desc: 'SSL chain, security headers, blacklist, port checker.', icon: ShieldAlert, accent: '#dc2626' },
  { href: '/tools/dns', title: 'DNS & Email', desc: 'DNS lookup, WHOIS, SPF/DMARC authentication checker.', icon: Mail, accent: '#06b6d4' },
  { href: '/tools/ai-seo', title: 'AI & SEO', desc: 'AI SEO Checker, redirect chains, robots.txt audit.', icon: Sparkles, accent: '#ec4899' },
]

export default function ToolsIndexPage(): React.ReactElement {
  const featured = TOOLS.filter(t => t.tag === 'Featured' || t.tag === 'Free Plugin')
  const rest = TOOLS.filter(t => t.tag !== 'Featured' && t.tag !== 'Free Plugin')

  return (
    <div className="tools-page">
      <ScrollReveal />
      <div className="tools-hero">
        <h1 className="tools-hero-title reveal-title">Free Website Tools</h1>
        <p className="tools-hero-subtitle reveal-title">
          14 free tools and plugins for developers, sysadmins, and website owners — DNS, SSL, security headers, WHOIS, speed test, WordPress monitoring, and more. No signup required.
        </p>
      </div>

      <div className="tools-container">
        {/* Featured tools — larger cards with gradient border */}
        <div className="tools-featured-grid reveal-stagger">
          {featured.map((tool) => {
            const Icon = tool.icon
            return (
              <Link key={tool.slug} href={tool.href ?? `/tools/${tool.slug}`} className="tools-card tools-card-featured" style={{ '--tools-accent': tool.accent } as React.CSSProperties}>
                <div className="tools-card-header">
                  <span className="tools-card-icon" style={{ background: `linear-gradient(135deg, ${tool.accent}22, ${tool.accent}0a)`, color: tool.accent }}>
                    <Icon size={24} strokeWidth={2} />
                  </span>
                  {tool.tag && <span className="tools-card-tag" style={{ background: tool.accent }}>{tool.tag}</span>}
                </div>
                <h2 className="tools-card-title">{tool.title}</h2>
                <p className="tools-card-desc">{tool.description}</p>
                <span className="tools-card-link">
                  Use this tool <ArrowRight size={14} strokeWidth={2.5} />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="tools-grid reveal-stagger">
          {rest.map((tool) => {
            const Icon = tool.icon
            return (
              <Link key={tool.slug} href={tool.href ?? `/tools/${tool.slug}`} className="tools-card" style={{ '--tools-accent': tool.accent } as React.CSSProperties}>
                <div className="tools-card-header">
                  <span className="tools-card-icon" style={{ background: `linear-gradient(135deg, ${tool.accent}22, ${tool.accent}0a)`, color: tool.accent }}>
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  {tool.tag && <span className="tools-card-tag" style={{ background: tool.accent }}>{tool.tag}</span>}
                </div>
                <h2 className="tools-card-title">{tool.title}</h2>
                <p className="tools-card-desc">{tool.description}</p>
                <span className="tools-card-link">
                  Use this tool <ArrowRight size={13} strokeWidth={2.5} />
                </span>
              </Link>
            )
          })}
        </div>

        {/* Pillar landings — 4 categorised umbrella pages for SEO + navigation */}
        <section className="landing-section reveal">
          <div className="landing-container" style={{ maxWidth: 880 }}>
            <h2 className="landing-section-title">Browse by category</h2>
            <p className="landing-section-subtitle">
              Each category landing groups the relevant free tools, explains what
              they catch, and links to the matching continuous monitor types.
            </p>
            <div className="tools-category-grid reveal-stagger">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <Link key={cat.href} href={cat.href} className="tools-card tools-category-card" style={{ '--tools-accent': cat.accent } as React.CSSProperties}>
                    <span className="tools-card-icon" style={{ background: `linear-gradient(135deg, ${cat.accent}22, ${cat.accent}0a)`, color: cat.accent }}>
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <h3 className="tools-card-title" style={{ fontSize: 16 }}>{cat.title}</h3>
                    <p className="tools-card-desc">{cat.desc}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Related continuous monitors */}
        <section className="landing-section reveal">
          <div className="landing-container" style={{ maxWidth: 880 }}>
            <h2 className="landing-section-title">Turn any tool into a continuous monitor</h2>
            <p className="landing-section-subtitle">
              Each free tool above maps to a continuous monitor type. Set it up once,
              get alerted whenever the result changes:
            </p>
            <div className="wp-showcase-card" style={{ borderRadius: 16, padding: '8px 36px', marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {[
                { href: '/monitoring/http-uptime-monitoring', title: 'HTTP uptime monitoring', desc: 'Continuous version of the HTTP Status Checker.' },
                { href: '/monitoring/ssl-certificate-monitoring', title: 'SSL certificate monitoring', desc: 'Continuous version of the SSL Certificate Checker.' },
                { href: '/monitoring/dns-monitoring', title: 'DNS record monitoring', desc: 'Continuous version of DNS Lookup.' },
                { href: '/monitoring/security-headers-monitoring', title: 'Security headers monitoring', desc: 'Continuous version of the Security Headers Checker.' },
                { href: '/monitoring/spf-dmarc-monitoring', title: 'SPF/DMARC monitoring', desc: 'Continuous version of the SPF & DMARC Checker.' },
                { href: '/monitoring/blacklist-monitoring', title: 'Blacklist monitoring', desc: 'Continuous version of the Blacklist Checker.' },
                { href: '/monitoring/redirect-chain-monitoring', title: 'Redirect chain monitoring', desc: 'Continuous version of the Redirect Chain Checker.' },
                { href: '/monitoring/response-time-monitoring', title: 'Response time monitoring', desc: 'Continuous version of the Website Speed Test.' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="wp-hiw-cell" style={{ padding: '28px 20px', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{
                      width: 20, height: 20, flexShrink: 0, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(22,163,74,0.12)', color: '#16a34a',
                    }}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span className="wp-showcase-title" style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</span>
                  </div>
                  <div className="wp-showcase-desc" style={{ fontSize: 13.5, lineHeight: 1.65 }}>{item.desc}</div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link href="/monitoring" style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>See all 24 monitor types &rarr;</Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <Faq
          items={FAQ.map(item => ({ question: item.q, answer: item.a }))}
          headline="Frequently asked questions"
        />

        {/* JSON-LD FAQPage schema mirroring the FAQ array above */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            }),
          }}
        />

        <div className="tools-cta reveal">
          <h2>Monitor your website 24/7</h2>
          <p>
            Go beyond one-time checks. Get continuous monitoring with instant alerts.
            The Free plan includes 3 monitors — no credit card required.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </Link>
        </div>
      </div>
    </div>
  )
}

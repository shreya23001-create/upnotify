import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Free Website Monitoring Tools — DNS, SSL, Speed, Security Headers | Uptrue',
  description:
    'Free tools for website owners and developers: SSL checker, DNS lookup, WHOIS, security headers, HTTP status checker, redirect chain tracer, SPF/DMARC checker, blacklist checker, speed test, and more. No signup required.',
  alternates: { canonical: 'https://uptrue.io/tools' },
  openGraph: {
    title: 'Free Website Monitoring Tools | Uptrue',
    description:
      'DNS lookup, SSL checker, security headers, WHOIS, SPF/DMARC, speed test, and more — all free.',
    url: 'https://uptrue.io/tools',
    type: 'website',
  },
}

const TOOLS: { slug: string; title: string; description: string; tag: string; href?: string }[] = [
  {
    slug: 'wordpress-monitor',
    href: '/monitoring/wordpress-site-monitor',
    title: 'WordPress Site Monitor Plugin',
    description:
      'Free plugin that monitors your WordPress site from the inside — detecting file injections, rogue admin users, foreign-language content, brute force attacks, security misconfigurations, and more. No inbound ports. Works behind Cloudflare.',
    tag: 'Free Plugin',
  },
  {
    slug: 'ai-seo-checker',
    title: 'AI SEO Checker',
    description:
      'Is your website visible to ChatGPT, Perplexity, Claude, and Gemini? Get your AI readiness score, audit crawler access, generate your llms.txt, and see where to submit your site.',
    tag: 'New',
  },
  {
    slug: 'ssl-checker',
    title: 'SSL Certificate Checker',
    description:
      'Check any SSL certificate instantly. See issuer, expiry date, days remaining, TLS version, and chain validity. Color-coded warnings for expiring certificates.',
    tag: 'Popular',
  },
  {
    slug: 'dns-lookup',
    title: 'DNS Lookup',
    description:
      'Look up A, AAAA, MX, NS, TXT, CNAME, and SOA records for any domain. Instant results with response time. No signup required.',
    tag: '',
  },
  {
    slug: 'whois-lookup',
    title: 'WHOIS Lookup',
    description:
      'Look up domain registration details, expiry date, registrar, nameservers, and RDAP data for any domain.',
    tag: '',
  },
  {
    slug: 'security-headers-checker',
    title: 'Security Headers Checker',
    description:
      'Check your website\'s security headers — HSTS, CSP, X-Frame-Options, CORS, Referrer-Policy, and more. Get a letter grade with missing header details.',
    tag: '',
  },
  {
    slug: 'spf-dmarc-checker',
    title: 'SPF & DMARC Checker',
    description:
      'Check your domain\'s SPF and DMARC email authentication records. See if your domain is protected against email spoofing and phishing.',
    tag: '',
  },
  {
    slug: 'http-status-checker',
    title: 'HTTP Status Code Checker',
    description:
      'Check any URL\'s HTTP response code, follow redirect chains, and inspect response headers. See 200, 301, 404, 500 and everything in between.',
    tag: '',
  },
  {
    slug: 'redirect-chain-checker',
    title: 'Redirect Chain Checker',
    description:
      'Trace the full redirect chain for any URL. Detect redirect loops, excessive hops, and SEO-damaging 302 redirects.',
    tag: '',
  },
  {
    slug: 'port-checker',
    title: 'Port Checker',
    description:
      'Check if any TCP port is open on any host. Test SSH, HTTP, HTTPS, SMTP, MySQL, PostgreSQL, Redis, and custom ports.',
    tag: '',
  },
  {
    slug: 'robots-txt-checker',
    title: 'robots.txt Checker',
    description:
      'Fetch and analyse the robots.txt file for any website. See all rules, detect Googlebot blocks, missing sitemaps, and crawl issues.',
    tag: '',
  },
  {
    slug: 'blacklist-checker',
    title: 'Blacklist Checker',
    description:
      'Check if your domain or IP is listed on major email blacklists — Spamhaus, SpamCop, Barracuda, SORBS, and more. Identify deliverability problems instantly.',
    tag: '',
  },
  {
    slug: 'website-speed-test',
    title: 'Website Speed Test',
    description:
      'Test your website\'s speed. Measure TTFB, total load time, page size, compression, and CDN cache status. Get a grade and actionable performance tips.',
    tag: '',
  },
  {
    slug: 'uptime-calculator',
    title: 'Uptime & SLA Calculator',
    description:
      'Calculate allowed downtime for any uptime percentage. See how much downtime 99.9%, 99.99%, and other SLA levels actually mean in real time.',
    tag: '',
  },
]

export default function ToolsIndexPage(): React.ReactElement {
  return (
    <div className="tools-page">
      <div className="tools-hero">
        <h1 className="tools-hero-title">Free Website Tools</h1>
        <p className="tools-hero-subtitle">
          14 free tools and plugins for developers, sysadmins, and website owners — DNS, SSL, security headers, WHOIS, speed test, WordPress monitoring, and more. No signup required.
        </p>
      </div>

      <div className="tools-container">
        <div className="tools-grid">
          {TOOLS.map((tool) => (
            <Link key={tool.slug} href={tool.href ?? `/tools/${tool.slug}`} className="tools-card">
              <div className="tools-card-header">
                <h2 className="tools-card-title">{tool.title}</h2>
                {tool.tag && <span className="tools-card-tag">{tool.tag}</span>}
              </div>
              <p className="tools-card-desc">{tool.description}</p>
              <span className="tools-card-link">Use this tool &rarr;</span>
            </Link>
          ))}
        </div>

        <div className="tools-cta">
          <h2>Monitor your website 24/7</h2>
          <p>Go beyond one-time checks. Get continuous monitoring with instant alerts.</p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </a>
        </div>
      </div>
    </div>
  )
}

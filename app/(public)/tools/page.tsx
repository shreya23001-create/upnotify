import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Free Website Monitoring Tools — DNS, SSL, Speed, Security Headers | Uptrue',
  description:
    'Free website monitoring tools: SSL checker, DNS lookup, WHOIS, security headers, HTTP status checker, redirect chain tracer, SPF/DMARC, blacklist checker, speed test, robots.txt, port checker, uptime calculator, and the Uptrue WordPress plugin. No signup required.',
  alternates: { canonical: 'https://uptrue.io/tools' },
  openGraph: {
    title: 'Free Website Monitoring Tools | Uptrue',
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
    a: 'Each tool gives you a snapshot — the state of your site, certificate, or DNS records at the moment you click "check". Continuous monitoring runs the same checks every minute (or every 5 minutes) and alerts you the moment something changes. The Free Uptrue plan includes 3 continuous monitors with email alerts.',
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
    a: 'The browser tools check externally — what the public internet sees. The Uptrue WordPress plugin checks from inside your site, with privileged access to detect things external tools cannot: file injections, rogue admin users, plugin CVEs, brute force attacks, and security misconfigurations. The two are complementary.',
  },
]

const TOOLS: { slug: string; title: string; description: string; tag: string; href?: string }[] = [
  {
    slug: 'score',
    href: '/score',
    title: 'Website Health Score',
    description:
      'Free multi-check grade across 5 categories — uptime, SSL, DNS, security headers, and performance. Enter any URL and get an instant A+ to F score with actionable recommendations. No signup required.',
    tag: 'Featured',
  },
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

        {/* Pillar landings — 4 categorised umbrella pages for SEO + navigation */}
        <section className="landing-section">
          <div className="landing-container" style={{ maxWidth: 880 }}>
            <h2 className="landing-section-title">Browse by category</h2>
            <p className="landing-section-subtitle">
              Each category landing groups the relevant free tools, explains what
              they catch, and links to the matching continuous monitor types.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
              marginTop: 24,
            }}>
              <Link href="/tools/uptime" className="tools-card">
                <div className="tools-card-header">
                  <h3 className="tools-card-title" style={{ fontSize: 16 }}>Uptime &amp; Performance</h3>
                </div>
                <p className="tools-card-desc">Status checker, speed test, health score, SLA calculator.</p>
              </Link>
              <Link href="/tools/security" className="tools-card">
                <div className="tools-card-header">
                  <h3 className="tools-card-title" style={{ fontSize: 16 }}>Website Security</h3>
                </div>
                <p className="tools-card-desc">SSL chain, security headers, blacklist, port checker.</p>
              </Link>
              <Link href="/tools/dns" className="tools-card">
                <div className="tools-card-header">
                  <h3 className="tools-card-title" style={{ fontSize: 16 }}>DNS &amp; Email</h3>
                </div>
                <p className="tools-card-desc">DNS lookup, WHOIS, SPF/DMARC authentication checker.</p>
              </Link>
              <Link href="/tools/ai-seo" className="tools-card">
                <div className="tools-card-header">
                  <h3 className="tools-card-title" style={{ fontSize: 16 }}>AI &amp; SEO</h3>
                </div>
                <p className="tools-card-desc">AI SEO Checker, redirect chains, robots.txt audit.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Related continuous monitors */}
        <section className="landing-section">
          <div className="landing-container" style={{ maxWidth: 880 }}>
            <h2 className="landing-section-title">Turn any tool into a continuous monitor</h2>
            <p className="landing-section-subtitle">
              Each free tool above maps to a continuous monitor type. Set it up once,
              get alerted whenever the result changes:
            </p>
            <ul className="about-list" style={{ marginTop: 24, fontSize: 15, lineHeight: 1.9 }}>
              <li><Link href="/monitoring/http-uptime-monitoring">HTTP uptime monitoring</Link> — continuous version of HTTP Status Checker.</li>
              <li><Link href="/monitoring/ssl-certificate-monitoring">SSL certificate monitoring</Link> — continuous version of SSL Certificate Checker.</li>
              <li><Link href="/monitoring/dns-monitoring">DNS record monitoring</Link> — continuous version of DNS Lookup.</li>
              <li><Link href="/monitoring/security-headers-monitoring">Security headers monitoring</Link> — continuous version of Security Headers Checker.</li>
              <li><Link href="/monitoring/spf-dmarc-monitoring">SPF/DMARC monitoring</Link> — continuous version of SPF & DMARC Checker.</li>
              <li><Link href="/monitoring/blacklist-monitoring">Blacklist monitoring</Link> — continuous version of Blacklist Checker.</li>
              <li><Link href="/monitoring/redirect-chain-monitoring">Redirect chain monitoring</Link> — continuous version of Redirect Chain Checker.</li>
              <li><Link href="/monitoring/response-time-monitoring">Response time monitoring</Link> — continuous version of Website Speed Test.</li>
              <li><Link href="/monitoring">See all 24 monitor types &rarr;</Link></li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="landing-section" style={{ background: 'var(--bg-muted)' }}>
          <div className="landing-container" style={{ maxWidth: 760 }}>
            <h2 className="landing-section-title">Frequently asked questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
              {FAQ.map((item, i) => (
                <div key={i} style={{ padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{item.q}</h3>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

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

        <div className="tools-cta">
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

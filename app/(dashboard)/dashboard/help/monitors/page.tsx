'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { HelpSidebar } from '../help-sidebar'

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What types of monitors does Upnotify support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Upnotify supports 24 monitor types across two tiers. Core monitors: HTTP/HTTPS Uptime, SSL Certificate, DNS Records, Keyword Detection, Domain Expiry, Port Check, Ping/Reachability, API Endpoint, Heartbeat, and Page Change Detection. Advanced monitors: Security Headers, Response Time Threshold, robots.txt Change, IP Address Change, MX Health, WHOIS Registrar Change, Sitemap Validity, Redirect Chain, SPF/DMARC Validity, Blacklist Check, Page Size, Cookie Consent Presence, and Nameserver Change.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is two-confirmation detection?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When a check fails, Upnotify waits 30 seconds and runs a second check from a different region. Only if both checks fail does it open an incident and alert you. This prevents false alarms from momentary network hiccups.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often does Upnotify check my website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Check intervals depend on the monitor type — most run as often as every minute. There is no free plan; every website subscription includes full monitor coverage.',
      },
    },
  ],
}

export default function MonitorsPage(): React.ReactElement {
  const pathname = usePathname()

  return (
    <div className="help-layout">
      <HelpSidebar currentPath={pathname} />
      <div className="help-main">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
        />

        <nav className="help-breadcrumb" aria-label="Breadcrumb">
          <Link href="/dashboard/help">Help Center</Link>
          <span className="help-breadcrumb-sep">/</span>
          <span>Understanding Monitors</span>
        </nav>

        <article className="help-article">
          <div className="help-article-hero">
            <h1 className="help-article-title">Understanding Monitors</h1>
            <p className="help-article-intro">
              A monitor keeps an eye on something important so you do not have to. You tell it what
              to watch, how often to check, and what counts as a problem. Upnotify handles the rest.
            </p>
          </div>

          <section className="help-section">
            <h2 className="help-section-title">The 24 monitor types</h2>
            <p>
              Different things can go wrong with a website, so Upnotify gives you different tools
              to catch them. Monitors are grouped into two tiers: core monitors that every site
              needs, and advanced monitors for security, compliance, and change detection.
            </p>

            <h3 style={{ fontSize: 17, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>Core monitors</h3>
            <ol className="help-steps">
              <li>
                <strong>🌐 HTTP/HTTPS Uptime</strong> — The bread and butter. Checks if your page
                is reachable and returning a healthy status code. Use this for any website or web app.
              </li>
              <li>
                <strong>🔒 SSL Certificate</strong> — Checks whether your HTTPS certificate is valid
                and warns you before it expires. An expired SSL certificate shows a full-screen browser
                warning to every visitor.
              </li>
              <li>
                <strong>📡 DNS Records</strong> — Watches your DNS records (A, MX, NS, TXT) and
                alerts you if they change unexpectedly. Catches hijacking and misconfiguration.
              </li>
              <li>
                <strong>🔍 Keyword Detection</strong> — Loads your page and checks for words or phrases
                that should (or should not) be there. Great for catching broken checkouts, injected
                spam, error pages, and content changes.
              </li>
              <li>
                <strong>📅 Domain Expiry</strong> — Tracks when your domain name expires. Forgetting
                to renew a domain can take your entire site offline and give it to squatters.
              </li>
              <li>
                <strong>🔌 Port Check</strong> — Checks whether a specific TCP port (like 3306 for
                MySQL or 5432 for PostgreSQL) is open and accepting connections.
              </li>
              <li>
                <strong>📶 Ping / Reachability</strong> — Sends an ICMP ping to confirm basic network
                reachability. The simplest possible check — useful for servers and infrastructure.
              </li>
              <li>
                <strong>⚡ API Endpoint</strong> — Sends a request to your API with custom headers and
                method, and validates the response status or body. Great for keeping your backend healthy.
              </li>
              <li>
                <strong>💓 Heartbeat</strong> — Works in reverse: your server pings Upnotify at regular
                intervals. If the heartbeat stops, you get alerted. Perfect for cron jobs and
                background tasks.
              </li>
              <li>
                <strong>👁️ Page Change Detection</strong> — Takes a snapshot of any page and alerts you
                when the content changes. Monitor your own pages for unexpected edits, or track
                competitor pricing and announcements.
              </li>
            </ol>

            <h3 style={{ fontSize: 17, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>Advanced monitors</h3>
            <ol className="help-steps">
              <li>
                <strong>🛡️ Security Headers</strong> — Checks your HTTP response headers for critical
                security settings like CSP, HSTS, and X-Frame-Options. Missing headers leave your site
                vulnerable to clickjacking and XSS attacks.
              </li>
              <li>
                <strong>⏱️ Response Time Threshold</strong> — Measures your page response time and alerts
                when it exceeds your threshold. Slow pages hurt SEO rankings and conversion rates.
              </li>
              <li>
                <strong>🤖 robots.txt Change</strong> — Monitors your robots.txt file and alerts when it
                changes. An accidental &ldquo;Disallow: /&rdquo; can block all search engines within hours.
              </li>
              <li>
                <strong>📍 IP Address Change</strong> — Tracks which IP your domain resolves to. Alerts
                you when it changes — catching DNS hijacking, CDN misconfigurations, and unexpected
                server migrations.
              </li>
              <li>
                <strong>📬 MX Health</strong> — Checks your MX records and mail server connectivity.
                Silent email failures — missed enquiries, failed password resets — often go unnoticed
                for days.
              </li>
              <li>
                <strong>🏛️ WHOIS Registrar Change</strong> — Monitors your WHOIS record and alerts if
                registrar or ownership details change. Domain theft is real — detect it before it is
                too late.
              </li>
              <li>
                <strong>🗺️ Sitemap Validity</strong> — Fetches and validates your XML sitemap. A broken
                sitemap means search engines discover your new pages more slowly or miss them entirely.
              </li>
              <li>
                <strong>🔗 Redirect Chain</strong> — Follows your URL&rsquo;s redirect hops and alerts on
                chains that are too long, end in errors, or form loops. Excessive redirects slow your
                site and dilute PageRank.
              </li>
              <li>
                <strong>✉️ SPF / DMARC Validity</strong> — Validates your email authentication DNS records.
                Without valid SPF and DMARC, anyone can send emails pretending to be from your domain.
              </li>
              <li>
                <strong>🚫 Blacklist Check</strong> — Checks your domain and IP against major email and
                web blacklists (Spamhaus, SpamCop, Barracuda). Being listed silently destroys email
                deliverability.
              </li>
              <li>
                <strong>📦 Page Size</strong> — Monitors your page&rsquo;s transfer size and alerts when it
                grows beyond your threshold. Page bloat hurts Core Web Vitals and mobile load times.
              </li>
              <li>
                <strong>🍪 Cookie Consent Presence</strong> — Checks that your cookie consent banner is
                present on every check. A missing banner is a potential GDPR compliance failure.
              </li>
              <li>
                <strong>🌐 Nameserver Change</strong> — Monitors the authoritative nameservers for your
                domain. A nameserver change gives attackers full control over all your DNS records.
              </li>
            </ol>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Check intervals explained</h2>
            <p>
              The check interval is how often Upnotify visits your site. Shorter intervals mean
              faster detection, but they use more of your plan&rsquo;s allowance.
            </p>
            <ul className="help-list">
              <li><strong>Free</strong> -- every 10 minutes</li>
              <li><strong>Lite &amp; Builder</strong> -- every 1 minute</li>
              <li><strong>Scale</strong> -- every 1 minute</li>
            </ul>
            <p>
              For most websites, 1-minute checks strike the right balance between speed and
              detection speed. Scale plan checks run continuously so you catch issues as fast
              as possible.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Two-confirmation detection</h2>
            <p>
              Nobody likes false alarms. That is why Upnotify uses a two-step process before
              declaring a site down:
            </p>
            <ol className="help-steps">
              <li>The first check fails -- maybe your site returned an error or timed out.</li>
              <li>Upnotify waits 30 seconds, then runs a second check from a different region.</li>
              <li>If the second check also fails, Upnotify opens an incident and sends your alerts.</li>
              <li>If the second check succeeds, Upnotify logs it as a &ldquo;flap&rdquo; (a brief hiccup) and moves on.</li>
            </ol>
            <p>
              This means you only get woken up when there is a real problem, not because of a
              momentary network blip.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Pause, resume, and delete</h2>
            <ul className="help-list">
              <li><strong>Pause</strong> -- Temporarily stops checking. Useful during planned maintenance. Your data is preserved.</li>
              <li><strong>Resume</strong> -- Starts checking again from where you left off.</li>
              <li><strong>Delete</strong> -- Permanently removes the monitor and all its check history. This cannot be undone.</li>
            </ul>
            <p>
              You can pause and resume monitors from the dashboard or the monitor detail page.
              Paused monitors do not count towards your plan limit.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Keyword monitoring in depth</h2>
            <p>
              The keyword monitor is one of the most powerful tools in Upnotify. Instead of just
              checking if a page loads, it checks <em>what</em> is on the page. Here is how to
              set it up properly.
            </p>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Positive keywords (must exist)</h3>
            <p>
              These are words or phrases that should always be on the page. If any of them
              disappear, Upnotify treats it as a failure and alerts you.
            </p>
            <ul className="help-list">
              <li><strong>Checkout page:</strong> &quot;Place Order&quot;, &quot;Secure Payment&quot;, &quot;Add to Cart&quot;</li>
              <li><strong>Login page:</strong> &quot;Sign In&quot;, &quot;Password&quot;</li>
              <li><strong>Status page:</strong> &quot;operational&quot;, &quot;healthy&quot;</li>
            </ul>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Negative keywords (must not exist)</h3>
            <p>
              These are words that should never appear on the page. If any of them show up,
              something has gone wrong. Common examples:
            </p>
            <ul className="help-list">
              <li><strong>Error indicators:</strong> &quot;fatal error&quot;, &quot;server error&quot;, &quot;database error&quot;</li>
              <li><strong>Spam injection:</strong> &quot;viagra&quot;, &quot;casino&quot; (signs your site has been hacked)</li>
              <li><strong>Stock issues:</strong> &quot;out of stock&quot;, &quot;unavailable&quot;</li>
            </ul>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Smart suggestions</h3>
            <p>
              When you enter a URL, Upnotify automatically suggests relevant keywords based on
              the page type. For example, a checkout page will suggest &quot;Place Order&quot; as a
              positive keyword and &quot;error&quot; as a negative keyword. Click any suggestion to add
              it, or type your own.
            </p>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Important: use the full page URL</h3>
            <p>
              Unlike HTTP monitors where you enter just a domain, keyword monitors need the
              full page URL. For example, use <code>https://yourshop.com/checkout</code> instead
              of just <code>yourshop.com</code>. The keywords are checked against the specific
              page content at that URL.
            </p>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Example: monitoring a checkout page</h3>
            <ol className="help-steps">
              <li>Create a new keyword monitor</li>
              <li>Enter the full checkout URL: <code>https://myshop.com/checkout</code></li>
              <li>Add positive keywords: &quot;Place Order&quot;, &quot;Checkout&quot;, &quot;Secure Payment&quot;</li>
              <li>Add negative keywords: &quot;error&quot;, &quot;failed&quot;, &quot;out of stock&quot;</li>
              <li>Set check interval to 1 minute and severity to P1 (Critical)</li>
              <li>Upnotify will alert you immediately if the checkout breaks or shows errors</li>
            </ol>
          </section>

          <div className="help-next-links">
            <p className="help-next-label">Next up</p>
            <Link href="/dashboard/help/alerts" className="help-next-link">
              Setting Up Alerts &rarr;
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}

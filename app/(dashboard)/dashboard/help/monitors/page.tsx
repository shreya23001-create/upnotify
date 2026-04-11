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
      name: 'What types of monitors does Uptrue support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Uptrue supports 10 monitor types: HTTP, SSL Certificate, Domain Expiry, DNS Record, Keyword, Port, API Endpoint, Ping, Heartbeat, and Competitor.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is two-confirmation detection?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When a check fails, Uptrue waits 30 seconds and runs a second check from a different region. Only if both checks fail does it open an incident and alert you. This prevents false alarms from momentary network hiccups.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often does Uptrue check my website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Check intervals depend on your plan. Free plans check every 10 minutes. Lite, Builder, and Scale plans check every 1 minute.',
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
          <h1 className="help-article-title">Understanding Monitors</h1>
          <p className="help-article-intro">
            A monitor keeps an eye on something important so you do not have to. You tell it what
            to watch, how often to check, and what counts as a problem. Uptrue handles the rest.
          </p>

          <section className="help-section">
            <h2 className="help-section-title">The 10 monitor types</h2>
            <p>
              Different things can go wrong with a website, so Uptrue gives you different tools
              to catch them. Here is what each type does:
            </p>
            <ol className="help-steps">
              <li>
                <strong>HTTP</strong> -- The bread and butter. Loads your page and checks for a
                successful response (status 200). Use this for any website or web app.
              </li>
              <li>
                <strong>SSL Certificate</strong> -- Checks whether your HTTPS certificate is valid
                and warns you before it expires. An expired SSL certificate scares visitors away
                with browser warnings.
              </li>
              <li>
                <strong>Domain Expiry</strong> -- Tracks when your domain name expires. Forgetting
                to renew a domain can take your entire site offline.
              </li>
              <li>
                <strong>DNS Record</strong> -- Watches your DNS records (A, CNAME, MX, etc.) and
                alerts you if they change unexpectedly. Useful for catching hijacking or
                misconfiguration.
              </li>
              <li>
                <strong>Keyword</strong> -- Loads your page and checks for words or phrases
                that should (or should not) be there. You can set <em>positive keywords</em>
                (must exist on the page) and <em>negative keywords</em> (must not exist). If
                any positive keyword disappears or any negative keyword appears, Uptrue alerts
                you immediately. Great for catching broken checkouts, injected spam, error
                pages, and content changes.
              </li>
              <li>
                <strong>Port</strong> -- Checks whether a specific port (like 3306 for MySQL or
                5432 for PostgreSQL) is open and accepting connections.
              </li>
              <li>
                <strong>API Endpoint</strong> -- Sends a request to your API and validates the
                response status, body, or headers. Great for making sure your backend is healthy.
              </li>
              <li>
                <strong>Ping</strong> -- Sends an ICMP ping to check basic network reachability.
                The simplest possible check.
              </li>
              <li>
                <strong>Heartbeat</strong> -- Works the other way round. Instead of Uptrue
                checking your server, your server pings Uptrue at regular intervals. If the
                heartbeat stops, you get alerted. Perfect for cron jobs and background tasks.
              </li>
              <li>
                <strong>Competitor</strong> -- Monitors a competitor&rsquo;s site so you know when
                they go down. Not for anything nefarious -- just good situational awareness.
              </li>
            </ol>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Check intervals explained</h2>
            <p>
              The check interval is how often Uptrue visits your site. Shorter intervals mean
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
              Nobody likes false alarms. That is why Uptrue uses a two-step process before
              declaring a site down:
            </p>
            <ol className="help-steps">
              <li>The first check fails -- maybe your site returned an error or timed out.</li>
              <li>Uptrue waits 30 seconds, then runs a second check from a different region.</li>
              <li>If the second check also fails, Uptrue opens an incident and sends your alerts.</li>
              <li>If the second check succeeds, Uptrue logs it as a &ldquo;flap&rdquo; (a brief hiccup) and moves on.</li>
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
              The keyword monitor is one of the most powerful tools in Uptrue. Instead of just
              checking if a page loads, it checks <em>what</em> is on the page. Here is how to
              set it up properly.
            </p>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Positive keywords (must exist)</h3>
            <p>
              These are words or phrases that should always be on the page. If any of them
              disappear, Uptrue treats it as a failure and alerts you.
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
              When you enter a URL, Uptrue automatically suggests relevant keywords based on
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
              <li>Uptrue will alert you immediately if the checkout breaks or shows errors</li>
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

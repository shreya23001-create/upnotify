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
      name: 'What alert channels does Uptrue support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Uptrue supports email, Slack, Microsoft Teams, and webhook alerts. The Free plan includes email only. Lite and above unlock all channels.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are Uptrue severity levels?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Uptrue uses four severity levels: P1 (Critical, full outage), P2 (High, major feature broken), P3 (Medium, degraded performance), and P4 (Low, minor issues). You can customise which severity levels trigger which alert channels.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I send alerts to Slack?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. On Lite plans and above, you can connect a Slack workspace and choose which channel receives alerts. You will need to create an incoming webhook in Slack and paste the URL into Uptrue.',
      },
    },
  ],
}

export default function AlertsPage(): React.ReactElement {
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
          <span>Setting Up Alerts</span>
        </nav>

        <article className="help-article">
          <h1 className="help-article-title">Setting Up Alerts</h1>
          <p className="help-article-intro">
            Monitoring without alerts is like a smoke detector without a siren. Alerts make sure
            the right people know the moment something breaks, wherever they are.
          </p>

          <section className="help-section">
            <h2 className="help-section-title">Alert channels</h2>
            <p>
              An alert channel is where Uptrue sends notifications when a monitor detects a
              problem. You can set up as many channels as you like and assign them to different
              monitors.
            </p>

            <h3 className="help-subsection-title">Email</h3>
            <p>
              The simplest option. Enter the email addresses of the people who should be notified.
              Available on all plans, including Free.
            </p>

            <h3 className="help-subsection-title">Slack</h3>
            <p>
              Get alerts right in your team&rsquo;s Slack channel. You will need to create an
              incoming webhook in your Slack workspace and paste the URL into Uptrue. Messages
              include the monitor name, status, response time, and a direct link to the incident.
            </p>

            <h3 className="help-subsection-title">Microsoft Teams</h3>
            <p>
              Similar to Slack. Create an incoming webhook connector in your Teams channel and
              paste the URL. Alerts show up as formatted cards with all the details you need.
            </p>

            <h3 className="help-subsection-title">Webhook</h3>
            <p>
              For developers who want full control. Uptrue sends a JSON payload to any URL you
              specify. Every webhook is signed with HMAC-SHA256 so you can verify it really came
              from Uptrue. Use this to trigger your own automations, PagerDuty, OpsGenie, or
              anything else.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Severity levels</h2>
            <p>
              Not every problem is equally urgent. Uptrue uses four severity levels so you can
              respond proportionally:
            </p>
            <ul className="help-list">
              <li><strong>P1 -- Critical</strong> -- Your site is completely down. All hands on deck.</li>
              <li><strong>P2 -- High</strong> -- A major feature is broken but the site is partially working.</li>
              <li><strong>P3 -- Medium</strong> -- Performance is degraded. Things are slow but functional.</li>
              <li><strong>P4 -- Low</strong> -- Minor issue. An SSL certificate expiring in 30 days, for example.</li>
            </ul>
            <p>
              You can customise which severity levels trigger which channels. For example, you
              might send P1 and P2 alerts to Slack and email, but only log P3 and P4 in the
              dashboard.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Plan restrictions</h2>
            <p>
              What you can use depends on your plan:
            </p>
            <ul className="help-list">
              <li><strong>Free</strong> -- Email alerts only.</li>
              <li><strong>Lite</strong> -- Email, Slack, Teams, and webhooks.</li>
              <li><strong>Builder</strong> -- Everything in Lite, plus webhooks.</li>
              <li><strong>Scale</strong> -- All channels, no limits.</li>
            </ul>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Smart Digest — fewer emails, same urgency</h2>
            <p>
              Smart Digest is the default alert delivery mode for all Uptrue accounts. Instead of sending
              one email per event (which causes an email storm during outages), Smart Digest works like this:
            </p>
            <ul className="help-list">
              <li><strong>First event</strong> in a 30-minute window → sent <strong>instantly</strong>. You know within seconds.</li>
              <li><strong>Subsequent events</strong> in the same window → collected and rolled up into one digest email when the window closes.</li>
              <li><strong>Critical-severity events</strong> always bypass the window and send instantly regardless.</li>
            </ul>
            <p>
              The result is 80–95% fewer emails during incidents with no loss of urgency on the alert that matters most — the first one.
            </p>
            <p>
              You can switch back to per-event mode (one email per event) or adjust the digest window
              at any time from <Link href="/dashboard/alerts/notifications">Alerts → Notification Preferences</Link>.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Setting up a channel step by step</h2>
            <ol className="help-steps">
              <li>Go to <strong>Alert Channels</strong> in the sidebar.</li>
              <li>Click <strong>Add Channel</strong>.</li>
              <li>Choose the channel type (email, Slack, Teams, or webhook).</li>
              <li>Enter the required details -- an email address, webhook URL, etc.</li>
              <li>Click <strong>Test</strong> to send a test notification and make sure it works.</li>
              <li>Save the channel, then assign it to one or more monitors.</li>
            </ol>
            <p>
              We strongly recommend testing every channel before relying on it. Better to find a
              typo now than during a real incident.
            </p>
          </section>

          <div className="help-next-links">
            <p className="help-next-label">Next up</p>
            <Link href="/dashboard/help/status-pages" className="help-next-link">
              Public Status Pages &rarr;
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}

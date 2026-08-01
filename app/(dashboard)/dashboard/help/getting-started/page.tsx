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
      name: 'How do I create my first monitor in Uptrue?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Go to your dashboard, click "Add Monitor", enter your website URL, pick a check interval, and save. Uptrue starts monitoring immediately.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take for Uptrue to detect downtime?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Uptrue uses two-confirmation checks. When the first check fails, a second check runs 30 seconds later from a different region. If both fail, you are alerted. This avoids false alarms from temporary network blips.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use Uptrue for free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The Free plan includes 3 monitors with 10-minute check intervals and email alerts. No credit card required.',
      },
    },
  ],
}

export default function GettingStartedPage(): React.ReactElement {
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
          <span>Getting Started</span>
        </nav>

        <article className="help-article">
          <div className="help-article-hero">
            <h1 className="help-article-title">Getting Started with Uptrue</h1>
            <p className="help-article-intro">
              You signed up because you never want to be the last person to know your site is down.
              Good call. Let us get you set up in under five minutes.
            </p>
          </div>

          <section className="help-section">
            <h2 className="help-section-title">1. Create your first monitor</h2>
            <p>
              A monitor is like a watchdog for your website. It visits your site every few minutes
              and checks if everything is working. If something goes wrong, it barks -- well, it
              sends you an alert.
            </p>
            <ol className="help-steps">
              <li>Open your <strong>Dashboard</strong> and click <strong>Add Monitor</strong>.</li>
              <li>Paste your website URL (e.g. <code>https://yoursite.com</code>).</li>
              <li>Pick how often you want Uptrue to check -- every 1, 5, or 10 minutes.</li>
              <li>Choose a monitor type. <strong>HTTP</strong> is the most common and checks whether your page loads successfully.</li>
              <li>Hit <strong>Save</strong>. Your first check runs within seconds.</li>
            </ol>
            <p>
              That is it. You will see a green dot next to your site once the first check comes back healthy.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">2. Understand your dashboard</h2>
            <p>
              Your dashboard is mission control. Here is what you will see:
            </p>
            <ul className="help-list">
              <li><strong>Status dots</strong> -- green means up, red means down, yellow means degraded.</li>
              <li><strong>Response time</strong> -- how fast your site responded, in milliseconds.</li>
              <li><strong>Uptime percentage</strong> -- your site&rsquo;s reliability over the last 24 hours, 7 days, or 30 days.</li>
              <li><strong>Incident history</strong> -- a timeline of anything that went wrong and when it was resolved.</li>
            </ul>
            <p>
              Think of the dashboard as a health report card for every site you care about.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">3. Set up alerts</h2>
            <p>
              Monitoring is only useful if you actually find out when something breaks. Alerts make sure you do.
            </p>
            <ol className="help-steps">
              <li>Go to <strong>Alert Channels</strong> in the sidebar.</li>
              <li>Click <strong>Add Channel</strong>.</li>
              <li>Choose where you want notifications -- email, Slack, Microsoft Teams, or webhook.</li>
              <li>Follow the setup steps for your chosen channel.</li>
              <li>Assign the channel to the monitors you want it to cover.</li>
            </ol>
            <p>
              On the Free plan you get email alerts. Upgrade to Lite or above to unlock Slack, Teams, and webhooks.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">4. Create a status page</h2>
            <p>
              A status page is a public page that shows your customers whether your services are running
              smoothly. Instead of fielding support tickets asking &ldquo;Is it just me?&rdquo;, you can
              point people to one page with real-time answers.
            </p>
            <ol className="help-steps">
              <li>Go to <strong>Status Pages</strong> in the sidebar.</li>
              <li>Click <strong>Create Status Page</strong>.</li>
              <li>Give it a name and pick which monitors to display.</li>
              <li>Customise the look -- add your logo and brand colours.</li>
              <li>Share the link with your users or embed it on your site.</li>
            </ol>
            <p>
              Status pages are available on the Lite plan and above.
            </p>
          </section>

          <div className="help-next-links">
            <p className="help-next-label">Next up</p>
            <Link href="/dashboard/help/monitors" className="help-next-link">
              Understanding Monitors &rarr;
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}

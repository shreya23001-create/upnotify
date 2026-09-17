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
      name: 'What does Watchdog do in Upnotify?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Watchdog monitors the uptime and response time of competitor websites you choose, so you can compare their reliability against your own sites. You get side-by-side data showing who has better uptime and faster response times.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many sites can I track with Watchdog on each Upnotify plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The number of competitor sites you can track depends on your plan. There is no free plan — check your Plans page for your current limit.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Watchdog count towards my monitor limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Watchdog has its own separate limit. Your regular monitors and Watchdog sites are counted independently, so adding Watchdog sites does not reduce the number of monitors you can create.',
      },
    },
  ],
}

export default function WatchdogHelpPage(): React.ReactElement {
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
          <span>Watchdog — Competitor Tracking</span>
        </nav>

        <article className="help-article">
          <div className="help-article-hero">
            <h1 className="help-article-title">Watchdog — Competitor Tracking</h1>
            <p className="help-article-intro">
              Knowing your own uptime is good. Knowing how it compares to the
              competition is better. Watchdog lets you monitor any website —
              a direct competitor, an industry leader, or anyone you want to
              benchmark against — right inside your Upnotify dashboard.
            </p>
          </div>

          <section className="help-section">
            <h2 className="help-section-title">What Watchdog does</h2>
            <p>
              Upnotify checks the websites you add to Watchdog every few minutes,
              tracking their uptime and response time the same way it tracks your
              own monitors. You get a live side-by-side comparison showing who is
              more reliable and who is faster.
            </p>
            <p>
              You get real data, not guesswork. If a competitor goes down during
              peak hours and you stay up, that is a selling point. If they are
              consistently faster than you, you know where to invest.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">How to add a site to Watchdog</h2>
            <ol className="help-steps">
              <li>Go to <strong>Watchdog</strong> in the sidebar.</li>
              <li>Click <strong>Add Site</strong>.</li>
              <li>Enter their domain (e.g. <code>example.com</code>).</li>
              <li>Upnotify starts monitoring immediately — the first data point appears within minutes.</li>
            </ol>
            <p>
              You do not need an account with them or any special access. Watchdog
              checks their public-facing site the same way any visitor would.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Reading the Watchdog dashboard</h2>
            <p>The Watchdog dashboard shows:</p>
            <ul className="help-list">
              <li><strong>Uptime percentage</strong> — your site vs each tracked site over 24 hours, 7 days, or 30 days.</li>
              <li><strong>Average response time</strong> — how fast each site responds compared to yours.</li>
              <li><strong>Current status</strong> — green (up), red (down), or yellow (degraded) for each site at a glance.</li>
              <li><strong>Incident count</strong> — how many times each site went down in the selected period.</li>
            </ul>
            <p>Use the time range selector at the top to switch between daily, weekly, and monthly views.</p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Plan limits</h2>
            <p>
              The Pro Plan includes up to <strong>5 Watchdog slots</strong> — enough to track
              your key competitors alongside your own websites.
            </p>
            <p>
              Watchdog slots are separate from your monitor limits. Adding Watchdog
              sites does not reduce the number of regular monitors you can create.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Tips for getting the most from Watchdog</h2>
            <ul className="help-list">
              <li><strong>Track direct competitors</strong> — add the sites your customers would choose instead of yours, not random big-name sites.</li>
              <li><strong>Check weekly trends</strong> — a single bad day does not mean much. Look at the 30-day view for reliable comparisons.</li>
              <li><strong>Use it in sales calls</strong> — if your uptime is better than a competitor, show the data. It speaks louder than promises.</li>
              <li><strong>Spot patterns</strong> — if a site goes down every Tuesday at 2am, they probably have a maintenance window. That is useful intel.</li>
            </ul>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Important notice</h2>
            <p>
              Watchdog monitors publicly accessible URLs using standard HTTP requests — the same way any
              web browser or visitor would. Data reflects Upnotify&apos;s independent observations and is not
              provided by, endorsed by, or affiliated with any of the services you choose to monitor.
            </p>
            <p>
              Results are for informational and benchmarking purposes only. You are responsible for
              ensuring your use of Watchdog complies with the terms of service of any site you choose
              to track. See our{' '}
              <Link href="/terms#watchdog">Terms of Service</Link> and{' '}
              <Link href="/privacy">Privacy Policy</Link> for full details.
            </p>
          </section>

          <div className="help-next-links">
            <p className="help-next-label">Next up</p>
            <Link href="/dashboard/help/credits" className="help-next-link">
              Community Credits &rarr;
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}

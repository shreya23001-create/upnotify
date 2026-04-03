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
      name: 'What does competitor tracking do in Uptrue?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Competitor tracking monitors the uptime and response time of other websites you choose, so you can compare their reliability against your own sites. You see side-by-side data showing who has better uptime and faster response times.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many competitors can I track on each Uptrue plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Free plan: 3 competitors. Lite plan: 5 competitors. Builder plan: 10 competitors. Scale plan: 25 competitors. These limits are per workspace.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does competitor tracking count towards my monitor limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Competitor tracking has its own separate limit. Your regular monitors and competitor monitors are counted independently, so adding competitors does not reduce the number of monitors you can create.',
      },
    },
  ],
}

export default function CompetitorsHelpPage(): React.ReactElement {
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
          <span>Tracking Your Competitors</span>
        </nav>

        <article className="help-article">
          <h1 className="help-article-title">Tracking Your Competitors</h1>
          <p className="help-article-intro">
            Knowing your own uptime is good. Knowing how it compares to the
            competition is better. Competitor tracking lets you see whether your
            site is more reliable, faster, or falling behind -- all from inside
            your Uptrue dashboard.
          </p>

          <section className="help-section">
            <h2 className="help-section-title">What competitor tracking does</h2>
            <p>
              Uptrue monitors the websites you choose -- your direct competitors,
              industry leaders, or anyone you want to benchmark against. Every few
              minutes it checks their uptime and response time, then shows you a
              side-by-side comparison with your own sites.
            </p>
            <p>
              You get real data, not guesswork. If a competitor goes down during peak
              hours and you stay up, that is a selling point. If they are consistently
              faster than you, you know where to invest.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">How to add a competitor</h2>
            <ol className="help-steps">
              <li>Go to <strong>Competitors</strong> in the sidebar.</li>
              <li>Click <strong>Add Competitor</strong>.</li>
              <li>Enter their domain (e.g. <code>example.com</code>).</li>
              <li>Uptrue starts monitoring immediately -- the first data point appears within minutes.</li>
            </ol>
            <p>
              You do not need an account with them or any special access. Uptrue checks their
              public-facing site the same way any visitor would.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Reading the comparison dashboard</h2>
            <p>
              The competitor dashboard shows:
            </p>
            <ul className="help-list">
              <li><strong>Uptime percentage</strong> -- your site vs each competitor over 24 hours, 7 days, or 30 days.</li>
              <li><strong>Average response time</strong> -- how fast each site responds compared to yours.</li>
              <li><strong>Current status</strong> -- green (up), red (down), or yellow (degraded) for each site at a glance.</li>
              <li><strong>Incident count</strong> -- how many times each site went down in the selected period.</li>
            </ul>
            <p>
              Use the time range selector at the top to switch between daily, weekly, and monthly views.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Plan limits</h2>
            <p>
              Each plan includes a set number of competitor slots:
            </p>
            <ul className="help-list">
              <li><strong>Free</strong> -- 3 competitors</li>
              <li><strong>Lite</strong> -- 5 competitors</li>
              <li><strong>Builder</strong> -- 10 competitors</li>
              <li><strong>Scale</strong> -- 25 competitors</li>
            </ul>
            <p>
              Competitor slots are separate from your monitor limits. Adding competitors
              does not reduce the number of regular monitors you can create.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Tips for using competitor data</h2>
            <ul className="help-list">
              <li><strong>Pick direct competitors</strong> -- track the sites your customers would choose instead of yours, not random big-name sites.</li>
              <li><strong>Check weekly trends</strong> -- a single bad day does not mean much. Look at the 30-day view for reliable comparisons.</li>
              <li><strong>Use it in sales calls</strong> -- if your uptime is better than a competitor, show the data. It speaks louder than promises.</li>
              <li><strong>Spot patterns</strong> -- if a competitor goes down every Tuesday at 2am, they probably have a maintenance window. That is useful intel.</li>
            </ul>
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

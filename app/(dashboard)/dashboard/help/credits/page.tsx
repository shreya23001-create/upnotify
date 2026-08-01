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
      name: 'How do community credits work in Uptrue?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Community credits are earned by contributing to Uptrue -- embedding a badge on your site, referring friends, leaving reviews, or reporting bugs. Credits are applied as a discount on your next bill, up to 10 pounds per month.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the maximum I can earn from Uptrue credits each month?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The monthly cap is 10 pounds. Credits above the cap roll over to the next month. If you cancel your subscription, unused credits expire.',
      },
    },
    {
      '@type': 'Question',
      name: 'When are Uptrue credits applied to my bill?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Credits are applied automatically to your next invoice. You can see your current balance and earning history in Settings under the Credits tab.',
      },
    },
  ],
}

export default function CreditsHelpPage(): React.ReactElement {
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
          <span>Community Credits</span>
        </nav>

        <article className="help-article">
          <div className="help-article-hero">
            <h1 className="help-article-title">Community Credits</h1>
            <p className="help-article-intro">
              We believe the people who help Uptrue grow should benefit too. Community
              credits let you earn real money off your bill just by being part of the
              community.
            </p>
          </div>

          <section className="help-section">
            <h2 className="help-section-title">How credits work</h2>
            <p>
              Credits are earned through specific actions that help Uptrue grow. Each
              credit has a pound value that gets applied as a discount on your next
              monthly or annual invoice. Think of it as cashback for being a good
              community member.
            </p>
            <p>
              You can track your credit balance and history in
              <strong> Settings</strong> &rarr; <strong>Credits</strong>.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">How to earn credits</h2>
            <p>
              There are four ways to earn:
            </p>
            <ul className="help-list">
              <li>
                <strong>Badge embeds -- &pound;2 per month</strong><br />
                Add an Uptrue status badge to your website. As long as the badge is live
                and detectable, you earn &pound;2 every month automatically. Go to
                <strong> Status Pages</strong> &rarr; <strong>Badge</strong> to grab the embed code.
              </li>
              <li>
                <strong>Referrals -- &pound;5 per referral</strong><br />
                Share your referral link. When someone signs up and upgrades to a paid
                plan, you earn &pound;5. See the
                <Link href="/dashboard/help/referrals"> Referral Program</Link> guide
                for full details.
              </li>
              <li>
                <strong>Reviews -- &pound;10 per review</strong><br />
                Leave a genuine review on a supported platform (e.g. G2, Capterra, or
                Trustpilot). Submit the link in <strong>Settings</strong> &rarr;
                <strong> Credits</strong> and the team verifies it within 48 hours.
              </li>
              <li>
                <strong>Bug reports -- &pound;5 per confirmed bug</strong><br />
                Found something broken? Report it through the in-app bug reporter. If
                the team confirms it as a valid bug, you earn &pound;5.
              </li>
            </ul>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Monthly cap</h2>
            <p>
              The maximum credit you can apply to a single invoice is
              <strong> &pound;10 per month</strong>. If you earn more than that in a
              month, the excess rolls over to future invoices. This keeps the programme
              sustainable so it lasts.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">When credits are applied</h2>
            <p>
              Credits are applied automatically when your next invoice is generated.
              You do not need to do anything -- the discount appears on the invoice
              itself. If your credits cover the full bill, you pay nothing that month.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">What happens if I cancel</h2>
            <p>
              Unused credits <strong>expire when your subscription ends</strong>. They
              cannot be cashed out or transferred to another account. If you resubscribe
              later, you start earning fresh.
            </p>
          </section>

          <div className="help-next-links">
            <p className="help-next-label">Next up</p>
            <Link href="/dashboard/help/referrals" className="help-next-link">
              Referral Program &rarr;
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}

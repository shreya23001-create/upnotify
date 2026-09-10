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
      name: 'How does the Upnotify referral program work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Share your unique referral link with a friend. When they sign up and upgrade to any paid plan, you both get one month free on your current plan. You can refer up to 5 friends for a maximum of 25 pounds in total value.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where do I find my Upnotify referral link?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Go to Settings, then click the Referrals tab. Your unique link is displayed there and you can copy it with one click.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a limit to how many people I can refer to Upnotify?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The referral programme is capped at 5 successful referrals per account, which gives you up to 25 pounds in total value (5 months free).',
      },
    },
  ],
}

export default function ReferralsHelpPage(): React.ReactElement {
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
          <span>Referral Program</span>
        </nav>

        <article className="help-article">
          <div className="help-article-hero">
            <h1 className="help-article-title">Referral Program</h1>
            <p className="help-article-intro">
              Good tools spread by word of mouth. If you like Upnotify enough to
              recommend it, we want to say thanks -- with free monitoring for you
              and the person you refer.
            </p>
          </div>

          <section className="help-section">
            <h2 className="help-section-title">How it works</h2>
            <p>
              The deal is simple:
            </p>
            <ol className="help-steps">
              <li>You share your unique referral link with a friend or colleague.</li>
              <li>They sign up using that link.</li>
              <li>They upgrade to any paid plan (Lite, Builder, or Scale).</li>
              <li>You both get <strong>one month free</strong> on your current plan.</li>
            </ol>
            <p>
              No special codes, no complicated tiers. One link, one upgrade, one
              free month each.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Where to find your referral link</h2>
            <p>
              Your referral link lives in <strong>Settings</strong> &rarr;
              <strong> Referrals</strong>. It looks something like
              <code> upnotify-monitoring.vercel.app/r/abc123</code>. Click the copy button to grab it,
              then share it wherever you like -- email, Slack, social media, or a
              quick text.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Tracking your referrals</h2>
            <p>
              The Referrals page shows you:
            </p>
            <ul className="help-list">
              <li><strong>Pending</strong> -- someone signed up but has not upgraded yet.</li>
              <li><strong>Completed</strong> -- they upgraded and you both received the reward.</li>
              <li><strong>Total earned</strong> -- how many months free you have received so far.</li>
            </ul>
            <p>
              Rewards are applied automatically. You do not need to claim anything
              manually.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Limits</h2>
            <p>
              The referral programme is capped at <strong>5 successful referrals</strong> per
              account. That means you can earn up to <strong>&pound;25 in total
              value</strong> (5 free months). After that, you can still share your
              link -- your friend still gets their free month -- but you will not
              receive additional rewards.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Fine print</h2>
            <ul className="help-list">
              <li>The referred person must be a new Upnotify user -- existing accounts do not count.</li>
              <li>They must upgrade within 30 days of signing up for the referral to qualify.</li>
              <li>Self-referrals are detected and will be declined.</li>
              <li>Upnotify reserves the right to modify or end the programme with 30 days notice.</li>
            </ul>
          </section>

          <div className="help-next-links">
            <p className="help-next-label">Next up</p>
            <Link href="/dashboard/help/tools" className="help-next-link">
              Free Tools &rarr;
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}

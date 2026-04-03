import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: 'Community Credits — Earn Discounts on Your Monitoring Plan | Uptrue',
  description:
    'Earn credits toward your Uptrue subscription by embedding badges, referring friends, writing reviews, and reporting bugs. Up to \u00A310/month off your plan.',
  alternates: { canonical: 'https://uptrue.io/credits' },
  openGraph: {
    title: 'Community Credits — Earn Discounts on Your Monitoring Plan',
    description:
      'Earn credits toward your Uptrue subscription. Embed badges, refer friends, write reviews, and report bugs to save up to \u00A310/month.',
    url: 'https://uptrue.io/credits',
  },
}

interface CreditWay {
  icon: string
  title: string
  amount: string
  description: string
  frequency: string
}

const CREDIT_WAYS: CreditWay[] = [
  {
    icon: '\uD83C\uDFF7\uFE0F',
    title: 'Embed an Uptrue Badge',
    amount: '\u00A32/month',
    description:
      'Add a small "Monitored by Uptrue" badge to your website footer. As long as the badge is live and verified, you earn a recurring monthly credit.',
    frequency: 'Recurring monthly',
  },
  {
    icon: '\uD83D\uDC65',
    title: 'Refer a Friend',
    amount: '\u00A35 per referral',
    description:
      'Share your unique referral link. When a friend signs up and upgrades to a paid plan, you both earn credit. Maximum 5 referrals (\u00A325 total).',
    frequency: 'One-time per referral',
  },
  {
    icon: '\u2B50',
    title: 'Write a Review',
    amount: '\u00A310 one-time',
    description:
      'Leave a genuine review of Uptrue on a trusted review platform (G2, Capterra, or Trustpilot). Submit the link and earn a one-time credit once verified.',
    frequency: 'One-time',
  },
  {
    icon: '\uD83D\uDC1B',
    title: 'Report a Bug',
    amount: '\u00A35 per valid bug',
    description:
      'Found something broken? Report it through the dashboard. If our team confirms and fixes the bug, you earn credit for helping us improve.',
    frequency: 'Per valid report',
  },
]

export default function CreditsPage(): React.ReactElement {
  return (
    <div className="public-page">
      <PublicNav />
      <main className="public-page-main" style={{ paddingTop: 80 }}>
        <div className="public-page-container">
          <div className="public-page-header">
            <h1 className="public-page-title">Community Credits</h1>
            <p className="public-page-subtitle">
              Earn credits toward your Uptrue subscription just by being part of the community.
              Save up to <strong>{'\u00A3'}10/month</strong> off your plan.
            </p>
          </div>

          <section className="credits-how-it-works">
            <h2 className="section-heading">How It Works</h2>
            <div className="credits-steps">
              <div className="credits-step">
                <div className="credits-step-number">1</div>
                <div className="credits-step-content">
                  <h3>Earn credits</h3>
                  <p>Complete any of the actions below to earn credits toward your subscription.</p>
                </div>
              </div>
              <div className="credits-step">
                <div className="credits-step-number">2</div>
                <div className="credits-step-content">
                  <h3>Credits are verified</h3>
                  <p>Our team verifies your action (badge, review, or bug report). Referrals are tracked automatically.</p>
                </div>
              </div>
              <div className="credits-step">
                <div className="credits-step-number">3</div>
                <div className="credits-step-content">
                  <h3>Save on your plan</h3>
                  <p>Credits are applied to your next billing cycle. Maximum {'\u00A3'}10/month cap applies.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="credits-ways">
            <h2 className="section-heading">Ways to Earn</h2>
            <div className="credits-grid">
              {CREDIT_WAYS.map((way) => (
                <div key={way.title} className="credits-card">
                  <div className="credits-card-icon">{way.icon}</div>
                  <div className="credits-card-body">
                    <div className="credits-card-header">
                      <h3 className="credits-card-title">{way.title}</h3>
                      <span className="credits-card-amount">{way.amount}</span>
                    </div>
                    <p className="credits-card-description">{way.description}</p>
                    <span className="credits-card-frequency">{way.frequency}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="credits-cap-notice">
            <div className="credits-cap-card">
              <h3>Monthly Cap: {'\u00A3'}10/month</h3>
              <p>
                Credits are capped at {'\u00A3'}10 per month per account. Unused credits do not roll over.
                Credits cannot be converted to cash or transferred to another account.
              </p>
            </div>
          </section>

          <section className="credits-cta">
            <h2>Ready to start earning?</h2>
            <p>Sign up for free and start earning credits from day one.</p>
            <Link href="/signup" className="btn btn-primary btn-lg">
              Sign Up and Start Earning
            </Link>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: 'Referral Program — Give 1 Month, Get 1 Month | Uptrue',
  description:
    'Share Uptrue with friends and colleagues. When they sign up and upgrade, you both get a free month of monitoring. Refer up to 5 people and save \u00A325.',
  alternates: { canonical: 'https://uptrue.io/referrals' },
  openGraph: {
    title: 'Uptrue Referral Program — Give 1 Month, Get 1 Month',
    description:
      'Share Uptrue with friends. When they upgrade, you both get a free month. Refer up to 5 people and save \u00A325 total.',
    url: 'https://uptrue.io/referrals',
  },
}

interface ReferralStep {
  number: string
  title: string
  description: string
}

const STEPS: ReferralStep[] = [
  {
    number: '1',
    title: 'Share your link',
    description:
      'Log in to your dashboard and copy your unique referral link from Settings. Share it with friends, colleagues, or on social media.',
  },
  {
    number: '2',
    title: 'Friend signs up & upgrades',
    description:
      'When someone uses your link to create an account and upgrades to any paid plan, the referral is tracked automatically.',
  },
  {
    number: '3',
    title: 'You both get credit',
    description:
      'Your friend gets their first month free, and you get a month of credit applied to your next billing cycle. Win-win.',
  },
]

export default function ReferralsPage(): React.ReactElement {
  return (
    <div className="public-page">
      <PublicNav />
      <main className="public-page-main" style={{ paddingTop: 80 }}>
        <div className="public-page-container">
          <div className="public-page-header">
            <div className="referral-hero-badge">Give 1 month, get 1 month</div>
            <h1 className="public-page-title">Referral Program</h1>
            <p className="public-page-subtitle">
              Love Uptrue? Share it with your network. When your friend signs up and upgrades,
              you both get a free month of monitoring.
            </p>
          </div>

          <section className="referral-steps">
            <h2 className="section-heading">How It Works</h2>
            <div className="steps-grid">
              {STEPS.map((step) => (
                <div key={step.number} className="step-card">
                  <div className="step-number">{step.number}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="referral-details">
            <div className="referral-details-grid">
              <div className="referral-detail-card">
                <h3>What you get</h3>
                <p className="referral-detail-amount">{'\u00A3'}5 credit</p>
                <p>Applied to your next billing cycle for each successful referral.</p>
              </div>
              <div className="referral-detail-card">
                <h3>What your friend gets</h3>
                <p className="referral-detail-amount">1 month free</p>
                <p>Their first month on any paid plan is completely free.</p>
              </div>
              <div className="referral-detail-card">
                <h3>Maximum referrals</h3>
                <p className="referral-detail-amount">5 referrals</p>
                <p>Earn up to {'\u00A3'}25 total in referral credits. No expiry on earned credits.</p>
              </div>
            </div>
          </section>

          <section className="referral-rules">
            <h2 className="section-heading">Program Rules</h2>
            <ul className="referral-rules-list">
              <li>Your friend must sign up using your unique referral link.</li>
              <li>The referral only counts when your friend upgrades to a paid plan.</li>
              <li>Maximum 5 successful referrals per account ({'\u00A3'}25 total).</li>
              <li>Self-referrals or duplicate accounts are not eligible.</li>
              <li>Credits are applied automatically at the next billing cycle.</li>
              <li>Uptrue reserves the right to modify or end this program at any time.</li>
            </ul>
          </section>

          <section className="referral-cta">
            <h2>Start referring today</h2>
            <p>Sign up for free and get your unique referral link from Settings.</p>
            <Link href="/signup" className="btn btn-primary btn-lg">
              Sign Up and Get Your Referral Link
            </Link>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

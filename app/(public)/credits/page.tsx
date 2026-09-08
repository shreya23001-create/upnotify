import type { Metadata } from 'next'
import Link from 'next/link'
import { Coins, ShieldCheck, PiggyBank, PlayCircle, Tag, Users, Star, Bug } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Community Credits — Earn Discounts on Your Monitoring Plan | Upnotify',
  description:
    'Earn credits toward your Upnotify subscription by embedding badges, referring friends, writing reviews, and reporting bugs. Up to \u00A310/month off your plan.',
  alternates: { canonical: 'https://uptrue.io/credits' },
  openGraph: {
    title: 'Community Credits — Earn Discounts on Your Monitoring Plan',
    description:
      'Earn credits toward your Upnotify subscription. Embed badges, refer friends, write reviews, and report bugs to save up to \u00A310/month.',
    url: 'https://uptrue.io/credits',
  },
}

interface CreditWay {
  icon: typeof Tag
  title: string
  amount: string
  description: string
  frequency: string
}

const CREDIT_WAYS: CreditWay[] = [
  {
    icon: Tag,
    title: 'Embed an Upnotify Badge',
    amount: '\u00A32/month',
    description:
      'Add a small "Monitored by Upnotify" badge to your website footer. As long as the badge is live and verified, you earn a recurring monthly credit.',
    frequency: 'Recurring monthly',
  },
  {
    icon: Users,
    title: 'Refer a Friend',
    amount: '\u00A35 per referral',
    description:
      'Share your unique referral link. When a friend signs up and upgrades to a paid plan, you both earn credit. Maximum 5 referrals (\u00A325 total).',
    frequency: 'One-time per referral',
  },
  {
    icon: Star,
    title: 'Write a Review',
    amount: '\u00A310 one-time',
    description:
      'Leave a genuine review of Upnotify on a trusted review platform (G2, Capterra, or Trustpilot). Submit the link and earn a one-time credit once verified.',
    frequency: 'One-time',
  },
  {
    icon: Bug,
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
      
      <main className="public-page-main" style={{ paddingTop: 80 }}>
        <div className="public-page-container">
          <div className="public-page-header">
            <h1 className="public-page-title">Community Credits</h1>
            <p className="public-page-subtitle">
              Earn credits toward your Upnotify subscription just by being part of the community.
              Save up to <strong>{'\u00A3'}10/month</strong> off your plan.
            </p>
          </div>

          <section className="credits-how-it-works">
            <div className="credits-how-layout">
              <div className="credits-how-visual">
                <svg className="credits-how-connector" viewBox="0 0 360 520" fill="none" aria-hidden="true">
                  <path d="M225 95 C 260 130, 260 160, 240 190" stroke="url(#creditsArrow1)" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" />
                  <path d="M155 320 C 130 350, 100 355, 75 380" stroke="url(#creditsArrow2)" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="creditsArrow1" x1="225" y1="95" x2="240" y2="190" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00c94a" stopOpacity="0.5" />
                      <stop offset="1" stopColor="#ec4899" stopOpacity="0.5" />
                    </linearGradient>
                    <linearGradient id="creditsArrow2" x1="155" y1="320" x2="75" y2="380" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ec4899" stopOpacity="0.5" />
                      <stop offset="1" stopColor="#00c94a" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="credits-how-card credits-how-card-1">
                  <div className="credits-how-icon credits-how-icon-violet"><Coins size={22} /></div>
                  <h3>Earn credits</h3>
                  <p>Complete any of the actions below to earn credits toward your subscription.</p>
                </div>

                <div className="credits-how-card credits-how-card-2">
                  <div className="credits-how-icon credits-how-icon-pink"><ShieldCheck size={22} /></div>
                  <h3>Credits are verified</h3>
                  <p>Our team verifies your action (badge, review, or bug report). Referrals are tracked automatically.</p>
                </div>

                <div className="credits-how-card credits-how-card-3">
                  <div className="credits-how-icon credits-how-icon-blue"><PiggyBank size={22} /></div>
                  <h3>Save on your plan</h3>
                  <p>Credits are applied to your next billing cycle. Maximum {'\u00A3'}10/month cap applies.</p>
                </div>
              </div>

              <div className="credits-how-copy">
                <h2 className="credits-how-title">How Community Credits Work</h2>
                <p className="credits-how-desc">
                  Still confused? Don&apos;t worry, we&apos;ve got you covered. Check out the ways to earn
                  below, or simply get in touch with our support team for more help.
                </p>
                <div className="credits-how-actions">
                  <Link href="/signup" className="btn btn-primary btn-lg">Learn More</Link>
                  <Link href="/contact" className="credits-how-video-link">
                    <PlayCircle size={20} /> Talk to Support
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="credits-ways">
            <h2 className="section-heading">Ways to Earn</h2>
            <div className="credits-grid">
              {CREDIT_WAYS.map((way) => {
                const Icon = way.icon
                return (
                <div key={way.title} className="credits-card">
                  <div className="credits-card-icon"><Icon size={24} /></div>
                  <div className="credits-card-body">
                    <div className="credits-card-header">
                      <h3 className="credits-card-title">{way.title}</h3>
                      <span className="credits-card-amount">{way.amount}</span>
                    </div>
                    <p className="credits-card-description">{way.description}</p>
                    <span className="credits-card-frequency">{way.frequency}</span>
                  </div>
                </div>
                )
              })}
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
      
    </div>
  )
}

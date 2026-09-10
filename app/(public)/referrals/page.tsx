import '../landing.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Gift, Share2, UserPlus, Wallet, PiggyBank, Users, Zap, ArrowRight,
  Link2, CreditCard, Ban, RefreshCcw, Settings2,
} from 'lucide-react'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: 'Referral Program — Give 1 Month, Get 1 Month | Upnotify',
  description:
    'Share Upnotify with friends and colleagues. When they sign up and upgrade, you both get a free month of monitoring. Refer up to 5 people and save \u00A325.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/referrals' },
  openGraph: {
    title: 'Upnotify Referral Program — Give 1 Month, Get 1 Month',
    description:
      'Share Upnotify with friends. When they upgrade, you both get a free month. Refer up to 5 people and save \u00A325 total.',
    url: 'https://upnotify-monitoring.vercel.app/referrals',
  },
}

interface ReferralStep {
  number: string
  title: string
  icon: typeof Share2
  points: string[]
}

const STEPS: ReferralStep[] = [
  {
    number: '1',
    icon: Share2,
    title: 'Share your link',
    points: ['Copy from Settings', 'Send to friends', 'Post on social'],
  },
  {
    number: '2',
    icon: UserPlus,
    title: 'Friend signs up',
    points: ['Uses your link', 'Creates account', 'Upgrades to paid'],
  },
  {
    number: '3',
    icon: Wallet,
    title: 'You both get credit',
    points: ['Friend: 1 month free', 'You: billing credit', 'Applied automatically'],
  },
]

const DETAILS = [
  { icon: PiggyBank, title: 'What you get', amount: `${'£'}5 credit`, desc: 'Applied to your next billing cycle for each successful referral.' },
  { icon: Gift, title: 'What your friend gets', amount: '1 month free', desc: 'Their first month on any paid plan is completely free.' },
  { icon: Users, title: 'Maximum referrals', amount: '5 referrals', desc: `Earn up to ${'£'}25 total in referral credits. No expiry on earned credits.` },
]

const RULES = [
  { icon: Link2, title: 'Unique link required', desc: 'Your friend must sign up using your unique referral link.' },
  { icon: CreditCard, title: 'Paid plan required', desc: 'The referral only counts when your friend upgrades to a paid plan.' },
  { icon: Users, title: `Max 5 referrals`, desc: `Maximum 5 successful referrals per account (${'£'}25 total).` },
  { icon: Ban, title: 'No self-referrals', desc: 'Self-referrals or duplicate accounts are not eligible.' },
  { icon: RefreshCcw, title: 'Auto-applied credit', desc: 'Credits are applied automatically at the next billing cycle.' },
  { icon: Settings2, title: 'Subject to change', desc: 'Upnotify reserves the right to modify or end this program at any time.' },
]

export default function ReferralsPage(): React.ReactElement {
  return (
    <div className="public-page">
      <ScrollReveal />
      <main className="public-page-main referral-hero-main" style={{ paddingTop: 80 }}>
        <div className="public-page-container">
          <div className="public-page-header">
            <div className="referral-hero-badge reveal-title"><Gift size={14} /> Give 1 month, get 1 month</div>
            <h1 className="public-page-title reveal-title">
              <span className="gradient-text referral-title-gradient">Referral</span> Program
            </h1>
            <p className="public-page-subtitle reveal-title">
              Love Upnotify? Share it with your network. When your friend signs up and upgrades,
              you both get a free month of monitoring.
            </p>
          </div>

          <section className="referral-steps">
            <h2 className="section-heading reveal-title">How It Works</h2>
            <div className="how-steps reveal-stagger">
              {STEPS.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={step.number} className="how-step">
                    <div className="how-step-badge">
                      <span className="how-step-number">{step.number}</span>
                      <span className="how-step-icon"><Icon size={20} /></span>
                    </div>
                    <h3 className="how-step-title">{step.title}</h3>
                    <ul className="how-step-points">
                      {step.points.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                    {i < STEPS.length - 1 && <ArrowRight className="how-step-arrow" size={20} />}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="referral-details">
            <div className="referral-details-grid reveal-stagger">
              {DETAILS.map((d) => {
                const Icon = d.icon
                return (
                  <div key={d.title} className="referral-detail-card">
                    <div className="referral-detail-icon"><Icon size={22} /></div>
                    <h3>{d.title}</h3>
                    <p className="referral-detail-amount">{d.amount}</p>
                    <p>{d.desc}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="referral-rules">
            <h2 className="section-heading reveal-title">Program Rules</h2>
            <div className="rules-snake reveal-stagger">
              {RULES.map((rule, i) => {
                const Icon = rule.icon
                const row = Math.floor(i / 3)
                const col = i % 3
                const isRowEnd = col === 2
                const isLastRow = row === Math.floor((RULES.length - 1) / 3)
                const startsRowTurn = isRowEnd && !isLastRow
                return (
                  <div
                    key={rule.title}
                    className={`rules-snake-node${startsRowTurn ? ' rules-snake-turn' : ''}`}
                    style={{ gridRow: row + 1, gridColumn: col + 1 }}
                  >
                    <div className="rules-snake-icon"><Icon size={22} /></div>
                    <h3 className="rules-snake-title">{rule.title}</h3>
                    <p className="rules-snake-desc">{rule.desc}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="referral-cta reveal">
            <div className="referral-cta-icon"><Zap size={24} /></div>
            <h2>Start referring today</h2>
            <p>Sign up for free and get your unique referral link from Settings.</p>
            <Link href="/signup" className="btn btn-primary btn-lg">
              Sign Up and Get Your Referral Link
            </Link>
          </section>
        </div>
      </main>
      
    </div>
  )
}

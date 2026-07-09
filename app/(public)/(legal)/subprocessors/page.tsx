import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ShieldCheck, Server, CreditCard, MessageSquare, Sparkles, Activity, Globe2, KeyRound, Mail,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sub-processors — Uptrue',
  description:
    'List of third-party sub-processors used by Uptrue to deliver the monitoring platform, including data location and purpose.',
  alternates: { canonical: 'https://uptrue.io/subprocessors' },
}

interface SubProcessor {
  name: string
  purpose: string
  location: string
}

interface Category {
  icon: typeof Server
  color: 'violet' | 'pink' | 'blue' | 'amber'
  title: string
  items: SubProcessor[]
}

const CATEGORIES: Category[] = [
  {
    icon: Server,
    color: 'violet',
    title: 'Infrastructure and Hosting',
    items: [
      { name: 'Supabase (AWS)', purpose: 'Primary database, authentication, real-time subscriptions, file storage', location: 'Frankfurt, Germany (EU)' },
      { name: 'Vercel', purpose: 'Application hosting, edge functions, cron jobs, CDN', location: 'Global (edge), primary EU' },
    ],
  },
  {
    icon: CreditCard,
    color: 'pink',
    title: 'Payment Processing',
    items: [
      { name: 'Stripe', purpose: 'Payment processing, subscription billing, invoicing', location: 'United States (with EU SCCs)' },
      { name: 'Razorpay', purpose: 'Payment processing for India-based customers', location: 'India' },
    ],
  },
  {
    icon: MessageSquare,
    color: 'blue',
    title: 'Communication and Alerts',
    items: [
      { name: 'Resend', purpose: 'Transactional email delivery (alerts, notifications, reports)', location: 'United States (with EU SCCs)' },
      { name: 'Twilio', purpose: 'SMS, WhatsApp, and voice call alerts', location: 'United States (with EU SCCs)' },
      { name: 'ElevenLabs', purpose: 'AI voice generation for voice call alerts', location: 'United States (with EU SCCs)' },
    ],
  },
  {
    icon: Sparkles,
    color: 'amber',
    title: 'AI and Intelligence',
    items: [
      { name: 'Anthropic (Claude)', purpose: 'AI-generated report summaries, score analysis, competitive intelligence', location: 'United States (with EU SCCs)' },
    ],
  },
  {
    icon: Activity,
    color: 'violet',
    title: 'Monitoring and Error Tracking',
    items: [
      { name: 'Sentry', purpose: 'Application error tracking and performance monitoring', location: 'United States (with EU SCCs)' },
    ],
  },
  {
    icon: Globe2,
    color: 'blue',
    title: 'DNS and Domain Services',
    items: [
      { name: 'Cloudflare', purpose: 'DNS queries for domain and DNS monitoring checks', location: 'Global' },
    ],
  },
  {
    icon: KeyRound,
    color: 'pink',
    title: 'Authentication',
    items: [
      { name: 'Google (OAuth)', purpose: 'Social login and admin authentication', location: 'United States (with EU SCCs)' },
    ],
  },
]

export default function SubprocessorsPage(): React.ReactElement {
  return (
    <div className="subp-page">
      <div className="subp-hero">
        <div className="subp-hero-badge"><ShieldCheck size={14} /> Data protection &amp; compliance</div>
        <h1>Sub-processors</h1>
        <p className="legal-updated">Last updated: April 2026</p>
        <p className="subp-hero-text">
          Uptrue uses the following third-party sub-processors to deliver and support the platform.
          Each sub-processor has been assessed for compliance with data protection legislation
          (including GDPR and UK GDPR) and is bound by appropriate data processing agreements.
        </p>
        <p className="subp-hero-links">
          Supplements our <Link href="/dpa">Data Processing Agreement</Link> and{' '}
          <Link href="/gdpr">GDPR Compliance</Link> page.
        </p>
      </div>

      <div className="subp-grid">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          return (
            <div key={cat.title} className={`subp-card subp-card-${cat.color}`}>
              <div className="subp-card-header">
                <div className={`subp-card-icon subp-icon-${cat.color}`}><Icon size={20} /></div>
                <h2>{cat.title}</h2>
              </div>
              <div className="subp-items">
                {cat.items.map((item) => (
                  <div key={item.name} className="subp-item">
                    <div className="subp-item-top">
                      <span className="subp-item-name">{item.name}</span>
                      <span className="subp-item-location">{item.location}</span>
                    </div>
                    <p className="subp-item-purpose">{item.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="subp-footer">
        <h2>Changes to Sub-processors</h2>
        <p>
          We will update this page when we add or remove a sub-processor. If you have entered into a
          Data Processing Agreement with us that includes a notification obligation, we will notify you
          by email at least 30 days before engaging a new sub-processor that processes personal data.
        </p>
        <a href="mailto:privacy@uptrue.io" className="subp-contact-link">
          <Mail size={16} /> privacy@uptrue.io
        </a>
      </div>
    </div>
  )
}

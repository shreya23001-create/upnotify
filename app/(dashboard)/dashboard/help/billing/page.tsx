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
      name: 'How much does Upnotify cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Upnotify has four plans: Free, Lite, Builder, and Scale. For current pricing and limits, visit our pricing page at upnotify-monitoring.vercel.app/#pricing.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens when I upgrade my Upnotify plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Upgrades take effect immediately. You are charged the prorated difference for the rest of your current billing period. All new features and limits are available straight away.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens when I downgrade my Upnotify plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Downgrades take effect at the end of your current billing period. You keep your current plan features until then. If you have more monitors than the new plan allows, the extra monitors are paused (not deleted) so you do not lose any data.',
      },
    },
  ],
}

export default function BillingPage(): React.ReactElement {
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
          <span>Plans &amp; Billing</span>
        </nav>

        <article className="help-article">
          <div className="help-article-hero">
            <h1 className="help-article-title">Plans &amp; Billing</h1>
            <p className="help-article-intro">
              Upnotify is designed so you can start for free and only pay when you genuinely need
              more. No surprise charges, no hidden fees, no &ldquo;contact sales&rdquo; runaround.
            </p>
          </div>

          <section className="help-section">
            <h2 className="help-section-title">The four plans</h2>

            <p>
              Upnotify has four plans: <strong>Free</strong>, <strong>Lite</strong>,{' '}
              <strong>Builder</strong>, and <strong>Scale</strong>. Each plan offers different
              monitor limits, check intervals, data retention, and alert channels. For current pricing and full feature comparisons, see the{' '}
              <Link href="/#pricing">pricing page</Link>.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">How upgrades work</h2>
            <p>
              When you upgrade, the change takes effect <strong>immediately</strong>. You get
              instant access to all the new features and higher limits. Upnotify calculates the
              prorated cost for the rest of your billing period so you only pay for the days you
              actually use.
            </p>
            <ol className="help-steps">
              <li>Go to <strong>Settings</strong> &rarr; <strong>Billing</strong>.</li>
              <li>Click <strong>Change Plan</strong>.</li>
              <li>Select your new plan and confirm.</li>
              <li>You will see the prorated charge before you confirm -- no surprises.</li>
            </ol>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">How downgrades work</h2>
            <p>
              Downgrades take effect at the <strong>end of your current billing period</strong>.
              You keep all your current features until then, so nothing changes mid-cycle.
            </p>
            <p>
              If your new plan has a lower monitor limit, any monitors over the limit are
              <strong> paused, not deleted</strong>. Your data stays safe. If you upgrade again
              later, you can resume them right where you left off.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Annual billing</h2>
            <p>
              Builder and Scale plans are available with annual billing, which saves you
              <strong> 20%</strong> compared to paying monthly. You can switch between monthly
              and annual at any time from your billing settings.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Cancellation</h2>
            <p>
              You can cancel any time from <strong>Settings</strong> &rarr; <strong>Billing</strong>.
              Your plan stays active until the end of the paid period. Upnotify does not offer a
              free plan, so after that your monitors are deactivated (not deleted), and your data
              is retained for 30 days in case you change your mind.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Canceling or Pausing</h2>
            <p>
              You can cancel or pause your subscription at any time from <Link href="/dashboard/settings?tab=billing">Settings &gt; Billing</Link>.
              If cost is a concern, we offer a <strong>3-month pause</strong> — no charges, data preserved, resume anytime.
            </p>
            <p>
              See <Link href="/dashboard/help/cancel-pause">Cancel or Pause</Link> for full details on what happens to your monitors, alerts, and data.
            </p>
          </section>

          <div className="help-next-links">
            <p className="help-next-label">Back to</p>
            <Link href="/dashboard/help" className="help-next-link">
              &larr; Help Center
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}

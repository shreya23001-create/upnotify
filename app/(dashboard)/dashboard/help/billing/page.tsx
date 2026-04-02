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
      name: 'How much does Uptrue cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Uptrue has four plans: Free (no cost, 3 monitors), Lite (10 pounds per year, 5 monitors), Builder (15 pounds per month, 25 monitors), and Scale (39 pounds per month, 100 monitors). Annual billing saves 20 percent on Builder and Scale.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens when I upgrade my Uptrue plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Upgrades take effect immediately. You are charged the prorated difference for the rest of your current billing period. All new features and limits are available straight away.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens when I downgrade my Uptrue plan?',
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
          <h1 className="help-article-title">Plans &amp; Billing</h1>
          <p className="help-article-intro">
            Uptrue is designed so you can start for free and only pay when you genuinely need
            more. No surprise charges, no hidden fees, no &ldquo;contact sales&rdquo; runaround.
          </p>

          <section className="help-section">
            <h2 className="help-section-title">The four plans</h2>

            <h3 className="help-subsection-title">Free -- forever</h3>
            <p>
              3 monitors, 10-minute check intervals, 7-day data retention, and email alerts.
              Perfect for a personal project or a quick proof of concept. No credit card required.
            </p>

            <h3 className="help-subsection-title">Lite -- &pound;10 per year</h3>
            <p>
              5 monitors, 1-minute checks, 30-day retention, all alert channels (email, Slack,
              Teams, webhooks), 1 branded status page, and 2 team members. That works out to
              less than a pound a month -- a no-brainer for a small site or side project.
            </p>

            <h3 className="help-subsection-title">Builder -- &pound;15 per month</h3>
            <p>
              25 monitors, 1-minute checks, 90-day retention, 5 custom-domain status pages,
              10 team members, and 5 AI-powered reports per month. Built for growing teams and
              serious projects.
            </p>

            <h3 className="help-subsection-title">Scale -- &pound;39 per month</h3>
            <p>
              100 monitors, 30-second checks, 1-year retention, unlimited status pages, 20 team
              members, unlimited AI reports, and full API access. Everything Uptrue offers, no
              limits.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">How upgrades work</h2>
            <p>
              When you upgrade, the change takes effect <strong>immediately</strong>. You get
              instant access to all the new features and higher limits. Uptrue calculates the
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
              Your plan stays active until the end of the paid period. After that, your account
              reverts to the Free plan. Monitors beyond the Free limit are paused, and your data
              is retained for 30 days in case you change your mind.
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

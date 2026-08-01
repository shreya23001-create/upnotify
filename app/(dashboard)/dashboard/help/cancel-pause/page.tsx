'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { HelpSidebar } from '../help-sidebar'

export default function HelpCancelPausePage(): React.ReactElement {
  const pathname = usePathname()
  return (
    <div className="help-layout">
      <HelpSidebar currentPath={pathname} />
      <div className="help-main">
        <nav className="help-breadcrumb" aria-label="Breadcrumb">
          <Link href="/dashboard/help">Help Center</Link>
          <span className="help-breadcrumb-sep">/</span>
          <span>Cancel or Pause</span>
        </nav>

        <article className="help-article">
          <div className="help-article-hero">
            <h1 className="help-article-title">Cancel or Pause Your Subscription</h1>
            <p className="help-article-intro">You can cancel or pause your subscription at any time from your billing settings. We offer a pause option so you can take a break without losing your setup.</p>
          </div>

          <section className="help-section">
            <h2 className="help-section-title">How to Cancel or Pause</h2>
            <ol className="help-steps">
              <li>Go to <Link href="/dashboard/settings?tab=billing">Settings &gt; Billing</Link></li>
              <li>Click <strong>Cancel or Pause</strong> under your current plan</li>
              <li>Select a reason for canceling</li>
              <li>If cost is the concern, you will be offered the option to pause instead</li>
              <li>Confirm your choice (5-second wait to prevent accidental actions)</li>
            </ol>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Pausing Your Subscription</h2>
            <p>Pausing is available for up to <strong>3 months</strong>. During the pause:</p>
            <ul className="help-list">
              <li><strong>No charges</strong> — billing stops completely</li>
              <li><strong>Monitors paused</strong> — checks stop running, no alerts fire</li>
              <li><strong>Data preserved</strong> — all monitors, settings, history, and configurations are kept</li>
              <li><strong>Resume anytime</strong> — click &quot;Resume Now&quot; to reactivate instantly</li>
            </ul>
            <p>After 3 months, your subscription automatically resumes. We send reminder notifications:</p>
            <ul className="help-list">
              <li><strong>14 days before</strong> — email + in-app message</li>
              <li><strong>3 days before</strong> — email + in-app message</li>
              <li><strong>Day of resume</strong> — everything reactivated automatically</li>
            </ul>
            <p>If you do not want billing to resume, cancel before the resume date.</p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Canceling Your Subscription</h2>
            <p>When you cancel, your account reverts to the <strong>Free plan</strong>. Here is what changes:</p>
            <ul className="help-list">
              <li><strong>Monitors</strong> — limited to 3 (excess monitors are paused, not deleted)</li>
              <li><strong>Check interval</strong> — 10 minutes only</li>
              <li><strong>Alerts</strong> — email only (Slack, Teams, and webhook channels are disabled)</li>
              <li><strong>Status pages</strong> — unpublished</li>
              <li><strong>AI reports</strong> — not available</li>
              <li><strong>API access</strong> — not available</li>
            </ul>
            <p><strong>Your data is not deleted.</strong> You can upgrade again at any time and all your monitors, settings, and history will still be there.</p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Resuming After a Pause</h2>
            <p>To resume before the 3-month period ends:</p>
            <ol className="help-steps">
              <li>Go to <Link href="/dashboard/settings?tab=billing">Settings &gt; Billing</Link></li>
              <li>Click <strong>Resume Plan</strong></li>
              <li>Billing resumes immediately and all monitors are reactivated</li>
            </ol>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Re-subscribing After Cancellation</h2>
            <p>If you canceled and want to come back, go to <Link href="/dashboard/settings?tab=billing">Settings &gt; Billing</Link> and choose a plan. Your previous monitors and settings will still be there — just select a plan and your paused monitors will be available to reactivate.</p>
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

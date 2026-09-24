'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { HelpSidebar, getTopicIcon } from '../help-sidebar'

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does Upnotify cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Upnotify has a single Pro Plan, priced per website at ₹999/website/year (including GST). Every website on the Pro Plan gets the full monitor engine, AI Checker, and AI Visibility tools — there are no separate tiers to choose between.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does buying more websites work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You choose how many websites you want to monitor and pay for that quantity up front. You can add more websites at any time — you are only charged for the additional websites, not your existing ones.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens when my Pro Plan renews?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each website you have purchased renews automatically once a year at ₹999/website. You will be notified before renewal, and you can cancel or pause at any time from Settings → Billing.',
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
            <div className="help-article-title-row">
              <span className="help-article-icon">{getTopicIcon('/dashboard/help/billing')}</span>
              <h1 className="help-article-title">Plans &amp; Billing</h1>
            </div>
            <p className="help-article-intro">
              Upnotify runs on a single Pro Plan, priced per website. No tiers to compare,
              no feature gating — every website you monitor gets the full product.
            </p>
          </div>

          <section className="help-section">
            <h2 className="help-section-title">The Pro Plan</h2>

            <p>
              Every website costs <strong>₹999/website/year</strong> (including 18% GST) and
              includes the full 23-type monitor engine, AI Checker, LLM.xml writer, and AI
              Engine Citation Checker. There are no separate tiers — buying the Pro Plan for a
              website gives you everything. For current pricing, see the{' '}
              <Link href="/#pricing">pricing page</Link>.
            </p>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Buying more websites</h2>
            <p>
              When you purchase, you choose how many websites you want to monitor and pay for
              that quantity up front — you do not need to name the domains until afterwards. You
              name each website the first time you create a monitor for it.
            </p>
            <ol className="help-steps">
              <li>Go to <strong>Plans</strong> in the sidebar.</li>
              <li>Choose how many websites you want, and click <strong>Buy Now</strong>.</li>
              <li>Complete checkout — you are only charged for the new websites you are adding.</li>
              <li>Create monitors for your website as normal; the first monitor for a new domain claims one of your purchased slots automatically.</li>
            </ol>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Renewals</h2>
            <p>
              Each website renews automatically once a year at <strong>₹999/website</strong>.
              You will be notified before renewal, and any website you have already purchased
              keeps working without interruption as long as it stays paid.
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

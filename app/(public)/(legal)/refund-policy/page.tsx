import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy — Upnotify',
  description:
    'Upnotify refund policy covering free, Lite (annual), Builder, and Scale plans. Learn about cooling-off periods, cancellations, and how to request a refund.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/refund-policy' },
}

export default function RefundPolicyPage(): React.ReactElement {
  return (
    <>
      <h1>Refund Policy</h1>
      <p className="legal-updated">Last updated: April 2026</p>

      <p>
        This Refund Policy explains how refunds and cancellations work for each Upnotify subscription
        plan. By subscribing to Upnotify, you agree to the terms set out below. This policy should be
        read alongside our <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>1. Free Plan</h2>
      <p>
        The Upnotify Free plan does not require any payment. As no charges are made, no refund applies.
      </p>

      {/* TODO: legal review needed — this clause referenced UK/EU-specific compliance obligations tied to the old entity; verify with counsel whether it still applies or needs Indian-equivalent language */}
      <h2>2. Lite Plan (Annual Billing)</h2>
      <p>
        The Lite plan is billed annually as a single upfront payment. Under the UK Consumer Rights Act
        2015, you have a <strong>14-day cooling-off period</strong> from the date of purchase during
        which you may cancel and receive a full refund, provided the service has not been substantially
        used during that period.
      </p>
      <p>
        After the 14-day cooling-off period, annual subscriptions are <strong>non-refundable</strong>{' '}
        for the remainder of the subscription year. Your service will remain active until the end of
        the paid period.
      </p>
      <p>
        If you upgrade from the Lite plan to a higher-tier plan during your subscription year, a
        prorated credit for the unused portion of your Lite subscription will be applied to the cost
        of the upgraded plan. This credit is not redeemable as cash.
      </p>

      <h2>3. Builder and Scale Plans (Monthly Billing)</h2>
      <p>
        Builder and Scale plans are billed on a monthly recurring basis. You may{' '}
        <strong>cancel at any time</strong> from your account settings. Cancellation takes effect at
        the end of the current billing period.
      </p>
      <p>
        <strong>No refunds are issued for the current billing month.</strong> Your service will
        continue to function until the end of the period you have already paid for. No partial or
        prorated refunds are provided for unused days within a billing cycle.
      </p>

      <h2>4. Subscription Pause</h2>
      <p>
        If cost is a concern, you may choose to <strong>pause your subscription for up to 3 months</strong>{' '}
        instead of canceling. During the pause period:
      </p>
      <ul>
        <li>No charges will be made to your payment method</li>
        <li>Your monitors will be paused (not deleted)</li>
        <li>All your data, settings, and configuration will be preserved</li>
        <li>You can resume your subscription at any time with one click</li>
      </ul>
      <p>
        Your subscription will automatically resume after 3 months. We will send you reminder
        notifications <strong>14 days</strong> and <strong>3 days</strong> before billing resumes,
        giving you time to cancel if you do not wish to continue.
      </p>
      <p>
        No refund is issued when pausing — billing simply stops for the pause period.
        If you prefer a full cancellation instead, you may cancel at any time and your
        account will revert to the Free plan.
      </p>

      <h2>5. Payment Processing</h2>
      <p>
        All payments are processed securely through <strong>Stripe</strong>. Upnotify does not store
        your credit card details. For payment disputes or failed charges, please refer to your Stripe
        receipt or contact our billing team.
      </p>

      <h2>6. How to Request a Refund</h2>
      <p>
        To request a refund (where eligible under this policy), please email us at{' '}
        <a href="mailto:shreya23001@gmail.com">shreya23001@gmail.com</a> with the following details:
      </p>
      <ul>
        <li>Your account email address</li>
        <li>The date of purchase</li>
        <li>The plan you subscribed to</li>
        <li>The reason for your refund request</li>
      </ul>
      <p>
        We aim to respond to all refund requests within <strong>5 business days</strong>. Approved
        refunds will be processed back to the original payment method within 5&ndash;10 business days,
        depending on your bank or card issuer.
      </p>

      <h2>7. Chargebacks</h2>
      <p>
        If you have an issue with a charge, we strongly encourage you to{' '}
        <strong>contact us first</strong> at{' '}
        <a href="mailto:shreya23001@gmail.com">shreya23001@gmail.com</a> before filing a dispute or
        chargeback with your bank or card issuer. We are committed to resolving billing issues
        fairly and promptly.
      </p>
      <p>
        Filing a chargeback without first contacting us may result in your account being suspended
        while the dispute is investigated. Fraudulent chargebacks may lead to permanent account
        termination.
      </p>

      <h2>8. AppSumo Deals</h2>
      <p>
        If you purchased Upnotify through AppSumo (or any third-party marketplace), refunds are governed
        by <strong>AppSumo&apos;s own refund policy</strong>, which typically provides a 60-day
        money-back guarantee. Please contact AppSumo directly for refund requests related to
        marketplace purchases.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Refund Policy from time to time. If we make material changes, we will
        notify you by email or by posting a notice on the Service at least 30 days before the changes
        take effect.
      </p>

      <h2>10. Contact Us</h2>
      <p>If you have any questions about this Refund Policy, please contact us at:</p>
      <ul>
        <li>
          <strong>Billing:</strong> <a href="mailto:shreya23001@gmail.com">shreya23001@gmail.com</a>
        </li>
        <li>
          <strong>Support:</strong> <a href="mailto:shreya23001@gmail.com">shreya23001@gmail.com</a>
        </li>
        <li>
          <strong>Post:</strong> Crozent Techlabs Private Limited, B-59, B-Block, Chipyana,
          Noida &ndash; 201009, Uttar Pradesh, India
        </li>
      </ul>
    </>
  )
}

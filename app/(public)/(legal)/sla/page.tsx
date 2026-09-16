import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Service Level Agreement — Upnotify',
  description:
    'Upnotify platform SLA: 99.9% uptime target, how we measure availability, service credits, exclusions, and how to file a claim.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/sla' },
}

export default function SLAPage(): React.ReactElement {
  return (
    <>
      <h1>Service Level Agreement</h1>
      <p className="legal-updated">Last updated: April 2026</p>

      <p>
        This Service Level Agreement (&quot;SLA&quot;) describes the availability commitment for the
        Upnotify monitoring platform operated by Crozent Techlabs Private Limited. This SLA applies to
        paid plans only and is subject to the terms and exclusions below.
      </p>
      <p>
        <strong>Important:</strong> This is the SLA for the Upnotify platform itself &mdash; not for the
        websites and services you monitor using Upnotify. We commit to keeping Upnotify available so that
        your monitoring runs reliably.
      </p>

      <h2>1. Uptime Target</h2>
      <p>
        Upnotify targets <strong>99.9% platform availability</strong> per calendar month for all paid
        plans. This means no more than approximately 43 minutes of unscheduled downtime per month.
      </p>

      <h2>2. How We Measure Availability</h2>
      <p>Availability is calculated as follows:</p>
      <p>
        <code>
          Monthly Uptime % = ((Total Minutes in Month &minus; Downtime Minutes) / Total Minutes in
          Month) &times; 100
        </code>
      </p>
      <p>
        <strong>Downtime</strong> is defined as any period of 5 or more consecutive minutes during
        which the Upnotify platform is unable to receive check results, process alerts, or serve the
        dashboard to authenticated users, as measured by our internal monitoring systems.
      </p>
      <p>
        Brief intermittent errors lasting less than 5 consecutive minutes are not counted as downtime.
      </p>

      <h2>3. Service Credits</h2>
      <p>
        If Upnotify fails to meet the 99.9% uptime target in any calendar month, affected customers on
        paid plans may request service credits as follows:
      </p>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Monthly Uptime %</th>
            <th>Service Credit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>99.0% &ndash; 99.9%</td>
            <td>10% of that month&apos;s fee</td>
          </tr>
          <tr>
            <td>95.0% &ndash; 99.0%</td>
            <td>25% of that month&apos;s fee</td>
          </tr>
          <tr>
            <td>Below 95.0%</td>
            <td>50% of that month&apos;s fee</td>
          </tr>
        </tbody>
      </table>
      <p>
        Service credits are issued as <strong>account credits</strong> applied to future invoices.
        Credits are not redeemable as cash refunds. The maximum credit for any single month is capped
        at 100% of that month&apos;s subscription fee.
      </p>

      <h2>4. How to Claim Credits</h2>
      <p>To request a service credit:</p>
      <ol>
        <li>
          Email <a href="mailto:info@upnotify.com">info@upnotify.com</a> within{' '}
          <strong>30 days</strong> of the end of the month in which the downtime occurred.
        </li>
        <li>
          Include your account email, the dates and approximate times of the downtime you
          experienced, and a brief description of the impact.
        </li>
        <li>
          We will verify the claim against our internal monitoring records and respond within 10
          business days.
        </li>
      </ol>
      <p>
        If the claim is validated, the credit will be applied to your next billing cycle.
      </p>

      <h2>5. Exclusions</h2>
      <p>This SLA does <strong>not</strong> apply to downtime caused by:</p>
      <ul>
        <li>
          <strong>Scheduled maintenance:</strong> Planned maintenance announced at least 48 hours in
          advance via our status page and email notifications.
        </li>
        <li>
          <strong>Force majeure:</strong> Events beyond our reasonable control, including natural
          disasters, war, terrorism, pandemics, government actions, power failures, or widespread
          internet outages.
        </li>
        <li>
          <strong>Third-party failures:</strong> Outages or degradation in third-party infrastructure
          providers (including Vercel, Supabase, Stripe, or DNS providers) that are outside our
          direct control.
        </li>
        <li>
          <strong>Customer-caused issues:</strong> Downtime resulting from your equipment, software,
          network, or configuration, including exceeding API rate limits.
        </li>
        <li>
          <strong>Abuse or violation:</strong> Suspension or termination of your account due to
          violation of our <a href="/terms">Terms of Service</a> or{' '}
          <a href="/acceptable-use">Acceptable Use Policy</a>.
        </li>
        <li>
          <strong>Beta or preview features:</strong> Any feature explicitly labelled as beta, preview,
          or experimental.
        </li>
      </ul>

      <h2>6. Plan Eligibility</h2>
      <p>
        Upnotify does not offer a free plan. This SLA and the service credit mechanism apply to{' '}
        <strong>active, paid subscriptions in good standing</strong>. Accounts that are suspended for
        non-payment, paused, or past the end of a cancelled billing period are not eligible for service
        credits for the affected period. Free one-off tools available on our website without an account
        are provided on a best-effort basis and are not covered by this SLA.
      </p>

      <h2>7. Sole Remedy</h2>
      <p>
        Service credits as described in this SLA are your sole and exclusive remedy for any failure by
        Upnotify to meet the availability target. This SLA does not modify or replace any other provision
        of our <a href="/terms">Terms of Service</a>.
      </p>

      <h2>8. Changes to This SLA</h2>
      <p>
        We may update this SLA from time to time. Material changes will be communicated via email at
        least 30 days before taking effect. Continued use of the Service after changes take effect
        constitutes acceptance of the revised SLA.
      </p>

      <h2>9. Contact</h2>
      <p>For SLA enquiries or credit claims, contact us at:</p>
      <ul>
        <li>
          <strong>Email:</strong> <a href="mailto:info@upnotify.com">info@upnotify.com</a>
        </li>
        <li>
          <strong>Post:</strong> Crozent Techlabs Private Limited, B-59, B-Block, Chipyana,
          Noida &ndash; 201009, Uttar Pradesh, India
        </li>
      </ul>
    </>
  )
}

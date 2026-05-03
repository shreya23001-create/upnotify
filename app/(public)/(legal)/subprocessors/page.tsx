import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sub-processors — Uptrue',
  description:
    'List of third-party sub-processors used by Uptrue to deliver the monitoring platform, including data location and purpose.',
  alternates: { canonical: 'https://uptrue.io/subprocessors' },
}

export default function SubprocessorsPage(): React.ReactElement {
  return (
    <>
      <h1>Sub-processors</h1>
      <p className="legal-updated">Last updated: April 2026</p>

      <p>
        Uptrue uses the following third-party sub-processors to deliver and support the platform.
        Each sub-processor has been assessed for compliance with data protection legislation
        (including GDPR and UK GDPR) and is bound by appropriate data processing agreements.
      </p>
      <p>
        This page supplements our <Link href="/dpa">Data Processing Agreement</Link> and{' '}
        <Link href="/gdpr">GDPR Compliance</Link> page.
      </p>

      <h2>Infrastructure and Hosting</h2>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Purpose</th>
            <th>Data Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase (AWS)</td>
            <td>Primary database, authentication, real-time subscriptions, file storage</td>
            <td>Frankfurt, Germany (EU)</td>
          </tr>
          <tr>
            <td>Vercel</td>
            <td>Application hosting, edge functions, cron jobs, CDN</td>
            <td>Global (edge), primary EU</td>
          </tr>
        </tbody>
      </table>

      <h2>Payment Processing</h2>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Purpose</th>
            <th>Data Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Stripe</td>
            <td>Payment processing, subscription billing, invoicing</td>
            <td>United States (with EU SCCs)</td>
          </tr>
          <tr>
            <td>Razorpay</td>
            <td>Payment processing for India-based customers</td>
            <td>India</td>
          </tr>
        </tbody>
      </table>

      <h2>Communication and Alerts</h2>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Purpose</th>
            <th>Data Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Resend</td>
            <td>Transactional email delivery (alerts, notifications, reports)</td>
            <td>United States (with EU SCCs)</td>
          </tr>
          <tr>
            <td>Twilio</td>
            <td>SMS, WhatsApp, and voice call alerts</td>
            <td>United States (with EU SCCs)</td>
          </tr>
          <tr>
            <td>ElevenLabs</td>
            <td>AI voice generation for voice call alerts</td>
            <td>United States (with EU SCCs)</td>
          </tr>
        </tbody>
      </table>

      <h2>AI and Intelligence</h2>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Purpose</th>
            <th>Data Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Anthropic (Claude)</td>
            <td>AI-generated report summaries, score analysis, competitive intelligence</td>
            <td>United States (with EU SCCs)</td>
          </tr>
        </tbody>
      </table>

      <h2>Monitoring and Error Tracking</h2>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Purpose</th>
            <th>Data Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sentry</td>
            <td>Application error tracking and performance monitoring</td>
            <td>United States (with EU SCCs)</td>
          </tr>
        </tbody>
      </table>

      <h2>DNS and Domain Services</h2>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Purpose</th>
            <th>Data Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cloudflare</td>
            <td>DNS queries for domain and DNS monitoring checks</td>
            <td>Global</td>
          </tr>
        </tbody>
      </table>

      <h2>Authentication</h2>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Purpose</th>
            <th>Data Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Google (OAuth)</td>
            <td>Social login and admin authentication</td>
            <td>United States (with EU SCCs)</td>
          </tr>
        </tbody>
      </table>

      <h2>Changes to Sub-processors</h2>
      <p>
        We will update this page when we add or remove a sub-processor. If you have entered into a
        Data Processing Agreement with us that includes a notification obligation, we will notify you
        by email at least 30 days before engaging a new sub-processor that processes personal data.
      </p>
      <p>
        If you have questions about our sub-processors, please contact us at{' '}
        <a href="mailto:privacy@uptrue.io">privacy@uptrue.io</a>.
      </p>
    </>
  )
}

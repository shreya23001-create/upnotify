import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'GDPR Compliance — Uptrue',
  description:
    'How Uptrue complies with the General Data Protection Regulation (GDPR). Your rights, our legal basis for processing, data location, and how to exercise your rights.',
  alternates: { canonical: 'https://uptrue.io/gdpr' },
}

export default function GDPRPage(): React.ReactElement {
  return (
    <>
      <h1>GDPR Compliance</h1>
      <p className="legal-updated">Last updated: April 2026</p>

      <p>
        This page explains how Uptrue complies with the General Data Protection Regulation (GDPR) and
        the UK GDPR. It supplements our <Link href="/privacy">Privacy Policy</Link> and provides
        specific information about your rights under data protection law.
      </p>

      <h2>1. Data Controller</h2>
      <p>
        The data controller for personal data processed through the Uptrue platform is:
      </p>
      <ul>
        <li>
          <strong>Company:</strong> Vision Software Solutions Limited
        </li>
        <li>
          <strong>Company Number:</strong> 02710980
        </li>
        <li>
          <strong>Registered Address:</strong> C/O Benison Solvers Limited, 1000 Great West Road,
          Brentford, United Kingdom, TW8 9DW
        </li>
      </ul>

      <h2>2. Data Protection Contact</h2>
      <p>
        For all data protection enquiries, you can contact us at:
      </p>
      <ul>
        <li>
          <strong>Email:</strong> <a href="mailto:privacy@uptrue.io">privacy@uptrue.io</a>
        </li>
        <li>
          <strong>Post:</strong> Data Protection, Vision Software Solutions Limited, C/O Benison
          Solvers Limited, 1000 Great West Road, Brentford, United Kingdom, TW8 9DW
        </li>
      </ul>

      <h2>3. Legal Basis for Processing</h2>
      <p>We process personal data under one or more of the following legal bases:</p>
      <ul>
        <li>
          <strong>Consent:</strong> Where you have given explicit consent for us to process your data
          for a specific purpose (e.g., marketing emails, cookie preferences). You may withdraw consent
          at any time.
        </li>
        <li>
          <strong>Contract:</strong> Where processing is necessary to perform our contract with you
          (e.g., providing the monitoring service, processing payments, sending alert notifications).
        </li>
        <li>
          <strong>Legitimate Interest:</strong> Where processing is necessary for our legitimate
          business interests, provided those interests do not override your fundamental rights (e.g.,
          fraud prevention, platform security, service improvement, analytics).
        </li>
        <li>
          <strong>Legal Obligation:</strong> Where processing is necessary to comply with a legal
          obligation (e.g., tax records, law enforcement requests).
        </li>
      </ul>

      <h2>4. Your Rights Under GDPR</h2>
      <p>
        Under the GDPR and UK GDPR, you have the following rights regarding your personal data:
      </p>
      <ul>
        <li>
          <strong>Right of Access:</strong> You have the right to obtain confirmation of whether we
          process your personal data and to request a copy of that data.
        </li>
        <li>
          <strong>Right to Rectification:</strong> You have the right to request correction of
          inaccurate personal data or completion of incomplete data.
        </li>
        <li>
          <strong>Right to Erasure:</strong> You have the right to request deletion of your personal
          data where there is no compelling reason for its continued processing.
        </li>
        <li>
          <strong>Right to Data Portability:</strong> You have the right to receive your personal data
          in a structured, commonly used, and machine-readable format (JSON or CSV).
        </li>
        <li>
          <strong>Right to Restriction:</strong> You have the right to request that we restrict
          processing of your data in certain circumstances.
        </li>
        <li>
          <strong>Right to Object:</strong> You have the right to object to processing based on
          legitimate interests or for direct marketing purposes.
        </li>
        <li>
          <strong>Rights Related to Automated Decision-Making:</strong> You have the right not to be
          subject to decisions based solely on automated processing that produce legal or similarly
          significant effects. Uptrue does not currently make automated decisions of this nature.
        </li>
      </ul>

      <h2>5. How to Exercise Your Rights</h2>
      <p>You can exercise your data rights in two ways:</p>
      <ul>
        <li>
          <strong>In-dashboard:</strong> Use the data export and account deletion features in your
          Account Settings to download your data or request deletion directly.
        </li>
        <li>
          <strong>By email:</strong> Send your request to{' '}
          <a href="mailto:privacy@uptrue.io">privacy@uptrue.io</a>. We will verify your identity
          before processing any request.
        </li>
      </ul>
      <p>
        We will respond to all valid requests within <strong>30 days</strong>. In complex cases, we may
        extend this by a further 60 days, but we will inform you of any extension and the reason for it
        within the initial 30-day period.
      </p>

      <h2>6. Data Location</h2>
      <p>
        All customer data is stored in the <strong>European Union</strong>. Our primary database is
        hosted by Supabase in the <strong>Frankfurt (eu-central-1)</strong> region. This ensures your
        data remains within the EU/EEA at all times during normal operation.
      </p>

      <h2>7. Sub-processors</h2>
      <p>
        We use a limited number of third-party sub-processors to deliver the Uptrue service. Each
        sub-processor has been assessed for GDPR compliance and is bound by appropriate data processing
        agreements. For a full list of our sub-processors, please refer to our{' '}
        <Link href="/dpa">Data Processing Agreement</Link>.
      </p>

      <h2>8. Data Retention</h2>
      <p>We retain personal data only for as long as necessary to fulfil the purposes for which it was collected:</p>
      <ul>
        <li>
          <strong>Account data:</strong> Retained for the duration of your account plus 30 days after
          deletion to allow for recovery.
        </li>
        <li>
          <strong>Monitoring data (check results, incidents):</strong> Retained according to your plan
          (typically 90 days for free plans, 1 year for paid plans).
        </li>
        <li>
          <strong>Billing records:</strong> Retained for 7 years to comply with UK tax and accounting
          obligations.
        </li>
        <li>
          <strong>Audit logs:</strong> Retained for 1 year.
        </li>
        <li>
          <strong>Marketing consent records:</strong> Retained for the duration of consent plus 3
          years.
        </li>
      </ul>

      <h2>9. Cookies</h2>
      <p>
        We use cookies and similar technologies as described in our{' '}
        <Link href="/cookies">Cookie Policy</Link>. You can manage your cookie preferences at any time
        using the cookie consent banner or your browser settings.
      </p>

      <h2>10. International Data Transfers</h2>
      <p>
        Where data is transferred outside the EU/EEA (for example, to service providers in the United
        States), we ensure appropriate safeguards are in place, including:
      </p>
      <ul>
        <li>
          <strong>Standard Contractual Clauses (SCCs)</strong> approved by the European Commission
        </li>
        <li>
          Adequacy decisions where applicable
        </li>
        <li>
          Additional technical and organisational measures to protect your data during transfer
        </li>
      </ul>

      <h2>11. Right to Complain</h2>
      <p>
        If you believe your data protection rights have been infringed, you have the right to lodge a
        complaint with your local supervisory authority:
      </p>
      <ul>
        <li>
          <strong>United Kingdom:</strong> Information Commissioner&apos;s Office (ICO) &mdash;{' '}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
            ico.org.uk
          </a>
        </li>
        <li>
          <strong>European Union:</strong> Your relevant national Data Protection Authority. A list is
          available at{' '}
          <a
            href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
            target="_blank"
            rel="noopener noreferrer"
          >
            edpb.europa.eu
          </a>
        </li>
      </ul>
      <p>
        We encourage you to contact us first at{' '}
        <a href="mailto:privacy@uptrue.io">privacy@uptrue.io</a> so that we can attempt to resolve
        your concern before you escalate to a supervisory authority.
      </p>

      <h2>12. Changes to This Policy</h2>
      <p>
        We may update this GDPR compliance page from time to time. Material changes will be
        communicated via email or a notice on the Service at least 30 days before taking effect. The
        &quot;last updated&quot; date at the top of this page indicates the most recent revision.
      </p>
    </>
  )
}

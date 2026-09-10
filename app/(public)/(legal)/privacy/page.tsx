import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Upnotify Privacy Policy. Learn how we collect, use, store, and protect your personal data. GDPR compliant with EU data storage.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/privacy' },
}

export default function PrivacyPolicyPage(): React.ReactElement {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="legal-updated">Last updated: 6 May 2026</p>

      <p>
        This Privacy Policy explains how Vision Software Solutions Limited, a company registered in England and Wales with
        its registered office at C/O Benison Solvers Limited, 1000 Great West Road, Brentford, United Kingdom, TW8 9DW (&quot;Uptrue&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), collects,
        uses, stores, and protects your personal data when you use our website at upnotify-monitoring.vercel.app and our
        monitoring platform (collectively, the &quot;Service&quot;).
      </p>
      <p>
        We are committed to protecting your privacy and complying with the UK General Data Protection
        Regulation (UK GDPR), the Data Protection Act 2018, the EU General Data Protection Regulation
        (EU GDPR) where applicable, and all other relevant data protection legislation.
      </p>

      <h2>1. Data Controller</h2>
      <p>
        Vision Software Solutions Limited is the data controller for personal data collected through the Service. For any
        questions regarding this Privacy Policy or your personal data, please contact us at:
      </p>
      <ul>
        <li><strong>Email:</strong> shreya23001@gmail.com</li>
        <li><strong>Post:</strong> Data Protection Officer, Vision Software Solutions Limited, C/O Benison Solvers Limited, 1000 Great West Road, Brentford, United Kingdom, TW8 9DW</li>
      </ul>

      <h2>2. Personal Data We Collect</h2>

      <h3>2.1 Account Information</h3>
      <p>When you create an account, we collect:</p>
      <ul>
        <li>Full name</li>
        <li>Email address</li>
        <li>Organisation name (if applicable)</li>
        <li>Password (stored as a cryptographic hash; we never store or have access to your plain-text password)</li>
        <li>Profile preferences and notification settings</li>
        <li>Currency preference (GBP, USD, or INR)</li>
      </ul>

      <h3>2.2 Billing Information</h3>
      <p>When you subscribe to a paid plan, we collect:</p>
      <ul>
        <li>Billing name and address</li>
        <li>VAT or tax identification number (where applicable)</li>
      </ul>
      <p>
        Payment card details are collected and processed directly by our payment processor, Stripe. We do
        not store, process, or have access to your full card number, CVV, or other sensitive payment
        credentials. We receive only a tokenised reference, card type, last four digits, and expiry date
        from Stripe for display and identification purposes.
      </p>

      <h3>2.3 Monitoring and Service Data</h3>
      <p>When you use the Service, we process:</p>
      <ul>
        <li>Monitor configurations (URLs, endpoints, check intervals, alert rules)</li>
        <li>Check results (response times, status codes, SSL certificate data, DNS records)</li>
        <li>Incident records and resolution history</li>
        <li>Status page content and configuration</li>
        <li>AI-generated report summaries and analysis</li>
        <li>Community Credit balance and credit transaction history</li>
      </ul>

      <h3>2.4 Email Engagement Data</h3>
      <p>
        Our email delivery provider (Resend) may collect data relating to your interaction with
        transactional and notification emails we send, including whether an email was opened and
        whether links within the email were clicked. This data is used to monitor email deliverability,
        improve our communications, and troubleshoot delivery issues. We do not use this data for
        marketing profiling.
      </p>

      <h3>2.5 Technical and Usage Data</h3>
      <p>We automatically collect:</p>
      <ul>
        <li>IP address</li>
        <li>Browser type and version</li>
        <li>Operating system</li>
        <li>Pages visited and features used within the Service</li>
        <li>Date and time of access</li>
        <li>Referring URL</li>
      </ul>

      <h3>2.6 Communication Data</h3>
      <p>
        If you contact us via email or support channels, we collect the content of your communications,
        your email address, and any other information you choose to provide.
      </p>

      <h2>3. Legal Basis for Processing</h2>
      <p>We process your personal data on the following legal bases under the GDPR:</p>
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Legal Basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Providing and maintaining the Service</td>
            <td>Performance of a contract (Article 6(1)(b))</td>
          </tr>
          <tr>
            <td>Processing payments and billing</td>
            <td>Performance of a contract (Article 6(1)(b))</td>
          </tr>
          <tr>
            <td>Sending transactional emails (alerts, invoices, account notices)</td>
            <td>Performance of a contract (Article 6(1)(b))</td>
          </tr>
          <tr>
            <td>Improving the Service, analytics, and troubleshooting</td>
            <td>Legitimate interest (Article 6(1)(f))</td>
          </tr>
          <tr>
            <td>Ensuring security and preventing fraud</td>
            <td>Legitimate interest (Article 6(1)(f))</td>
          </tr>
          <tr>
            <td>Sending marketing communications</td>
            <td>Consent (Article 6(1)(a))</td>
          </tr>
          <tr>
            <td>Complying with legal obligations (tax, regulatory)</td>
            <td>Legal obligation (Article 6(1)(c))</td>
          </tr>
        </tbody>
      </table>
      <p>
        Where we rely on legitimate interest, we have conducted a balancing assessment to ensure that
        our interests do not override your fundamental rights and freedoms.
      </p>

      <h2>4. How We Use Your Data</h2>
      <p>We use your personal data to:</p>
      <ul>
        <li>Create and manage your account</li>
        <li>Provide monitoring services, alerts, status pages, and reports</li>
        <li>Process payments, issue invoices, and manage subscriptions</li>
        <li>Send transactional communications (alerts, incident notifications, account updates)</li>
        <li>Generate AI-powered performance reports and summaries using aggregated monitoring data</li>
        <li>Provide technical support and respond to enquiries</li>
        <li>Maintain security, detect fraud, and prevent abuse</li>
        <li>Improve the Service through aggregated usage analytics</li>
        <li>Comply with applicable legal and regulatory requirements</li>
        <li>Send marketing communications (only with your explicit consent, and you may opt out at any time)</li>
      </ul>

      <h2>4A. Publicly Visible Data</h2>
      <p>
        Certain features of the Service generate data that is publicly accessible:
      </p>
      <ul>
        <li>
          <strong>Public Tracker:</strong> Uptime monitoring results for selected third-party websites
          and services are displayed publicly on the Upnotify website. This data relates to the monitored
          third-party services, not to your personal data. No personal data from your account is
          included in Public Tracker results.
        </li>
        <li>
          <strong>Upnotify Score:</strong> When you or any visitor uses the Upnotify Score tool to scan a
          URL, the resulting health score and diagnostic summary may be cached and displayed publicly.
          The scanned URL and the resulting score are not linked to your account or personal data
          unless you are logged in at the time of the scan, in which case the scan is associated with
          your account for your convenience but the public display does not reveal your identity.
        </li>
        <li>
          <strong>Status Pages:</strong> If you create a public status page, the monitoring data,
          incident history, and uptime statistics displayed on that page are publicly visible by design.
        </li>
      </ul>

      <h2>4B. Account Access by Upnotify Personnel</h2>
      <p>
        To provide customer support, diagnose technical issues, and maintain the integrity of the
        Service, authorised Upnotify administrators may access your account in a read-only view
        (&quot;account impersonation&quot;). When this occurs:
      </p>
      <ul>
        <li>
          Access is limited to authorised personnel and is used solely for support and operational
          purposes.
        </li>
        <li>
          Every instance of impersonation access is recorded in an immutable audit log, including
          the administrator&apos;s identity, the account accessed, the timestamp, duration, and IP
          address.
        </li>
        <li>
          Administrators cannot modify your data, change your settings, or take actions on your
          behalf during impersonation access.
        </li>
        <li>
          You may request a copy of the audit log entries relating to any impersonation access to
          your account by contacting shreya23001@gmail.com.
        </li>
      </ul>
      <p>
        The legal basis for this processing is our legitimate interest (Article 6(1)(f)) in providing
        effective customer support and maintaining the security and integrity of the Service.
      </p>

      <h2>4C. Watchdog — Competitor Monitoring Data</h2>
      <p>
        When you use the Watchdog feature to monitor third-party websites (&quot;Tracked Sites&quot;),
        Upnotify sends standard HTTP requests to the URLs you configure and records:
      </p>
      <ul>
        <li>The URL you have chosen to monitor</li>
        <li>HTTP response codes, response times, and SSL certificate status returned by that URL</li>
        <li>Timestamps of each check and any detected downtime events</li>
      </ul>
      <p>
        Upnotify does <strong>not</strong> collect any personal data from Tracked Sites. Checks are
        performed against publicly accessible URLs only and do not attempt to authenticate or access
        any non-public content.
      </p>
      <p>
        Watchdog data is stored within your account and is subject to the same retention, security,
        and access controls as all other monitoring data described in this Policy. It is not shared
        with, provided to, or made accessible by any Tracked Site or its operators.
      </p>
      <p>
        The legal basis for this processing is the performance of our contract with you (Article
        6(1)(b) UK GDPR) — you have configured Watchdog and we process the resulting data to deliver
        the monitoring service you have requested.
      </p>

      <h2>5. Third-Party Data Processors</h2>
      <p>
        We share your personal data with the following third-party service providers, each of whom acts
        as a data processor on our behalf. All processors are bound by data processing agreements and
        are required to handle your data in accordance with applicable data protection law.
      </p>
      <table>
        <thead>
          <tr>
            <th>Processor</th>
            <th>Purpose</th>
            <th>Data Processed</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase (Frankfurt)</td>
            <td>Database, authentication, real-time services</td>
            <td>Account data, monitoring data, check results</td>
            <td>EU (Frankfurt, Germany)</td>
          </tr>
          <tr>
            <td>Stripe</td>
            <td>Payment processing, subscriptions, Connect payouts</td>
            <td>Billing information, transaction data</td>
            <td>EU / US (with EU SCCs)</td>
          </tr>
          <tr>
            <td>Vercel</td>
            <td>Application hosting, edge functions, cron jobs</td>
            <td>IP address, request metadata</td>
            <td>Global (EU-primary with SCCs)</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Transactional email delivery (alerts, reports, account emails)</td>
            <td>Email address, email content</td>
            <td>US (with EU SCCs)</td>
          </tr>
          <tr>
            <td>Anthropic (Claude API)</td>
            <td>AI-powered report generation and analysis</td>
            <td>Aggregated, anonymised monitoring data</td>
            <td>US (with EU SCCs)</td>
          </tr>
          <tr>
            <td>Razorpay</td>
            <td>Payment processing for customers in India (coming soon)</td>
            <td>Billing information, transaction data</td>
            <td>India (with EU SCCs)</td>
          </tr>
          <tr>
            <td>Twilio</td>
            <td>SMS, WhatsApp, and voice call alerts</td>
            <td>Phone number, alert content</td>
            <td>US (with EU SCCs)</td>
          </tr>
        </tbody>
      </table>
      <p>
        We do not sell, rent, or trade your personal data to any third party for their own marketing
        purposes.
      </p>

      <h2>6. International Data Transfers</h2>
      <p>
        Your primary data is stored in the European Union (Supabase Frankfurt region). Where data is
        transferred outside the EU/UK, we ensure that appropriate safeguards are in place, including:
      </p>
      <ul>
        <li>
          <strong>EU Standard Contractual Clauses (SCCs)</strong> and <strong>UK International Data
          Transfer Agreement (IDTA)</strong> with all processors that store or process data outside
          the EU/UK.
        </li>
        <li>
          Transfers to countries with an <strong>adequacy decision</strong> from the European Commission
          or UK Secretary of State, where applicable.
        </li>
      </ul>
      <p>
        We conduct transfer impact assessments for each international transfer to ensure your data
        receives an equivalent level of protection.
      </p>

      <h2>7. Data Retention</h2>
      <p>We retain your personal data only for as long as necessary to fulfil the purposes described in this Privacy Policy:</p>
      <table>
        <thead>
          <tr>
            <th>Data Category</th>
            <th>Retention Period</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account information</td>
            <td>Duration of account + 30 days after deletion</td>
          </tr>
          <tr>
            <td>Monitoring and check result data</td>
            <td>Duration of account + 30 days after deletion</td>
          </tr>
          <tr>
            <td>Billing and transaction records</td>
            <td>7 years from the date of transaction (legal requirement)</td>
          </tr>
          <tr>
            <td>Audit logs</td>
            <td>1 year from creation</td>
          </tr>
          <tr>
            <td>Support correspondence</td>
            <td>2 years from the last communication</td>
          </tr>
          <tr>
            <td>Technical/usage logs</td>
            <td>90 days</td>
          </tr>
        </tbody>
      </table>
      <p>
        When data is no longer required, it is securely deleted or anonymised so that it can no longer
        be associated with you.
      </p>

      <h2>8. Your Rights</h2>
      <p>
        Under the UK GDPR and EU GDPR, you have the following rights regarding your personal data:
      </p>
      <ul>
        <li>
          <strong>Right of access (Article 15):</strong> You have the right to request a copy of the
          personal data we hold about you.
        </li>
        <li>
          <strong>Right to rectification (Article 16):</strong> You have the right to request that we
          correct any inaccurate or incomplete personal data.
        </li>
        <li>
          <strong>Right to erasure (Article 17):</strong> You have the right to request the deletion of
          your personal data, subject to certain legal exceptions. Upon a valid erasure request, we will
          delete your data within 30 days.
        </li>
        <li>
          <strong>Right to data portability (Article 20):</strong> You have the right to receive your
          personal data in a structured, commonly used, and machine-readable format (JSON or CSV).
        </li>
        <li>
          <strong>Right to restriction of processing (Article 18):</strong> You have the right to request
          that we limit the processing of your personal data in certain circumstances.
        </li>
        <li>
          <strong>Right to object (Article 21):</strong> You have the right to object to the processing of
          your personal data where we rely on legitimate interest as the legal basis.
        </li>
        <li>
          <strong>Right to withdraw consent:</strong> Where processing is based on your consent, you may
          withdraw that consent at any time. Withdrawal does not affect the lawfulness of processing
          carried out before withdrawal.
        </li>
      </ul>
      <p>
        To exercise any of these rights, please contact us at shreya23001@gmail.com. We will respond to your
        request within one month, or notify you if an extension is required (up to two additional months
        for complex requests). You will not be charged a fee for exercising your rights, except where
        requests are manifestly unfounded or excessive.
      </p>
      <p>
        You may also export your data at any time using the data export feature in your account settings.
      </p>

      <h2>9. Children&apos;s Privacy</h2>
      <p>
        The Service is not designed for or directed at individuals under the age of 16. We do not
        knowingly collect personal data from children under 16. If we become aware that we have
        inadvertently collected personal data from a child under 16, we will take steps to delete that
        data as soon as possible. If you believe we may have collected data from a child under 16,
        please contact us at shreya23001@gmail.com.
      </p>

      <h2>10. Cookies</h2>
      <p>
        We use a limited number of cookies and similar technologies to operate the Service. For full
        details on the cookies we use, their purpose, and how to manage them, please see our
        <a href="/cookies">Cookie Policy</a>.
      </p>

      <h2>11. Security Measures</h2>
      <p>
        We implement appropriate technical and organisational measures to protect your personal data
        against unauthorised access, alteration, disclosure, or destruction. These measures include:
      </p>
      <ul>
        <li>Encryption of data in transit using TLS 1.2 or higher</li>
        <li>Encryption of sensitive data at rest using AES-256</li>
        <li>Row-level security (RLS) at the database level to ensure strict data isolation</li>
        <li>Hashing of passwords using bcrypt</li>
        <li>Hashing of API keys on creation (shown once, never stored in plain text)</li>
        <li>HMAC-SHA256 signing of webhook payloads</li>
        <li>Immutable audit logging of all security-relevant events</li>
        <li>Automated security scanning of dependencies</li>
        <li>Regular access reviews and principle of least privilege</li>
      </ul>
      <p>
        While we take all reasonable steps to protect your data, no system is completely secure. We
        cannot guarantee absolute security, but we are committed to promptly addressing any security
        incidents.
      </p>

      <h2>12. Data Breach Notification</h2>
      <p>
        In the event of a personal data breach that is likely to result in a risk to your rights and
        freedoms, we will:
      </p>
      <ul>
        <li>
          Notify the UK Information Commissioner&apos;s Office (ICO) within 72 hours of becoming aware of
          the breach, as required by Article 33 of the UK GDPR.
        </li>
        <li>
          Notify you without undue delay if the breach is likely to result in a high risk to your rights
          and freedoms, as required by Article 34 of the UK GDPR.
        </li>
        <li>
          Take immediate steps to contain the breach, investigate its cause, and implement measures to
          prevent recurrence.
        </li>
      </ul>

      <h2>13. Automated Decision-Making</h2>
      <p>
        We use AI (Anthropic Claude API) to generate automated report summaries and performance analyses
        based on your monitoring data. These are informational outputs only and do not constitute
        automated decision-making that produces legal or similarly significant effects on you. You may
        request human review of any AI-generated output by contacting shreya23001@gmail.com.
      </p>

      <h2>14. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices or
        applicable law. When we make material changes, we will notify you by email and by posting a
        prominent notice on the Service at least 30 days before the changes take effect.
      </p>
      <p>
        We encourage you to review this Privacy Policy periodically. The &quot;Last updated&quot; date at the top
        of this page indicates when the most recent revision was made.
      </p>

      <h2>15. Complaints</h2>
      <p>
        If you are not satisfied with our response to a privacy concern, you have the right to lodge a
        complaint with the relevant supervisory authority:
      </p>
      <ul>
        <li>
          <strong>United Kingdom:</strong> Information Commissioner&apos;s Office (ICO) &mdash;
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a> &mdash;
          Telephone: 0303 123 1113
        </li>
        <li>
          <strong>European Union:</strong> Your local Data Protection Authority (DPA). A list of EU DPAs
          is available at
          <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer">
            edpb.europa.eu
          </a>.
        </li>
      </ul>

      <h2>16. Contact Us</h2>
      <p>
        For any questions, concerns, or requests regarding this Privacy Policy or your personal data,
        please contact:
      </p>
      <ul>
        <li><strong>Data Protection Officer:</strong> shreya23001@gmail.com</li>
        <li><strong>General Support:</strong> shreya23001@gmail.com</li>
        <li><strong>Post:</strong> Data Protection Officer, Vision Software Solutions Limited, C/O Benison Solvers Limited, 1000 Great West Road, Brentford, United Kingdom, TW8 9DW</li>
      </ul>
    </>
  )
}

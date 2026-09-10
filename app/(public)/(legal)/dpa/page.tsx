import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Processing Agreement',
  description:
    'Upnotify Data Processing Agreement (DPA). Covers data processing terms for GDPR compliance between Upnotify and its customers.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/dpa' },
}

export default function DataProcessingAgreementPage(): React.ReactElement {
  return (
    <>
      <h1>Data Processing Agreement</h1>
      <p className="legal-updated">Last updated: 30 March 2026</p>

      <p>
        This Data Processing Agreement (&quot;DPA&quot;) forms part of the agreement between Vision Software Solutions Limited,
        a company registered in England and Wales with its registered office at C/O Benison Solvers Limited, 1000 Great West Road, Brentford, United Kingdom, TW8 9DW
        (&quot;Uptrue&quot;, &quot;Processor&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), and the customer (&quot;Controller&quot;,
        &quot;you&quot;, or &quot;your&quot;) who has agreed to the Upnotify <a href="/terms">Terms of Service</a>.
      </p>
      <p>
        This DPA sets out the terms under which Upnotify processes personal data on behalf of the
        Controller in connection with the provision of the Upnotify monitoring platform (the &quot;Service&quot;).
        This DPA is entered into pursuant to Article 28 of the UK General Data Protection Regulation
        (UK GDPR) and, where applicable, Article 28 of the EU General Data Protection Regulation
        (EU GDPR).
      </p>
      <p>
        This DPA applies automatically to all customers. By using the Service, you agree to the
        terms of this DPA.
      </p>

      <h2>1. Definitions</h2>
      <p>In this DPA, unless the context requires otherwise:</p>
      <ul>
        <li>
          <strong>&quot;Data Protection Laws&quot;</strong> means the UK GDPR, the Data Protection Act 2018,
          the EU GDPR, the Privacy and Electronic Communications Regulations 2003 (PECR), and all
          other applicable data protection and privacy legislation.
        </li>
        <li>
          <strong>&quot;Personal Data&quot;</strong> means any information relating to an identified or
          identifiable natural person that is processed by Upnotify on behalf of the Controller in
          connection with the Service.
        </li>
        <li>
          <strong>&quot;Processing&quot;</strong> means any operation or set of operations performed on
          Personal Data, including collection, recording, organisation, structuring, storage,
          adaptation, retrieval, consultation, use, disclosure, combination, restriction, erasure,
          or destruction.
        </li>
        <li>
          <strong>&quot;Sub-processor&quot;</strong> means any third party engaged by Upnotify to process
          Personal Data on behalf of the Controller.
        </li>
        <li>
          <strong>&quot;Data Breach&quot;</strong> means a breach of security leading to the accidental or
          unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, Personal
          Data transmitted, stored, or otherwise processed.
        </li>
        <li>
          <strong>&quot;Data Subject&quot;</strong> means an identified or identifiable natural person whose
          Personal Data is processed under this DPA.
        </li>
      </ul>

      <h2>2. Scope and Purpose of Processing</h2>
      <h3>2.1 Subject Matter</h3>
      <p>
        Upnotify processes Personal Data on behalf of the Controller solely for the purpose of providing
        the Service, which includes website and infrastructure monitoring, alerting, status page
        hosting, incident management, and report generation.
      </p>
      <h3>2.2 Categories of Data Subjects</h3>
      <p>The Personal Data processed under this DPA may relate to the following categories of Data Subjects:</p>
      <ul>
        <li>The Controller&apos;s employees, contractors, and authorised users of the Service</li>
        <li>The Controller&apos;s clients and end users (in the case of Agency accounts)</li>
        <li>Individuals whose contact information is provided for alert delivery (email recipients, phone number holders)</li>
      </ul>
      <h3>2.3 Types of Personal Data</h3>
      <p>The types of Personal Data processed may include:</p>
      <ul>
        <li>Name and email address (account information)</li>
        <li>Phone number (for SMS, WhatsApp, and voice call alerts)</li>
        <li>IP addresses (from access logs and audit records)</li>
        <li>Organisation name and role assignments</li>
        <li>Monitor configuration data (URLs, endpoints)</li>
        <li>Billing and transaction data (processed by Stripe; Upnotify does not store payment card details)</li>
      </ul>
      <h3>2.4 Duration</h3>
      <p>
        Processing shall continue for the duration of the Controller&apos;s use of the Service and for
        the retention periods specified in the <a href="/privacy">Privacy Policy</a>, unless earlier
        termination or deletion is requested.
      </p>

      <h2>3. Processor Obligations</h2>
      <p>Upnotify, as the Processor, shall:</p>
      <ul>
        <li>
          Process Personal Data only on the documented instructions of the Controller, including with
          respect to transfers of Personal Data outside the UK or EU, unless required to do so by
          applicable law, in which case Upnotify shall inform the Controller of that legal requirement
          before processing (unless prohibited from doing so by law).
        </li>
        <li>
          Ensure that persons authorised to process the Personal Data have committed themselves to
          confidentiality or are under an appropriate statutory obligation of confidentiality.
        </li>
        <li>
          Implement and maintain appropriate technical and organisational measures to ensure a level
          of security appropriate to the risk, as described in Section 5.
        </li>
        <li>
          Respect the conditions for engaging Sub-processors, as described in Section 4.
        </li>
        <li>
          Assist the Controller, taking into account the nature of processing, in fulfilling the
          Controller&apos;s obligations to respond to Data Subject requests, as described in Section 7.
        </li>
        <li>
          Assist the Controller in ensuring compliance with obligations relating to security of
          processing, notification of Data Breaches, data protection impact assessments, and prior
          consultation with supervisory authorities.
        </li>
        <li>
          At the choice of the Controller, delete or return all Personal Data to the Controller after
          the end of the provision of the Service, and delete existing copies unless retention is
          required by applicable law, as described in Section 8.
        </li>
        <li>
          Make available to the Controller all information necessary to demonstrate compliance with
          the obligations laid down in Article 28 of the UK GDPR / EU GDPR and allow for and
          contribute to audits, including inspections, as described in Section 9.
        </li>
        <li>
          Immediately inform the Controller if, in Upnotify&apos;s opinion, an instruction from the
          Controller infringes Data Protection Laws.
        </li>
      </ul>

      <h2>4. Sub-processors</h2>
      <h3>4.1 Authorised Sub-processors</h3>
      <p>
        The Controller provides general written authorisation for Upnotify to engage Sub-processors.
        The following Sub-processors are currently authorised:
      </p>
      <table>
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Purpose</th>
            <th>Data Processed</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase Inc.</td>
            <td>Database hosting, authentication, real-time services</td>
            <td>Account data, monitoring data, check results, authentication tokens</td>
            <td>EU (Frankfurt, Germany)</td>
          </tr>
          <tr>
            <td>Stripe Inc.</td>
            <td>Payment processing, subscription management, Connect payouts</td>
            <td>Billing name, address, payment method details, transaction records</td>
            <td>EU / US (SCCs in place)</td>
          </tr>
          <tr>
            <td>Vercel Inc.</td>
            <td>Application hosting, edge functions, cron job execution</td>
            <td>IP addresses, HTTP request metadata</td>
            <td>Global edge (EU-primary, SCCs in place)</td>
          </tr>
          <tr>
            <td>Resend Inc.</td>
            <td>Transactional email delivery</td>
            <td>Email addresses, email subject and body content</td>
            <td>US (SCCs in place)</td>
          </tr>
          <tr>
            <td>Anthropic PBC</td>
            <td>AI-powered report generation and analysis (Claude API)</td>
            <td>Aggregated, anonymised monitoring metrics and performance data</td>
            <td>US (SCCs in place)</td>
          </tr>
          <tr>
            <td>Twilio Inc.</td>
            <td>SMS, WhatsApp, and voice call alert delivery</td>
            <td>Phone numbers, alert message content</td>
            <td>US (SCCs in place)</td>
          </tr>
        </tbody>
      </table>

      <h3>4.2 Changes to Sub-processors</h3>
      <p>
        Upnotify shall notify the Controller by email at least 30 days before adding or replacing a
        Sub-processor, providing the Controller with the opportunity to object to the change. If the
        Controller objects on reasonable data protection grounds and the parties cannot resolve the
        objection within 30 days, the Controller may terminate the Service agreement with immediate
        effect.
      </p>
      <h3>4.3 Sub-processor Agreements</h3>
      <p>
        Upnotify shall enter into a written agreement with each Sub-processor imposing data protection
        obligations no less protective than those set out in this DPA. Upnotify remains fully liable
        to the Controller for the performance of each Sub-processor&apos;s obligations.
      </p>

      <h2>5. Security Measures</h2>
      <p>
        Upnotify implements and maintains the following technical and organisational measures to protect
        Personal Data:
      </p>

      <h3>5.1 Encryption</h3>
      <ul>
        <li>All data in transit is encrypted using TLS 1.2 or higher</li>
        <li>Sensitive data at rest is encrypted using AES-256</li>
        <li>API keys are hashed using bcrypt on creation and never stored in plain text</li>
        <li>Webhook payloads are signed using HMAC-SHA256</li>
      </ul>

      <h3>5.2 Access Controls</h3>
      <ul>
        <li>Row-level security (RLS) enforced at the database level to ensure strict data isolation between organisations</li>
        <li>All database queries are additionally scoped by organisation ID at the application level</li>
        <li>Principle of least privilege applied to all system and database accounts</li>
        <li>Multi-factor authentication available for user accounts</li>
        <li>Admin access restricted to whitelisted email addresses with Google OAuth</li>
      </ul>

      <h3>5.3 Audit Logging</h3>
      <ul>
        <li>Immutable audit logs of all authentication events, admin actions, and security-relevant operations</li>
        <li>Audit logs include timestamp, user ID, action, resource type, resource ID, and IP address</li>
        <li>Audit logs do not contain passwords, tokens, or personal data content</li>
        <li>Audit logs are retained for one year</li>
      </ul>

      <h3>5.4 Infrastructure Security</h3>
      <ul>
        <li>Application hosted on Vercel with automatic security patching</li>
        <li>Database hosted on Supabase (AWS Frankfurt) with managed security</li>
        <li>Automated dependency vulnerability scanning via npm audit in CI/CD pipeline</li>
        <li>GitHub Actions secret scanner to prevent accidental credential exposure</li>
        <li>Error tracking and monitoring via Sentry</li>
      </ul>

      <h3>5.5 Organisational Measures</h3>
      <ul>
        <li>Confidentiality obligations for all personnel with access to Personal Data</li>
        <li>Regular access reviews</li>
        <li>Incident response procedures documented and tested</li>
        <li>Data protection awareness for all team members</li>
      </ul>

      <h2>6. Data Breach Notification</h2>
      <h3>6.1 Notification to Controller</h3>
      <p>
        Upnotify shall notify the Controller without undue delay, and in any event within 72 hours of
        becoming aware of a Data Breach affecting Personal Data processed on behalf of the Controller.
      </p>
      <h3>6.2 Content of Notification</h3>
      <p>The notification shall include, to the extent available:</p>
      <ul>
        <li>A description of the nature of the Data Breach, including where possible the categories and approximate number of Data Subjects and records affected</li>
        <li>The name and contact details of the point of contact for further information</li>
        <li>A description of the likely consequences of the Data Breach</li>
        <li>A description of the measures taken or proposed to be taken to address the Data Breach, including measures to mitigate its possible adverse effects</li>
      </ul>
      <h3>6.3 Cooperation</h3>
      <p>
        Upnotify shall cooperate with the Controller and take all reasonable steps to assist in the
        investigation, mitigation, and remediation of any Data Breach. Upnotify shall also assist the
        Controller in meeting its obligations to notify the relevant supervisory authority and affected
        Data Subjects, as applicable.
      </p>

      <h2>7. Data Subject Requests</h2>
      <p>
        Upnotify shall, taking into account the nature of the processing, assist the Controller by
        appropriate technical and organisational measures, insofar as this is possible, in fulfilling
        the Controller&apos;s obligations to respond to Data Subject requests to exercise their rights
        under Data Protection Laws, including:
      </p>
      <ul>
        <li>Right of access</li>
        <li>Right to rectification</li>
        <li>Right to erasure</li>
        <li>Right to restriction of processing</li>
        <li>Right to data portability</li>
        <li>Right to object</li>
      </ul>
      <p>
        If Upnotify receives a request directly from a Data Subject, Upnotify shall promptly notify the
        Controller and shall not respond to the request directly unless instructed to do so by the
        Controller or required to do so by applicable law.
      </p>
      <p>
        The Service provides self-service data export functionality (JSON and CSV formats) that
        Controllers can use to fulfil access and portability requests. Erasure requests can be
        fulfilled via the account deletion feature or by contacting shreya23001@gmail.com.
      </p>

      <h2>8. Data Deletion and Return</h2>
      <h3>8.1 Upon Termination</h3>
      <p>
        Upon termination of the Service agreement, at the Controller&apos;s choice, Upnotify shall:
      </p>
      <ul>
        <li>
          <strong>Return</strong> all Personal Data to the Controller in a structured, commonly used,
          and machine-readable format (JSON or CSV); or
        </li>
        <li>
          <strong>Delete</strong> all Personal Data and confirm deletion in writing.
        </li>
      </ul>
      <p>
        The Controller has 30 days from the date of termination to request return of data. After
        this period, Upnotify shall securely delete all Personal Data, unless retention is required
        by applicable law.
      </p>
      <h3>8.2 Retention Exceptions</h3>
      <p>
        Upnotify may retain Personal Data beyond the termination date solely to the extent required by
        applicable law (e.g., financial and tax records for 7 years under UK law). Such retained data
        will continue to be protected in accordance with this DPA and will be deleted as soon as the
        legal retention period expires.
      </p>

      <h2>9. Audit Rights</h2>
      <h3>9.1 Information</h3>
      <p>
        Upnotify shall make available to the Controller all information necessary to demonstrate
        compliance with the obligations in this DPA and in Article 28 of the UK GDPR / EU GDPR.
      </p>
      <h3>9.2 Audits</h3>
      <p>
        The Controller, or an independent third-party auditor mandated by the Controller, may conduct
        an audit of Upnotify&apos;s processing activities and compliance with this DPA, subject to the
        following conditions:
      </p>
      <ul>
        <li>
          The Controller shall provide at least 30 days&apos; written notice of any audit request.
        </li>
        <li>
          Audits shall be conducted during normal business hours and shall not unreasonably disrupt
          Upnotify&apos;s operations.
        </li>
        <li>
          The Controller shall bear the costs of the audit, unless the audit reveals a material
          breach by Upnotify, in which case Upnotify shall bear the reasonable costs.
        </li>
        <li>
          The Controller may conduct no more than one audit per 12-month period, unless a Data Breach
          has occurred or a supervisory authority requires an additional audit.
        </li>
        <li>
          All information obtained during the audit shall be treated as Confidential Information.
        </li>
      </ul>
      <h3>9.3 Alternative Assurance</h3>
      <p>
        Where Upnotify has obtained a relevant third-party certification or audit report (such as SOC 2
        Type II or ISO 27001), Upnotify may provide such report to the Controller as an alternative to
        an on-site audit, provided the report is current and covers the relevant processing activities.
      </p>

      <h2>10. International Data Transfers</h2>
      <h3>10.1 Primary Storage</h3>
      <p>
        Personal Data is primarily stored within the European Union (Supabase, Frankfurt, Germany).
      </p>
      <h3>10.2 Transfers Outside the EU/UK</h3>
      <p>
        Where Personal Data is transferred to Sub-processors located outside the EU/UK (as identified
        in Section 4.1), Upnotify ensures that appropriate safeguards are in place, including:
      </p>
      <ul>
        <li>
          <strong>EU Standard Contractual Clauses (SCCs)</strong> as approved by the European Commission
          (Decision 2021/914), incorporated into agreements with each relevant Sub-processor.
        </li>
        <li>
          <strong>UK International Data Transfer Agreement (IDTA)</strong> or the <strong>UK Addendum
          to the EU SCCs</strong>, as approved by the UK Information Commissioner, where transfers
          originate from the UK.
        </li>
      </ul>
      <h3>10.3 Transfer Impact Assessments</h3>
      <p>
        Upnotify conducts transfer impact assessments for each international data transfer to evaluate
        whether the laws of the destination country provide an adequate level of protection and
        whether supplementary measures are required.
      </p>

      <h2>11. Duration and Termination</h2>
      <p>
        This DPA comes into effect when the Controller begins using the Service and remains in effect
        for the duration of the processing. Upon termination of the Service agreement, the provisions
        of this DPA shall continue to apply to any Personal Data retained by Upnotify until such data
        is securely deleted.
      </p>

      <h2>12. Liability</h2>
      <p>
        The liability of each party under this DPA is subject to the limitations and exclusions set
        out in the <a href="/terms">Terms of Service</a>. Each party shall be liable for damage caused
        by processing that infringes Data Protection Laws, in accordance with Article 82 of the
        UK GDPR / EU GDPR.
      </p>

      <h2>13. Governing Law</h2>
      <p>
        This DPA is governed by and construed in accordance with the laws of England and Wales. Any
        dispute arising under this DPA shall be subject to the exclusive jurisdiction of the courts
        of England and Wales, without prejudice to the rights of Data Subjects to lodge complaints
        with supervisory authorities or to seek judicial remedies in their Member State of habitual
        residence.
      </p>

      <h2>14. Contact</h2>
      <p>
        For questions about this Data Processing Agreement, please contact:
      </p>
      <ul>
        <li><strong>Data Protection Officer:</strong> shreya23001@gmail.com</li>
        <li><strong>General Support:</strong> shreya23001@gmail.com</li>
        <li><strong>Post:</strong> Data Protection Officer, Vision Software Solutions Limited, C/O Benison Solvers Limited, 1000 Great West Road, Brentford, United Kingdom, TW8 9DW</li>
      </ul>
    </>
  )
}

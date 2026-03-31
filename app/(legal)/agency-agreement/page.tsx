export default function AgencyPartnerAgreementPage(): React.ReactElement {
  return (
    <>
      <h1>Agency Partner Agreement</h1>
      <p className="legal-updated">Last updated: 30 March 2026</p>

      <p>
        This Agency Partner Agreement (&quot;Agreement&quot;) is entered into between Vision Software Solutions Limited, a company
        registered in England and Wales with its registered office at C/O Benison Solvers Limited, 1000 Great West Road, Brentford, United Kingdom, TW8 9DW
        (&quot;Uptrue&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), and the Agency (&quot;you&quot;, &quot;your&quot;, or &quot;Agency&quot;) that
        registers for an Agency plan on the Uptrue platform.
      </p>
      <p>
        This Agreement supplements the Uptrue <a href="/terms">Terms of Service</a>,
        <a href="/privacy"> Privacy Policy</a>, and <a href="/acceptable-use"> Acceptable Use Policy</a>,
        all of which are incorporated by reference. In the event of a conflict between this Agreement
        and the Terms of Service, this Agreement shall prevail with respect to Agency-specific matters.
      </p>
      <p>
        By activating an Agency plan, you confirm that you have the authority to enter into this Agreement
        on behalf of your organisation and that you have read, understood, and agree to be bound by its
        terms.
      </p>

      <h2>1. Agency Relationship</h2>
      <h3>1.1 Nature of Relationship</h3>
      <p>
        The relationship between Uptrue and the Agency is that of independent service providers. Nothing
        in this Agreement creates a partnership, joint venture, employment, or franchise relationship.
        The Agency is not an agent, representative, or employee of Uptrue and has no authority to bind
        Uptrue or make commitments on our behalf.
      </p>
      <h3>1.2 Agency Services</h3>
      <p>
        Under this Agreement, the Agency is authorised to use the Uptrue platform to provide website
        and infrastructure monitoring services to the Agency&apos;s own clients (&quot;End Clients&quot;). The
        Agency may manage monitors, configure alerts, create status pages, and generate reports on
        behalf of its End Clients.
      </p>
      <h3>1.3 End Client Relationship</h3>
      <p>
        The Agency maintains the direct commercial relationship with its End Clients. Uptrue has no
        direct contractual relationship with End Clients. The Agency is solely responsible for its
        agreements, pricing, support, and obligations to its End Clients.
      </p>

      <h2>2. Fees and Revenue Share</h2>
      <h3>2.1 Setup Fee</h3>
      <p>
        The Agency shall pay a one-time setup fee of &pound;149 (one hundred and forty-nine pounds
        sterling) to activate the Agency plan. This fee is non-refundable. Payment is processed
        through Stripe at the time of activation.
      </p>
      <h3>2.2 Revenue Share Model</h3>
      <p>
        The Agency may charge its End Clients for monitoring services at prices determined by the
        Agency at its sole discretion. For each payment received from an End Client through the
        Uptrue billing system, the revenue shall be split as follows:
      </p>
      <table>
        <thead>
          <tr>
            <th>Recipient</th>
            <th>Share</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Uptrue (Platform Fee)</td>
            <td>75%</td>
            <td>Platform infrastructure, monitoring engine, maintenance, support, and development</td>
          </tr>
          <tr>
            <td>Agency</td>
            <td>25%</td>
            <td>Agency&apos;s margin for client management, sales, and support</td>
          </tr>
        </tbody>
      </table>
      <p>
        The revenue share is calculated on the gross amount collected from the End Client, before any
        payment processing fees. Stripe&apos;s processing fees are deducted from the total before the
        split is applied.
      </p>
      <h3>2.3 Stripe Connect</h3>
      <p>
        Revenue sharing is facilitated through Stripe Connect. The Agency must create and maintain a
        valid Stripe Connect Express account as part of the onboarding process. The Agency is
        responsible for:
      </p>
      <ul>
        <li>Completing Stripe&apos;s identity verification and onboarding requirements</li>
        <li>Providing accurate banking and tax information to Stripe</li>
        <li>Maintaining compliance with Stripe&apos;s terms of service</li>
      </ul>
      <p>
        Uptrue does not store, process, or have access to the Agency&apos;s bank account details. All
        financial data is handled directly by Stripe.
      </p>
      <h3>2.4 Payouts</h3>
      <p>
        Agency payouts are processed weekly via Stripe Connect on the default Stripe payout schedule.
        Payouts are subject to Stripe&apos;s standard holding periods and processing times. The Agency
        may view payout history and pending balances within the Uptrue dashboard and their Stripe
        Express dashboard.
      </p>
      <h3>2.5 Taxes</h3>
      <p>
        Each party is responsible for its own tax obligations. The Agency is responsible for collecting
        and remitting any applicable taxes (including VAT, GST, or sales tax) on amounts charged to
        its End Clients. Uptrue will provide the Agency with necessary documentation for tax reporting
        purposes.
      </p>

      <h2>3. Agency Responsibilities</h2>
      <p>The Agency agrees to:</p>
      <ul>
        <li>
          Manage its End Client accounts accurately and in good faith, including correct configuration
          of monitors, alerts, and status pages.
        </li>
        <li>
          Provide first-line technical support to its End Clients. Uptrue provides platform-level
          support to the Agency, not directly to End Clients.
        </li>
        <li>
          Ensure that all End Clients are aware that monitoring services are powered by the Uptrue
          platform (unless operating under white-label terms as described in Section 5).
        </li>
        <li>
          Comply with all applicable laws and regulations in its dealings with End Clients, including
          data protection and consumer protection legislation.
        </li>
        <li>
          Not make any representations, warranties, or guarantees to End Clients on behalf of Uptrue
          without our prior written consent.
        </li>
        <li>
          Ensure that its billing practices to End Clients are fair, transparent, and compliant with
          applicable consumer protection laws.
        </li>
        <li>
          Promptly notify Uptrue of any material disputes, complaints, or legal proceedings involving
          End Clients that relate to the Service.
        </li>
      </ul>

      <h2>4. Uptrue Responsibilities</h2>
      <p>Uptrue agrees to:</p>
      <ul>
        <li>
          Provide and maintain the monitoring platform, including all core features (monitoring checks,
          alerting, status pages, reporting, and the check engine).
        </li>
        <li>
          Target 99.9% platform availability as described in the Service Level Agreement in the
          <a href="/terms">Terms of Service</a>.
        </li>
        <li>
          Provide platform-level technical support to the Agency via email (support@uptrue.io) during
          standard business hours.
        </li>
        <li>
          Process Agency payouts accurately and on schedule via Stripe Connect.
        </li>
        <li>
          Notify the Agency of any material changes to the platform, pricing, or this Agreement with
          at least 30 days&apos; notice.
        </li>
        <li>
          Provide reasonable documentation and guidance to assist the Agency in using the platform
          effectively.
        </li>
      </ul>

      <h2>5. White-Label Terms</h2>
      <h3>5.1 Branding</h3>
      <p>
        The Agency plan includes the ability to white-label certain aspects of the Service for End
        Clients, including:
      </p>
      <ul>
        <li>Custom logo and branding on status pages</li>
        <li>Custom colour schemes and styling on client-facing pages</li>
        <li>Custom domain mapping for status pages (e.g., status.agencydomain.com)</li>
        <li>Branded email alert templates (sender name customisation)</li>
      </ul>
      <h3>5.2 Restrictions</h3>
      <p>
        The Agency may not:
      </p>
      <ul>
        <li>
          Represent the Service as its own proprietary technology in a manner that is misleading or
          constitutes passing off.
        </li>
        <li>
          Remove or obscure Uptrue branding from areas where it is required (e.g., the Uptrue dashboard
          itself, API responses, or webhook payloads).
        </li>
        <li>
          Use Uptrue&apos;s trademarks, logos, or brand assets except as expressly permitted in this
          Agreement or in writing.
        </li>
      </ul>
      <h3>5.3 Agency Analytics</h3>
      <p>
        The Agency may configure its own Google Tag Manager container, Google Analytics property, or
        other analytics tools on its white-labelled pages. Uptrue&apos;s own analytics are never injected
        on Agency white-label pages. The Agency is responsible for complying with applicable cookie
        consent and privacy laws in relation to any analytics it configures.
      </p>

      <h2>6. End Client Data</h2>
      <h3>6.1 Data Processing</h3>
      <p>
        In relation to End Client data processed through the Service, the Agency acts as the data
        controller and Uptrue acts as the data processor. The terms of data processing are set out
        in the <a href="/dpa">Data Processing Agreement</a>, which forms part of this Agreement.
      </p>
      <h3>6.2 Data Isolation</h3>
      <p>
        End Client data is logically separated within the platform using workspace-level isolation and
        row-level security. The Agency can access all data within its organisation. End Clients (if
        given direct access) can only access data within their assigned workspace.
      </p>
      <h3>6.3 Data Portability</h3>
      <p>
        The Agency may export End Client data at any time using the data export features in the
        dashboard or by contacting support@uptrue.io.
      </p>

      <h2>7. Termination</h2>
      <h3>7.1 Termination by the Agency</h3>
      <p>
        The Agency may terminate this Agreement at any time by providing 30 days&apos; written notice to
        support@uptrue.io. Upon termination:
      </p>
      <ul>
        <li>
          The Agency will retain access to the Service for the 30-day notice period to facilitate
          migration of End Clients.
        </li>
        <li>
          Any outstanding payouts will be processed on the next scheduled payout date after termination.
        </li>
        <li>
          The one-time setup fee is non-refundable.
        </li>
      </ul>
      <h3>7.2 Termination by Uptrue</h3>
      <p>
        Uptrue may terminate this Agreement:
      </p>
      <ul>
        <li>
          With 30 days&apos; written notice for any reason, providing the Agency with reasonable time to
          migrate End Clients.
        </li>
        <li>
          Immediately, without notice, if the Agency materially breaches this Agreement, the Terms of
          Service, or the Acceptable Use Policy, and fails to remedy the breach within 14 days of
          written notice (where the breach is capable of remedy).
        </li>
        <li>
          Immediately if the Agency engages in fraud, illegal activity, or conduct that poses a
          material risk to Uptrue, other users, or third parties.
        </li>
      </ul>
      <h3>7.3 End Client Migration</h3>
      <p>
        Upon termination, the Agency is responsible for notifying its End Clients and facilitating the
        transition of monitoring services. Uptrue will:
      </p>
      <ul>
        <li>
          Provide data export capabilities for 30 days following termination.
        </li>
        <li>
          At the Agency&apos;s request and with End Client consent, assist in transferring End Client
          accounts to direct Uptrue plans (at Uptrue&apos;s standard pricing) or to another provider.
        </li>
        <li>
          Delete all Agency and End Client data 30 days after termination, in accordance with our
          Privacy Policy, unless retention is required by law.
        </li>
      </ul>

      <h2>8. Payment Terms</h2>
      <ul>
        <li>
          All Agency payouts are processed weekly via Stripe Connect.
        </li>
        <li>
          The minimum payout threshold is &pound;10 (or local currency equivalent). Balances below
          the threshold are carried forward to the next payout period.
        </li>
        <li>
          Uptrue reserves the right to withhold payouts if there is a dispute, chargeback, or suspected
          fraudulent activity, pending resolution.
        </li>
        <li>
          In the event of chargebacks or refunds issued to End Clients, the Agency&apos;s share of the
          refunded amount will be deducted from future payouts.
        </li>
      </ul>

      <h2>9. Non-Solicitation</h2>
      <p>
        During the term of this Agreement and for a period of 12 months following termination:
      </p>
      <ul>
        <li>
          The Agency agrees not to directly solicit or recruit Uptrue employees or contractors with
          whom the Agency has had material contact during the term.
        </li>
        <li>
          Uptrue agrees not to directly solicit or approach the Agency&apos;s End Clients to convert them
          to direct Uptrue accounts, except where the Agency has been terminated for breach or where
          the End Client independently contacts Uptrue.
        </li>
      </ul>
      <p>
        This section does not restrict either party from responding to general recruitment advertisements
        or from engaging with individuals who approach them independently.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        The limitation of liability provisions in the <a href="/terms">Terms of Service</a> (Section 8)
        apply to this Agreement. Additionally:
      </p>
      <ul>
        <li>
          Uptrue is not liable for any losses incurred by the Agency as a result of the Agency&apos;s
          dealings with its End Clients, including disputes over pricing, service quality, or
          contractual obligations between the Agency and its End Clients.
        </li>
        <li>
          The Agency shall indemnify and hold Uptrue harmless from any claims brought by End Clients
          arising from the Agency&apos;s actions, omissions, representations, or breaches of its
          obligations to End Clients.
        </li>
        <li>
          Uptrue&apos;s total liability to the Agency under this Agreement shall not exceed the total
          amount paid by the Agency to Uptrue in the three (3) months preceding the claim, or &pound;50,
          whichever is less.
        </li>
      </ul>

      <h2>11. Confidentiality</h2>
      <p>
        Each party agrees to keep confidential all non-public information received from the other party
        in connection with this Agreement, including but not limited to business plans, pricing,
        technical information, customer data, and financial information (&quot;Confidential Information&quot;).
      </p>
      <p>
        Confidential Information may be disclosed only to employees, contractors, or advisors who need
        to know it for the purposes of this Agreement and who are bound by obligations of confidentiality
        at least as protective as those in this section. This obligation survives termination of this
        Agreement for a period of two years.
      </p>
      <p>
        Confidential Information does not include information that: (a) is or becomes publicly available
        through no fault of the receiving party; (b) was known to the receiving party prior to disclosure;
        (c) is independently developed by the receiving party; or (d) is required to be disclosed by law
        or regulation.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        This Agreement is governed by and construed in accordance with the laws of England and Wales.
        Any dispute arising out of or in connection with this Agreement shall be subject to the exclusive
        jurisdiction of the courts of England and Wales.
      </p>
      <p>
        Before initiating formal proceedings, the parties agree to attempt to resolve any dispute through
        good-faith negotiation for a period of at least 30 days following written notice of the dispute.
      </p>

      <h2>13. General</h2>
      <h3>13.1 Entire Agreement</h3>
      <p>
        This Agreement, together with the Terms of Service, Privacy Policy, Cookie Policy, Acceptable
        Use Policy, and Data Processing Agreement, constitutes the entire agreement between the parties
        regarding the Agency relationship and supersedes all prior discussions and agreements.
      </p>
      <h3>13.2 Amendment</h3>
      <p>
        Uptrue may amend this Agreement with 30 days&apos; written notice. If the Agency does not agree
        to the amended terms, it may terminate this Agreement in accordance with Section 7.1.
      </p>
      <h3>13.3 Severability</h3>
      <p>
        If any provision of this Agreement is found to be invalid, illegal, or unenforceable, the
        remaining provisions shall continue in full force and effect.
      </p>
      <h3>13.4 Waiver</h3>
      <p>
        The failure of either party to enforce any provision of this Agreement shall not constitute a
        waiver of that provision or any other provision.
      </p>
      <h3>13.5 Assignment</h3>
      <p>
        The Agency may not assign or transfer its rights or obligations under this Agreement without
        Uptrue&apos;s prior written consent. Uptrue may assign its rights and obligations without restriction.
      </p>

      <h2>14. Contact</h2>
      <p>
        For questions about this Agency Partner Agreement, please contact:
      </p>
      <ul>
        <li><strong>Email:</strong> partners@uptrue.io</li>
        <li><strong>Support:</strong> support@uptrue.io</li>
        <li><strong>Post:</strong> Vision Software Solutions Limited, C/O Benison Solvers Limited, 1000 Great West Road, Brentford, United Kingdom, TW8 9DW</li>
      </ul>
    </>
  )
}

export default function TermsOfServicePage(): React.ReactElement {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="legal-updated">Last updated: 30 March 2026</p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Uptrue platform,
        website, and related services (collectively, the &quot;Service&quot;) operated by Vision Software Solutions Limited,
        a company registered in England and Wales with its registered office at C/O Benison Solvers Limited, 1000 Great West Road, Brentford, United Kingdom, TW8 9DW
        (&quot;Uptrue&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
      </p>
      <p>
        By creating an account, accessing, or using the Service, you agree to be bound by these Terms.
        If you are entering into these Terms on behalf of a company or other legal entity, you represent
        that you have the authority to bind that entity. If you do not agree to these Terms, you must not
        use the Service.
      </p>

      <h2>1. Service Description</h2>
      <p>
        Uptrue is a software-as-a-service (&quot;SaaS&quot;) platform that provides website and infrastructure
        monitoring services, including but not limited to:
      </p>
      <ul>
        <li>Uptime and HTTP response monitoring</li>
        <li>SSL certificate expiry monitoring</li>
        <li>DNS record change detection</li>
        <li>Keyword and content monitoring</li>
        <li>API endpoint monitoring</li>
        <li>Port and ping monitoring</li>
        <li>Heartbeat (cron job) monitoring</li>
        <li>Alerting via email, SMS, WhatsApp, voice call, Slack, and webhook</li>
        <li>Public and private status pages</li>
        <li>AI-powered performance and incident reports</li>
        <li>Incident management and resolution tracking</li>
        <li>White-label agency monitoring and client management</li>
      </ul>
      <p>
        The specific features available to you depend on the subscription plan you select. We reserve
        the right to modify, discontinue, or introduce new features at any time, with reasonable notice
        where practicable.
      </p>

      <h2>2. Account Terms</h2>
      <h3>2.1 Registration</h3>
      <p>
        To use the Service, you must create an account by providing accurate, complete, and current
        information. You must be at least 16 years of age to create an account. You agree to update
        your account information promptly if it changes.
      </p>
      <h3>2.2 Account Security</h3>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials, including
        your password and any API keys issued to your account. You agree to notify us immediately at
        support@uptrue.io if you become aware of any unauthorised access to or use of your account.
        We are not liable for any loss or damage arising from your failure to protect your account
        credentials.
      </p>
      <h3>2.3 Organisational Accounts and Roles</h3>
      <p>
        Uptrue supports organisational accounts with multiple users. The account owner (&quot;Owner&quot;) may
        invite additional users and assign roles including Administrator, Member, and Viewer. The Owner
        is responsible for the actions of all users within their organisation and for ensuring that all
        users comply with these Terms.
      </p>
      <h3>2.4 Agency Accounts</h3>
      <p>
        If you register as an Agency, additional terms apply as set out in the Agency Partner Agreement,
        which forms part of these Terms by reference. Agency accounts enable you to manage monitoring on
        behalf of your clients and to resell monitoring services under your own brand.
      </p>

      <h2>3. Subscription Plans and Billing</h2>
      <h3>3.1 Plans</h3>
      <p>Uptrue offers the following subscription tiers:</p>
      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Price</th>
            <th>Billing</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Usage-Based</td>
            <td>&pound;1 per monitor per month</td>
            <td>Monthly</td>
          </tr>
          <tr>
            <td>Starter</td>
            <td>&pound;19 per month</td>
            <td>Monthly</td>
          </tr>
          <tr>
            <td>Pro</td>
            <td>&pound;49 per month</td>
            <td>Monthly</td>
          </tr>
          <tr>
            <td>Agency</td>
            <td>&pound;149 one-time setup fee</td>
            <td>One-time + revenue share</td>
          </tr>
        </tbody>
      </table>
      <p>
        Feature availability, monitor limits, check intervals, and alert channel access vary by plan.
        Current plan details are available on our pricing page at uptrue.io/pricing.
      </p>
      <h3>3.2 Payment</h3>
      <p>
        All payments are processed securely through Stripe. By providing your payment information, you
        authorise us to charge the applicable fees to your chosen payment method. All prices are quoted
        in British Pounds Sterling (GBP) unless otherwise stated. Prices are exclusive of applicable
        taxes, which will be added where required by law.
      </p>
      <h3>3.3 Auto-Renewal</h3>
      <p>
        Monthly subscriptions renew automatically at the end of each billing period unless cancelled
        before the renewal date. You will be charged the then-current rate for your plan at each renewal.
        We will notify you of any price changes at least 30 days before they take effect.
      </p>
      <h3>3.4 Cancellation</h3>
      <p>
        You may cancel your subscription at any time from your account settings. Cancellation takes
        effect at the end of the current billing period. You will retain access to the Service until
        the end of that period. No partial refunds are issued for unused time within a billing period.
      </p>
      <h3>3.5 Refunds</h3>
      <p>
        As a general policy, fees paid are non-refundable. However, if you experience a material service
        failure attributable to Uptrue, you may request a credit or refund by contacting
        support@uptrue.io within 14 days of the issue. Refund requests are assessed on a case-by-case
        basis at our reasonable discretion.
      </p>
      <h3>3.6 Plan Changes</h3>
      <p>
        You may upgrade or downgrade your plan at any time. Upgrades take effect immediately. When
        upgrading, you will be charged the prorated difference for the remainder of the current billing
        period. Downgrades take effect at the start of the next billing period. If you downgrade to a
        plan with lower limits and your current usage exceeds those limits, monitoring will be paused on
        excess monitors until you reduce your usage or upgrade.
      </p>
      <h3>3.7 Overdue Payments</h3>
      <p>
        If a payment fails, we will retry the charge up to three times over a seven-day period. If payment
        remains unsuccessful, your account will be downgraded to a restricted state with monitoring paused.
        If payment is not resolved within 30 days, we reserve the right to suspend or terminate your account.
      </p>

      <h2>4. Service Level Agreement</h2>
      <p>
        Uptrue targets 99.9% platform availability for the Service, measured on a calendar month basis,
        excluding scheduled maintenance windows. Scheduled maintenance will be announced at least 48 hours
        in advance via our status page at status.uptrue.io and by email.
      </p>
      <p>
        If we fail to meet the 99.9% uptime target in any calendar month, affected customers on paid plans
        may request a service credit equal to 10% of their monthly fee for each full 0.1% below the target,
        up to a maximum of 100% of that month&apos;s fee. Credit requests must be submitted within 30 days of
        the month in question.
      </p>
      <p>
        This SLA does not apply to: (a) downtime caused by factors outside our reasonable control, including
        force majeure, internet disruptions, or third-party service failures; (b) issues resulting from your
        equipment, software, or network connections; (c) downtime during scheduled maintenance; or (d) abuse
        or excessive use in violation of these Terms.
      </p>

      <h2>5. Data Ownership</h2>
      <p>
        You retain all right, title, and interest in and to any data you submit to the Service, including
        monitoring configurations, check results, incident records, and reports (&quot;Customer Data&quot;). We do
        not claim ownership of your Customer Data.
      </p>
      <p>
        You grant Uptrue a limited, non-exclusive licence to process, store, and transmit your Customer
        Data solely for the purpose of providing the Service to you. This licence terminates when you
        delete your data or close your account.
      </p>
      <p>
        You may export your Customer Data at any time using the data export feature in your account
        settings, or by contacting support@uptrue.io.
      </p>

      <h2>6. Intellectual Property</h2>
      <p>
        The Service, including all software, code, design, documentation, trademarks, logos, and content
        created by Uptrue (&quot;Uptrue IP&quot;), is and remains the exclusive property of Vision Software Solutions Limited. These
        Terms do not grant you any right, title, or interest in the Uptrue IP except for the limited right
        to use the Service in accordance with these Terms.
      </p>
      <p>
        You may not copy, modify, distribute, sell, lease, reverse-engineer, decompile, or create derivative
        works based on any part of the Service or Uptrue IP without our prior written consent.
      </p>
      <p>
        Any feedback, suggestions, or ideas you provide to us regarding the Service may be used by us
        without restriction or obligation to you.
      </p>

      <h2>7. Prohibited Uses</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>
          Violate any applicable law, regulation, or third-party rights, including intellectual property,
          privacy, or data protection laws.
        </li>
        <li>
          Monitor websites or systems without the consent of their owner or operator, or in a manner that
          constitutes unauthorised access.
        </li>
        <li>
          Conduct or facilitate distributed denial-of-service (DDoS) attacks, load testing, stress testing,
          or any activity that could disrupt the target or the Service.
        </li>
        <li>
          Send spam, unsolicited communications, or phishing content via alert channels.
        </li>
        <li>
          Attempt to gain unauthorised access to the Service, other accounts, or related systems.
        </li>
        <li>
          Interfere with or disrupt the integrity or performance of the Service.
        </li>
        <li>
          Use the Service in connection with any illegal activity, including fraud, money laundering, or
          the distribution of illegal content.
        </li>
        <li>
          Resell or redistribute the Service except as expressly permitted under an Agency plan.
        </li>
        <li>
          Circumvent or attempt to circumvent any rate limits, usage limits, or security measures.
        </li>
      </ul>
      <p>
        Violation of this section may result in immediate suspension or termination of your account. See
        our <a href="/acceptable-use">Acceptable Use Policy</a> for further detail.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by applicable law:
      </p>
      <ul>
        <li>
          <strong>No indirect damages.</strong> In no event shall Uptrue, its directors, employees, or
          agents be liable for any indirect, incidental, special, consequential, or punitive damages,
          including but not limited to loss of profits, revenue, data, business opportunities, or
          goodwill, arising out of or related to your use of or inability to use the Service, even if
          we have been advised of the possibility of such damages.
        </li>
        <li>
          <strong>Liability cap.</strong> Our total aggregate liability to you for any and all claims
          arising under or in connection with these Terms or the Service shall not exceed the total
          amount you have paid to Uptrue in the twelve (12) months immediately preceding the event
          giving rise to the claim, or one hundred pounds sterling (&pound;100), whichever is greater.
        </li>
        <li>
          <strong>No guarantee of detection.</strong> While we endeavour to provide accurate and timely
          monitoring, we do not guarantee that the Service will detect every outage, incident, or issue
          affecting your monitored resources. The Service is a tool to assist your operational awareness
          and does not replace your own monitoring and incident response obligations.
        </li>
      </ul>
      <p>
        Nothing in these Terms excludes or limits our liability for: (a) death or personal injury caused
        by our negligence; (b) fraud or fraudulent misrepresentation; or (c) any other liability that
        cannot be excluded or limited under applicable law.
      </p>

      <h2>9. Indemnification</h2>
      <p>
        You agree to indemnify, defend, and hold harmless Vision Software Solutions Limited, its officers, directors,
        employees, and agents from and against any and all claims, damages, losses, liabilities, costs,
        and expenses (including reasonable legal fees) arising out of or related to: (a) your use of the
        Service; (b) your violation of these Terms; (c) your violation of any applicable law or
        regulation; or (d) your infringement of any third-party rights.
      </p>

      <h2>10. Suspension and Termination</h2>
      <h3>10.1 Termination by You</h3>
      <p>
        You may close your account at any time by contacting support@uptrue.io or using the account
        deletion feature in your settings. Upon termination, your data will be retained for 30 days to
        allow for recovery, after which it will be permanently deleted in accordance with our Privacy
        Policy.
      </p>
      <h3>10.2 Termination or Suspension by Us</h3>
      <p>
        We may suspend or terminate your access to the Service, in whole or in part, at any time and for
        any reason, including but not limited to:
      </p>
      <ul>
        <li>Breach of these Terms or the Acceptable Use Policy</li>
        <li>Non-payment of fees</li>
        <li>Conduct that we reasonably believe may harm Uptrue, other users, or third parties</li>
        <li>If required by law or regulation</li>
      </ul>
      <p>
        Where practicable, we will provide you with reasonable notice before suspension or termination,
        except where immediate action is necessary to protect the Service or comply with legal obligations.
      </p>
      <h3>10.3 Effect of Termination</h3>
      <p>
        Upon termination, your right to access and use the Service ceases immediately. Sections of these
        Terms that by their nature should survive termination will survive, including but not limited to
        provisions relating to intellectual property, limitation of liability, indemnification, and
        governing law.
      </p>

      <h2>11. Disclaimers</h2>
      <p>
        The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind,
        whether express, implied, or statutory. We disclaim all warranties, including but not limited to
        implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
      </p>
      <p>
        We do not warrant that the Service will be uninterrupted, error-free, secure, or free of viruses
        or other harmful components. We do not warrant that monitoring results will be accurate, complete,
        or timely in all circumstances.
      </p>

      <h2>12. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. When we make material changes, we will notify you by
        email to the address associated with your account and by posting a prominent notice on the Service
        at least 30 days before the changes take effect.
      </p>
      <p>
        Your continued use of the Service after the effective date of any changes constitutes your
        acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using
        the Service and close your account before the changes take effect.
      </p>

      <h2>13. Governing Law and Dispute Resolution</h2>
      <p>
        These Terms are governed by and construed in accordance with the laws of England and Wales. Any
        dispute arising out of or in connection with these Terms, including any question regarding their
        existence, validity, or termination, shall be subject to the exclusive jurisdiction of the courts
        of England and Wales.
      </p>
      <p>
        Before initiating formal proceedings, the parties agree to attempt to resolve any dispute through
        good-faith negotiation for a period of at least 30 days following written notice of the dispute.
      </p>

      <h2>14. General Provisions</h2>
      <h3>14.1 Entire Agreement</h3>
      <p>
        These Terms, together with the Privacy Policy, Cookie Policy, Acceptable Use Policy, Data
        Processing Agreement, and (where applicable) the Agency Partner Agreement, constitute the entire
        agreement between you and Vision Software Solutions Limited regarding the Service and supersede all prior agreements
        and understandings.
      </p>
      <h3>14.2 Severability</h3>
      <p>
        If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining
        provisions shall continue in full force and effect.
      </p>
      <h3>14.3 Waiver</h3>
      <p>
        Our failure to enforce any provision of these Terms shall not constitute a waiver of that provision
        or any other provision.
      </p>
      <h3>14.4 Assignment</h3>
      <p>
        You may not assign or transfer your rights or obligations under these Terms without our prior
        written consent. We may assign our rights and obligations under these Terms without restriction.
      </p>
      <h3>14.5 Force Majeure</h3>
      <p>
        Neither party shall be liable for any failure or delay in performance due to circumstances beyond
        its reasonable control, including but not limited to acts of God, natural disasters, war, terrorism,
        pandemic, government action, internet or telecommunications failures, or third-party service
        outages.
      </p>

      <h2>15. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us at:
      </p>
      <ul>
        <li><strong>Email:</strong> legal@uptrue.io</li>
        <li><strong>Support:</strong> support@uptrue.io</li>
        <li>
          <strong>Post:</strong> Vision Software Solutions Limited, C/O Benison Solvers Limited, 1000 Great West Road, Brentford, United Kingdom, TW8 9DW
        </li>
      </ul>
    </>
  )
}

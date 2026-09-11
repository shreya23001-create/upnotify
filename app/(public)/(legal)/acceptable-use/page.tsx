import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy',
  description:
    'Upnotify Acceptable Use Policy. Rules and restrictions governing your use of the Upnotify monitoring platform and services.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/acceptable-use' },
}

export default function AcceptableUsePolicyPage(): React.ReactElement {
  return (
    <>
      <h1>Acceptable Use Policy</h1>
      <p className="legal-updated">Last updated: 2 April 2026</p>

      <p>
        This Acceptable Use Policy (&quot;AUP&quot;) sets out the rules and restrictions governing your use of
        the Upnotify platform and services (the &quot;Service&quot;) operated by Crozent Techlabs Private Limited
        (&quot;Upnotify&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). This AUP is incorporated into and forms part of our
        <a href="/terms">Terms of Service</a>.
      </p>
      <p>
        By using the Service, you agree to comply with this AUP. We reserve the right to update this
        AUP at any time. Continued use of the Service after any changes constitutes your acceptance of
        the updated policy.
      </p>

      <h2>1. Prohibited Activities</h2>
      <p>You must not use the Service to:</p>

      <h3>1.1 Abusive Monitoring</h3>
      <ul>
        <li>
          Monitor websites, servers, APIs, or other resources that you do not own or do not have
          explicit written authorisation to monitor.
        </li>
        <li>
          Configure monitors at excessively high frequencies with the intent to overload, disrupt, or
          degrade the performance of the target resource or any intermediary infrastructure.
        </li>
        <li>
          Use the Service as a load-testing, stress-testing, or benchmarking tool against third-party
          systems.
        </li>
        <li>
          Use the Service to conduct or facilitate distributed denial-of-service (DDoS) attacks, whether
          directly or indirectly.
        </li>
        <li>
          Use monitoring data to engage in competitive intelligence gathering in a manner that violates
          applicable law or the terms of service of the monitored resource.
        </li>
      </ul>

      <h3>1.2 Spam and Unsolicited Communications</h3>
      <ul>
        <li>
          Use alert channels (email, SMS, WhatsApp, voice call, Slack, or webhook) to send spam,
          unsolicited commercial communications, or phishing content.
        </li>
        <li>
          Configure alerts in a manner designed to harass, threaten, or abuse any individual or
          organisation.
        </li>
        <li>
          Use status pages or any public-facing feature of the Service to distribute spam, advertising,
          or unsolicited content.
        </li>
      </ul>

      <h3>1.3 Illegal and Harmful Content</h3>
      <ul>
        <li>
          Use the Service in connection with any activity that violates applicable local, national, or
          international law, regulation, or governmental order.
        </li>
        <li>
          Monitor, host, link to, or distribute content that is illegal, defamatory, obscene, threatening,
          or that infringes the intellectual property rights of any third party.
        </li>
        <li>
          Use the Service in connection with fraud, money laundering, terrorist financing, or any other
          criminal activity.
        </li>
        <li>
          Use the Service to facilitate or promote discrimination, hatred, or violence against any
          individual or group.
        </li>
      </ul>

      <h3>1.4 Unauthorised Access and Security Violations</h3>
      <ul>
        <li>
          Attempt to gain unauthorised access to the Service, other user accounts, or any systems,
          networks, or data connected to the Service.
        </li>
        <li>
          Probe, scan, or test the vulnerability of the Service or any related infrastructure without
          our prior written consent.
        </li>
        <li>
          Interfere with, disrupt, or attempt to disrupt the integrity, performance, or availability
          of the Service or its underlying infrastructure.
        </li>
        <li>
          Reverse-engineer, decompile, disassemble, or otherwise attempt to derive the source code of
          the Service.
        </li>
        <li>
          Circumvent, disable, or interfere with any security features, rate limits, usage limits, or
          access controls of the Service.
        </li>
      </ul>

      <h3>1.5 Account Misuse</h3>
      <ul>
        <li>
          Create multiple accounts to circumvent plan limits, usage restrictions, or suspension or
          termination actions.
        </li>
        <li>
          Share your account credentials with unauthorised individuals or allow others to access the
          Service through your account.
        </li>
        <li>
          Resell, redistribute, or sublicense the Service except as expressly permitted under an Agency
          plan and the <a href="/agency-agreement">Agency Partner Agreement</a>.
        </li>
        <li>
          Provide false, misleading, or fraudulent information during registration or at any point during
          your use of the Service.
        </li>
      </ul>

      <h3>1.6 Competitive Intelligence (Upnotify Compete)</h3>
      <p>
        If you use or access the Upnotify Compete feature (competitive intelligence, price tracking,
        stock monitoring), you must comply with the following additional restrictions:
      </p>
      <ul>
        <li>
          You must not use Upnotify Compete to scrape, collect, or store data from any website that
          prohibits such activity in its terms of service or robots.txt file.
        </li>
        <li>
          You must not use Upnotify Compete to circumvent access controls, CAPTCHAs, rate limits, or
          other technical measures employed by any third-party website.
        </li>
        <li>
          You must respect the robots.txt directives of any website monitored through Upnotify Compete.
          Upnotify will make reasonable efforts to honour robots.txt restrictions automatically, but
          you remain responsible for ensuring your use is compliant.
        </li>
        <li>
          You must not use data obtained through Upnotify Compete to engage in price fixing, market
          manipulation, or any other activity that would violate competition law.
        </li>
        <li>
          You must not redistribute, resell, or publicly publish raw data obtained through Upnotify
          Compete without our prior written consent.
        </li>
      </ul>

      <h3>1.7 Public Tracker Disclaimer</h3>
      <p>
        The Upnotify Public Tracker displays uptime and performance data for selected third-party
        websites and services. This data is collected through external monitoring and is provided
        for informational purposes only. You acknowledge that:
      </p>
      <ul>
        <li>
          Public Tracker results may not reflect the actual internal status of the monitored service
          and may be affected by network conditions, regional variations, or transient issues.
        </li>
        <li>
          Upnotify is not affiliated with, endorsed by, or responsible for any third-party website or
          service displayed on the Public Tracker.
        </li>
        <li>
          You must not rely on Public Tracker data as the sole basis for business, financial, or
          operational decisions.
        </li>
      </ul>

      <h2>2. Rate Limiting and Fair Usage</h2>
      <p>
        To ensure the quality and availability of the Service for all users, we enforce rate limits and
        fair-use policies:
      </p>
      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>API Rate Limit</th>
            <th>Daily API Limit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Free / Lite / Builder</td>
            <td>60 requests per minute</td>
            <td>1,000 requests per day</td>
          </tr>
          <tr>
            <td>Scale</td>
            <td>60 requests per minute</td>
            <td>1,000 requests per day</td>
          </tr>
          <tr>
            <td>Agency</td>
            <td>300 requests per minute</td>
            <td>10,000 requests per day</td>
          </tr>
        </tbody>
      </table>
      <p>
        If you consistently exceed your rate limits, we may throttle your requests, temporarily suspend
        your API access, or require you to upgrade to a higher-tier plan. We will endeavour to notify
        you before taking such action.
      </p>
      <p>
        Monitoring check intervals are governed by your plan tier. Configuring checks at intervals below
        your plan&apos;s minimum is not permitted and will be automatically adjusted.
      </p>

      <h2>3. Account Suspension and Termination</h2>
      <p>
        If we determine, in our reasonable judgement, that you have violated this AUP, we may take one
        or more of the following actions:
      </p>
      <ul>
        <li>
          <strong>Warning:</strong> We may issue a written warning to the email address associated with
          your account, specifying the violation and requesting immediate remediation.
        </li>
        <li>
          <strong>Temporary suspension:</strong> We may temporarily suspend your access to the Service,
          in whole or in part, while we investigate the violation. We will endeavour to provide notice
          before suspension, except where immediate action is necessary to protect the Service, other
          users, or third parties.
        </li>
        <li>
          <strong>Permanent termination:</strong> For serious or repeated violations, we may permanently
          terminate your account. Upon termination, your data will be handled in accordance with our
          <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Service</a>.
        </li>
        <li>
          <strong>Legal action:</strong> We reserve the right to pursue legal remedies, including seeking
          damages, injunctive relief, or reporting the matter to relevant law enforcement authorities.
        </li>
      </ul>
      <p>
        You may appeal a suspension or termination by contacting info@upnotify.com within 14 days of the
        action. We will review your appeal and respond within a reasonable timeframe.
      </p>

      <h2>4. Reporting Abuse</h2>
      <p>
        If you become aware of any use of the Service that violates this AUP, please report it to us
        immediately at:
      </p>
      <ul>
        <li><strong>Email:</strong> info@upnotify.com</li>
      </ul>
      <p>
        When reporting abuse, please provide as much detail as possible, including:
      </p>
      <ul>
        <li>Your contact information</li>
        <li>A description of the suspected violation</li>
        <li>Any relevant evidence (URLs, screenshots, log data)</li>
        <li>The date and time the suspected violation occurred</li>
      </ul>
      <p>
        We will investigate all reports promptly and take appropriate action. We will not disclose the
        identity of the reporter to the accused party without the reporter&apos;s consent, except where
        required by law.
      </p>

      <h2>5. Your Responsibilities</h2>
      <p>You are responsible for:</p>
      <ul>
        <li>
          Ensuring that your use of the Service complies with this AUP, our Terms of Service, and all
          applicable laws and regulations.
        </li>
        <li>
          Ensuring that you have the necessary rights and authorisations to monitor the resources you
          configure within the Service.
        </li>
        <li>
          The actions of all users within your organisation who access the Service through your account.
        </li>
        <li>
          Promptly addressing any AUP violations by users within your organisation.
        </li>
      </ul>

      <h2>6. Consequences of Violation</h2>
      <p>
        Violation of this AUP may result in:
      </p>
      <ul>
        <li>Immediate suspension or termination of your account without refund</li>
        <li>Deletion of offending content or configurations</li>
        <li>Temporary or permanent restriction of specific features</li>
        <li>Reporting to relevant law enforcement authorities</li>
        <li>Civil or criminal liability as permitted by applicable law</li>
      </ul>
      <p>
        We exercise reasonable judgement in enforcing this AUP and will consider the severity, intent,
        and frequency of violations when determining the appropriate response.
      </p>

      <h2>7. Changes to This Policy</h2>
      <p>
        We may update this Acceptable Use Policy from time to time. When we make material changes, we
        will update the &quot;Last updated&quot; date at the top of this page and notify you via email or a
        notice within the Service. Your continued use of the Service after any changes constitutes
        your acceptance of the updated AUP.
      </p>

      <h2>8. Contact Us</h2>
      <p>
        If you have any questions about this Acceptable Use Policy, please contact us at:
      </p>
      <ul>
        <li><strong>Abuse reports:</strong> info@upnotify.com</li>
        <li><strong>General enquiries:</strong> info@upnotify.com</li>
        <li><strong>Post:</strong> Crozent Techlabs Private Limited, B-59, B-Block, Chipyana, Noida &ndash; 201009, Uttar Pradesh, India</li>
      </ul>
    </>
  )
}

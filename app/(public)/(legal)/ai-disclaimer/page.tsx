import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Content Disclaimer — Upnotify',
  description:
    'How Upnotify uses artificial intelligence for report summaries, score analysis, and competitive intelligence. Important limitations and disclaimers.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/ai-disclaimer' },
}

export default function AIDisclaimerPage(): React.ReactElement {
  return (
    <>
      <h1>AI Content Disclaimer</h1>
      <p className="legal-updated">Last updated: April 2026</p>

      <h2>1. How Upnotify Uses AI</h2>
      <p>
        Upnotify uses artificial intelligence technology provided by <strong>Anthropic</strong> (Claude)
        to generate certain content within the platform. AI is currently used for:
      </p>
      <ul>
        <li>
          <strong>Report summaries:</strong> AI-generated executive summaries of uptime, performance,
          and incident data in weekly and monthly reports.
        </li>
        <li>
          <strong>Score analysis:</strong> AI-powered commentary on website health scores, including
          recommendations and risk assessments.
        </li>
        <li>
          <strong>Competitive intelligence:</strong> AI-assisted analysis of competitor data, trends,
          and market positioning (where available).
        </li>
      </ul>

      <h2>2. Informational Purposes Only</h2>
      <p>
        All AI-generated content on Upnotify is provided <strong>for informational purposes only</strong>.
        It is intended to supplement &mdash; not replace &mdash; your own analysis, professional
        judgement, and decision-making processes.
      </p>

      <h2>3. Accuracy and Reliability</h2>
      <p>
        While we strive to provide useful and accurate AI-generated insights, artificial intelligence
        can and does make mistakes. <strong>Upnotify does not guarantee the accuracy, completeness,
        reliability, or timeliness of any AI-generated content.</strong>
      </p>
      <p>
        AI-generated text may contain:
      </p>
      <ul>
        <li>Factual errors or inaccuracies</li>
        <li>Outdated information</li>
        <li>Misinterpretation of data patterns</li>
        <li>Incomplete analysis</li>
        <li>Generalised recommendations that may not apply to your specific situation</li>
      </ul>

      <h2>4. User Responsibility</h2>
      <p>
        You should <strong>always verify important information independently</strong> before acting on
        it. We strongly recommend that you:
      </p>
      <ul>
        <li>
          Cross-reference AI-generated insights with the raw monitoring data available in your
          dashboard.
        </li>
        <li>
          Do not make critical business decisions based solely on AI-generated output.
        </li>
        <li>
          Consult qualified professionals (IT, security, business, legal) for decisions with
          significant consequences.
        </li>
        <li>
          Use AI-generated content as one input among many in your decision-making process.
        </li>
      </ul>

      <h2>5. Limitation of Liability</h2>
      <p>
        Upnotify and Crozent Techlabs Private Limited are <strong>not liable</strong> for any decisions
        made, actions taken, or losses incurred based on AI-generated content. This includes, but is
        not limited to, decisions regarding infrastructure changes, service provider selection,
        incident response, or business strategy.
      </p>

      <h2>6. Variability of Results</h2>
      <p>
        AI models may produce <strong>different results over time</strong>, even when analysing the
        same underlying data. This is a normal characteristic of large language models and does not
        indicate a defect in the service. Results may vary due to model updates, prompt refinements,
        or changes in the AI provider&apos;s infrastructure.
      </p>

      <h2>7. No Professional Advice</h2>
      <p>
        AI-generated content on Upnotify does not constitute professional advice of any kind, including
        but not limited to technical, legal, financial, or security advice. For enterprise-critical
        decisions or specialised guidance, always consult a qualified professional in the relevant
        field.
      </p>

      <h2>8. Data Privacy and AI</h2>
      <p>
        When generating AI content, we send aggregated and anonymised monitoring data to the AI
        provider. We do not send personal user information, credentials, or sensitive configuration
        details to AI services. For more information on how we handle your data, please see our{' '}
        <a href="/privacy">Privacy Policy</a> and <a href="/gdpr">GDPR Compliance</a> page.
      </p>

      <h2>9. Automated Outage Detection Reports</h2>
      <p>
        Upnotify publishes <strong>automated monitoring reports</strong> when our systems detect a possible
        issue with a publicly tracked website or service. These reports are:
      </p>
      <ul>
        <li>Generated automatically using AI based on Upnotify&apos;s own monitoring data and publicly available sources</li>
        <li>Reviewed and approved by a human administrator before publication</li>
        <li>Written using cautious, hedged language (e.g. &ldquo;may be experiencing&rdquo;, &ldquo;possible issue&rdquo;) to reflect
          that our detection is an indication, not a confirmed outage</li>
        <li>Published as a matter of public interest — service availability directly affects users, businesses, and the public</li>
      </ul>

      <h3>9.1 Independence and No Affiliation</h3>
      <p>
        Upnotify is an <strong>independent monitoring service</strong>. We have no affiliation, partnership, or
        commercial relationship with any company whose services we monitor or report on. Monitoring reports
        do not imply endorsement, criticism, or any business relationship with the companies mentioned.
      </p>

      <h3>9.2 Accuracy and Sources</h3>
      <p>
        Automated reports draw on Upnotify&apos;s own detection data alongside publicly available sources
        including official status pages, news publications, and social media posts. All external sources
        are attributed with links. We do not fabricate information. Where facts are uncertain, reports
        use explicit hedging (&ldquo;details are still emerging&rdquo;, &ldquo;reports suggest&rdquo;).
      </p>
      <p>
        <strong>Upnotify does not guarantee the accuracy, completeness, or timeliness of automated monitoring
        reports.</strong> The situation may have changed since the report was published. Always check the
        relevant company&apos;s official status page for authoritative updates.
      </p>

      {/* TODO: legal review needed — this clause referenced UK/EU-specific compliance obligations tied to the old entity; verify with counsel whether it still applies or needs Indian-equivalent language */}
      <h3>9.3 Public Interest and Legal Basis</h3>
      <p>
        Automated outage reports are published on a matter of public interest under{' '}
        <strong>Section 4 of the UK Defamation Act 2013</strong>. Reporting on the availability of
        publicly used digital services — and aggregating publicly available user reports — is a legitimate
        activity that serves the public by providing timely, independent information about service disruptions
        that affect many people.
      </p>
      <p>
        All reports use honest, hedged language that represents Upnotify&apos;s genuine, reasonable belief
        based on monitoring data at the time of detection. This approach is consistent with the honest
        opinion defence under <strong>Section 3 of the UK Defamation Act 2013</strong>.
      </p>

      <h3>9.4 Corrections and Takedown Requests</h3>
      <p>
        We are committed to accuracy. If a monitoring report contains inaccurate information, we will
        review and correct or remove it promptly. To request a correction or removal:
      </p>
      <ul>
        <li>
          <strong>Email:</strong> <a href="mailto:shreya23001@gmail.com">shreya23001@gmail.com</a>
        </li>
        <li>Include the URL of the report, the specific inaccuracy, and supporting evidence where possible</li>
        <li>We aim to respond within <strong>2 business days</strong> and to action valid requests within <strong>5 business days</strong></li>
      </ul>
      <p>
        Corrections are noted in the published report where appropriate. Reports found to be materially
        inaccurate are removed without delay.
      </p>

      <h3>9.5 No Personal Data in Reports</h3>
      <p>
        Automated reports do not include Reddit usernames, X/Twitter handles, or any other personal
        identifiers. Social media sources are referenced generically (e.g. &ldquo;users on Reddit&rdquo;,
        &ldquo;posts on X&rdquo;). Report generation pipelines are designed to strip personal identifiers
        before content is stored or published.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        If you have questions or concerns about our use of AI, please contact us at:
      </p>
      <ul>
        <li>
          <strong>Email:</strong> <a href="mailto:shreya23001@gmail.com">shreya23001@gmail.com</a>
        </li>
        <li>
          <strong>Monitoring report corrections:</strong> <a href="mailto:shreya23001@gmail.com">shreya23001@gmail.com</a>
        </li>
        <li>
          <strong>Post:</strong> Crozent Techlabs Private Limited, B-59, B-Block, Chipyana,
          Noida &ndash; 201009, Uttar Pradesh, India
        </li>
      </ul>
    </>
  )
}

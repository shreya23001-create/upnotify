import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Content Disclaimer — Uptrue',
  description:
    'How Uptrue uses artificial intelligence for report summaries, score analysis, and competitive intelligence. Important limitations and disclaimers.',
  alternates: { canonical: 'https://uptrue.io/ai-disclaimer' },
}

export default function AIDisclaimerPage(): React.ReactElement {
  return (
    <>
      <h1>AI Content Disclaimer</h1>
      <p className="legal-updated">Last updated: April 2026</p>

      <h2>1. How Uptrue Uses AI</h2>
      <p>
        Uptrue uses artificial intelligence technology provided by <strong>Anthropic</strong> (Claude)
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
        All AI-generated content on Uptrue is provided <strong>for informational purposes only</strong>.
        It is intended to supplement &mdash; not replace &mdash; your own analysis, professional
        judgement, and decision-making processes.
      </p>

      <h2>3. Accuracy and Reliability</h2>
      <p>
        While we strive to provide useful and accurate AI-generated insights, artificial intelligence
        can and does make mistakes. <strong>Uptrue does not guarantee the accuracy, completeness,
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
        Uptrue and Vision Software Solutions Limited are <strong>not liable</strong> for any decisions
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
        AI-generated content on Uptrue does not constitute professional advice of any kind, including
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

      <h2>9. Contact Us</h2>
      <p>
        If you have questions or concerns about our use of AI, please contact us at:
      </p>
      <ul>
        <li>
          <strong>Email:</strong> <a href="mailto:support@uptrue.io">support@uptrue.io</a>
        </li>
        <li>
          <strong>Post:</strong> Vision Software Solutions Limited, C/O Benison Solvers Limited,
          1000 Great West Road, Brentford, United Kingdom, TW8 9DW
        </li>
      </ul>
    </>
  )
}

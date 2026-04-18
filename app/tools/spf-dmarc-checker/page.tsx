import type { Metadata } from 'next'
import { SpfDmarcCheckerTool } from '@/components/tools/spf-dmarc-checker-tool'

export const metadata: Metadata = {
  title: 'Free SPF & DMARC Record Checker — Email Security Test | Uptrue',
  description:
    'Check your SPF and DMARC DNS records instantly. Validate email authentication setup, detect misconfigurations, and get a security grade. Free tool, no signup.',
  alternates: { canonical: 'https://uptrue.io/tools/spf-dmarc-checker' },
  openGraph: {
    title: 'Free SPF & DMARC Record Checker — Email Security Test | Uptrue',
    description:
      'Check SPF and DMARC records, detect misconfigurations, and get an email security grade. Free, no signup.',
    url: 'https://uptrue.io/tools/spf-dmarc-checker',
    type: 'website',
  },
}

const faqItems = [
  {
    question: 'What is an SPF record?',
    answer:
      'SPF (Sender Policy Framework) is a DNS TXT record that lists which mail servers are authorised to send email on behalf of your domain. When an email arrives, the receiving mail server checks your SPF record to verify the sending server is allowed. Without SPF, spammers can easily forge emails that appear to come from your domain.',
  },
  {
    question: 'What is DMARC and why do I need it?',
    answer:
      'DMARC (Domain-based Message Authentication, Reporting and Conformance) is a DNS TXT record that tells receiving mail servers what to do when an email fails SPF or DKIM checks — either monitor (none), quarantine to spam, or reject it outright. DMARC also enables reporting so you can see who is sending email from your domain. Without DMARC, even a correctly configured SPF record provides limited protection against phishing.',
  },
  {
    question: 'What does DMARC p=none mean?',
    answer:
      'A DMARC policy of p=none means the record is in monitoring mode only. Emails that fail authentication are still delivered normally, but reports are sent to the address in the "rua" tag. This is a good starting point to understand your email sending patterns, but it provides no protection. You should aim to progress to p=quarantine and eventually p=reject once you are confident all legitimate email is passing.',
  },
  {
    question: 'How do I fix a missing SPF record?',
    answer:
      'Log in to your domain registrar or DNS provider and add a TXT record at your root domain (@). The value should be something like "v=spf1 include:yourmailprovider.com -all". Replace "yourmailprovider.com" with the include provided by your email service (e.g., Google Workspace uses include:_spf.google.com). The "-all" at the end means reject all other senders. Once added, changes propagate within minutes to 48 hours.',
  },
  {
    question: 'What is the difference between ~all and -all in SPF?',
    answer:
      'The "~all" (softfail) mechanism means that emails from unlisted servers should be accepted but marked as suspicious. The "-all" (hardfail) mechanism instructs receiving servers to reject emails from unlisted servers outright. For maximum protection, use "-all". Use "~all" only if you are transitioning and need time to identify all your legitimate sending servers first.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
    {
      '@type': 'WebApplication',
      name: 'SPF & DMARC Checker',
      url: 'https://uptrue.io/tools/spf-dmarc-checker',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GBP',
      },
      description:
        'Free SPF and DMARC record checker. Validate email authentication, detect misconfigurations, and get a security grade instantly.',
    },
  ],
}

export default function SpfDmarcCheckerPage(): React.ReactElement {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="tools-page">
        <div className="tools-hero">
          <h1 className="tools-hero-title">SPF &amp; DMARC Checker</h1>
          <p className="tools-hero-subtitle">
            Check your email security records instantly. Validate SPF and DMARC configuration, detect misconfigurations, and get a security grade — free, no signup required.
          </p>
        </div>

        <div className="tools-container">
          <SpfDmarcCheckerTool />

          <div className="tools-info-section">
            <h2>What does this tool check?</h2>
            <div className="tools-info-grid">
              <div className="tools-info-card">
                <h3>SPF Record</h3>
                <p>Validates your SPF record exists, is correctly formed, and uses a restrictive "all" mechanism to block unauthorised senders.</p>
              </div>
              <div className="tools-info-card">
                <h3>DMARC Record</h3>
                <p>Checks your DMARC policy, enforcement level (none / quarantine / reject), coverage percentage, and reporting address.</p>
              </div>
              <div className="tools-info-card">
                <h3>Security Grade</h3>
                <p>An overall A–F grade based on how well your domain is protected: A = SPF pass + DMARC reject, F = no SPF record.</p>
              </div>
              <div className="tools-info-card">
                <h3>Issue Detection</h3>
                <p>Identifies specific misconfigurations like missing records, permissive policies, and incomplete coverage with actionable fixes.</p>
              </div>
            </div>
          </div>

          <div className="tools-info-section">
            <h2>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {faqItems.map((item, i) => (
                <div key={i} className="card" style={{ padding: '16px 20px' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.question}
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="tools-cta">
            <h2>Monitor SPF &amp; DMARC changes automatically</h2>
            <p>
              Uptrue monitors your SPF and DMARC records for unexpected changes and alerts you the
              moment something shifts. Protect your domain reputation before attackers exploit a misconfiguration.
            </p>
            <a href="/signup" className="btn btn-primary btn-lg">
              Start Monitoring Free
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

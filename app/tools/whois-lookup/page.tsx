import type { Metadata } from 'next'
import Link from 'next/link'
import { WhoisLookupTool } from '@/components/tools/whois-lookup-tool'

export const metadata: Metadata = {
  title: 'Free WHOIS Lookup — Domain Registration Checker | Uptrue',
  description:
    'Look up WHOIS registration data for any domain. See registrar, creation date, expiry date, nameservers, and domain status. Free, instant, no signup.',
  alternates: { canonical: 'https://uptrue.io/tools/whois-lookup' },
  openGraph: {
    title: 'Free WHOIS Lookup — Domain Registration Checker | Uptrue',
    description:
      'Look up WHOIS registration data for any domain. See registrar, creation date, expiry date, and nameservers. Free, no signup.',
    url: 'https://uptrue.io/tools/whois-lookup',
    type: 'website',
  },
}

const faqItems = [
  {
    question: 'What is WHOIS?',
    answer:
      'WHOIS is a protocol used to query databases that store registered users of Internet resources, including domain names. A WHOIS lookup returns information such as the domain registrar, registration and expiry dates, nameservers, and sometimes contact details (though many registrars now redact personal information under GDPR). This tool uses the modern RDAP (Registration Data Access Protocol) standard to retrieve this data.',
  },
  {
    question: 'How do I find who owns a domain?',
    answer:
      'Enter the domain name in the tool above and click "WHOIS Lookup". The results will show the registrar (the company where the domain was registered) and any available contact information. Note that under GDPR, personal contact details are often redacted for domains registered in the EU and UK.',
  },
  {
    question: 'Is WHOIS data always public?',
    answer:
      'Not always. Since GDPR came into effect in 2018, registrars must redact personal contact details for individuals. Business registrations may still show company information. Some TLDs (like .uk) also limit what is publicly available. This tool retrieves whatever is publicly available via RDAP.',
  },
  {
    question: 'What does domain status mean?',
    answer:
      'Domain status codes indicate the current state of a domain. Common statuses include "clientTransferProhibited" (the domain cannot be transferred away, a normal security measure), "clientUpdateProhibited" (changes are locked), "active" (normal operation), and "pendingDelete" (the domain is scheduled for deletion). Multiple status codes can apply at once.',
  },
  {
    question: 'How do I check when a domain expires?',
    answer:
      'The expiry date is shown in the Registration Details section of the results. If the domain is expiring within 90 days, the tool will highlight this with a warning. If it has already expired, it will be shown in red. We recommend setting up automated domain expiry monitoring with Uptrue to get notified well in advance.',
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
      name: 'WHOIS Lookup Tool',
      url: 'https://uptrue.io/tools/whois-lookup',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GBP',
      },
      description:
        'Free WHOIS lookup tool. Check domain registration data, expiry date, registrar, nameservers, and domain status instantly.',
    },
  ],
}

export default function WhoisLookupPage(): React.ReactElement {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="tools-page">
        <div className="tools-hero">
          <h1 className="tools-hero-title">WHOIS Lookup</h1>
          <p className="tools-hero-subtitle">
            Check registration data for any domain. See registrar, creation date, expiry date, nameservers, and domain status — free, no signup required.
          </p>
        </div>

        <div className="tools-container">
          <WhoisLookupTool />

          <div className="tools-info-section">
            <h2>What does this tool check?</h2>
            <div className="tools-info-grid">
              <div className="tools-info-card">
                <h3>Registrar</h3>
                <p>The company where the domain was registered (e.g., GoDaddy, Namecheap, Cloudflare).</p>
              </div>
              <div className="tools-info-card">
                <h3>Registration &amp; Expiry Dates</h3>
                <p>When the domain was first registered and when it expires. Domains expiring soon are highlighted with a warning.</p>
              </div>
              <div className="tools-info-card">
                <h3>Nameservers</h3>
                <p>The DNS servers responsible for the domain. Changing nameservers affects where your site and email are hosted.</p>
              </div>
              <div className="tools-info-card">
                <h3>Domain Status</h3>
                <p>Status codes indicating the current state of the domain, such as transfer locks and pending actions.</p>
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
            <h2>Never let your domain expire</h2>
            <p>
              Uptrue&apos;s <Link href="/monitoring/domain-expiry-monitoring">domain expiry monitoring</Link>{' '}
              alerts you via email, Slack, or webhook at 90, 30, and 7 days before expiry. Pair it with{' '}
              <Link href="/monitoring/whois-registrar-monitoring">WHOIS registrar monitoring</Link> to catch
              unexpected ownership or registrar changes the moment they happen. Set up once and forget about it.
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

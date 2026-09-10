import type { Metadata } from 'next'
import Link from 'next/link'
import { Landmark, Calendar, Server, Info } from 'lucide-react'
import { WhoisLookupTool } from '@/components/tools/whois-lookup-tool'
import Faq from '@/components/landing/faq'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: 'Free WHOIS Lookup — Domain Registration Checker | Upnotify',
  description:
    'Look up WHOIS registration data for any domain. See registrar, creation date, expiry date, nameservers, and domain status. Free, instant, no signup.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/tools/whois-lookup' },
  openGraph: {
    title: 'Free WHOIS Lookup — Domain Registration Checker | Upnotify',
    description:
      'Look up WHOIS registration data for any domain. See registrar, creation date, expiry date, and nameservers. Free, no signup.',
    url: 'https://upnotify-monitoring.vercel.app/tools/whois-lookup',
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
      'The expiry date is shown in the Registration Details section of the results. If the domain is expiring within 90 days, the tool will highlight this with a warning. If it has already expired, it will be shown in red. We recommend setting up automated domain expiry monitoring with Upnotify to get notified well in advance.',
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
      url: 'https://upnotify-monitoring.vercel.app/tools/whois-lookup',
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
        <ScrollReveal />
        <div className="tools-hero">
          <h1 className="tools-hero-title reveal-title">WHOIS Lookup</h1>
          <p className="tools-hero-subtitle reveal-title">
            Check registration data for any domain. See registrar, creation date, expiry date, nameservers, and domain status — free, no signup required.
          </p>
        </div>

        <div className="tools-container">
          <WhoisLookupTool />

          <div className="tools-info-section">
            <h2>What does this tool check?</h2>
            <div className="tools-info-grid reveal-stagger">
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Landmark size={16} /></span>Registrar</h3>
                <p>The company where the domain was registered (e.g., GoDaddy, Namecheap, Cloudflare).</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Calendar size={16} /></span>Registration &amp; Expiry Dates</h3>
                <p>When the domain was first registered and when it expires. Domains expiring soon are highlighted with a warning.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Server size={16} /></span>Nameservers</h3>
                <p>The DNS servers responsible for the domain. Changing nameservers affects where your site and email are hosted.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Info size={16} /></span>Domain Status</h3>
                <p>Status codes indicating the current state of the domain, such as transfer locks and pending actions.</p>
              </div>
            </div>
          </div>

          <Faq items={faqItems} headline="Frequently Asked Questions" />

          <div className="tools-cta reveal">
            <h2>Never let your domain expire</h2>
            <p>
              Upnotify&apos;s <Link href="/monitoring/domain-expiry-monitoring">domain expiry monitoring</Link>{' '}
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

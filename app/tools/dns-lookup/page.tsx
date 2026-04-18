import type { Metadata } from 'next'
import { DnsLookupTool } from '@/components/tools/dns-lookup-tool'

export const metadata: Metadata = {
  title: 'Free DNS Lookup Tool — Check DNS Records Online | Uptrue',
  description:
    'Look up DNS records for any domain instantly. Check A, AAAA, MX, NS, TXT, CNAME, and SOA records. Free DNS checker, no signup required.',
  alternates: { canonical: 'https://uptrue.io/tools/dns-lookup' },
  openGraph: {
    title: 'Free DNS Lookup Tool — Check DNS Records Online | Uptrue',
    description:
      'Look up DNS records for any domain instantly. Check A, AAAA, MX, NS, TXT, CNAME, and SOA records. Free, no signup.',
    url: 'https://uptrue.io/tools/dns-lookup',
    type: 'website',
  },
}

const faqItems = [
  {
    question: 'What is a DNS lookup?',
    answer:
      'A DNS lookup queries the Domain Name System to retrieve records associated with a domain name. DNS records map human-readable domain names to technical data like IP addresses, mail servers, and name servers. When you visit a website, your browser performs a DNS lookup to find the IP address to connect to.',
  },
  {
    question: 'How do I check MX records for a domain?',
    answer:
      'Enter the domain in the tool above and click "Lookup DNS", then select the MX tab. MX (Mail Exchange) records tell email servers where to deliver email for that domain. Each MX record has a priority number — lower numbers are tried first.',
  },
  {
    question: 'Why are my DNS records not showing up?',
    answer:
      'New DNS records can take up to 48 hours to fully propagate across all DNS servers worldwide. If you recently added or changed a record, it may not yet be visible everywhere. You can also check if your domain registrar has saved the changes correctly.',
  },
  {
    question: 'What is the difference between A and CNAME records?',
    answer:
      'An A record maps a domain directly to an IPv4 address (e.g., 93.184.216.34). A CNAME (Canonical Name) record maps a domain to another domain name instead of an IP address. CNAMEs are typically used for subdomains pointing to services like CDNs, and they cannot coexist with other records at the root domain.',
  },
  {
    question: 'How long does DNS propagation take?',
    answer:
      'DNS propagation typically takes between a few minutes and 48 hours, depending on the TTL (Time To Live) of the previous records and how quickly DNS resolvers around the world update their caches. During propagation, different users in different locations may see different results.',
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
      name: 'DNS Lookup Tool',
      url: 'https://uptrue.io/tools/dns-lookup',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GBP',
      },
      description:
        'Free DNS record lookup tool. Check A, AAAA, MX, NS, TXT, CNAME, and SOA records for any domain instantly.',
    },
  ],
}

export default function DnsLookupPage(): React.ReactElement {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="tools-page">
        <div className="tools-hero">
          <h1 className="tools-hero-title">DNS Lookup Tool</h1>
          <p className="tools-hero-subtitle">
            Look up DNS records for any domain instantly. Check A, AAAA, MX, NS, TXT, CNAME, and SOA records — free, no signup required.
          </p>
        </div>

        <div className="tools-container">
          <DnsLookupTool />

          <div className="tools-info-section">
            <h2>What DNS record types does this tool check?</h2>
            <div className="tools-info-grid">
              <div className="tools-info-card">
                <h3>A &amp; AAAA Records</h3>
                <p>Maps your domain to an IPv4 (A) or IPv6 (AAAA) address. Essential for resolving your website.</p>
              </div>
              <div className="tools-info-card">
                <h3>MX Records</h3>
                <p>Mail Exchange records that tell the internet where to deliver email for your domain, with priority ordering.</p>
              </div>
              <div className="tools-info-card">
                <h3>NS Records</h3>
                <p>Name Server records that identify which DNS servers are authoritative for your domain.</p>
              </div>
              <div className="tools-info-card">
                <h3>TXT Records</h3>
                <p>Text records used for domain verification, SPF email authentication, DMARC policies, and more.</p>
              </div>
              <div className="tools-info-card">
                <h3>CNAME Records</h3>
                <p>Canonical Name records that alias one domain to another — commonly used for subdomains and CDNs.</p>
              </div>
              <div className="tools-info-card">
                <h3>SOA Record</h3>
                <p>Start of Authority record containing zone metadata: primary nameserver, hostmaster email, and serial number.</p>
              </div>
            </div>
          </div>

          <div className="tools-info-section">
            <h2>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {faqItems.map((item, i) => (
                <div key={i} className="card" style={{ padding: '16px 20px' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: '#f3f4f6' }}>
                    {item.question}
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#9ca3af', lineHeight: 1.6 }}>
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="tools-cta">
            <h2>Monitor DNS changes automatically</h2>
            <p>
              Get alerted the moment a DNS record changes on your domain. Uptrue watches your DNS records
              24/7 and notifies you via email, Slack, or webhook before issues affect your users.
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

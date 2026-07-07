import type { Metadata } from 'next'
import Link from 'next/link'
import { Globe, Mail, Server, FileText, Link2, Info } from 'lucide-react'
import { DnsLookupTool } from '@/components/tools/dns-lookup-tool'
import Faq from '@/components/landing/faq'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

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
        <ScrollReveal />
        <div className="tools-hero">
          <h1 className="tools-hero-title reveal-title">DNS Lookup Tool</h1>
          <p className="tools-hero-subtitle reveal-title">
            Look up DNS records for any domain instantly. Check A, AAAA, MX, NS, TXT, CNAME, and SOA records — free, no signup required.
          </p>
        </div>

        <div className="tools-container">
          <DnsLookupTool />

          <div className="tools-info-section">
            <h2>What DNS record types does this tool check?</h2>
            <div className="tools-info-grid reveal-stagger">
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Globe size={16} /></span>A &amp; AAAA Records</h3>
                <p>Maps your domain to an IPv4 (A) or IPv6 (AAAA) address. Essential for resolving your website.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Mail size={16} /></span>MX Records</h3>
                <p>Mail Exchange records that tell the internet where to deliver email for your domain, with priority ordering.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Server size={16} /></span>NS Records</h3>
                <p>Name Server records that identify which DNS servers are authoritative for your domain.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><FileText size={16} /></span>TXT Records</h3>
                <p>Text records used for domain verification, SPF email authentication, DMARC policies, and more.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Link2 size={16} /></span>CNAME Records</h3>
                <p>Canonical Name records that alias one domain to another — commonly used for subdomains and CDNs.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Info size={16} /></span>SOA Record</h3>
                <p>Start of Authority record containing zone metadata: primary nameserver, hostmaster email, and serial number.</p>
              </div>
            </div>
          </div>

          <Faq items={faqItems} headline="Frequently Asked Questions" />

          <div className="tools-cta reveal">
            <h2>Monitor DNS changes automatically</h2>
            <p>
              Get alerted the moment a DNS record changes on your domain. Uptrue&apos;s{' '}
              <Link href="/monitoring/dns-monitoring">DNS monitoring</Link> watches your records every six hours
              and pairs naturally with{' '}
              <Link href="/monitoring/nameserver-monitoring">nameserver change monitoring</Link> so a registrar
              hijack or accidental edit reaches you within minutes — via email, Slack, Telegram, or webhook.
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

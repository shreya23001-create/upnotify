import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, Radar, Mail, Zap } from 'lucide-react'
import { BlacklistCheckerTool } from '@/components/tools/blacklist-checker-tool'
import Faq from '@/components/landing/faq'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: 'Free Domain Blacklist Checker — Is My Domain Blacklisted? | Upnotify',
  description:
    'Check if your domain or IP is listed on spam blacklists. Test against Spamhaus, SpamCop, Barracuda, SORBS, and 6 more. Free blacklist checker, instant results.',
  alternates: { canonical: 'https://upnotify-monitoring.vercel.app/tools/blacklist-checker' },
  openGraph: {
    title: 'Free Domain Blacklist Checker — Is My Domain Blacklisted? | Upnotify',
    description:
      'Check if your domain or IP is on spam blacklists. Test against Spamhaus, SpamCop, Barracuda, SORBS, and more.',
    url: 'https://upnotify-monitoring.vercel.app/tools/blacklist-checker',
    type: 'website',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a DNS blacklist?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A DNS blacklist (DNSBL) is a real-time database of IP addresses known to send spam or engage in malicious behaviour. Email servers query these lists before accepting incoming mail — if the sender\'s IP is listed, the email may be rejected or sent to spam.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I know if my email is blacklisted?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Signs your email is blacklisted include: emails landing in spam folders, delivery failures with error codes like 550 or 554, and low email open rates. Use this free blacklist checker to check your domain against 10 major DNSBL lists instantly.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get removed from a blacklist?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each blacklist has its own removal process. For Spamhaus, visit spamhaus.org and submit a removal request after fixing the underlying issue (e.g., securing a compromised server or stopping spam). For SpamCop, the listing will typically expire automatically in 24–48 hours. First, identify and fix the root cause — otherwise you\'ll be re-listed.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Spamhaus?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Spamhaus is one of the most widely used and authoritative email blacklists in the world. Their ZEN list combines the SBL (Spamhaus Block List), XBL (Exploits Block List), and PBL (Policy Block List). Being listed on Spamhaus ZEN can severely affect email deliverability.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why are my emails going to spam?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Emails go to spam for several reasons: your IP or domain is on a blacklist, your SPF/DKIM/DMARC records are missing or misconfigured, your email content contains spam trigger words, or you are sending to unengaged or purchased lists. Check this blacklist checker first, then verify your SPF and DMARC records.',
      },
    },
  ],
}

export default function BlacklistCheckerPage(): React.ReactElement {
  return (
    <div className="tools-page">
      <ScrollReveal />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="tools-hero">
        <h1 className="tools-hero-title reveal-title">Domain Blacklist Checker</h1>
        <p className="tools-hero-subtitle reveal-title">
          Check if your domain or IP address is listed on any of 10 major spam blacklists.
          Includes Spamhaus, SpamCop, Barracuda, SORBS, and more. Instant results, no signup required.
        </p>
      </div>

      <div className="tools-container">
        <BlacklistCheckerTool />

        <div className="tools-info-section">
          <h2>What does this tool check?</h2>
          <div className="tools-info-grid reveal-stagger">
            <div className="tools-info-card">
              <h3><span className="tools-info-icon"><AlertTriangle size={16} /></span>10 Major Blacklists</h3>
              <p>Checks against Spamhaus ZEN, SpamCop, Barracuda, SORBS, UCEPROTECT, Manitu, Mailspike, PSBL, and WPBL simultaneously.</p>
            </div>
            <div className="tools-info-card">
              <h3><span className="tools-info-icon"><Radar size={16} /></span>IP Resolution</h3>
              <p>Automatically resolves your domain to its IP address, then checks the IP against each DNSBL using real DNS lookups.</p>
            </div>
            <div className="tools-info-card">
              <h3><span className="tools-info-icon"><Mail size={16} /></span>Deliverability Impact</h3>
              <p>Understand which blacklists your domain is on and what impact that has on email deliverability to Gmail, Outlook, and other providers.</p>
            </div>
            <div className="tools-info-card">
              <h3><span className="tools-info-icon"><Zap size={16} /></span>Instant Results</h3>
              <p>All 10 lists are checked in parallel — results arrive in seconds with a clear clean/listed status for each list.</p>
            </div>
          </div>
        </div>

        <Faq
          items={faqSchema.mainEntity.map(faq => ({ question: faq.name, answer: faq.acceptedAnswer.text }))}
          headline="Frequently asked questions"
        />

        <div className="tools-cta reveal">
          <h2>Monitor your blacklist status 24/7</h2>
          <p>
            Upnotify&apos;s <Link href="/monitoring/blacklist-monitoring">blacklist monitoring</Link> checks your
            domain against spam blacklists daily and alerts you the moment you get listed. Pair it with{' '}
            <Link href="/monitoring/mx-health-monitoring">MX health monitoring</Link> so a deliverability hit
            never goes unnoticed.
          </p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring
          </a>
        </div>
      </div>
    </div>
  )
}

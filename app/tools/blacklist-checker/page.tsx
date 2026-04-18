import type { Metadata } from 'next'
import { BlacklistCheckerTool } from '@/components/tools/blacklist-checker-tool'

export const metadata: Metadata = {
  title: 'Free Domain Blacklist Checker — Is My Domain Blacklisted? | Uptrue',
  description:
    'Check if your domain or IP is listed on spam blacklists. Test against Spamhaus, SpamCop, Barracuda, SORBS, and 6 more. Free blacklist checker, instant results.',
  alternates: { canonical: 'https://uptrue.io/tools/blacklist-checker' },
  openGraph: {
    title: 'Free Domain Blacklist Checker — Is My Domain Blacklisted? | Uptrue',
    description:
      'Check if your domain or IP is on spam blacklists. Test against Spamhaus, SpamCop, Barracuda, SORBS, and more.',
    url: 'https://uptrue.io/tools/blacklist-checker',
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="tools-hero">
        <h1 className="tools-hero-title">Domain Blacklist Checker</h1>
        <p className="tools-hero-subtitle">
          Check if your domain or IP address is listed on any of 10 major spam blacklists.
          Includes Spamhaus, SpamCop, Barracuda, SORBS, and more. Instant results, no signup required.
        </p>
      </div>

      <div className="tools-container">
        <BlacklistCheckerTool />

        <div className="tools-info-section">
          <h2>What does this tool check?</h2>
          <div className="tools-info-grid">
            <div className="tools-info-card">
              <h3>10 Major Blacklists</h3>
              <p>Checks against Spamhaus ZEN, SpamCop, Barracuda, SORBS, UCEPROTECT, Manitu, Mailspike, PSBL, and WPBL simultaneously.</p>
            </div>
            <div className="tools-info-card">
              <h3>IP Resolution</h3>
              <p>Automatically resolves your domain to its IP address, then checks the IP against each DNSBL using real DNS lookups.</p>
            </div>
            <div className="tools-info-card">
              <h3>Deliverability Impact</h3>
              <p>Understand which blacklists your domain is on and what impact that has on email deliverability to Gmail, Outlook, and other providers.</p>
            </div>
            <div className="tools-info-card">
              <h3>Instant Results</h3>
              <p>All 10 lists are checked in parallel — results arrive in seconds with a clear clean/listed status for each list.</p>
            </div>
          </div>
        </div>

        <div className="tools-info-section">
          <h2>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqSchema.mainEntity.map((faq, i) => (
              <div key={i} className="tools-info-card">
                <h3>{faq.name}</h3>
                <p>{faq.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="tools-cta">
          <h2>Monitor your blacklist status 24/7</h2>
          <p>
            Uptrue monitors your domain against spam blacklists continuously and alerts you
            the moment you get listed — so you can fix it before it hurts your email deliverability.
          </p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </a>
        </div>
      </div>
    </div>
  )
}

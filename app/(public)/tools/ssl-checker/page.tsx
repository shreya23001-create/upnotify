import type { Metadata } from 'next'
import Link from 'next/link'
import { SslCheckerTool } from '@/components/tools/ssl-checker-tool'

export const metadata: Metadata = {
  title: 'Free SSL Certificate Checker — Check Any SSL | Uptrue',
  description:
    'Free SSL certificate checker. Check any SSL certificate instantly — issuer, expiry date, days remaining, TLS version, and chain validity. Includes how to read the result and what to do if your certificate is expiring. No signup required.',
  alternates: { canonical: 'https://uptrue.io/tools/ssl-checker' },
  openGraph: {
    title: 'Free SSL Certificate Checker | Uptrue',
    description:
      'Check any SSL certificate instantly. See issuer, expiry, TLS version, and chain validity.',
    url: 'https://uptrue.io/tools/ssl-checker',
    type: 'website',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What does this SSL certificate checker do?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It connects to the domain you enter, fetches the certificate served on port 443, and reports the issuer, expiry date, days remaining, TLS protocol version (1.2 or 1.3), and whether the certificate chain is fully valid and trusted by browsers. The check runs server-side in real time — no signup, no rate limit, and the tool never stores the certificate or the domain you tested.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the SSL checker free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, completely free. No account, no email capture, no credit card. You can check as many domains as you need. If you want continuous monitoring instead of one-off checks, that is what the paid Uptrue plans are for — but the checker stays free forever.',
      },
    },
    {
      '@type': 'Question',
      name: 'How accurate are the SSL results?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The check uses the standard Node.js TLS stack and reads the certificate directly from the host. It will match what a browser sees for the same hostname. If the result differs from another tool, the most common cause is a CDN serving a different certificate per region, or a wildcard/SNI mismatch — both of which the tool surfaces explicitly in the chain validity output.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between an expired and an invalid SSL certificate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An expired certificate was once valid but its expiry date has passed — browsers will show a hard error and refuse to load the site without manual override. An invalid certificate fails for other reasons: wrong hostname (the certificate was issued for a different domain), broken chain (an intermediate certificate is missing from the server response), self-signed (not issued by a trusted CA), or revoked (the issuer pulled it back). The tool tells you which case applies so you can fix the right thing.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often should I check my SSL certificate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Manually, at least 30 days before any expected expiry. Better: set up continuous monitoring and you will be alerted automatically when the certificate is within 30 days of expiry, when it is reissued (which can break your chain if the new chain is not deployed correctly), or when the issuer changes unexpectedly.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I monitor SSL certificates continuously, not just one-off checks?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Uptrue’s SSL Certificate Monitoring runs the same check every hour by default, alerts you if the certificate enters the expiry warning window, and notifies you via email, Slack, Telegram, or webhook when something changes. The Free plan includes 3 monitors so you can cover your most important domain at no cost.',
      },
    },
  ],
}

export default function SslCheckerPage(): React.ReactElement {
  return (
    <div className="tools-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="tools-hero">
        <h1 className="tools-hero-title">Free SSL Certificate Checker</h1>
        <p className="tools-hero-subtitle">
          Check any SSL certificate instantly. See the issuer, expiry, TLS version, and chain validity — no signup required.
        </p>
      </div>

      <div className="tools-container">
        <SslCheckerTool />

        <div className="tools-info-section">
          <h2>What does this tool check?</h2>
          <div className="tools-info-grid">
            <div className="tools-info-card">
              <h3>Certificate Issuer</h3>
              <p>Who issued the SSL certificate (e.g., Let&apos;s Encrypt, Cloudflare, DigiCert).</p>
            </div>
            <div className="tools-info-card">
              <h3>Expiry Date</h3>
              <p>When the certificate expires and how many days remain.</p>
            </div>
            <div className="tools-info-card">
              <h3>TLS Version</h3>
              <p>The TLS protocol version in use (TLS 1.2, 1.3).</p>
            </div>
            <div className="tools-info-card">
              <h3>Chain Validity</h3>
              <p>Whether the full certificate chain is valid and trusted.</p>
            </div>
          </div>
        </div>

        <div className="tools-cta">
          <h2>Monitor this SSL certificate 24/7</h2>
          <p>
            Get alerted before your SSL certificate expires. Uptrue&apos;s{' '}
            <Link href="/monitoring/ssl-certificate-monitoring">SSL certificate monitoring</Link>{' '}
            checks every hour and pairs naturally with{' '}
            <Link href="/monitoring/security-headers-monitoring">security headers monitoring</Link>{' '}
            so a TLS misconfiguration never goes unnoticed. Notifications via email, Slack, Telegram, or webhook.
          </p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </a>
        </div>

        <div className="tools-info-section">
          <h2>Frequently asked questions</h2>
          <div className="tools-info-grid" style={{ gridTemplateColumns: '1fr' }}>
            {faqSchema.mainEntity.map((faq, i) => (
              <div key={i} className="tools-info-card">
                <h3>{faq.name}</h3>
                <p>{faq.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

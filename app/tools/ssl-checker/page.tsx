import type { Metadata } from 'next'
import { SslCheckerTool } from '@/components/tools/ssl-checker-tool'

export const metadata: Metadata = {
  title: 'Free SSL Certificate Checker | Uptrue',
  description:
    'Check any SSL certificate for free. See issuer, expiry date, days remaining, TLS version, cipher suite, and chain validity. Instant results, no signup required.',
  alternates: { canonical: 'https://uptrue.io/tools/ssl-checker' },
  openGraph: {
    title: 'Free SSL Certificate Checker | Uptrue',
    description:
      'Check any SSL certificate instantly. See issuer, expiry, TLS version, and chain validity.',
    url: 'https://uptrue.io/tools/ssl-checker',
    type: 'website',
  },
}

export default function SslCheckerPage(): React.ReactElement {
  return (
    <div className="tools-page">
      <div className="tools-hero">
        <h1 className="tools-hero-title">SSL Certificate Checker</h1>
        <p className="tools-hero-subtitle">
          Enter a domain to check its SSL certificate. See issuer, expiry, TLS version, and chain validity instantly.
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
            Get alerted before your SSL certificate expires. Uptrue checks every
            30 seconds and notifies you via email, Slack, or webhook.
          </p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </a>
        </div>
      </div>
    </div>
  )
}

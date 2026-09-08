'use client'

import { useState } from 'react'

interface SslResult {
  valid: boolean
  issuer: string
  subject: string
  validFrom: string
  validTo: string
  daysUntilExpiry: number
  protocol: string
  responseTimeMs: number
  errorMessage?: string
}

function getExpiryStatus(days: number): { label: string; color: string; className: string } {
  if (days < 0) return { label: 'Expired', color: 'var(--color-danger, #ef4444)', className: 'ssl-status-expired' }
  if (days < 30) return { label: 'Critical', color: 'var(--color-danger, #ef4444)', className: 'ssl-status-critical' }
  if (days <= 90) return { label: 'Warning', color: 'var(--color-warning, #f59e0b)', className: 'ssl-status-warning' }
  return { label: 'Healthy', color: 'var(--color-success, #22c55e)', className: 'ssl-status-healthy' }
}

function getRemedies(result: SslResult): string[] {
  const remedies: string[] = []
  const err = (result.errorMessage || '').toLowerCase()

  if (err.includes('incomplete certificate chain') || err.includes('intermediate') || err.includes('unable_to_verify_leaf') || err.includes('leaf_signature')) {
    remedies.push('The server is not sending the full certificate chain. Ask your hosting provider or system administrator to install the intermediate CA certificate.')
    remedies.push('If you use Apache, add the intermediate cert to SSLCertificateChainFile. For Nginx, concatenate it with your certificate file.')
    remedies.push('Test your chain at ssllabs.com/ssltest to confirm the fix.')
  } else if (err.includes('self-signed')) {
    remedies.push('Self-signed certificates are not trusted by browsers and will show security warnings to visitors.')
    remedies.push('Replace with a certificate from a trusted CA. Free options include Let\'s Encrypt (certbot) or Cloudflare.')
    remedies.push('If this is an internal/development server, you can add the certificate to your local trust store.')
  } else if (err.includes('expired')) {
    remedies.push('Your SSL certificate has expired. Renew it immediately through your certificate provider.')
    remedies.push('If using Let\'s Encrypt, run: sudo certbot renew --force-renewal')
    remedies.push('Set up auto-renewal with a cron job to prevent this in future: 0 3 * * * certbot renew --quiet')
  } else if (err.includes('connection refused') || err.includes('ECONNREFUSED')) {
    remedies.push('Port 443 (HTTPS) is not accepting connections. Check that your web server is running and listening on port 443.')
    remedies.push('Verify your firewall allows inbound traffic on port 443.')
    remedies.push('If using a load balancer, ensure SSL termination is configured correctly.')
  } else if (err.includes('not found') || err.includes('ENOTFOUND')) {
    remedies.push('The domain could not be resolved. Check your DNS records are correctly configured.')
    remedies.push('Verify the domain is spelled correctly and the DNS has propagated (can take up to 48 hours for new domains).')
  } else if (err.includes('timeout')) {
    remedies.push('The SSL connection timed out. The server may be overloaded or unreachable.')
    remedies.push('Check if the server is up and responding on port 443.')
    remedies.push('If behind a CDN like Cloudflare, ensure SSL mode is set to Full or Full (Strict).')
  }

  if (result.valid && result.daysUntilExpiry > 0 && result.daysUntilExpiry <= 30) {
    remedies.push(`Your certificate expires in ${result.daysUntilExpiry} days. Renew it now to avoid downtime.`)
    remedies.push('Set up automated monitoring with Upnotify to get alerted before expiry.')
  }

  return remedies
}

export function SslCheckerTool(): React.ReactElement {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SslResult | null>(null)
  const [error, setError] = useState('')

  async function handleCheck(): Promise<void> {
    const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!cleaned) {
      setError('Please enter a domain')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/tools/ssl-check?domain=${encodeURIComponent(cleaned)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to check SSL certificate')
        return
      }

      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      handleCheck()
    }
  }

  return (
    <div className="ssl-checker">
      <div className="ssl-checker-input-row">
        <input
          type="text"
          className="form-input ssl-checker-input"
          placeholder="Enter domain (e.g., github.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Domain to check"
        />
        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check SSL'}
        </button>
      </div>

      {error && (
        <div className="ssl-checker-error">{error}</div>
      )}

      {result && (
        <div className="ssl-checker-results">
          {result.errorMessage ? (
            <div className="card ssl-result-card ssl-result-error">
              <h3>SSL Issue Detected</h3>
              <p>{result.errorMessage}</p>

              {getRemedies(result).length > 0 && (
                <div className="ssl-remedies">
                  <h4>Possible Remedies</h4>
                  <ul>
                    {getRemedies(result).map((remedy, i) => (
                      <li key={i}>{remedy}</li>
                    ))}
                  </ul>
                  <p className="ssl-disclaimer">
                    These suggestions are for informational purposes only. We recommend consulting
                    a qualified technical professional before making changes to your server configuration.
                    Upnotify accepts no responsibility for any actions taken based on these suggestions.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div className={`ssl-status-banner ${getExpiryStatus(result.daysUntilExpiry).className}`}>
                <div className="ssl-status-banner-left">
                  <span className="ssl-status-indicator" style={{ background: getExpiryStatus(result.daysUntilExpiry).color }} />
                  <span className="ssl-status-label">
                    {getExpiryStatus(result.daysUntilExpiry).label}
                  </span>
                </div>
                <div className="ssl-status-banner-right">
                  {result.daysUntilExpiry < 0
                    ? `Expired ${Math.abs(result.daysUntilExpiry)} days ago`
                    : `${result.daysUntilExpiry} days remaining`
                  }
                </div>
              </div>

              {/* Details grid */}
              <div className="ssl-details-grid">
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">Issuer</span>
                  <span className="ssl-detail-value">{result.issuer}</span>
                </div>
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">Subject</span>
                  <span className="ssl-detail-value">{result.subject}</span>
                </div>
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">Valid From</span>
                  <span className="ssl-detail-value">
                    {new Date(result.validFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">Expires</span>
                  <span className="ssl-detail-value" style={{ color: getExpiryStatus(result.daysUntilExpiry).color }}>
                    {new Date(result.validTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">TLS Protocol</span>
                  <span className="ssl-detail-value">{result.protocol || 'TLS 1.2+'}</span>
                </div>
                <div className="card ssl-detail-card">
                  <span className="ssl-detail-label">Check Time</span>
                  <span className="ssl-detail-value">{result.responseTimeMs}ms</span>
                </div>
              </div>

              {/* Show remedies for expiring certs */}
              {getRemedies(result).length > 0 && (
                <div className="card ssl-result-card" style={{ marginTop: 16 }}>
                  <div className="ssl-remedies">
                    <h4>Recommendations</h4>
                    <ul>
                      {getRemedies(result).map((remedy, i) => (
                        <li key={i}>{remedy}</li>
                      ))}
                    </ul>
                    <p className="ssl-disclaimer">
                      These suggestions are for informational purposes only. We recommend consulting
                      a qualified technical professional before making changes to your server configuration.
                      Upnotify accepts no responsibility for any actions taken based on these suggestions.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

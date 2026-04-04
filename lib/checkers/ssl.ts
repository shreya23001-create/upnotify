import * as tls from 'tls'
import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const hostname = new URL(
    monitor.target.startsWith('http') ? monitor.target : `https://${monitor.target}`
  ).hostname
  const start = Date.now()

  return new Promise<CheckerResult>((resolve) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, timeout: monitor.timeout_ms, rejectUnauthorized: false },
      () => {
        const authorized = socket.authorized
        const authError = String(socket.authorizationError || '')
        const cert = socket.getPeerCertificate()
        socket.end()
        const responseTimeMs = Date.now() - start

        if (!cert || !cert.valid_to) {
          resolve({ status: 'down', responseTimeMs, errorMessage: 'No certificate found', metadata: {} })
          return
        }

        const expiryDate = new Date(cert.valid_to)
        const now = new Date()
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        const metadata: Record<string, unknown> = {
          daysUntilExpiry,
          issuer: cert.issuer?.O || 'Unknown',
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          subject: cert.subject?.CN || hostname,
          chainValid: authorized,
          chainError: authError || null,
        }

        // Check for chain issues (incomplete chain, self-signed intermediate, etc.)
        if (!authorized && authError) {
          let chainMessage = 'Certificate chain issue'
          if (authError.includes('unable to verify the first certificate') || authError.includes('unable to get local issuer certificate') || authError.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
            chainMessage = 'Incomplete certificate chain — intermediate CA certificate is missing'
          } else if (authError.includes('self-signed') || authError.includes('DEPTH_ZERO_SELF_SIGNED_CERT')) {
            chainMessage = 'Self-signed certificate — not trusted by browsers'
          } else if (authError.includes('CERT_HAS_EXPIRED')) {
            chainMessage = 'SSL certificate has expired'
          }

          // Still report cert details but mark as degraded (cert exists but chain broken)
          resolve({
            status: 'degraded',
            responseTimeMs,
            errorMessage: chainMessage,
            metadata,
          })
          return
        }

        if (daysUntilExpiry < 0) {
          resolve({ status: 'down', responseTimeMs, errorMessage: 'Certificate expired', metadata })
        } else if (daysUntilExpiry < 7) {
          resolve({
            status: 'down',
            responseTimeMs,
            errorMessage: `Certificate expires in ${daysUntilExpiry} days`,
            metadata,
          })
        } else if (daysUntilExpiry < 30) {
          resolve({
            status: 'degraded',
            responseTimeMs,
            errorMessage: `Certificate expires in ${daysUntilExpiry} days`,
            metadata,
          })
        } else {
          resolve({ status: 'up', responseTimeMs, metadata })
        }
      }
    )

    socket.on('error', (err) => {
      socket.destroy()
      const raw = err.message || 'Unknown SSL error'

      // Translate common OpenSSL errors into user-friendly messages
      let errorMessage = raw
      if (raw.includes('unable to verify the first certificate') || raw.includes('unable to get local issuer certificate')) {
        errorMessage = 'Incomplete certificate chain — the server is not sending the intermediate CA certificate. Contact the site administrator to fix their SSL configuration.'
      } else if (raw.includes('certificate has expired')) {
        errorMessage = 'SSL certificate has expired.'
      } else if (raw.includes('self-signed certificate')) {
        errorMessage = 'Self-signed certificate detected — not trusted by browsers.'
      } else if (raw.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused on port 443 — HTTPS may not be configured.'
      } else if (raw.includes('ENOTFOUND')) {
        errorMessage = 'Domain not found — DNS resolution failed.'
      }

      resolve({
        status: 'down',
        responseTimeMs: Date.now() - start,
        errorMessage,
        metadata: { rawError: raw },
      })
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve({
        status: 'down',
        responseTimeMs: Date.now() - start,
        errorMessage: 'Connection timeout',
      })
    })
  })
}

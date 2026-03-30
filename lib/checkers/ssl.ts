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
      { host: hostname, port: 443, servername: hostname, timeout: monitor.timeout_ms },
      () => {
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

        const metadata = {
          daysUntilExpiry,
          issuer: cert.issuer?.O || 'Unknown',
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          subject: cert.subject?.CN || hostname,
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
      resolve({
        status: 'down',
        responseTimeMs: Date.now() - start,
        errorMessage: err.message,
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

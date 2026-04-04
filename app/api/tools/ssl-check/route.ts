import { NextResponse, type NextRequest } from 'next/server'
import * as tls from 'tls'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (15 req/min per IP)
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 15

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count += 1
  if (entry.count > RATE_LIMIT_MAX) {
    return true
  }
  return false
}

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 300_000)

interface SslCheckResponse {
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

function checkSsl(hostname: string): Promise<SslCheckResponse> {
  const start = Date.now()

  return new Promise<SslCheckResponse>((resolve) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, timeout: 10000, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate()
        const protocol = socket.getProtocol() || 'Unknown'
        const authorized = socket.authorized
        const authError = String(socket.authorizationError || '')
        socket.end()
        const responseTimeMs = Date.now() - start

        if (!cert || !cert.valid_to) {
          resolve({
            valid: false,
            issuer: 'Unknown',
            subject: hostname,
            validFrom: '',
            validTo: '',
            daysUntilExpiry: 0,
            protocol,
            responseTimeMs,
            errorMessage: 'No certificate found',
          })
          return
        }

        const expiryDate = new Date(cert.valid_to)
        const now = new Date()
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Build chain warning if applicable
        let chainWarning: string | undefined
        if (!authorized && authError) {
          if (authError.includes('unable to verify the first certificate') || authError.includes('unable to get local issuer certificate')) {
            chainWarning = 'Incomplete certificate chain — intermediate CA certificate is missing. Contact the site administrator.'
          } else if (authError.includes('self-signed')) {
            chainWarning = 'Self-signed certificate — not trusted by browsers.'
          } else {
            chainWarning = `Certificate chain issue: ${authError}`
          }
        }

        resolve({
          valid: daysUntilExpiry > 0 && authorized,
          issuer: String(cert.issuer?.O || cert.issuer?.CN || 'Unknown'),
          subject: String(cert.subject?.CN || hostname),
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysUntilExpiry,
          protocol,
          responseTimeMs,
          errorMessage: chainWarning,
        })
      }
    )

    socket.on('error', (err) => {
      socket.destroy()
      const raw = err.message || 'Unknown SSL error'
      let errorMessage = raw
      if (raw.includes('unable to verify the first certificate') || raw.includes('unable to get local issuer certificate')) {
        errorMessage = 'Incomplete certificate chain — the server is not sending the intermediate CA certificate.'
      } else if (raw.includes('certificate has expired')) {
        errorMessage = 'SSL certificate has expired.'
      } else if (raw.includes('self-signed')) {
        errorMessage = 'Self-signed certificate — not trusted by browsers.'
      } else if (raw.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused on port 443 — HTTPS may not be configured.'
      } else if (raw.includes('ENOTFOUND')) {
        errorMessage = 'Domain not found — DNS resolution failed.'
      }

      resolve({
        valid: false,
        issuer: 'Unknown',
        subject: hostname,
        validFrom: '',
        validTo: '',
        daysUntilExpiry: 0,
        protocol: 'Unknown',
        responseTimeMs: Date.now() - start,
        errorMessage,
      })
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve({
        valid: false,
        issuer: 'Unknown',
        subject: hostname,
        validFrom: '',
        validTo: '',
        daysUntilExpiry: 0,
        protocol: 'Unknown',
        responseTimeMs: Date.now() - start,
        errorMessage: 'Connection timeout',
      })
    })
  })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const url = new URL(request.url)
    const domain = url.searchParams.get('domain')

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 })
    }

    // Validate domain — block path traversal and injection
    const cleaned = domain.replace(/^www\./, '').toLowerCase()
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]{0,252}[a-zA-Z0-9]$/
    if (!domainRegex.test(cleaned) || cleaned.includes('..')) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    const result = await checkSsl(cleaned)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    })
  } catch (err) {
    logger.error('SSL check API error', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

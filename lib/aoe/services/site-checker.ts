// =============================================================================
// AOE — Automated Outreach Engine
// Service: site-checker — standalone HTTP + SSL check
// No dependency on Monitor type — usable in any product
// =============================================================================

import * as tls from 'tls'

export interface AoeSiteCheckResult {
  responseTimeMs: number | null
  statusCode: number | null
  isDown: boolean
  sslExpiryDays: number | null
  errorMessage: string | null
}

// ---------------------------------------------------------------------------
// HTTP check — returns response time, status code, and up/down status
// ---------------------------------------------------------------------------

async function checkHttp(url: string, timeoutMs: number): Promise<{
  responseTimeMs: number
  statusCode: number | null
  isDown: boolean
  errorMessage: string | null
}> {
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'UptrueSiteChecker/1.0 (+https://uptrue.io)' },
    })

    clearTimeout(timer)
    const responseTimeMs = Date.now() - start

    if (response.status >= 500) {
      return { responseTimeMs, statusCode: response.status, isDown: true, errorMessage: `Server error: ${response.status}` }
    }

    return { responseTimeMs, statusCode: response.status, isDown: false, errorMessage: null }
  } catch (error) {
    const responseTimeMs = Date.now() - start
    const msg = error instanceof Error ? error.message : 'Unknown error'
    const isTimeout = msg.includes('abort') || msg.includes('timeout')
    return {
      responseTimeMs,
      statusCode: null,
      isDown: true,
      errorMessage: isTimeout ? `Timeout after ${timeoutMs}ms` : msg,
    }
  }
}

// ---------------------------------------------------------------------------
// SSL check — returns days until expiry (null if no SSL / error)
// ---------------------------------------------------------------------------

async function checkSsl(domain: string, timeoutMs: number): Promise<number | null> {
  return new Promise<number | null>((resolve) => {
    const socket = tls.connect(
      { host: domain, port: 443, servername: domain, timeout: timeoutMs, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate()
        socket.end()

        if (!cert?.valid_to) {
          resolve(null)
          return
        }

        const expiryDate = new Date(cert.valid_to)
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        resolve(daysUntilExpiry)
      }
    )

    socket.on('error', () => { socket.destroy(); resolve(null) })
    socket.on('timeout', () => { socket.destroy(); resolve(null) })
  })
}

// ---------------------------------------------------------------------------
// Combined check — runs HTTP and SSL in parallel
// ---------------------------------------------------------------------------

export async function checkSite(
  domain: string,
  timeoutMs = 10000
): Promise<AoeSiteCheckResult> {
  const url = `https://${domain}`

  const [httpResult, sslExpiryDays] = await Promise.all([
    checkHttp(url, timeoutMs),
    checkSsl(domain, timeoutMs),
  ])

  return {
    responseTimeMs: httpResult.responseTimeMs,
    statusCode: httpResult.statusCode,
    isDown: httpResult.isDown,
    sslExpiryDays,
    errorMessage: httpResult.errorMessage,
  }
}

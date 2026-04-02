/**
 * Uptrue Score — Website health score calculator.
 *
 * Orchestrates existing checkers (HTTP, SSL, DNS) plus the new
 * security-headers checker to produce a 0-100 health score across
 * five categories, each worth 20 points.
 *
 * This file is the ONLY place the scoring algorithm lives.
 */

import * as tls from 'tls'
import * as dns from 'dns/promises'
import { checkSecurityHeaders } from '@/lib/checkers/security-headers'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryScore {
  name: string
  score: number
  maxScore: number
  checks: CheckItem[]
}

export interface CheckItem {
  label: string
  passed: boolean
  value: string
  recommendation?: string
}

export interface ScoreResult {
  domain: string
  url: string
  totalScore: number
  grade: string
  gradeColor: string
  categories: CategoryScore[]
  scannedAt: string
}

// ---------------------------------------------------------------------------
// Grade calculation
// ---------------------------------------------------------------------------

interface GradeInfo {
  grade: string
  color: string
}

function getGrade(score: number): GradeInfo {
  if (score >= 95) return { grade: 'A+', color: '#059669' }
  if (score >= 90) return { grade: 'A', color: '#059669' }
  if (score >= 80) return { grade: 'B', color: '#3b82f6' }
  if (score >= 70) return { grade: 'C', color: '#d97706' }
  if (score >= 60) return { grade: 'D', color: '#ea580c' }
  return { grade: 'F', color: '#dc2626' }
}

// ---------------------------------------------------------------------------
// URL normalisation
// ---------------------------------------------------------------------------

function normaliseUrl(input: string): string {
  let url = input.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`
  }
  return url
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || url
  }
}

// ---------------------------------------------------------------------------
// Category 1: Uptime & Response (0-20)
// ---------------------------------------------------------------------------

async function checkUptimeResponse(url: string): Promise<CategoryScore> {
  const checks: CheckItem[] = []
  let score = 0

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const start = Date.now()

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)
    const responseTimeMs = Date.now() - start

    // Status code check (0-10 points)
    const statusOk = response.status >= 200 && response.status < 400
    if (statusOk) {
      score += 10
    }
    checks.push({
      label: 'HTTP Status Code',
      passed: statusOk,
      value: `${response.status} ${response.statusText}`,
      ...(!statusOk && { recommendation: 'Your site returned an error status code. Check your server configuration.' }),
    })

    // Response time check (0-10 points)
    let responseScore = 0
    if (responseTimeMs < 500) {
      responseScore = 10
    } else if (responseTimeMs < 1000) {
      responseScore = 8
    } else if (responseTimeMs < 2000) {
      responseScore = 5
    } else if (responseTimeMs < 3000) {
      responseScore = 3
    }
    score += responseScore

    const responseOk = responseTimeMs < 2000
    checks.push({
      label: 'Response Time',
      passed: responseOk,
      value: `${responseTimeMs}ms`,
      ...(!responseOk && { recommendation: 'Your response time is slow. Consider using a CDN, optimising server-side code, or upgrading your hosting.' }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed'
    checks.push({
      label: 'HTTP Status Code',
      passed: false,
      value: 'Failed to connect',
      recommendation: 'Your site could not be reached. Check that the URL is correct and the server is running.',
    })
    checks.push({
      label: 'Response Time',
      passed: false,
      value: message.includes('abort') ? 'Timeout (>15s)' : message,
      recommendation: 'The connection timed out or failed.',
    })
    logger.warn('Score: uptime check failed', { url, error: message })
  }

  return { name: 'Uptime & Response', score, maxScore: 20, checks }
}

// ---------------------------------------------------------------------------
// Category 2: SSL Security (0-20)
// ---------------------------------------------------------------------------

async function checkSSLSecurity(hostname: string): Promise<CategoryScore> {
  const checks: CheckItem[] = []
  let score = 0

  return new Promise<CategoryScore>((resolve) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, timeout: 10000 },
      () => {
        const cert = socket.getPeerCertificate()
        const protocol = socket.getProtocol()
        socket.end()

        if (!cert || !cert.valid_to) {
          checks.push({
            label: 'SSL Certificate',
            passed: false,
            value: 'No certificate found',
            recommendation: 'Install an SSL certificate. Free certificates are available from Let\'s Encrypt.',
          })
          resolve({ name: 'SSL Security', score: 0, maxScore: 20, checks })
          return
        }

        // Certificate validity (0-5 points)
        const expiryDate = new Date(cert.valid_to)
        const now = new Date()
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        const certValid = daysUntilExpiry > 0
        if (certValid) score += 5
        checks.push({
          label: 'SSL Certificate',
          passed: certValid,
          value: certValid ? `Valid (${cert.issuer?.O || 'Unknown issuer'})` : 'Expired',
          ...(!certValid && { recommendation: 'Your SSL certificate has expired. Renew it immediately.' }),
        })

        // Days until expiry (0-8 points)
        let expiryScore = 0
        if (daysUntilExpiry > 90) {
          expiryScore = 8
        } else if (daysUntilExpiry > 30) {
          expiryScore = 6
        } else if (daysUntilExpiry > 7) {
          expiryScore = 3
        }
        score += expiryScore

        const expiryOk = daysUntilExpiry > 30
        checks.push({
          label: 'Certificate Expiry',
          passed: expiryOk,
          value: daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : 'Expired',
          ...(!expiryOk && {
            recommendation: daysUntilExpiry <= 0
              ? 'Certificate has expired. Renew immediately.'
              : `Certificate expires in ${daysUntilExpiry} days. Renew soon to avoid downtime.`,
          }),
        })

        // TLS version (0-7 points)
        const tlsVersion = protocol || 'unknown'
        let tlsScore = 0
        if (tlsVersion === 'TLSv1.3') {
          tlsScore = 7
        } else if (tlsVersion === 'TLSv1.2') {
          tlsScore = 5
        } else if (tlsVersion === 'TLSv1.1' || tlsVersion === 'TLSv1') {
          tlsScore = 2
        }
        score += tlsScore

        const tlsOk = tlsVersion === 'TLSv1.3' || tlsVersion === 'TLSv1.2'
        checks.push({
          label: 'TLS Version',
          passed: tlsOk,
          value: tlsVersion,
          ...(!tlsOk && { recommendation: 'Upgrade to TLS 1.2 or 1.3. Older versions have known vulnerabilities.' }),
        })

        resolve({ name: 'SSL Security', score, maxScore: 20, checks })
      }
    )

    socket.on('error', (err) => {
      socket.destroy()
      checks.push({
        label: 'SSL Certificate',
        passed: false,
        value: 'Connection failed',
        recommendation: `SSL connection failed: ${err.message}. Ensure HTTPS is properly configured.`,
      })
      resolve({ name: 'SSL Security', score: 0, maxScore: 20, checks })
    })

    socket.on('timeout', () => {
      socket.destroy()
      checks.push({
        label: 'SSL Certificate',
        passed: false,
        value: 'Connection timeout',
        recommendation: 'SSL connection timed out. Check that port 443 is open and HTTPS is configured.',
      })
      resolve({ name: 'SSL Security', score: 0, maxScore: 20, checks })
    })
  })
}

// ---------------------------------------------------------------------------
// Category 3: DNS Health (0-20)
// ---------------------------------------------------------------------------

async function checkDNSHealth(hostname: string): Promise<CategoryScore> {
  const checks: CheckItem[] = []
  let score = 0

  try {
    const [aRecords, nsRecords, txtRecords] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolveNs(hostname),
      dns.resolveTxt(hostname),
    ])

    // DNS resolves (0-5 points)
    const resolves = aRecords.status === 'fulfilled' && aRecords.value.length > 0
    if (resolves) score += 5
    checks.push({
      label: 'DNS Resolution',
      passed: resolves,
      value: resolves ? `${aRecords.value.length} A record(s)` : 'No A records found',
      ...(!resolves && { recommendation: 'DNS does not resolve. Check your domain DNS configuration.' }),
    })

    // Multiple nameservers (0-5 points)
    const nsValues = nsRecords.status === 'fulfilled' ? nsRecords.value : []
    const multipleNs = nsValues.length >= 2
    if (multipleNs) score += 5
    checks.push({
      label: 'Multiple Nameservers',
      passed: multipleNs,
      value: `${nsValues.length} nameserver(s)`,
      ...(!multipleNs && { recommendation: 'Use at least 2 nameservers for redundancy.' }),
    })

    // SPF record (0-5 points)
    const txtValues = txtRecords.status === 'fulfilled' ? txtRecords.value.flat() : []
    const hasSPF = txtValues.some((txt) => txt.startsWith('v=spf1'))
    if (hasSPF) score += 5
    checks.push({
      label: 'SPF Record',
      passed: hasSPF,
      value: hasSPF ? 'Present' : 'Not found',
      ...(!hasSPF && { recommendation: 'Add an SPF record to prevent email spoofing from your domain.' }),
    })

    // DMARC record (0-5 points)
    let hasDMARC = false
    try {
      const dmarcRecords = await dns.resolveTxt(`_dmarc.${hostname}`)
      hasDMARC = dmarcRecords.flat().some((txt) => txt.startsWith('v=DMARC1'))
    } catch {
      // DMARC record does not exist
    }
    if (hasDMARC) score += 5
    checks.push({
      label: 'DMARC Record',
      passed: hasDMARC,
      value: hasDMARC ? 'Present' : 'Not found',
      ...(!hasDMARC && { recommendation: 'Add a DMARC record to protect against email spoofing and phishing.' }),
    })
  } catch (error) {
    logger.warn('Score: DNS check failed', {
      hostname,
      error: error instanceof Error ? error.message : String(error),
    })
    checks.push({
      label: 'DNS Resolution',
      passed: false,
      value: 'DNS lookup failed',
      recommendation: 'DNS lookup failed. Verify the domain exists and DNS is configured.',
    })
  }

  return { name: 'DNS Health', score, maxScore: 20, checks }
}

// ---------------------------------------------------------------------------
// Category 4: Security Headers (0-20)
// ---------------------------------------------------------------------------

async function checkSecurityHeadersCategory(url: string): Promise<CategoryScore> {
  const result = await checkSecurityHeaders(url)
  const checks: CheckItem[] = [
    {
      label: 'Strict-Transport-Security (HSTS)',
      passed: result.hasHSTS,
      value: result.hasHSTS ? 'Present' : 'Missing',
      ...(!result.hasHSTS && { recommendation: 'Add the Strict-Transport-Security header to force HTTPS connections.' }),
    },
    {
      label: 'Content-Security-Policy (CSP)',
      passed: result.hasCSP,
      value: result.hasCSP ? 'Present' : 'Missing',
      ...(!result.hasCSP && { recommendation: 'Add a Content-Security-Policy header to prevent XSS and data injection attacks.' }),
    },
    {
      label: 'X-Frame-Options',
      passed: result.hasXFrameOptions,
      value: result.hasXFrameOptions ? 'Present' : 'Missing',
      ...(!result.hasXFrameOptions && { recommendation: 'Add X-Frame-Options to prevent clickjacking attacks.' }),
    },
    {
      label: 'X-Content-Type-Options',
      passed: result.hasXContentTypeOptions,
      value: result.hasXContentTypeOptions ? 'Present' : 'Missing',
      ...(!result.hasXContentTypeOptions && { recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME type sniffing.' }),
    },
    {
      label: 'Referrer-Policy',
      passed: result.hasReferrerPolicy,
      value: result.hasReferrerPolicy ? 'Present' : 'Missing',
      ...(!result.hasReferrerPolicy && { recommendation: 'Add a Referrer-Policy header to control what referrer information is sent.' }),
    },
  ]

  return { name: 'Security Headers', score: result.score, maxScore: 20, checks }
}

// ---------------------------------------------------------------------------
// Category 5: Performance (0-20)
// ---------------------------------------------------------------------------

async function checkPerformance(url: string): Promise<CategoryScore> {
  const checks: CheckItem[] = []
  let score = 0

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const start = Date.now()

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
    })

    const body = await response.text()
    clearTimeout(timeout)
    const totalTimeMs = Date.now() - start
    const contentSizeKB = Math.round(body.length / 1024)

    // Time to full response (0-10 points)
    let timeScore = 0
    if (totalTimeMs < 1000) {
      timeScore = 10
    } else if (totalTimeMs < 2000) {
      timeScore = 7
    } else if (totalTimeMs < 3000) {
      timeScore = 4
    } else if (totalTimeMs < 5000) {
      timeScore = 2
    }
    score += timeScore

    const timeOk = totalTimeMs < 2000
    checks.push({
      label: 'Full Page Load Time',
      passed: timeOk,
      value: `${totalTimeMs}ms`,
      ...(!timeOk && { recommendation: 'Page load is slow. Optimise images, enable compression, use a CDN, and minimise render-blocking resources.' }),
    })

    // Content size (0-5 points)
    let sizeScore = 0
    if (contentSizeKB < 100) {
      sizeScore = 5
    } else if (contentSizeKB < 500) {
      sizeScore = 3
    } else if (contentSizeKB < 1000) {
      sizeScore = 1
    }
    score += sizeScore

    const sizeOk = contentSizeKB < 500
    checks.push({
      label: 'HTML Size',
      passed: sizeOk,
      value: `${contentSizeKB} KB`,
      ...(!sizeOk && { recommendation: 'HTML response is large. Reduce inline scripts/styles, remove unnecessary markup, and enable compression.' }),
    })

    // Compression (0-5 points)
    const encoding = response.headers.get('content-encoding')
    const hasCompression = encoding !== null && ['gzip', 'br', 'deflate', 'zstd'].some(e => encoding.includes(e))
    if (hasCompression) score += 5
    checks.push({
      label: 'Compression',
      passed: hasCompression,
      value: hasCompression ? encoding || 'Enabled' : 'Not enabled',
      ...(!hasCompression && { recommendation: 'Enable gzip or Brotli compression to reduce transfer size.' }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    logger.warn('Score: performance check failed', { url, error: message })
    checks.push({
      label: 'Full Page Load Time',
      passed: false,
      value: message.includes('abort') ? 'Timeout (>15s)' : message,
      recommendation: 'Could not load the page to measure performance.',
    })
  }

  return { name: 'Performance', score, maxScore: 20, checks }
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function calculateScore(inputUrl: string): Promise<ScoreResult> {
  const url = normaliseUrl(inputUrl)
  const hostname = extractHostname(url)

  logger.info('Score: starting scan', { domain: hostname, url })

  const [uptime, ssl, dnsHealth, secHeaders, perf] = await Promise.allSettled([
    checkUptimeResponse(url),
    checkSSLSecurity(hostname),
    checkDNSHealth(hostname),
    checkSecurityHeadersCategory(url),
    checkPerformance(url),
  ])

  const categories: CategoryScore[] = [
    uptime.status === 'fulfilled' ? uptime.value : { name: 'Uptime & Response', score: 0, maxScore: 20, checks: [] },
    ssl.status === 'fulfilled' ? ssl.value : { name: 'SSL Security', score: 0, maxScore: 20, checks: [] },
    dnsHealth.status === 'fulfilled' ? dnsHealth.value : { name: 'DNS Health', score: 0, maxScore: 20, checks: [] },
    secHeaders.status === 'fulfilled' ? secHeaders.value : { name: 'Security Headers', score: 0, maxScore: 20, checks: [] },
    perf.status === 'fulfilled' ? perf.value : { name: 'Performance', score: 0, maxScore: 20, checks: [] },
  ]

  const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0)
  const { grade, color } = getGrade(totalScore)

  logger.info('Score: scan complete', { domain: hostname, totalScore, grade })

  return {
    domain: hostname,
    url,
    totalScore,
    grade,
    gradeColor: color,
    categories,
    scannedAt: new Date().toISOString(),
  }
}

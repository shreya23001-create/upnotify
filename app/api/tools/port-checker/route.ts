import { NextResponse, type NextRequest } from 'next/server'
import * as net from 'net'
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

// ---------------------------------------------------------------------------
// SSRF protection — block private/localhost IPs
// ---------------------------------------------------------------------------

function isPrivateOrLocalhost(host: string): boolean {
  const lower = host.toLowerCase()
  if (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true
  }

  // IPv4 private ranges
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (ipv4) {
    const [, a, b, c] = ipv4.map(Number)
    if (a === 10) return true
    if (a === 127) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true
    if (a === 0) return true
  }

  return false
}

// ---------------------------------------------------------------------------
// Known port → service map
// ---------------------------------------------------------------------------

const PORT_SERVICE_MAP: Record<number, string> = {
  21: 'FTP',
  22: 'SSH',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  465: 'SMTPS',
  587: 'SMTP Submission',
  993: 'IMAPS',
  995: 'POP3S',
  3306: 'MySQL',
  5432: 'PostgreSQL',
  6379: 'Redis',
  8080: 'HTTP Alt',
  8443: 'HTTPS Alt',
  27017: 'MongoDB',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PortCheckResult {
  host: string
  port: number
  open: boolean
  responseTimeMs: number
  service: string
  error?: string
}

// ---------------------------------------------------------------------------
// TCP connection check
// ---------------------------------------------------------------------------

function checkPort(host: string, port: number): Promise<PortCheckResult> {
  const start = Date.now()
  const service = PORT_SERVICE_MAP[port] ?? 'Unknown'

  return new Promise<PortCheckResult>((resolve) => {
    const socket = new net.Socket()

    socket.setTimeout(8000)

    socket.connect(port, host, () => {
      socket.destroy()
      resolve({
        host,
        port,
        open: true,
        responseTimeMs: Date.now() - start,
        service,
      })
    })

    socket.on('error', (err: NodeJS.ErrnoException) => {
      socket.destroy()
      const message = err.code === 'ECONNREFUSED'
        ? `Port ${port} is closed — connection refused`
        : err.message || 'Connection failed'
      resolve({
        host,
        port,
        open: false,
        responseTimeMs: Date.now() - start,
        service,
        error: message,
      })
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve({
        host,
        port,
        open: false,
        responseTimeMs: Date.now() - start,
        service,
        error: `Port ${port} timed out — may be firewalled`,
      })
    })
  })
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const url = new URL(request.url)
    const hostParam = url.searchParams.get('host')
    const portParam = url.searchParams.get('port')

    if (!hostParam || typeof hostParam !== 'string') {
      return NextResponse.json({ error: 'Missing host parameter' }, { status: 400 })
    }

    if (!portParam || typeof portParam !== 'string') {
      return NextResponse.json({ error: 'Missing port parameter' }, { status: 400 })
    }

    // Normalize host
    const host = hostParam
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '')

    if (!host) {
      return NextResponse.json({ error: 'Invalid host' }, { status: 400 })
    }

    if (isPrivateOrLocalhost(host)) {
      return NextResponse.json(
        { error: 'Private or localhost addresses are not allowed' },
        { status: 400 }
      )
    }

    const port = parseInt(portParam, 10)
    if (isNaN(port) || port < 1 || port > 65535) {
      return NextResponse.json(
        { error: 'Port must be a number between 1 and 65535' },
        { status: 400 }
      )
    }

    const result = await checkPort(host, port)

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    logger.error('Port checker API error', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

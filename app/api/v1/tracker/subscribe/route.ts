import { NextResponse } from 'next/server'
import { subscribeToPublicMonitor, getPublicMonitorById } from '@/lib/db/public-monitors'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter for subscribe endpoint
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 5 // 5 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  if (entry.count > RATE_LIMIT_MAX) return true
  return false
}

// Clean up stale entries periodically to avoid memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key)
  }
}, 300_000) // every 5 minutes

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json() as { monitorId?: string; email?: string }
    const { monitorId, email } = body

    if (!monitorId || typeof monitorId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Monitor ID is required.' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    // Sanitise email — lowercase, trim, limit length
    const sanitisedEmail = email.trim().toLowerCase().slice(0, 320)

    // Verify monitor exists
    const monitor = await getPublicMonitorById(monitorId)
    if (!monitor) {
      return NextResponse.json(
        { success: false, error: 'Monitor not found.' },
        { status: 404 }
      )
    }

    const result = await subscribeToPublicMonitor(monitorId, sanitisedEmail)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? 'Failed to subscribe.' },
        { status: 500 }
      )
    }

    logger.info('Public tracker subscriber added', { domain: monitor.domain })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Subscribe endpoint error', { error: error instanceof Error ? error.message : 'Unknown' })
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { subscribeToStatusPage } from '@/lib/db/status-pages'
import { statusPageSubscribeSchema } from '@/lib/validations/schemas'
import { validateInput } from '@/lib/validations/validate'
import { checkRateLimit, PUBLIC_SUBSCRIBE_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rateLimit = checkRateLimit(request, PUBLIC_SUBSCRIBE_RATE_LIMIT, 'status-page-subscribe')
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      })
    }

    const body: unknown = await request.json()
    const parsed = validateInput(statusPageSubscribeSchema, body, 'status-page-subscribe')
    if (!parsed.success) return parsed.response

    const { statusPageId, email } = parsed.data
    const result = await subscribeToStatusPage(statusPageId, email)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

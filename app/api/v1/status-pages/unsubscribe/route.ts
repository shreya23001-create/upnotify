import { NextResponse } from 'next/server'
import { unsubscribeFromStatusPage } from '@/lib/db/status-pages'
import { checkRateLimit, PUBLIC_UNSUBSCRIBE_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export async function GET(request: Request): Promise<NextResponse> {
  const rateLimit = checkRateLimit(request, PUBLIC_UNSUBSCRIBE_RATE_LIMIT, 'status-page-unsubscribe')
  if (!rateLimit.allowed) {
    return new NextResponse('<html><body><h1>Too Many Requests</h1><p>Please try again later.</p></body></html>', {
      status: 429,
      headers: {
        'Content-Type': 'text/html',
        'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
      },
    })
  }

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const success = await unsubscribeFromStatusPage(token)
  if (success) {
    return new NextResponse('<html><body><h1>Unsubscribed</h1><p>You have been unsubscribed from status updates.</p></body></html>', {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return new NextResponse('<html><body><h1>Error</h1><p>Invalid or expired unsubscribe link.</p></body></html>', {
    status: 400,
    headers: { 'Content-Type': 'text/html' },
  })
}

import { NextResponse } from 'next/server'
import { unsubscribeFromStatusPage } from '@/lib/db/status-pages'

export async function GET(request: Request): Promise<NextResponse> {
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

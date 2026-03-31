import { NextResponse } from 'next/server'
import { subscribeToStatusPage } from '@/lib/db/status-pages'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { statusPageId, email } = body as { statusPageId?: string; email?: string }

    if (!statusPageId || !email) {
      return NextResponse.json({ success: false, error: 'Missing statusPageId or email' }, { status: 400 })
    }

    const result = await subscribeToStatusPage(statusPageId, email)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

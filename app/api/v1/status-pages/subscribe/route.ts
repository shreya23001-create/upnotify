import { NextResponse } from 'next/server'
import { subscribeToStatusPage } from '@/lib/db/status-pages'
import { statusPageSubscribeSchema } from '@/lib/validations/schemas'
import { validateInput } from '@/lib/validations/validate'

export async function POST(request: Request): Promise<NextResponse> {
  try {
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

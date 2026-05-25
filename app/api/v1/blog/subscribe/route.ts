import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { checkRateLimit, PUBLIC_SUBSCRIBE_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  const rate = checkRateLimit(request, PUBLIC_SUBSCRIBE_RATE_LIMIT, 'blog-subscribe')
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) } },
    )
  }

  let body: { email?: string; source?: string }
  try {
    body = await request.json() as { email?: string; source?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@') || !email.includes('.')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const source = (body.source ?? 'general').trim().slice(0, 100)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const { error } = await db
    .from('blog_subscribers')
    .upsert({ email, source }, { onConflict: 'email,source', ignoreDuplicates: true })

  if (error) {
    logger.error('blog subscribe failed', { error: error.message })
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }

  logger.info('blog subscriber added', { email, source })
  return NextResponse.json({ success: true })
}

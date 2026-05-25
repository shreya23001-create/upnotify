/**
 * Internal endpoint — manually re-triggers processing for a stuck run.
 * Protected by CRON_SECRET. Normal flow uses citation-processor.ts directly.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { processCitationRun } from '@/lib/services/citation-processor'
import { checkRateLimit, AI_EXPENSIVE_RATE_LIMIT } from '@/lib/utils/rate-limiter'

export const maxDuration = 60

function isAuthorised(request: NextRequest): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === (process.env.CRON_SECRET ?? '')
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Defence-in-depth even though the route is CRON_SECRET protected — if the
  // secret ever leaks, a per-IP cap throttles cost-abuse until rotated.
  const rate = checkRateLimit(request, AI_EXPENSIVE_RATE_LIMIT, 'ai-process-run')
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) } },
    )
  }

  if (!isAuthorised(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { runId?: string }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const { runId } = body
  if (!runId) return NextResponse.json({ error: 'runId required.' }, { status: 400 })

  const result = await processCitationRun(runId)
  return NextResponse.json(result)
}

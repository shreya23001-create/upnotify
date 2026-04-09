/**
 * Internal endpoint — manually re-triggers processing for a stuck run.
 * Protected by CRON_SECRET. Normal flow uses citation-processor.ts directly.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { processCitationRun } from '@/lib/services/citation-processor'

export const maxDuration = 60

function isAuthorised(request: NextRequest): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === (process.env.CRON_SECRET ?? '')
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorised(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { runId?: string }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const { runId } = body
  if (!runId) return NextResponse.json({ error: 'runId required.' }, { status: 400 })

  const result = await processCitationRun(runId)
  return NextResponse.json(result)
}

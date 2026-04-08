import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getActiveEngines } from '@/lib/db/ai-engines'
import { canRunCitationCheck, createCitationRun } from '@/lib/db/ai-visibility'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  let body: { domain?: string; keywords?: string[]; engineIds?: string[] }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const { domain, keywords = [], engineIds = [] } = body

  if (!domain?.trim()) return NextResponse.json({ error: 'Domain is required.' }, { status: 400 })
  if (keywords.length === 0) return NextResponse.json({ error: 'At least one keyword is required.' }, { status: 400 })
  if (keywords.length > 5) return NextResponse.json({ error: 'Maximum 5 keywords per run.' }, { status: 400 })
  if (engineIds.length === 0) return NextResponse.json({ error: 'Select at least one AI engine.' }, { status: 400 })

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase().trim()
  const cleanKeywords = keywords.map(k => k.trim()).filter(Boolean)

  // Plan limit check
  const sub = await getSubscriptionWithPlan(user.org_id)
  const planSlug = sub?.plan?.slug ?? 'free'

  const allEngines   = await getActiveEngines()
  const freeEngineIds = allEngines.filter(e => e.is_free).map(e => e.id)
  const validEngineIds = engineIds.filter(id => allEngines.some(e => e.id === id && e.is_active))

  const limitCheck = await canRunCitationCheck(user.org_id, planSlug, validEngineIds, freeEngineIds)
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason }, { status: 403 })
  }

  // Create the run record (status: pending)
  const run = await createCitationRun(user.org_id, user.id, cleanDomain, cleanKeywords, validEngineIds)
  if (!run) {
    logger.error('createCitationRun failed', { orgId: user.org_id })
    return NextResponse.json({ error: 'Failed to start check. Please try again.' }, { status: 500 })
  }

  // Fire async processor (non-blocking — Vercel edge/serverless compatible)
  // We call the internal cron-style endpoint to process this run
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  fetch(`${baseUrl}/api/ai-visibility/process-run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.CRON_SECRET ?? '',
    },
    body: JSON.stringify({ runId: run.id }),
  }).catch(err => logger.error('process-run trigger failed', { error: String(err), runId: run.id }))

  return NextResponse.json({ runId: run.id, status: 'pending' })
}

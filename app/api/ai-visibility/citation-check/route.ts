import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getActiveEngines } from '@/lib/db/ai-engines'
import { canRunCitationCheck, createCitationRun, getCitationRunsThisMonth } from '@/lib/db/ai-visibility'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { processCitationRun } from '@/lib/services/citation-processor'
import { logger } from '@/lib/utils/logger'
import {
  checkRateLimit, checkRateLimitByKey,
  AI_EXPENSIVE_RATE_LIMIT, AI_CITATION_USER_RATE_LIMIT,
} from '@/lib/utils/rate-limiter'
import { cleanDomainForAi, cleanKeywordForAi } from '@/lib/utils/sanitize-ai-input'

// Allow up to 60s — Exa + multiple keywords can take ~10-20s
export const maxDuration = 60

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Cost-abuse guard: cap before the auth check so anonymous flood-tests
  // can't burn DB calls. Plan limits still enforce per-org caps inside the
  // handler; this is per-IP defence-in-depth on top.
  const ipRate = checkRateLimit(request, AI_EXPENSIVE_RATE_LIMIT, 'ai-citation-check')
  if (!ipRate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((ipRate.resetAt - Date.now()) / 1000))) } },
    )
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  // Per-user burst guard. A user could otherwise spin up 10 tabs and race the
  // plan-monthly counter, burning shared engine API quota. 3 requests per
  // minute is plenty for the legitimate "tweak keyword and re-run" workflow.
  // engineering-app#86.
  const userRate = checkRateLimitByKey(`ai-citation-check:user:${user.id}`, AI_CITATION_USER_RATE_LIMIT)
  if (!userRate.allowed) {
    return NextResponse.json(
      { error: 'Please wait a moment before running another citation check.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((userRate.resetAt - Date.now()) / 1000))) } },
    )
  }

  let body: { domain?: string; keywords?: string[]; engineIds?: string[] }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const { domain, keywords = [], engineIds = [] } = body

  if (!domain?.trim()) return NextResponse.json({ error: 'Domain is required.' }, { status: 400 })
  if (keywords.length === 0) return NextResponse.json({ error: 'At least one keyword is required.' }, { status: 400 })
  if (keywords.length > 5) return NextResponse.json({ error: 'Maximum 5 keywords per run.' }, { status: 400 })
  if (engineIds.length === 0) return NextResponse.json({ error: 'Select at least one AI engine.' }, { status: 400 })

  // Sanitise both fields before they reach the prompt — strip control chars,
  // LLM delimiter tokens, cap length. engineering-app#81 + #83.
  const cleanDomain   = cleanDomainForAi(domain)
  const cleanKeywords = keywords.map(cleanKeywordForAi).filter(Boolean)

  const sub           = await getSubscriptionWithPlan(user.org_id)
  const planSlug      = sub?.plan?.slug ?? 'free'
  const allEngines    = await getActiveEngines()
  const freeEngineIds = allEngines.filter(e => e.is_free).map(e => e.id)
  const validEngineIds = engineIds.filter(id => allEngines.some(e => e.id === id && e.is_active))

  const limitCheck = await canRunCitationCheck(user.org_id, planSlug, validEngineIds, freeEngineIds)
  if (!limitCheck.allowed) return NextResponse.json({ error: limitCheck.reason }, { status: 403 })

  const run = await createCitationRun(user.org_id, user.id, cleanDomain, cleanKeywords, validEngineIds)
  if (!run) {
    logger.error('createCitationRun failed', { orgId: user.org_id })
    return NextResponse.json({ error: 'Failed to start check. Please try again.' }, { status: 500 })
  }

  // Race-condition guard: re-check monthly count after insert
  if (planSlug !== 'free') {
    const used        = await getCitationRunsThisMonth(user.org_id)
    const monthlyLimit = sub?.plan?.citation_check_monthly_limit ?? 0
    if (monthlyLimit > 0 && used > monthlyLimit) {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      await createAdminClient().from('citation_check_runs').delete().eq('id', run.id)
      logger.warn('Citation check race condition — rolled back run', { orgId: user.org_id, runId: run.id })
      return NextResponse.json({ error: 'Monthly citation limit reached. Please try again next month.' }, { status: 403 })
    }
  }

  // Process synchronously — avoids Vercel serverless killing background fetches
  const result = await processCitationRun(run.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Processing failed.' }, { status: 500 })
  }

  return NextResponse.json({ runId: run.id, status: 'complete', score: result.score })
}

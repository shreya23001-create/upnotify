import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getActiveEngines } from '@/lib/db/ai-engines'
import { getAiVisibilityRunsThisMonth } from '@/lib/db/ai-visibility'
import {
  canRunProfileCheck, createProfileRun,
  getActiveProfilePrompts,
} from '@/lib/db/ai-profile'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { processProfileRun } from '@/lib/services/profile-introspector'
import { logger } from '@/lib/utils/logger'
import { checkRateLimit, AI_EXPENSIVE_RATE_LIMIT } from '@/lib/utils/rate-limiter'
import { cleanDomainForAi } from '@/lib/utils/sanitize-ai-input'

// 5 prompts × up to 7 engines × ~3s each = ~100s typical. Vercel Pro caps
// per-function maxDuration at 300s — give ourselves headroom.
export const maxDuration = 300

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit(request, AI_EXPENSIVE_RATE_LIMIT, 'ai-profile-check')
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) } },
    )
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  let body: { domain?: string; engineIds?: string[]; promptIds?: string[] }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const { domain, engineIds = [], promptIds = [] } = body

  if (!domain?.trim()) return NextResponse.json({ error: 'Domain is required.' }, { status: 400 })
  if (engineIds.length === 0) return NextResponse.json({ error: 'Select at least one AI engine.' }, { status: 400 })

  // Sanitise prompt-bound input — strip control chars + LLM delimiters, cap
  // length. engineering-app#81.
  const cleanDomain = cleanDomainForAi(domain)

  const sub             = await getSubscriptionWithPlan(user.org_id)
  const planSlug        = sub?.plan?.slug ?? 'free'
  const allEngines      = await getActiveEngines()
  const freeEngineIds   = allEngines.filter(e => e.is_free).map(e => e.id)
  const validEngineIds  = engineIds.filter(id => allEngines.some(e => e.id === id && e.is_active))

  if (validEngineIds.length === 0) {
    return NextResponse.json({ error: 'No valid active engines selected.' }, { status: 400 })
  }

  const limitCheck = await canRunProfileCheck(user.org_id, planSlug, validEngineIds, freeEngineIds)
  if (!limitCheck.allowed) return NextResponse.json({ error: limitCheck.reason }, { status: 403 })

  // Resolve prompts: explicit list, or whatever's currently active.
  let resolvedPromptIds = promptIds
  if (resolvedPromptIds.length === 0) {
    const active = await getActiveProfilePrompts()
    if (active.length === 0) {
      return NextResponse.json(
        { error: 'No introspection prompts are active. Ask an admin to add prompts at /admin/ai-profile-prompts.' },
        { status: 503 },
      )
    }
    resolvedPromptIds = active.map(p => p.id)
  }

  const run = await createProfileRun(user.org_id, user.id, cleanDomain, validEngineIds, resolvedPromptIds)
  if (!run) {
    logger.error('createProfileRun failed', { orgId: user.org_id })
    return NextResponse.json({ error: 'Failed to start AI Profile run. Please try again.' }, { status: 500 })
  }

  // Race-condition guard against the shared AI Visibility quota
  if (planSlug !== 'free') {
    const used         = await getAiVisibilityRunsThisMonth(user.org_id)
    const monthlyLimit = sub?.plan?.citation_check_monthly_limit ?? 0
    if (monthlyLimit > 0 && used > monthlyLimit) {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (createAdminClient() as any).from('ai_profile_runs').delete().eq('id', run.id)
      logger.warn('AI Profile race condition — rolled back run', { orgId: user.org_id, runId: run.id })
      return NextResponse.json(
        { error: 'Monthly AI Visibility limit reached. Please try again next month.' },
        { status: 403 },
      )
    }
  }

  // Run synchronously so Vercel doesn't kill background fetches
  const result = await processProfileRun(run.id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Processing failed.' }, { status: 500 })
  }

  return NextResponse.json({
    runId:        run.id,
    status:       'complete',
    recognisedBy: result.recognisedBy ?? [],
  })
}

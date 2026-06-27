import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getEnginesByType } from '@/lib/db/ai-engines'
import { canGenerateLlmsTxt, saveLlmsTxtGeneration, isLlmsTxtOverLimit } from '@/lib/db/ai-visibility'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { logger } from '@/lib/utils/logger'
import { generateLlmsTxtDashboard } from '@/lib/services/llms-txt'
import { checkRateLimit, AI_EXPENSIVE_RATE_LIMIT } from '@/lib/utils/rate-limiter'
import { cleanDomainForAi } from '@/lib/utils/sanitize-ai-input'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit(request, AI_EXPENSIVE_RATE_LIMIT, 'ai-generate-llms')
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) } },
    )
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  let body: { domain?: string; engineIds?: string[] }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const { domain, engineIds = [] } = body
  if (!domain?.trim()) return NextResponse.json({ error: 'Domain is required.' }, { status: 400 })

  // Sanitise prompt-bound input — strip control chars + LLM delimiters, cap
  // length. engineering-app#81.
  const cleanDomain = cleanDomainForAi(domain)

  // Check plan limit
  const sub = await getSubscriptionWithPlan(user.org_id)
  const planSlug = sub?.plan?.slug ?? 'free'
  const limitCheck = await canGenerateLlmsTxt(user.org_id, planSlug)
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason }, { status: 403 })
  }

  // Get selected engines
  const allEngines = await getEnginesByType('llms_txt')
  const selected   = allEngines.filter(e => engineIds.includes(e.id) && e.is_active)

  // Generate — crawls the site and auto-fills placeholders
  const content = await generateLlmsTxtDashboard(cleanDomain, selected)

  // Save to DB
  const saved = await saveLlmsTxtGeneration(user.org_id, user.id, cleanDomain, selected.map(e => e.id), content)
  if (!saved) {
    logger.error('saveLlmsTxtGeneration failed', { orgId: user.org_id })
    // Return content anyway — don't block the user if save fails
  }

  // Race-condition guard: after insert, roll back ONLY if the count is now
  // STRICTLY over the plan limit — i.e. a concurrent request also inserted.
  // The just-saved row legitimately brings the count up to the limit (free
  // plan: count 1 === limit 1), so it must not be rolled back. Using the
  // pre-insert check (count >= limit) here failed every first generation.
  // engineering-app#154.
  if (saved) {
    const slug2 = (await getSubscriptionWithPlan(user.org_id))?.plan?.slug ?? 'free'
    if (await isLlmsTxtOverLimit(user.org_id, slug2)) {
      logger.warn('llms.txt race condition detected — rolling back insert', { orgId: user.org_id, rowId: saved.id })
      // saveLlmsTxtGeneration uses user client; use admin client to delete
      const { createAdminClient } = await import('@/lib/supabase/admin')
      await createAdminClient().from('llms_txt_generations').delete().eq('id', saved.id)
      return NextResponse.json({ error: 'You have reached your llms.txt generation limit. Please try again.' }, { status: 403 })
    }
  }

  return NextResponse.json({ content, domain: cleanDomain })
}

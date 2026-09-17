export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getEnginesByType } from '@/lib/db/ai-engines'
import { getLlmsTxtGenerations, getCitationRuns, canGenerateLlmsTxt, getAiVisibilityRunsThisMonth } from '@/lib/db/ai-visibility'
import { getProfileRuns } from '@/lib/db/ai-profile'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { hasActiveWebsitePlan } from '@/lib/utils/plan-limits'
import { AiVisibilityClient } from '@/components/dashboard/ai-visibility-client'

export const metadata: Metadata = { title: 'AI Visibility' }

// The current Pro Plan (per-website) has no row in the legacy plans table —
// see lib/db/ai-visibility.ts's PRO_PLAN_WEBSITE_SLUG for why this exact
// slug string matters (it's special-cased there for citation/llms.txt limits).
const PRO_PLAN_WEBSITE_SLUG = 'pro-plan-website'

export default async function AiVisibilityPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [engines, llmsGenerations, citationRuns, profileRuns, plan, hasWebsitePlan] = await Promise.all([
    getEnginesByType('both'),
    getLlmsTxtGenerations(user.org_id),
    getCitationRuns(user.org_id, 5),
    getProfileRuns(user.org_id, 5),
    getSubscriptionWithPlan(user.org_id),
    hasActiveWebsitePlan(user.org_id),
  ])

  // A Pro Plan (per-website) org takes priority over any legacy plan row —
  // paying customers must never be treated as 'free'.
  const planSlug = hasWebsitePlan ? PRO_PLAN_WEBSITE_SLUG : (plan?.plan?.slug ?? 'free')
  const freeEngineIds = engines.filter(e => e.is_free).map(e => e.id)

  // aiVisibilityRunsThisMonth is the COMBINED count of citation + profile runs.
  // Both features share the `citation_check_monthly_limit` quota per Boss
  // decision 2026-05-10.
  const [llmsCheck, aiVisibilityRunsThisMonth] = await Promise.all([
    canGenerateLlmsTxt(user.org_id, planSlug),
    getAiVisibilityRunsThisMonth(user.org_id),
  ])

  // Read citation limit from DB for legacy orgs; Pro Plan orgs use the fixed
  // allowance defined in lib/db/ai-visibility.ts (PRO_PLAN_WEBSITE_LIMITS).
  const citationLimit = hasWebsitePlan
    ? 4
    : (plan?.plan as unknown as Record<string, number> | null)?.citation_check_monthly_limit ?? 0

  return (
    <div className="db-content">
      <AiVisibilityClient
        engines={engines}
        freeEngineIds={freeEngineIds}
        llmsGenerations={llmsGenerations}
        citationRuns={citationRuns}
        profileRuns={profileRuns}
        planSlug={planSlug}
        canGenerateLlms={llmsCheck.allowed}
        llmsBlockReason={llmsCheck.reason}
        citationRunsThisMonth={aiVisibilityRunsThisMonth}
        citationLimit={citationLimit}
      />
    </div>
  )
}

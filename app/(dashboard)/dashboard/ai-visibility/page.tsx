export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getEnginesByType } from '@/lib/db/ai-engines'
import { getLlmsTxtGenerations, getCitationRuns, canGenerateLlmsTxt, getAiVisibilityRunsThisMonth } from '@/lib/db/ai-visibility'
import { getProfileRuns } from '@/lib/db/ai-profile'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { AiVisibilityClient } from '@/components/dashboard/ai-visibility-client'

export const metadata: Metadata = { title: 'AI Visibility' }

export default async function AiVisibilityPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [engines, llmsGenerations, citationRuns, profileRuns, plan] = await Promise.all([
    getEnginesByType('both'),
    getLlmsTxtGenerations(user.org_id),
    getCitationRuns(user.org_id, 5),
    getProfileRuns(user.org_id, 5),
    getSubscriptionWithPlan(user.org_id),
  ])

  const planSlug = plan?.plan?.slug ?? 'free'
  const freeEngineIds = engines.filter(e => e.is_free).map(e => e.id)

  // aiVisibilityRunsThisMonth is the COMBINED count of citation + profile runs.
  // Both features share the `citation_check_monthly_limit` quota per Boss
  // decision 2026-05-10.
  const [llmsCheck, aiVisibilityRunsThisMonth] = await Promise.all([
    canGenerateLlmsTxt(user.org_id, planSlug),
    getAiVisibilityRunsThisMonth(user.org_id),
  ])

  // Read citation limit from DB — never hardcode plan limits
  const citationLimit = (plan?.plan as unknown as Record<string, number> | null)?.citation_check_monthly_limit ?? 0

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">AI Visibility</div>
          <div className="db-page-sub">Generate your llms.txt, monitor citations, and discover what AI engines say about your site.</div>
        </div>
        <a href="/tools/ai-seo-checker" target="_blank" className="btn btn-secondary btn-sm">
          Free AI SEO Checker ↗
        </a>
      </div>

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

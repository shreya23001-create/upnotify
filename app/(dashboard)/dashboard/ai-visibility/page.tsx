import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getEnginesByType } from '@/lib/db/ai-engines'
import { getLlmsTxtGenerations, getCitationRuns, canGenerateLlmsTxt, getCitationRunsThisMonth } from '@/lib/db/ai-visibility'
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions'
import { AiVisibilityClient } from '@/components/dashboard/ai-visibility-client'

export const metadata: Metadata = { title: 'AI Visibility' }

export default async function AiVisibilityPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [engines, llmsGenerations, citationRuns, plan] = await Promise.all([
    getEnginesByType('both'),
    getLlmsTxtGenerations(user.org_id),
    getCitationRuns(user.org_id, 5),
    getSubscriptionWithPlan(user.org_id),
  ])

  const planSlug = plan?.plan?.slug ?? 'free'
  const freeEngineIds = engines.filter(e => e.is_free).map(e => e.id)

  const [llmsCheck, citationRunsThisMonth] = await Promise.all([
    canGenerateLlmsTxt(user.org_id, planSlug),
    getCitationRunsThisMonth(user.org_id),
  ])

  const CITATION_LIMITS: Record<string, number> = { free: 0, lite: 2, builder: 4, scale: 4 }
  const citationLimit = CITATION_LIMITS[planSlug] ?? 0

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">AI Visibility</div>
          <div className="db-page-sub">Generate your llms.txt and monitor whether AI engines are citing your site.</div>
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
        planSlug={planSlug}
        canGenerateLlms={llmsCheck.allowed}
        llmsBlockReason={llmsCheck.reason}
        citationRunsThisMonth={citationRunsThisMonth}
        citationLimit={citationLimit}
      />
    </div>
  )
}

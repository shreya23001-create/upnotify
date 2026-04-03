import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getCompetitorsByOrg } from '@/lib/db/competitor-monitors'
import { checkCompetitorLimit } from '@/lib/utils/plan-limits'
import { CompetitorDashboard } from '@/components/competitors/competitor-dashboard'

export const metadata: Metadata = {
  title: 'Competitor Monitoring',
}

export default async function CompetitorsPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [competitors, limitInfo] = await Promise.all([
    getCompetitorsByOrg(user.org_id),
    checkCompetitorLimit(user.org_id),
  ])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Competitor Monitoring</h1>
          <p className="page-subtitle">
            Track competitor uptime and compare it against your own sites.
          </p>
        </div>
      </div>

      <CompetitorDashboard
        competitors={competitors}
        orgId={user.org_id}
        limitInfo={limitInfo}
      />
    </div>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getCompetitorsByOrg } from '@/lib/db/competitor-monitors'
import { checkCompetitorLimit } from '@/lib/utils/plan-limits'
import { CompetitorDashboard } from '@/components/competitors/competitor-dashboard'

export const metadata: Metadata = {
  title: 'Watchdog',
}

export default async function WatchdogPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [competitors, limitInfo] = await Promise.all([
    getCompetitorsByOrg(user.org_id),
    checkCompetitorLimit(user.org_id),
  ])

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">Watchdog</div>
          <div className="db-page-sub">Monitor competitor uptime and compare their reliability against your own sites.</div>
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

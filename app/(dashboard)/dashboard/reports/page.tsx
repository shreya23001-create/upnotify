import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorsGroupedByWebsite } from '@/lib/db/monitors'
import { requireActivatedOrg } from '@/lib/auth/require-activated-org'
import { ReportExplorer } from '@/components/reports/report-explorer'

export default async function ReportsPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await requireActivatedOrg(user.org_id)

  const groups = await getMonitorsGroupedByWebsite(user.org_id)
  const websites = groups
    .filter(g => g.domain && g.monitors.length > 0)
    .map(g => ({
      domain: g.domain,
      monitorCount: g.monitors.filter(m => m.type !== 'wordpress').length,
    }))
    .filter(g => g.monitorCount > 0)
    .sort((a, b) => a.domain.localeCompare(b.domain))

  return (
    <div className="db-content">
      <div className="db-page-header no-print">
        <div>
          <div className="db-page-title">Reports</div>
          <p className="db-page-subtitle">Review your website monitoring performance with clear, actionable reports.</p>
        </div>
      </div>

      <ReportExplorer websites={websites} />
    </div>
  )
}

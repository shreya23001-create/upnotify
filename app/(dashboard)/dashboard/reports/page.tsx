import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getReportsForOrg } from '@/lib/db/reports'
import { ReportsTable } from '@/components/reports/reports-table'
import Link from 'next/link'

export default async function ReportsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const reports = await getReportsForOrg(user.org_id)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Reports</div>
        <div className="db-page-actions">
          <Link href="/dashboard/reports/new" className="btn btn-primary btn-sm">+ Generate Report</Link>
        </div>
      </div>
      <ReportsTable reports={reports} />
    </div>
  )
}

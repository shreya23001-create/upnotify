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
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <Link href="/dashboard/reports/new" className="btn btn-primary">+ Generate Report</Link>
      </div>
      <ReportsTable reports={reports} />
    </div>
  )
}

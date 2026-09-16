import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getReportsForOrgPaged } from '@/lib/db/reports'
import { ReportsTable } from '@/components/reports/reports-table'
import { parsePage, getPaginationMeta, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination'
import Link from 'next/link'
import { requireActivatedOrg } from '@/lib/auth/require-activated-org'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await requireActivatedOrg(user.org_id)

  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = DEFAULT_PAGE_SIZE

  const { data: reports, total } = await getReportsForOrgPaged(user.org_id, page, pageSize)
  const pagination = getPaginationMeta(page, pageSize, total)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Reports</div>
        <div className="db-page-actions">
          <Link href="/dashboard/reports/new" className="btn btn-primary btn-sm">+ Generate Report</Link>
        </div>
      </div>
      <ReportsTable reports={reports} pagination={pagination} />
    </div>
  )
}

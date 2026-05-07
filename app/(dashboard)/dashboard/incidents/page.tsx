import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getAllIncidentsByOrgPaged } from '@/lib/db/incidents'
import { IncidentsTable } from '@/components/dashboard/incidents-table'
import { parsePage, getPaginationMeta, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Incidents',
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = DEFAULT_PAGE_SIZE

  const { data: incidents, total } = await getAllIncidentsByOrgPaged(user.org_id, page, pageSize)
  const pagination = getPaginationMeta(page, pageSize, total)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Incidents</div>
      </div>
      <IncidentsTable incidents={incidents} pagination={pagination} />
    </div>
  )
}

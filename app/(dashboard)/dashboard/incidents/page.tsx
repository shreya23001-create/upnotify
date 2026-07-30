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
  searchParams: Promise<{ page?: string; tab?: string }>
}): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { page: pageParam, tab: tabParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = DEFAULT_PAGE_SIZE
  const tab = tabParam === 'resolved' ? 'resolved' : tabParam === 'open' ? 'open' : undefined

  const { data: incidents, total, openTotal, resolvedTotal } = await getAllIncidentsByOrgPaged(user.org_id, page, pageSize, tab)
  const pagination = getPaginationMeta(page, pageSize, total)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Incidents</div>
        <div className="db-page-subtitle">Track and resolve downtime events across your monitors</div>
      </div>
      <IncidentsTable
        incidents={incidents}
        pagination={pagination}
        openTotal={openTotal}
        resolvedTotal={resolvedTotal}
        activeTab={tab ?? 'all'}
      />
    </div>
  )
}

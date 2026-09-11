import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getAllIncidentsGroupedByWebsite } from '@/lib/db/incidents'
import { IncidentsTable } from '@/components/dashboard/incidents-table'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Incidents',
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { tab: tabParam } = await searchParams
  const tab = tabParam === 'resolved' ? 'resolved' : tabParam === 'open' ? 'open' : undefined

  const { groups, openTotal, resolvedTotal } = await getAllIncidentsGroupedByWebsite(user.org_id, tab)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Incidents</div>
        <div className="db-page-subtitle">Track and resolve downtime events across your monitors</div>
      </div>
      <IncidentsTable
        groups={groups}
        openTotal={openTotal}
        resolvedTotal={resolvedTotal}
        activeTab={tab ?? 'all'}
      />
    </div>
  )
}

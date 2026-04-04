import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getAllIncidentsByOrg } from '@/lib/db/incidents'
import { IncidentsTable } from '@/components/dashboard/incidents-table'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Incidents',
}

export default async function IncidentsPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const incidents = await getAllIncidentsByOrg(user.org_id, 200)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Incidents</h1>
      </div>
      <IncidentsTable incidents={incidents} />
    </div>
  )
}

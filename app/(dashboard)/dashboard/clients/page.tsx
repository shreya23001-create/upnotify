import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getCurrentOrganisation } from '@/lib/db/organisations'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { ClientWorkspaceCard } from '@/components/dashboard/client-workspace-card'

export default async function ClientsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const org = await getCurrentOrganisation()
  if (!org || org.type !== 'agency') redirect('/dashboard')

  const workspaces = await getWorkspacesByOrg(org.id)
  const clientWorkspaces = workspaces.filter((w) => !w.is_internal)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Clients</div>
        <div className="db-page-actions">
          <button className="btn btn-primary btn-sm" disabled>+ Add Client</button>
        </div>
      </div>
      {clientWorkspaces.length === 0 ? (
        <div className="empty-state"><p>No client workspaces yet.</p></div>
      ) : (
        <div className="grid-cards">
          {clientWorkspaces.map((ws) => <ClientWorkspaceCard key={ws.id} workspace={ws} />)}
        </div>
      )}
    </div>
  )
}

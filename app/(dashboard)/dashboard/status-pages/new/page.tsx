import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getMonitorsByWorkspace } from '@/lib/db/monitors'
import { CreateStatusPageForm } from '@/components/status-page/create-status-page-form'

export default async function NewStatusPagePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const monitors = defaultWorkspace ? await getMonitorsByWorkspace(defaultWorkspace.id) : []

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Create Status Page</div>
      </div>
      <div className="card">
        <div className="card-content">
          <CreateStatusPageForm monitors={monitors} />
        </div>
      </div>
    </div>
  )
}

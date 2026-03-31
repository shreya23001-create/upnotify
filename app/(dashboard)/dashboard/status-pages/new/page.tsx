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
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Create Status Page</h1>
      <div className="card">
        <div className="card-content">
          <CreateStatusPageForm monitors={monitors} />
        </div>
      </div>
    </div>
  )
}

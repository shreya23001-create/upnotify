import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getMonitorsByWorkspace } from '@/lib/db/monitors'
import { getStatusPageById } from '@/lib/db/status-pages'
import { EditStatusPageForm } from '@/components/status-page/edit-status-page-form'

export default async function EditStatusPagePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const statusPage = await getStatusPageById(id)
  if (!statusPage) notFound()

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const monitors = defaultWorkspace ? await getMonitorsByWorkspace(defaultWorkspace.id) : []

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Edit Status Page</h1>
      <div className="card">
        <div className="card-content">
          <EditStatusPageForm statusPage={statusPage} monitors={monitors} />
        </div>
      </div>
    </div>
  )
}

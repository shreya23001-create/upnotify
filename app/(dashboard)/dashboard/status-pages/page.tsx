import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getStatusPagesByWorkspace } from '@/lib/db/status-pages'
import { StatusPagesTable } from '@/components/status-page/status-pages-table'
import Link from 'next/link'

export default async function StatusPagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const statusPages = defaultWorkspace ? await getStatusPagesByWorkspace(defaultWorkspace.id) : []

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Status Pages</div>
        <div className="db-page-actions">
          <Link href="/dashboard/status-pages/new" className="btn btn-primary btn-sm">+ Create Status Page</Link>
        </div>
      </div>
      <StatusPagesTable pages={statusPages} />
    </div>
  )
}

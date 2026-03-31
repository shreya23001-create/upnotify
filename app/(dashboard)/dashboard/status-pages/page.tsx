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
    <div>
      <div className="page-header">
        <h1 className="page-title">Status Pages</h1>
        <Link href="/dashboard/status-pages/new" className="btn btn-primary">+ Create Status Page</Link>
      </div>
      <StatusPagesTable pages={statusPages} />
    </div>
  )
}

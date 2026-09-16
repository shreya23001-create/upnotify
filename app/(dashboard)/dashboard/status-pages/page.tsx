import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getStatusPagesByWorkspacePaged } from '@/lib/db/status-pages'
import { StatusPagesTable } from '@/components/status-page/status-pages-table'
import { parsePage, getPaginationMeta, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination'
import Link from 'next/link'
import { requireActivatedOrg } from '@/lib/auth/require-activated-org'

export default async function StatusPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await requireActivatedOrg(user.org_id)

  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = DEFAULT_PAGE_SIZE

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const { data: statusPages, total } = defaultWorkspace
    ? await getStatusPagesByWorkspacePaged(defaultWorkspace.id, page, pageSize)
    : { data: [], total: 0 }

  const pagination = getPaginationMeta(page, pageSize, total)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Status Pages</div>
        <div className="db-page-actions">
          <Link href="/dashboard/status-pages/new" className="btn btn-primary btn-sm">+ Create Status Page</Link>
        </div>
      </div>
      <StatusPagesTable pages={statusPages} pagination={pagination} />
    </div>
  )
}

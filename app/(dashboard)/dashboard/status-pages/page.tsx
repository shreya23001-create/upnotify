import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getWorkspacesByOrg } from '@/lib/db/workspaces'
import { getStatusPagesByWorkspacePaged } from '@/lib/db/status-pages'
import { StatusPagesTable } from '@/components/status-page/status-pages-table'
import { parsePage, getPaginationMeta, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination'
import Link from 'next/link'
import { Globe, CheckCircle2, Activity } from 'lucide-react'
import { requireActivatedOrg } from '@/lib/auth/require-activated-org'
import { requireTabAccess } from '@/lib/auth/require-tab-access'

export default async function StatusPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await requireActivatedOrg(user.org_id)
  requireTabAccess(user, '/dashboard/status-pages')

  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = DEFAULT_PAGE_SIZE

  const workspaces = await getWorkspacesByOrg(user.org_id)
  const defaultWorkspace = workspaces[0]
  const { data: statusPages, total } = defaultWorkspace
    ? await getStatusPagesByWorkspacePaged(defaultWorkspace.id, page, pageSize)
    : { data: [], total: 0 }

  const pagination = getPaginationMeta(page, pageSize, total)

  const publishedCount = statusPages.filter(p => p.is_published).length
  const totalMonitorsTracked = statusPages.reduce((sum, p) => sum + ((p.monitor_ids || []) as string[]).length, 0)

  return (
    <div className="db-content sp-page">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">Status Pages</div>
          <p className="sp-page-sub">Create and manage public status pages for your services.</p>
        </div>
        <div className="db-page-actions">
          <Link href="/dashboard/status-pages/new" className="btn btn-primary btn-sm sp-create-btn">
            <span className="sp-create-btn-icon">+</span>
            Create Status Page
          </Link>
        </div>
      </div>

      {statusPages.length > 0 && (
        <div className="sp-stats-bar">
          <div className="sp-stat-card sp-stat-card--pages">
            <div className="sp-stat-icon"><Globe size={18} /></div>
            <div>
              <div className="sp-stat-value">{total}</div>
              <div className="sp-stat-label">{total === 1 ? 'Status Page' : 'Status Pages'}</div>
            </div>
          </div>
          <div className="sp-stat-card sp-stat-card--published">
            <div className="sp-stat-icon"><CheckCircle2 size={18} /></div>
            <div>
              <div className="sp-stat-value">{publishedCount}</div>
              <div className="sp-stat-label">Published</div>
            </div>
          </div>
          <div className="sp-stat-card sp-stat-card--monitors">
            <div className="sp-stat-icon"><Activity size={18} /></div>
            <div>
              <div className="sp-stat-value">{totalMonitorsTracked}</div>
              <div className="sp-stat-label">Monitors Tracked</div>
            </div>
          </div>
        </div>
      )}

      <StatusPagesTable pages={statusPages} pagination={pagination} />
    </div>
  )
}

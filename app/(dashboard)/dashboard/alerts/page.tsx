import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getAlertChannelsByOrgPaged } from '@/lib/db/alerts'
import { AlertChannelsTable } from '@/components/alerts/alert-channels-table'
import { parsePage, getPaginationMeta, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination'
import Link from 'next/link'

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = DEFAULT_PAGE_SIZE

  const { data: channels, total } = await getAlertChannelsByOrgPaged(user.org_id, page, pageSize)
  const pagination = getPaginationMeta(page, pageSize, total)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Alert Channels</div>
        <div className="db-page-actions">
          <Link href="/dashboard/alerts/notifications" className="btn btn-secondary btn-sm">Notification preferences</Link>
          <Link href="/dashboard/alerts/new" className="btn btn-primary btn-sm">+ Add Channel</Link>
        </div>
      </div>
      <AlertChannelsTable channels={channels} pagination={pagination} />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getAlertChannelsByOrg } from '@/lib/db/alerts'
import { AlertChannelsTable } from '@/components/alerts/alert-channels-table'
import Link from 'next/link'

export default async function AlertsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const channels = await getAlertChannelsByOrg(user.org_id)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Alert Channels</div>
        <div className="db-page-actions">
          <Link href="/dashboard/alerts/notifications" className="btn btn-secondary btn-sm">Notification preferences</Link>
          <Link href="/dashboard/alerts/new" className="btn btn-primary btn-sm">+ Add Channel</Link>
        </div>
      </div>
      <AlertChannelsTable channels={channels} />
    </div>
  )
}

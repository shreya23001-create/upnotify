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
    <div>
      <div className="page-header">
        <h1 className="page-title">Alert Channels</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/dashboard/alerts/notifications" className="btn btn-secondary">Notification preferences</Link>
          <Link href="/dashboard/alerts/new" className="btn btn-primary">+ Add Channel</Link>
        </div>
      </div>
      <AlertChannelsTable channels={channels} />
    </div>
  )
}

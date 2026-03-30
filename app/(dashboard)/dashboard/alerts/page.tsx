import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getAlertChannelsByOrg } from '@/lib/db/alerts'

export default async function AlertsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const channels = await getAlertChannelsByOrg(user.org_id)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Alert Channels</h1>
        <button className="btn btn-primary" disabled>+ Add Channel</button>
      </div>
      {channels.length === 0 ? (
        <div className="empty-state"><p>No alert channels configured. Add a channel to receive downtime notifications.</p></div>
      ) : (
        <div className="space-y-sm">
          {channels.map((channel) => (
            <div key={channel.id} className="card">
              <div className="card-content-compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{channel.name}</div>
                  <div style={{ fontSize: 12, color: '#71717a', textTransform: 'capitalize' }}>{channel.type}</div>
                </div>
                <span className={`badge ${channel.is_enabled ? 'badge-success' : 'badge-outline'}`}>
                  {channel.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

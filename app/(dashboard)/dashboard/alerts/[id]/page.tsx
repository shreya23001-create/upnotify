import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getAlertChannelById } from '@/lib/db/alerts'
import { EditAlertChannelForm } from '@/components/alerts/edit-alert-channel-form'

export default async function EditAlertChannelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const channel = await getAlertChannelById(id)
  if (!channel) notFound()

  return (
    <div className="db-content">
      <div className="ac-edit-wrap">
        <a href="/dashboard/alerts" className="mon-detail-back">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11L5 7l4-4" />
          </svg>
          Alert Channels
        </a>

        <div className="ac-edit-hero">
          <div>
            <h1 className="ac-edit-title">Edit Alert Channel</h1>
            <p className="ac-edit-subtitle">Update the configuration for <strong>{channel.name}</strong></p>
          </div>
        </div>

        <div className="ac-edit-body">
          <div className="card">
            <div className="card-content">
              <EditAlertChannelForm channel={channel} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

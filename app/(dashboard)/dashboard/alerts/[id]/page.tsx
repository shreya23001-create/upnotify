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
      <div className="db-page-header">
        <div className="db-page-title">Edit Alert Channel</div>
        <div className="db-page-actions">
          <a href="/dashboard/alerts" className="btn btn-secondary btn-sm">← Back</a>
        </div>
      </div>
      <div className="card">
        <div className="card-content">
          <EditAlertChannelForm channel={channel} />
        </div>
      </div>
    </div>
  )
}

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
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Edit Alert Channel</h1>
      <div className="card">
        <div className="card-content">
          <EditAlertChannelForm channel={channel} />
        </div>
      </div>
    </div>
  )
}

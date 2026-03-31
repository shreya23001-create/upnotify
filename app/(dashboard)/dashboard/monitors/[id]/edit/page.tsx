import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getMonitorById } from '@/lib/db/monitors'
import { EditMonitorForm } from '@/components/monitors/edit-monitor-form'

export default async function EditMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const monitor = await getMonitorById(id)
  if (!monitor) notFound()

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Edit Monitor</h1>
      <div className="card">
        <div className="card-content">
          <EditMonitorForm monitor={monitor} />
        </div>
      </div>
    </div>
  )
}

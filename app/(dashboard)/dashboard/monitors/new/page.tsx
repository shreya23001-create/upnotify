import { CreateMonitorForm } from '@/components/monitors/create-monitor-form'
import { PaidMonitorCreator } from '@/components/monitors/paid-monitor-creator'

export default async function NewMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>
}) {
  const { paid } = await searchParams
  const isPaid = paid === 'true'

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Create Monitor</h1>
      {isPaid ? (
        <PaidMonitorCreator />
      ) : (
        <div className="card">
          <div className="card-content">
            <CreateMonitorForm />
          </div>
        </div>
      )}
    </div>
  )
}

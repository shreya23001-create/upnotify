import { CreateMonitorForm } from '@/components/monitors/create-monitor-form'

export default function NewMonitorPage() {
  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Create Monitor</h1>
      <div className="card">
        <div className="card-content">
          <CreateMonitorForm />
        </div>
      </div>
    </div>
  )
}

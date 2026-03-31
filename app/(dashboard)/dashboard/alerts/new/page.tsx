import { CreateAlertChannelForm } from '@/components/alerts/create-alert-channel-form'

export default function NewAlertChannelPage() {
  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Create Alert Channel</h1>
      <div className="card">
        <div className="card-content">
          <CreateAlertChannelForm />
        </div>
      </div>
    </div>
  )
}

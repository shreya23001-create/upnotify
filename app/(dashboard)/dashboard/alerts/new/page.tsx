import { CreateAlertChannelForm } from '@/components/alerts/create-alert-channel-form'

export default function NewAlertChannelPage() {
  return (
    <div className="db-content">
      <div className="db-page-header">
        <div className="db-page-title">Create Alert Channel</div>
      </div>
      <div className="card">
        <div className="card-content">
          <CreateAlertChannelForm />
        </div>
      </div>
    </div>
  )
}

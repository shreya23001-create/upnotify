import { CreateAlertChannelForm } from '@/components/alerts/create-alert-channel-form'

export default function NewAlertChannelPage() {
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
            <h1 className="ac-edit-title">Add Alert Channel</h1>
            <p className="ac-edit-subtitle">Choose a channel type and configure where to send alerts</p>
          </div>
        </div>

        <div className="ac-edit-body">
          <div className="card">
            <div className="card-content">
              <CreateAlertChannelForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

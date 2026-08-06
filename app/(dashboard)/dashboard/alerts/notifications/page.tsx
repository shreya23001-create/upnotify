import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { getOrgAlertSettings } from '@/lib/db/alert-settings'
import { saveNotificationSettingsAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function NotificationsSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const settings = await getOrgAlertSettings(user.org_id)

  return (
    <div className="db-content">
      <div className="notif-wrap">

        {/* Back link */}
        <a href="/dashboard/alerts" className="mon-detail-back">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11L5 7l4-4" />
          </svg>
          Alert Channels
        </a>

        {/* Hero */}
        <div className="notif-hero">
          <div className="notif-hero-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div>
            <h1 className="notif-title">Email Notification Preferences</h1>
            <p className="notif-subtitle">Control how and when alert emails are sent to your team</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="notif-info-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>
            <strong>Smart Digest</strong> groups alert emails so you stop getting flooded during outages.
            The first event always sends instantly — subsequent events collect quietly and roll up into one digest.
            Critical-severity events always bypass the window and send immediately.
          </p>
        </div>

        {/* Form card */}
        <div className="card">
          <div className="card-content">
            <form action={saveNotificationSettingsAction} className="notif-form">

              {/* Mode */}
              <div className="notif-section">
                <div className="notif-section-header">
                  <span className="notif-section-title">Delivery Mode</span>
                  <span className="notif-section-desc">Choose how alert emails are batched and sent</span>
                </div>
                <div className="notif-mode-grid">
                  <label className="notif-mode-card">
                    <input type="radio" name="mode" value="off" defaultChecked={settings.mode === 'off'} className="notif-radio" />
                    <div className="notif-mode-icon notif-mode-icon--off">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                    </div>
                    <div className="notif-mode-info">
                      <span className="notif-mode-title">Instant — every event</span>
                      <span className="notif-mode-desc">One email per incident open and one per recovery. Best for low-volume monitoring setups.</span>
                    </div>
                    <div className="notif-mode-check">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </label>

                  <label className="notif-mode-card">
                    <input type="radio" name="mode" value="smart" defaultChecked={settings.mode !== 'off'} className="notif-radio" />
                    <div className="notif-mode-icon notif-mode-icon--smart">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    </div>
                    <div className="notif-mode-info">
                      <span className="notif-mode-title">
                        Smart Digest — first instant, then grouped
                        <span className="notif-badge-default">Recommended</span>
                      </span>
                      <span className="notif-mode-desc">Cuts email volume by 80–95% during outages with no loss of urgency on the first alert.</span>
                    </div>
                    <div className="notif-mode-check">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </label>
                </div>
              </div>

              <div className="notif-divider" />

              {/* Settings row */}
              <div className="notif-section">
                <div className="notif-section-header">
                  <span className="notif-section-title">Digest Settings</span>
                  <span className="notif-section-desc">Fine-tune timing and severity bypass rules</span>
                </div>
                <div className="notif-settings-grid">
                  <div className="notif-field">
                    <label htmlFor="digest_window_minutes" className="notif-field-label">Digest window</label>
                    <p className="notif-field-hint">How long to collect events before sending the rollup. Only applies in Smart Digest mode.</p>
                    <select
                      id="digest_window_minutes"
                      name="digest_window_minutes"
                      defaultValue={String(settings.digest_window_minutes)}
                      className="form-select notif-select"
                    >
                      <option value="5">5 minutes</option>
                      <option value="10">10 minutes</option>
                      <option value="30">30 minutes (recommended)</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>

                  <div className="notif-field">
                    <label htmlFor="instant_severity_floor" className="notif-field-label">Instant-send floor</label>
                    <p className="notif-field-hint">Severities at or above this level always send immediately, bypassing the digest window.</p>
                    <select
                      id="instant_severity_floor"
                      name="instant_severity_floor"
                      defaultValue={settings.instant_severity_floor}
                      className="form-select notif-select"
                    >
                      <option value="critical">Critical only (recommended)</option>
                      <option value="warning">Critical + warning</option>
                      <option value="all">All severities — disables Smart Digest</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="notif-actions">
                <button type="submit" className="btn btn-primary">Save Preferences</button>
                <a href="/dashboard/alerts" className="btn btn-secondary">Cancel</a>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  )
}

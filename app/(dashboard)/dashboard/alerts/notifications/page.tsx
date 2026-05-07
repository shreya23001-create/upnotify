import { redirect } from 'next/navigation'
import Link from 'next/link'
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
      <div className="db-page-header">
        <div className="db-page-title">Email notification preferences</div>
        <div className="db-page-actions">
          <Link href="/dashboard/alerts" className="btn btn-secondary btn-sm">← Back to alert channels</Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-body">
          <p className="form-hint" style={{ fontSize: 14 }}>
            Smart Digest groups alert emails so you stop getting one email per event.
            The first event in a window sends instantly so you know something is happening.
            Subsequent events collect quietly and roll up into a single digest email when the window closes.
            Critical-severity events always send instantly regardless of window state.
          </p>

          <form action={saveNotificationSettingsAction} method="post" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label className="form-label">Mode</label>
              <label className="option-card">
                <input type="radio" name="mode" value="off" defaultChecked={settings.mode === 'off'} style={{ marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div className="option-card-title">Off — every event sends an email immediately</div>
                  <div className="option-card-desc">
                    One email per incident open and one per recovery, per channel. Best if you have very few monitors.
                  </div>
                </div>
              </label>
              <label className="option-card">
                <input type="radio" name="mode" value="smart" defaultChecked={settings.mode === 'smart'} style={{ marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div className="option-card-title">
                    Smart Digest — first event instant, then group{' '}
                    <span className="badge-accent">Default</span>
                  </div>
                  <div className="option-card-desc">
                    Recommended for all accounts. Cuts email volume by 80–95% during outages with no loss of urgency on the first alert.
                  </div>
                </div>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="digest_window_minutes" className="form-label">Digest window</label>
              <select
                id="digest_window_minutes"
                name="digest_window_minutes"
                defaultValue={String(settings.digest_window_minutes)}
                className="form-control"
                style={{ maxWidth: 240 }}
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="30">30 minutes (recommended)</option>
                <option value="60">1 hour</option>
              </select>
              <span className="form-hint">How long to collect events before sending the digest. Only applies when mode is Smart Digest.</span>
            </div>

            <div className="form-group">
              <label htmlFor="instant_severity_floor" className="form-label">Instant-send severity floor</label>
              <select
                id="instant_severity_floor"
                name="instant_severity_floor"
                defaultValue={settings.instant_severity_floor}
                className="form-control"
                style={{ maxWidth: 240 }}
              >
                <option value="critical">Critical only (recommended)</option>
                <option value="warning">Critical + warning</option>
                <option value="all">All severities (= turns Smart Digest off)</option>
              </select>
              <span className="form-hint">Severities at or above this floor always send instantly and bypass the digest window.</span>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save preferences</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

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
    <div>
      <div className="page-header">
        <h1 className="page-title">Email notification preferences</h1>
        <Link href="/dashboard/alerts" className="btn btn-secondary">← Back to alert channels</Link>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-body">
          <p style={{ marginTop: 0, color: 'var(--text-muted)' }}>
            Smart Digest groups alert emails so you stop getting one email per event.
            The first event in a window sends instantly so you know something is happening.
            Subsequent events collect quietly and roll up into a single digest email when the window closes.
            Critical-severity events always send instantly regardless of window state.
          </p>

          <form action={saveNotificationSettingsAction} method="post" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Mode</label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 6, marginBottom: 8, cursor: 'pointer' }}>
                <input type="radio" name="mode" value="off" defaultChecked={settings.mode === 'off'} style={{ marginTop: 4 }} />
                <div>
                  <div style={{ fontWeight: 500 }}>Off — every event sends an email immediately</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    Today&apos;s default. One email per incident open and one per recovery, per channel. Best if you have very few monitors.
                  </div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>
                <input type="radio" name="mode" value="smart" defaultChecked={settings.mode === 'smart'} style={{ marginTop: 4 }} />
                <div>
                  <div style={{ fontWeight: 500 }}>Smart Digest — first event instant, then group</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    Recommended if you have ≥5 monitors. Cuts email volume by 80–95% during outages and flap.
                  </div>
                </div>
              </label>
            </div>

            <div className="form-group" style={{ marginTop: 24 }}>
              <label htmlFor="digest_window_minutes" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Digest window
              </label>
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                How long to collect events before sending the digest. Only applies when mode is Smart Digest.
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 24 }}>
              <label htmlFor="instant_severity_floor" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Instant-send severity floor
              </label>
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                Severities at or above this floor always send instantly and bypass the digest window.
              </div>
            </div>

            <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="btn btn-primary">Save preferences</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

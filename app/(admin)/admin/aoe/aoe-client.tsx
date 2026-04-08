'use client'

import { useState, useEffect, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AoeQuotaPanel {
  month: string
  totalQuota: number
  totalSent: number
  usagePct: number
  marketingSent: number
  alertSent: number
  burstSent: number
  availableMarketing: number
  reservedAlerts: number
  safetyBuffer: number
  hardReserve: number
  monitorsWithEmail: number
  statusPageSubs: number
  status: string
  calculatedAt: string | null
}

interface AoeCampaignStat {
  campaign: string
  sent: number
  opened: number
  clicked: number
  converted: number
  bounced: number
  spam: number
}

interface AoeStats {
  month: string
  quota: AoeQuotaPanel | null
  campaigns: AoeCampaignStat[]
  discovery: Record<string, number>
  settings: { key: string; value: string }[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: string): React.ReactElement {
  const map: Record<string, { bg: string; label: string }> = {
    active:               { bg: '#22c55e', label: 'Active' },
    paused_85:            { bg: '#f59e0b', label: 'Paused — 85%' },
    upgrade_required_95:  { bg: '#ef4444', label: 'Upgrade Required — 95%' },
  }
  const s = map[status] ?? { bg: '#6b7280', label: status }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      background: s.bg,
      color: '#fff',
    }}>{s.label}</span>
  )
}

function pctBar(value: number, total: number, color: string): React.ReactElement {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 38, textAlign: 'right' }}>{value.toLocaleString()}</span>
    </div>
  )
}

function settingVal(settings: { key: string; value: string }[], key: string): boolean {
  const row = settings.find(s => s.key === key)
  if (!row) return true // default on
  return row.value === 'true'
}

const CAMPAIGN_LABELS: Record<string, string> = {
  ssl_expiry:   'SSL Expiry Outreach',
  site_down:    'Site Down Outreach',
  site_slow:    'Site Slow Outreach',
  ecom_down:    'Ecom Down Outreach',
  ai_seo:       'AI Visibility Outreach',
  compete_cold: 'Compete Cold Outreach',
}

// Campaigns shown in the toggle table (order matters)
const CAMPAIGN_KEYS = ['ssl_expiry', 'site_down', 'site_slow', 'ecom_down', 'ai_seo', 'compete_cold'] as const
type CampaignKey = typeof CAMPAIGN_KEYS[number]

// Setting key lookup — must match aoe_settings DB keys
const CAMPAIGN_SETTING_KEY: Record<CampaignKey, string> = {
  ssl_expiry:   'campaign_ssl_expiry',
  site_down:    'campaign_site_down',
  site_slow:    'campaign_site_slow',
  ecom_down:    'campaign_ecom_down',
  ai_seo:       'campaign_ai_seo',
  compete_cold: 'campaign_compete_cold',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminAoeClientPage(): React.ReactElement {
  const [stats, setStats] = useState<AoeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchStats = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/aoe-stats')
      if (res.ok) {
        const data = await res.json() as { ok: boolean } & AoeStats
        if (data.ok) setStats(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const toggle = useCallback(async (key: string, current: boolean): Promise<void> => {
    setSaving(key)
    try {
      await fetch('/api/admin/aoe-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: !current }),
      })
      await fetchStats()
    } finally {
      setSaving(null)
    }
  }, [fetchStats])

  if (loading || !stats) {
    return (
      <div>
        <h1 className="admin-page-title">AOE — Automated Outreach Engine</h1>
        <p style={{ color: 'var(--text-muted)', padding: 32 }}>Loading...</p>
      </div>
    )
  }

  const q = stats.quota
  const masterEnabled = settingVal(stats.settings, 'master_enabled')

  // Discovery funnel totals
  const disc = stats.discovery
  const totalDiscovered = Object.values(disc).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>AOE — Automated Outreach Engine</h1>
          <p className="admin-page-subtitle" style={{ margin: '4px 0 0' }}>Quota, campaign performance, discovery pipeline. Refreshes every 60 seconds.</p>
        </div>
        {/* Master kill switch */}
        <div className="card" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>AOE Master Switch</span>
          <button
            onClick={() => toggle('master_enabled', masterEnabled)}
            disabled={saving === 'master_enabled'}
            style={{
              padding: '6px 18px',
              borderRadius: 6,
              border: 'none',
              cursor: saving === 'master_enabled' ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 13,
              background: masterEnabled ? '#22c55e' : '#ef4444',
              color: '#fff',
              opacity: saving === 'master_enabled' ? 0.6 : 1,
            }}
          >
            {masterEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Quota Panel */}
      {q ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="card-title">Email Quota — {q.month}</div>
            {statusBadge(q.status)}
          </div>
          <div className="card-content">
            {/* Usage bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{q.usagePct}% used</span>
                <span style={{ color: 'var(--text-muted)' }}>{q.totalSent.toLocaleString()} / {q.totalQuota.toLocaleString()} emails</span>
              </div>
              <div style={{ height: 12, background: 'var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${q.usagePct}%`,
                  height: '100%',
                  borderRadius: 6,
                  background: q.usagePct >= 95 ? '#ef4444' : q.usagePct >= 85 ? '#f59e0b' : '#3b82f6',
                  transition: 'width 0.4s',
                }} />
              </div>
              <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                <span>70% — warn</span>
                <span>85% — pause marketing</span>
                <span>95% — upgrade</span>
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Marketing Sent</div>
                {pctBar(q.marketingSent, q.totalQuota, '#3b82f6')}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Alert Sent</div>
                {pctBar(q.alertSent, q.totalQuota, '#22c55e')}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Burst Sent</div>
                {pctBar(q.burstSent, q.totalQuota, '#a855f7')}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Reserved (alerts + buffer)</div>
                {pctBar(q.reservedAlerts, q.totalQuota, '#f59e0b')}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Available Marketing</div>
                {pctBar(q.availableMarketing, q.totalQuota, '#06b6d4')}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Hard Reserve (2%)</div>
                {pctBar(q.hardReserve, q.totalQuota, '#6b7280')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-muted)', marginTop: 16, flexWrap: 'wrap' }}>
              <span>Active monitors w/ email: <strong style={{ color: 'var(--text-primary)' }}>{q.monitorsWithEmail}</strong></span>
              <span>Status page subscribers: <strong style={{ color: 'var(--text-primary)' }}>{q.statusPageSubs}</strong></span>
              {q.calculatedAt && <span>Last calculated: <strong style={{ color: 'var(--text-primary)' }}>{new Date(q.calculatedAt).toLocaleString()}</strong></span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 16, padding: 24 }}>
          <p style={{ color: 'var(--text-muted)' }}>No quota record for {stats.month} yet — runs at midnight tonight.</p>
        </div>
      )}

      {/* Campaign Controls + Stats */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Campaign Toggles &amp; Performance</div></div>
        <div className="card-content" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Opened</th>
                  <th>Clicked</th>
                  <th>Converted</th>
                  <th>Bounced</th>
                  <th>Spam</th>
                </tr>
              </thead>
              <tbody>
                {CAMPAIGN_KEYS.map(campaign => {
                  const settingKey = CAMPAIGN_SETTING_KEY[campaign]
                  const enabled = settingVal(stats.settings, settingKey)
                  const stat = stats.campaigns.find(c => c.campaign === campaign)
                  const isAiSeo = campaign === 'ai_seo'
                  return (
                    <tr key={campaign}>
                      <td style={{ fontWeight: 500 }}>
                        {CAMPAIGN_LABELS[campaign] ?? campaign}
                        {isAiSeo && (
                          <span style={{ marginLeft: 8, fontSize: 11, background: '#7c3aed', color: '#fff', padding: '1px 7px', borderRadius: 8, fontWeight: 600 }}>
                            Harvey review pending
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => toggle(settingKey, enabled)}
                          disabled={!masterEnabled || saving === settingKey}
                          style={{
                            padding: '3px 12px',
                            borderRadius: 10,
                            border: 'none',
                            cursor: (!masterEnabled || saving === settingKey) ? 'not-allowed' : 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            background: enabled && masterEnabled ? '#22c55e' : '#6b7280',
                            color: '#fff',
                            opacity: saving === settingKey ? 0.6 : 1,
                          }}
                        >
                          {enabled ? 'ON' : 'OFF'}
                        </button>
                      </td>
                      <td>{stat?.sent.toLocaleString() ?? '—'}</td>
                      <td>
                        {stat?.sent ? (
                          <span>
                            {stat.opened.toLocaleString()}
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> ({Math.round((stat.opened / stat.sent) * 100)}%)</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {stat?.sent ? (
                          <span>
                            {stat.clicked.toLocaleString()}
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> ({Math.round((stat.clicked / stat.sent) * 100)}%)</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ color: stat?.converted ? '#22c55e' : undefined }}>
                        {stat?.converted.toLocaleString() ?? '—'}
                      </td>
                      <td style={{ color: stat?.bounced ? '#f59e0b' : undefined }}>
                        {stat?.bounced.toLocaleString() ?? '—'}
                      </td>
                      <td style={{ color: stat?.spam ? '#ef4444' : undefined }}>
                        {stat?.spam.toLocaleString() ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Discovery Funnel */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Discovery Pipeline — All Time</div></div>
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            {[
              { key: 'pending_check', label: 'Pending Check', color: '#6b7280' },
              { key: 'checking',      label: 'Checking',      color: '#3b82f6' },
              { key: 'ready',         label: 'Ready to Email', color: '#06b6d4' },
              { key: 'emailed',       label: 'Emailed',        color: '#a855f7' },
              { key: 'converted',     label: 'Converted',      color: '#22c55e' },
              { key: 'skip',          label: 'Skipped',        color: '#9ca3af' },
              { key: 'opted_out',     label: 'Opted Out',      color: '#f59e0b' },
            ].map(({ key, label, color }) => (
              <div key={key} className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{(disc[key] ?? 0).toLocaleString()}</div>
              </div>
            ))}
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Discovered</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{totalDiscovered.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

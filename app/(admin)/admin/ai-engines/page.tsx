import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllEnginesAdmin, getEngineKeys } from '@/lib/db/ai-engines'
import { createAdminClient } from '@/lib/supabase/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supa = any

export const metadata: Metadata = { title: 'AI Engines — Admin' }

export default async function AiEnginesAdminPage(): Promise<React.ReactElement> {
  const supabase = createAdminClient() as Supa
  const engines  = await getAllEnginesAdmin()

  // Get key counts and usage per engine
  const keyStats = await Promise.all(
    engines.map(async (e) => {
      const keys = await getEngineKeys(e.id)
      const activeKeys = keys.filter(k => k.is_active)
      const totalUsage = activeKeys.reduce((s, k) => s + k.current_usage, 0)
      const totalLimit = activeKeys.reduce((s, k) => s + k.monthly_limit, 0)
      return { engineId: e.id, keyCount: keys.length, activeKeys: activeKeys.length, totalUsage, totalLimit }
    })
  )

  // Citation run counts this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { count: runsThisMonth } = await supabase
    .from('citation_check_runs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfMonth)

  const { count: llmsThisMonth } = await supabase
    .from('llms_txt_generations')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfMonth)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">AI Engines</h1>
          <p className="admin-page-subtitle">Manage AI engine registry, API key pools, and usage limits for AI Visibility features.</p>
        </div>
        <Link href="/admin/ai-engines/new" className="btn btn-primary btn-sm">+ Add Engine</Link>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 32 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{engines.filter(e => e.is_active).length}</span>
            <span className="admin-stat-label">Active Engines</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{runsThisMonth ?? 0}</span>
            <span className="admin-stat-label">Citation Runs This Month</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{llmsThisMonth ?? 0}</span>
            <span className="admin-stat-label">llms.txt Generated This Month</span>
          </div>
        </div>
      </div>

      {/* Engine table */}
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Engine</th>
              <th>Type</th>
              <th>Signal</th>
              <th>Free Tier</th>
              <th>API Keys</th>
              <th>Usage This Month</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {engines.map(engine => {
              const stats = keyStats.find(s => s.engineId === engine.id)
              const usagePct = stats && stats.totalLimit > 0
                ? Math.round((stats.totalUsage / stats.totalLimit) * 100)
                : 0
              const usageColor = usagePct >= 90 ? '#ef4444' : usagePct >= 70 ? '#f59e0b' : '#22c55e'
              return (
                <tr key={engine.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{engine.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{engine.slug}</div>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-blue">
                      {engine.type === 'both' ? 'llms.txt + Citation' : engine.type}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${engine.signal_quality === 'high' ? 'admin-badge-green' : engine.signal_quality === 'medium' ? 'admin-badge-yellow' : 'admin-badge-gray'}`}>
                      {engine.signal_quality}
                    </span>
                  </td>
                  <td>{engine.is_free ? <span className="admin-badge admin-badge-green">Yes</span> : <span className="admin-badge admin-badge-gray">No</span>}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{stats?.activeKeys ?? 0} active / {stats?.keyCount ?? 0} total</div>
                  </td>
                  <td>
                    {stats && stats.totalLimit > 0 ? (
                      <div>
                        <div style={{ fontSize: 13, color: usageColor, fontWeight: 600 }}>
                          {stats.totalUsage.toLocaleString()} / {stats.totalLimit.toLocaleString()}
                        </div>
                        <div style={{ height: 4, background: 'var(--border-primary)', borderRadius: 2, marginTop: 4, overflow: 'hidden', width: 80 }}>
                          <div style={{ height: '100%', width: `${Math.min(usagePct, 100)}%`, background: usageColor, borderRadius: 2 }} />
                        </div>
                      </div>
                    ) : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No keys</span>}
                  </td>
                  <td>
                    <span className={`admin-badge ${engine.is_active ? 'admin-badge-green' : 'admin-badge-gray'}`}>
                      {engine.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/admin/ai-engines/${engine.id}/keys`} className="admin-action-link">Keys</Link>
                      <Link href={`/admin/ai-engines/${engine.id}/edit`} className="admin-action-link">Edit</Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {engines.length === 0 && (
          <div className="admin-empty">No engines configured yet. <Link href="/admin/ai-engines/new">Add the first engine →</Link></div>
        )}
      </div>
    </div>
  )
}

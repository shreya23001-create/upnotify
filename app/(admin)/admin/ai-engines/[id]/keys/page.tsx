import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllEnginesAdmin, getEngineKeys } from '@/lib/db/ai-engines'
import { notFound } from 'next/navigation'

export const metadata: Metadata = { title: 'Engine API Keys — Admin' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EngineKeysPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params
  const engines = await getAllEnginesAdmin()
  const engine  = engines.find(e => e.id === id)
  if (!engine) notFound()

  const keys = await getEngineKeys(id)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin/ai-engines">AI Engines</Link> / {engine.name}
          </div>
          <h1 className="admin-page-title">{engine.name} — API Key Pool</h1>
          <p className="admin-page-subtitle">
            Add multiple API keys to rotate automatically when usage approaches the monthly limit.
            Keys are encrypted with AES-256 and never exposed outside this admin panel.
          </p>
        </div>
        <Link href={`/admin/ai-engines/${id}/keys/new`} className="btn btn-primary btn-sm">+ Add Key</Link>
      </div>

      {/* Key pool table */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        {keys.length === 0 ? (
          <div className="admin-empty">
            No API keys configured. <Link href={`/admin/ai-engines/${id}/keys/new`}>Add the first key →</Link>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Usage This Month</th>
                <th>Monthly Limit</th>
                <th>Capacity Used</th>
                <th>Reset Date</th>
                <th>Last Used</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(key => {
                const pct = key.monthly_limit > 0 ? Math.round((key.current_usage / key.monthly_limit) * 100) : 0
                const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e'
                const resetDate = new Date(key.reset_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                const lastUsed = key.last_used_at
                  ? new Date(key.last_used_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  : 'Never'
                return (
                  <tr key={key.id}>
                    <td style={{ fontWeight: 600 }}>{key.label}</td>
                    <td style={{ fontWeight: 600, color }}>{key.current_usage.toLocaleString()}</td>
                    <td>{key.monthly_limit.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--border-primary)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color, fontWeight: 600, whiteSpace: 'nowrap' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{resetDate}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{lastUsed}</td>
                    <td>
                      <span className={`admin-badge ${key.is_active ? 'admin-badge-green' : 'admin-badge-gray'}`}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <form action={`/api/admin/ai-engines/keys/${key.id}/delete`} method="POST">
                        <button type="submit" className="admin-action-link" style={{ color: 'var(--color-danger)' }}
                          onClick={e => { if (!confirm('Delete this key? This cannot be undone.')) e.preventDefault() }}>
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Key rotation explanation */}
      <div className="admin-card" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>How key rotation works</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          When a citation check runs, Uptrue picks the active key with the lowest usage that is under its monthly limit.
          When a key reaches 999 uses (or its configured limit), the next key in the pool takes over automatically.
          Counters reset on the 1st of each month. Add as many keys as needed — each key should be from a separate API account.
        </p>
      </div>
    </div>
  )
}

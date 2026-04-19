'use client'

import { useState, useEffect, useCallback } from 'react'
import type { EmailProvider, EmailRouting, EmailType, EmailProviderType } from '@/lib/db/email-providers'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER_TYPES: { value: EmailProviderType; label: string; fields: string[] }[] = [
  { value: 'resend',    label: 'Resend',    fields: ['api_key'] },
  { value: 'sendgrid',  label: 'SendGrid',  fields: ['api_key'] },
  { value: 'smtp',      label: 'SMTP',      fields: ['host', 'port', 'user', 'pass', 'secure'] },
]

const EMAIL_TYPES: { value: EmailType; label: string; description: string }[] = [
  { value: 'monitor_alert',        label: 'Monitor Alerts',        description: 'Down/up notifications' },
  { value: 'incident_notification', label: 'Incident Notifications', description: 'Incident created/resolved' },
  { value: 'blog_approval',        label: 'Blog Approval',         description: 'Auto-generated blog drafts' },
  { value: 'team_invite',          label: 'Team Invites',          description: 'Workspace invitations' },
  { value: 'citation_report',      label: 'Citation Reports',      description: 'AI visibility reports' },
  { value: 'system',               label: 'System / Fallback',     description: 'All other emails + catch-all' },
]

const BLANK_FORM = {
  name: '',
  type: 'resend' as EmailProviderType,
  from_email: '',
  from_name: 'Uptrue',
  is_active: true,
  api_key: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_pass: '',
  smtp_secure: false,
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Form = typeof BLANK_FORM

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeBadge(type: EmailProviderType) {
  const colors: Record<EmailProviderType, string> = {
    resend: '#6366f1',
    sendgrid: '#0ea5e9',
    smtp: '#f59e0b',
  }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      background: colors[type] + '20',
      color: colors[type],
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>{type}</span>
  )
}

function buildConfig(form: Form): Record<string, unknown> {
  if (form.type === 'resend' || form.type === 'sendgrid') return { api_key: form.api_key }
  return {
    host: form.smtp_host,
    port: Number(form.smtp_port) || 587,
    user: form.smtp_user,
    pass: form.smtp_pass,
    secure: form.smtp_secure,
  }
}

function configToForm(provider: EmailProvider): Form {
  const cfg = provider.config as Record<string, unknown>
  return {
    name: provider.name,
    type: provider.type,
    from_email: provider.from_email,
    from_name: provider.from_name,
    is_active: provider.is_active,
    api_key: (cfg.api_key as string) ?? '',
    smtp_host: (cfg.host as string) ?? '',
    smtp_port: String(cfg.port ?? 587),
    smtp_user: (cfg.user as string) ?? '',
    smtp_pass: (cfg.pass as string) ?? '',
    smtp_secure: Boolean(cfg.secure),
  }
}

// ---------------------------------------------------------------------------
// Provider Form Modal
// ---------------------------------------------------------------------------

function ProviderModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: EmailProvider | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<Form>(editing ? configToForm(editing) : BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof Form, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        type: form.type,
        config: buildConfig(form),
        from_email: form.from_email,
        from_name: form.from_name,
        is_active: form.is_active,
      }

      const res = editing
        ? await fetch(`/api/admin/email-providers/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/admin/email-providers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Save failed')
        return
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const smtpSelected = form.type === 'smtp'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>{editing ? 'Edit Provider' : 'Add Email Provider'}</h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Display Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} required
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Provider Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value as EmailProviderType)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}>
                {PROVIDER_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {(form.type === 'resend' || form.type === 'sendgrid') && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>API Key</label>
                <input type="password" value={form.api_key} onChange={e => set('api_key', e.target.value)} required
                  placeholder={editing ? '••••••••  (leave blank to keep current)' : ''}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'monospace' }} />
              </div>
            )}

            {smtpSelected && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>SMTP Host</label>
                    <input value={form.smtp_host} onChange={e => set('smtp_host', e.target.value)} required={smtpSelected}
                      placeholder="smtp.example.com"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Port</label>
                    <input value={form.smtp_port} onChange={e => set('smtp_port', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>SMTP Username</label>
                  <input value={form.smtp_user} onChange={e => set('smtp_user', e.target.value)} required={smtpSelected}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>SMTP Password</label>
                  <input type="password" value={form.smtp_pass} onChange={e => set('smtp_pass', e.target.value)} required={smtpSelected}
                    placeholder={editing ? '••••••••  (leave blank to keep current)' : ''}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'monospace' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.smtp_secure} onChange={e => set('smtp_secure', e.target.checked)} />
                  Use TLS (port 465)
                </label>
              </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>From Email</label>
                <input type="email" value={form.from_email} onChange={e => set('from_email', e.target.value)} required
                  placeholder="alerts@yourdomain.com"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>From Name</label>
                <input value={form.from_name} onChange={e => set('from_name', e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
              Active (emails route to this provider)
            </label>

          </div>

          {error && <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-danger, #ef4444)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 16px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '8px 16px', fontSize: 13, borderRadius: 6, border: 'none', background: '#111827', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontWeight: 600 }}>
              {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Add Provider')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EmailProvidersContent() {
  const [providers, setProviders] = useState<EmailProvider[]>([])
  const [routings, setRoutings] = useState<EmailRouting[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<EmailProvider | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testTo, setTestTo] = useState('')
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; error?: string }>>({})
  const [routingSaving, setRoutingSaving] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [pRes, rRes] = await Promise.all([
      fetch('/api/admin/email-providers'),
      fetch('/api/admin/email-routing'),
    ])
    if (pRes.ok) {
      const d = await pRes.json() as { providers: EmailProvider[] }
      setProviders(d.providers)
    }
    if (rRes.ok) {
      const d = await rRes.json() as { routings: EmailRouting[] }
      setRoutings(d.routings)
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleDelete(id: string) {
    await fetch(`/api/admin/email-providers/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    void load()
  }

  async function handleTest(provider: EmailProvider) {
    if (!testTo) { alert('Enter a test recipient email first'); return }
    setTesting(provider.id)
    const res = await fetch('/api/admin/email-providers/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_id: provider.id, test_to: testTo }),
    })
    const d = await res.json() as { success: boolean; error?: string }
    setTestResult(r => ({ ...r, [provider.id]: d }))
    setTesting(null)
    void load()
  }

  async function handleRoutingChange(emailType: EmailType, field: 'provider_id' | 'fallback_provider_id', value: string | null) {
    setRoutingSaving(emailType)
    const current = routings.find(r => r.email_type === emailType)
    await fetch('/api/admin/email-routing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_type: emailType,
        provider_id: field === 'provider_id' ? value : (current?.provider_id ?? null),
        fallback_provider_id: field === 'fallback_provider_id' ? value : (current?.fallback_provider_id ?? null),
      }),
    })
    setRoutingSaving(null)
    void load()
  }

  const activeProviders = providers.filter(p => p.is_active)

  function providerName(id: string | null) {
    if (!id) return '— not set —'
    return providers.find(p => p.id === id)?.name ?? id
  }

  if (loading) return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Email Providers ── */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Email Providers</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Configure services used to send email. Supports Resend, SendGrid, and any SMTP provider.
            </p>
          </div>
          <button onClick={() => { setEditing(null); setModal('add') }}
            style={{ padding: '7px 14px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: '#111827', color: '#fff', cursor: 'pointer' }}>
            + Add Provider
          </button>
        </div>

        {/* Test recipient input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Test recipient:</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={testTo}
            onChange={e => setTestTo(e.target.value)}
            style={{ flex: 1, padding: '5px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-card)', color: 'var(--text)' }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Used for Send Test buttons below</span>
        </div>

        {providers.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            No providers configured. Add one above or set <code>RESEND_API_KEY</code> in env vars as a fallback.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {providers.map(p => {
              const tr = testResult[p.id]
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</span>
                      {typeBadge(p.type)}
                      {!p.is_active && <span className="badge badge-neutral" style={{ fontSize: 10 }}>inactive</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {p.from_name} &lt;{p.from_email}&gt;
                      {p.test_last_at && (
                        <span style={{ marginLeft: 10 }}>
                          Last test: <span style={{ color: p.test_status === 'ok' ? '#16a34a' : '#dc2626' }}>
                            {p.test_status === 'ok' ? '✓ passed' : `✗ ${p.test_error ?? 'failed'}`}
                          </span>
                        </span>
                      )}
                    </div>
                    {tr && (
                      <div style={{ marginTop: 4, fontSize: 12, color: tr.success ? '#16a34a' : '#dc2626' }}>
                        {tr.success ? '✓ Test email sent successfully' : `✗ ${tr.error}`}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleTest(p)} disabled={testing === p.id}
                      style={{ padding: '5px 10px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text)' }}>
                      {testing === p.id ? '…' : 'Test'}
                    </button>
                    <button onClick={() => { setEditing(p); setModal('edit') }}
                      style={{ padding: '5px 10px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text)' }}>
                      Edit
                    </button>
                    {deleteConfirm === p.id ? (
                      <>
                        <button onClick={() => handleDelete(p.id)}
                          style={{ padding: '5px 10px', fontSize: 12, borderRadius: 5, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer' }}>
                          Confirm Delete
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          style={{ padding: '5px 10px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text)' }}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(p.id)}
                        style={{ padding: '5px 10px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: '#dc2626' }}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Email Routing ── */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Email Routing</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Choose which provider handles each type of email. System is the catch-all fallback.
          </p>
        </div>

        {activeProviders.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add at least one active provider above to configure routing.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Email Type</th>
                <th>Description</th>
                <th>Primary Provider</th>
                <th>Fallback Provider</th>
              </tr>
            </thead>
            <tbody>
              {EMAIL_TYPES.map(et => {
                const routing = routings.find(r => r.email_type === et.value)
                const saving = routingSaving === et.value
                return (
                  <tr key={et.value}>
                    <td style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{et.label}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{et.description}</td>
                    <td>
                      <select
                        disabled={saving}
                        value={routing?.provider_id ?? ''}
                        onChange={e => handleRoutingChange(et.value, 'provider_id', e.target.value || null)}
                        style={{ padding: '5px 8px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
                      >
                        <option value="">— env fallback —</option>
                        {activeProviders.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        disabled={saving}
                        value={routing?.fallback_provider_id ?? ''}
                        onChange={e => handleRoutingChange(et.value, 'fallback_provider_id', e.target.value || null)}
                        style={{ padding: '5px 8px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
                      >
                        <option value="">— none —</option>
                        {activeProviders.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          <strong>Routing order:</strong> Primary provider → Fallback provider (if primary inactive) → System route → <code>RESEND_API_KEY</code> env var.
        </p>
      </div>

      {/* ── Modal ── */}
      {(modal === 'add' || modal === 'edit') && (
        <ProviderModal
          editing={modal === 'edit' ? editing : null}
          onClose={() => { setModal(null); setEditing(null) }}
          onSaved={() => { setModal(null); setEditing(null); void load() }}
        />
      )}
    </div>
  )
}

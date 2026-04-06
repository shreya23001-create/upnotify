import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ─── Auth guard ──────────────────────────────────────────────────────────────

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtAmount(pence: number, currency = 'gbp'): string {
  const amount = (pence / 100).toFixed(2)
  const symbols: Record<string, string> = { gbp: '£', usd: '$', eur: '€', inr: '₹' }
  return `${symbols[currency.toLowerCase()] ?? currency.toUpperCase() + ' '}${amount}`
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function User360Page({
  searchParams,
}: {
  searchParams: Promise<{ org_id?: string; email?: string }>
}): Promise<React.ReactElement> {
  if (!(await isAdmin())) redirect('/admin')

  const { org_id, email } = await searchParams
  const supabase = createAdminClient()

  // ── Resolve org from org_id or email lookup ──────────────────────────────
  let orgId = org_id ?? null

  if (!orgId && email) {
    const { data: userRow } = await supabase
      .from('users')
      .select('org_id')
      .ilike('email', email.trim())
      .limit(1)
      .maybeSingle()
    orgId = userRow?.org_id ?? null
  }

  // ── Load all data in parallel ────────────────────────────────────────────
  const [orgResult, usersResult, subsResult, invoicesResult, monitorsResult, incidentsResult] =
    orgId
      ? await Promise.all([
          supabase.from('organisations').select('*').eq('id', orgId).single(),
          supabase.from('users').select('id, email, full_name, created_at, last_sign_in_at, is_super_admin').eq('org_id', orgId),
          supabase.from('subscriptions').select('id, status, billing_cycle, current_period_end, created_at, plans(name, slug, price_monthly_gbp)').eq('org_id', orgId).order('created_at', { ascending: false }),
          supabase.from('invoices').select('id, amount_gbp, currency, status, invoice_pdf_url, created_at, period_start').eq('org_id', orgId).order('created_at', { ascending: false }).limit(10),
          supabase.from('monitors').select('id, name, url, status, check_type, created_at').eq('org_id', orgId).order('created_at', { ascending: false }),
          supabase.from('incidents').select('id, started_at, resolved_at, cause').eq('org_id', orgId).order('started_at', { ascending: false }).limit(5),
        ])
      : Array(6).fill({ data: null, error: null, count: null })

  const org = orgResult.data as Record<string, unknown> | null
  const users = (usersResult.data ?? []) as Array<{ id: string; email: string; full_name: string | null; created_at: string; last_sign_in_at: string | null; is_super_admin: boolean }>
  const subs = (subsResult.data ?? []) as Array<{ id: string; status: string; billing_cycle: string; current_period_end: string | null; created_at: string; plans: { name: string; slug: string; price_monthly_gbp: number } | null }>
  const invoices = (invoicesResult.data ?? []) as Array<{ id: string; amount_gbp: number; currency: string; status: string; invoice_pdf_url: string | null; created_at: string; period_start: string | null }>
  const monitors = (monitorsResult.data ?? []) as Array<{ id: string; name: string; url: string; status: string; check_type: string; created_at: string }>
  const incidents = (incidentsResult.data ?? []) as Array<{ id: string; started_at: string; resolved_at: string | null; cause: string | null }>

  const activeSub = subs.find(s => s.status === 'active')
  const monitorUpCount = monitors.filter(m => m.status === 'up').length
  const monitorDownCount = monitors.filter(m => m.status === 'down').length
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount_gbp ?? 0), 0)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User 360</h1>
          <p className="admin-page-subtitle">Full view of a user or organisation.</p>
        </div>
        <Link href="/admin/revenue" className="btn btn-secondary" style={{ fontSize: 13 }}>← Revenue</Link>
      </div>

      {/* Search bar */}
      <form method="GET" className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          name="email"
          className="form-input"
          placeholder="Search by email…"
          defaultValue={email ?? ''}
          style={{ flex: 1, minWidth: 220, fontSize: 13 }}
        />
        <input
          name="org_id"
          className="form-input"
          placeholder="…or paste org ID"
          defaultValue={orgId ?? ''}
          style={{ flex: 1, minWidth: 220, fontSize: 13 }}
        />
        <button type="submit" className="btn btn-primary" style={{ fontSize: 13 }}>Look up</button>
      </form>

      {/* No result state */}
      {(org_id || email) && !org && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          No organisation found for that email or ID.
        </div>
      )}

      {/* Empty state — no search yet */}
      {!org_id && !email && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          Enter an email address or org ID above to look up a user.
        </div>
      )}

      {org && (
        <>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Plan', value: activeSub?.plans?.name ?? 'Free' },
              { label: 'Billing', value: activeSub ? activeSub.billing_cycle : '—' },
              { label: 'Monitors', value: String(monitors.length) },
              { label: 'Up / Down', value: `${monitorUpCount} / ${monitorDownCount}` },
              { label: 'Total Paid', value: fmtAmount(totalRevenue) },
              { label: 'Invoices', value: String(invoices.length) },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* Org / Account */}
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Organisation</h3>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    ['Name', org.name as string],
                    ['Org ID', org.id as string],
                    ['Created', fmtDate(org.created_at as string)],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ padding: '5px 0', color: 'var(--text-muted)', width: 90 }}>{k}</td>
                      <td style={{ padding: '5px 0', fontWeight: 500, wordBreak: 'break-all' }}>{v || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Users */}
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Users</h3>
              {users.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No users found.</p>
              ) : (
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '7px 0' }}>
                          <div style={{ fontWeight: 600 }}>{u.full_name || u.email}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last login: {fmtDate(u.last_sign_in_at)}</div>
                        </td>
                        <td style={{ padding: '7px 0', textAlign: 'right' }}>
                          {u.is_super_admin && <span className="badge badge-warning" style={{ fontSize: 10 }}>Admin</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Subscription */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Subscriptions</h3>
            {subs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Free plan — no subscription.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Plan</th><th>Billing</th><th>Status</th><th>Renews</th><th>Started</th></tr>
                </thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.plans?.name ?? '—'}</td>
                      <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{s.billing_cycle}</td>
                      <td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{s.status}</span></td>
                      <td style={{ fontSize: 12 }}>{fmtDate(s.current_period_end)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* Recent invoices */}
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Recent Invoices</h3>
              {invoices.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No invoices.</p>
              ) : (
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(inv.created_at)}</td>
                        <td style={{ padding: '6px 0', fontWeight: 700, color: 'var(--color-success)' }}>{fmtAmount(inv.amount_gbp, inv.currency)}</td>
                        <td style={{ padding: '6px 0' }}><span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-neutral'}`}>{inv.status}</span></td>
                        <td style={{ padding: '6px 0', textAlign: 'right' }}>
                          {inv.invoice_pdf_url
                            ? <a href={inv.invoice_pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--accent)' }}>PDF ↗</a>
                            : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent incidents */}
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Recent Incidents</h3>
              {incidents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No incidents. 🎉</p>
              ) : (
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <tbody>
                    {incidents.map(inc => (
                      <tr key={inc.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '6px 0' }}>
                          <div style={{ fontSize: 12 }}>{inc.cause ?? 'Unreachable'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDateTime(inc.started_at)}</div>
                        </td>
                        <td style={{ padding: '6px 0', textAlign: 'right' }}>
                          {inc.resolved_at
                            ? <span className="badge badge-success" style={{ fontSize: 10 }}>Resolved</span>
                            : <span className="badge badge-danger" style={{ fontSize: 10 }}>Open</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Monitors */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Monitors ({monitors.length})
            </h3>
            {monitors.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No monitors set up.</p>
            ) : (
              <table className="table">
                <thead><tr><th>Name</th><th>URL</th><th>Type</th><th>Status</th><th>Created</th></tr></thead>
                <tbody>
                  {monitors.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.url}</td>
                      <td style={{ fontSize: 12 }}>{m.check_type}</td>
                      <td>
                        <span className={`badge ${m.status === 'up' ? 'badge-success' : m.status === 'down' ? 'badge-danger' : 'badge-neutral'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick actions */}
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {users[0] && (
                <Link
                  href={`/admin?impersonate=${users[0].id}`}
                  className="btn btn-secondary"
                  style={{ fontSize: 13 }}
                >
                  👤 Impersonate {users[0].email}
                </Link>
              )}
              <Link href={`/admin/users?org_id=${orgId}`} className="btn btn-secondary" style={{ fontSize: 13 }}>
                🏢 View in Users list
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

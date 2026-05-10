import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllProfilePromptsAdmin } from '@/lib/db/ai-profile-prompts'
import { DeletePromptButton } from './delete-prompt-button'

export const metadata: Metadata = { title: 'AI Profile Prompts — Admin' }

export default async function ProfilePromptsPage(): Promise<React.ReactElement> {
  const prompts = await getAllProfilePromptsAdmin()

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">AI Profile Prompts</h1>
          <p className="admin-page-subtitle">
            Introspection prompts sent to AI engines when a user runs an AI Profile.
            Use the literal placeholder <code>{'{domain}'}</code> — it&apos;s substituted with the run target at execution time.
          </p>
        </div>
        <Link href="/admin/ai-profile-prompts/new" className="btn btn-primary btn-sm">+ Add Prompt</Link>
      </div>

      <div className="admin-card" style={{ marginBottom: 24 }}>
        {prompts.length === 0 ? (
          <div className="admin-empty">
            No prompts configured. <Link href="/admin/ai-profile-prompts/new">Add the first prompt →</Link>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Prompt</th>
                <th style={{ width: 80 }}>Sort</th>
                <th style={{ width: 90 }}>Status</th>
                <th style={{ width: 160 }}>Last Updated</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.prompt_text}</div>
                    {p.admin_notes && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {p.admin_notes}
                      </div>
                    )}
                  </td>
                  <td>{p.sort_order}</td>
                  <td>
                    <span className={`admin-badge ${p.is_active ? 'admin-badge-green' : 'admin-badge-gray'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(p.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Link href={`/admin/ai-profile-prompts/${p.id}/edit`} className="admin-action-link">
                        Edit
                      </Link>
                      <DeletePromptButton promptId={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-card" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          How prompts work
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          When a user runs an AI Profile for <code>example.com</code>, every active prompt is sent to each
          selected AI engine, with <code>{'{domain}'}</code> replaced by <code>example.com</code>. Prompts that work
          well are open-ended and ask the engine to describe, categorise, or recommend the site. Avoid
          yes/no prompts (engines tend to over-affirm).
        </p>
      </div>
    </div>
  )
}

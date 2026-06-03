'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PromptForm {
  prompt_text: string
  sort_order:  string
  is_active:   boolean
  admin_notes: string
}

export default function NewProfilePromptPage(): React.ReactElement {
  const router = useRouter()
  const [form, setForm] = useState<PromptForm>({
    prompt_text: '',
    sort_order:  '99',
    is_active:   true,
    admin_notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function set<K extends keyof PromptForm>(key: K, value: PromptForm[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/ai-profile-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_text: form.prompt_text.trim(),
          sort_order:  parseInt(form.sort_order, 10),
          is_active:   form.is_active,
          admin_notes: form.admin_notes.trim() || null,
        }),
      })
      const data = await res.json() as { prompt?: { id: string }; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to create prompt.'); return }
      router.push('/admin/ai-profile-prompts')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="admin-breadcrumb">
        <Link href="/admin/ai-profile-prompts">AI Profile Prompts</Link> / New
      </div>
      <div className="admin-page-header" style={{ marginTop: 8 }}>
        <div>
          <h1 className="admin-page-title">Add Profile Prompt</h1>
          <p className="admin-page-subtitle">
            Use <code>{'{domain}'}</code> as a placeholder. It&apos;s replaced with the user&apos;s domain at run time.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {error && <div className="admin-form-error">{error}</div>}

        <div className="admin-card" style={{ padding: 20 }}>
          <div className="admin-form-group">
            <label className="admin-form-label">Prompt text</label>
            <textarea className="admin-form-input" rows={3} value={form.prompt_text}
              onChange={e => set('prompt_text', e.target.value)}
              placeholder="e.g. What is {domain} known for?" required />
            <span className="admin-form-hint">
              Open-ended questions work best. Avoid yes/no prompts — engines tend to over-affirm.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Sort order</label>
              <input className="admin-form-input" type="number" min="0" value={form.sort_order}
                onChange={e => set('sort_order', e.target.value)} />
              <span className="admin-form-hint">Lower numbers appear first.</span>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Status</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
                <input type="checkbox" checked={form.is_active}
                  onChange={e => set('is_active', e.target.checked)} />
                <span style={{ fontSize: 13, fontWeight: 600, color: form.is_active ? '#16a34a' : '#dc2626' }}>
                  {form.is_active ? 'Active — will run' : 'Inactive — will be skipped'}
                </span>
              </label>
            </div>
          </div>

          <div className="admin-form-group" style={{ marginTop: 16 }}>
            <label className="admin-form-label">
              Admin notes <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(internal only)</span>
            </label>
            <textarea className="admin-form-input" rows={2} value={form.admin_notes}
              onChange={e => set('admin_notes', e.target.value)}
              placeholder="What signal does this prompt surface? When was it added? etc." />
          </div>
        </div>

        <div className="admin-form-actions">
          <Link href="/admin/ai-profile-prompts" className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={loading || !form.prompt_text.trim()}>
            {loading ? 'Creating…' : 'Create Prompt'}
          </button>
        </div>
      </form>
    </div>
  )
}

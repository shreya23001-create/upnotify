'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface PromptForm {
  prompt_text: string
  sort_order:  string
  is_active:   boolean
  admin_notes: string
}

export default function EditProfilePromptPage(): React.ReactElement {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [form, setForm]       = useState<PromptForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/ai-profile-prompts')
        const data = await res.json() as { prompts?: { id: string; prompt_text: string; sort_order: number; is_active: boolean; admin_notes: string | null }[] }
        const prompt = data.prompts?.find(p => p.id === params.id)
        if (!prompt) { setError('Prompt not found.'); setLoading(false); return }
        setForm({
          prompt_text: prompt.prompt_text,
          sort_order:  String(prompt.sort_order),
          is_active:   prompt.is_active,
          admin_notes: prompt.admin_notes ?? '',
        })
      } catch {
        setError('Failed to load prompt.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  function set<K extends keyof PromptForm>(key: K, value: PromptForm[K]) {
    setForm(f => f ? { ...f, [key]: value } : f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/ai-profile-prompts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_text: form.prompt_text.trim(),
          sort_order:  parseInt(form.sort_order, 10),
          is_active:   form.is_active,
          admin_notes: form.admin_notes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save.'); return }
      router.push('/admin/ai-profile-prompts')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Loading prompt…</div>
  if (!form) return (
    <div style={{ padding: 40 }}>
      <div style={{ color: '#dc2626', marginBottom: 16 }}>{error || 'Prompt not found.'}</div>
      <Link href="/admin/ai-profile-prompts" className="btn btn-secondary btn-sm">← Back to Prompts</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="admin-breadcrumb">
        <Link href="/admin/ai-profile-prompts">AI Profile Prompts</Link> / Edit
      </div>
      <div className="admin-page-header" style={{ marginTop: 8 }}>
        <div>
          <h1 className="admin-page-title">Edit Prompt</h1>
          <p className="admin-page-subtitle">
            Changes apply to future runs only. Past run results keep their original prompt text.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {error && <div className="admin-form-error">{error}</div>}

        <div className="admin-card" style={{ padding: 20 }}>
          <div className="admin-form-group">
            <label className="admin-form-label">Prompt text</label>
            <textarea className="admin-form-input" rows={3} value={form.prompt_text}
              onChange={e => set('prompt_text', e.target.value)} required />
            <span className="admin-form-hint">
              Use <code>{'{domain}'}</code> as the placeholder.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Sort order</label>
              <input className="admin-form-input" type="number" min="0" value={form.sort_order}
                onChange={e => set('sort_order', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Status</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
                <input type="checkbox" checked={form.is_active}
                  onChange={e => set('is_active', e.target.checked)} />
                <span style={{ fontSize: 13, fontWeight: 600, color: form.is_active ? '#16a34a' : '#dc2626' }}>
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>

          <div className="admin-form-group" style={{ marginTop: 16 }}>
            <label className="admin-form-label">
              Admin notes <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(internal only)</span>
            </label>
            <textarea className="admin-form-input" rows={2} value={form.admin_notes}
              onChange={e => set('admin_notes', e.target.value)} />
          </div>
        </div>

        <div className="admin-form-actions">
          <Link href="/admin/ai-profile-prompts" className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={saving || !form.prompt_text.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

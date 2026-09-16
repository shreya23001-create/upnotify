'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EngineForm {
  name:           string
  slug:           string
  description:    string
  type:           'llms_txt' | 'citation' | 'both'
  signal_quality: 'high' | 'medium' | 'indicative'
  signal_note:    string
  is_free:        boolean
  is_active:      boolean
  sort_order:     string
  admin_notes:    string
  model_id:       string
}

export default function NewEnginePage(): React.ReactElement {
  const router = useRouter()
  const [form, setForm] = useState<EngineForm>({
    name: '', slug: '', description: '', type: 'both',
    signal_quality: 'medium', signal_note: '',
    is_free: false, is_active: true, sort_order: '99', admin_notes: '',
    model_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function set<K extends keyof EngineForm>(key: K, value: EngineForm[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setForm(f => ({ ...f, name, slug }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/ai-engines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sort_order: parseInt(form.sort_order, 10),
          model_id:   form.model_id.trim() === '' ? null : form.model_id.trim(),
        }),
      })
      const data = await res.json() as { engine?: { id: string }; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to create engine.'); return }
      router.push(`/admin/ai-engines/${data.engine!.id}/keys`)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="admin-breadcrumb">
        <Link href="/admin/ai-engines">AI Engines</Link> / New Engine
      </div>
      <div className="admin-page-header" style={{ marginTop: 8 }}>
        <div>
          <h1 className="admin-page-title">Add AI Engine</h1>
          <p className="admin-page-subtitle">Register a new AI engine. After saving, add API keys to the key pool.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {error && <div className="admin-form-error">{error}</div>}

        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px' }}>Basic Info</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Name</label>
              <input className="admin-form-input" value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Perplexity" required />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Slug</label>
              <input className="admin-form-input" value={form.slug}
                onChange={e => set('slug', e.target.value)}
                placeholder="e.g. perplexity" required />
              <span className="admin-form-hint">Must match key in ENGINE_QUERY_MAP in process-run/route.ts</span>
            </div>
          </div>

          <div className="admin-form-group" style={{ marginTop: 16 }}>
            <label className="admin-form-label">Description</label>
            <textarea className="admin-form-input" rows={2} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="What this engine does and why it matters for AI visibility." />
          </div>

          <div className="admin-form-group" style={{ marginTop: 16 }}>
            <label className="admin-form-label">Signal note <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(shown to users)</span></label>
            <input className="admin-form-input" value={form.signal_note}
              onChange={e => set('signal_note', e.target.value)}
              placeholder="e.g. Explicit citation URL returned with each response." />
          </div>
        </div>

        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px' }}>Configuration</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Type</label>
              <select className="admin-form-input" value={form.type} onChange={e => set('type', e.target.value as EngineForm['type'])}>
                <option value="both">llms.txt + Citation</option>
                <option value="llms_txt">llms.txt only</option>
                <option value="citation">Citation only</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Signal quality</label>
              <select className="admin-form-input" value={form.signal_quality} onChange={e => set('signal_quality', e.target.value as EngineForm['signal_quality'])}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="indicative">Indicative</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Sort order</label>
              <input className="admin-form-input" type="number" min="0" value={form.sort_order}
                onChange={e => set('sort_order', e.target.value)} />
            </div>
          </div>

          <div className="admin-form-group" style={{ marginTop: 16 }}>
            <label className="admin-form-label">
              Model ID <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(provider-side identifier)</span>
            </label>
            <input className="admin-form-input" value={form.model_id}
              onChange={e => set('model_id', e.target.value)}
              placeholder="e.g. claude-haiku-4-5-20251001 — leave blank for search-only engines" />
            <span className="admin-form-hint">
              The model the citation checker will call. Update without a code deploy when providers rotate models.
            </span>
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="admin-toggle-row">
              <div>
                <div className="admin-toggle-label">Free tier</div>
                <div className="admin-toggle-hint">Included on the entry-level engine tier</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_free} onChange={e => set('is_free', e.target.checked)} />
                <span style={{ fontSize: 13, fontWeight: 600, color: form.is_free ? '#16a34a' : 'var(--text-muted)' }}>
                  {form.is_free ? 'Yes' : 'No'}
                </span>
              </label>
            </div>
            <div className="admin-toggle-row">
              <div>
                <div className="admin-toggle-label">Active</div>
                <div className="admin-toggle-hint">Show this engine to users and include in checks</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
                <span style={{ fontSize: 13, fontWeight: 600, color: form.is_active ? '#16a34a' : '#dc2626' }}>
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: 20 }}>
          <div className="admin-form-group">
            <label className="admin-form-label">Admin notes <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(internal only)</span></label>
            <textarea className="admin-form-input" rows={3} value={form.admin_notes}
              onChange={e => set('admin_notes', e.target.value)}
              placeholder="Pricing notes, rate limits, account details, etc." />
          </div>
        </div>

        <div className="admin-form-actions">
          <Link href="/admin/ai-engines" className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Engine & Add Keys →'}
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

export default function EditEnginePage(): React.ReactElement {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [form, setForm]       = useState<EngineForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/admin/ai-engines')
        const data = await res.json() as { engines?: { id: string; name: string; slug: string; description: string; type: string; signal_quality: string; signal_note: string; is_free: boolean; is_active: boolean; sort_order: number; admin_notes: string | null; model_id: string | null }[] }
        const engine = data.engines?.find(e => e.id === params.id)
        if (!engine) { setError('Engine not found.'); setLoading(false); return }
        setForm({
          name:           engine.name,
          slug:           engine.slug,
          description:    engine.description,
          type:           engine.type as EngineForm['type'],
          signal_quality: engine.signal_quality as EngineForm['signal_quality'],
          signal_note:    engine.signal_note,
          is_free:        engine.is_free,
          is_active:      engine.is_active,
          sort_order:     String(engine.sort_order),
          admin_notes:    engine.admin_notes ?? '',
          model_id:       engine.model_id ?? '',
        })
      } catch {
        setError('Failed to load engine.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch(`/api/admin/ai-engines/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sort_order: parseInt(form.sort_order, 10),
          model_id:   form.model_id.trim() === '' ? null : form.model_id.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save.'); return }
      setSuccess(true)
      setTimeout(() => router.push('/admin/ai-engines'), 1000)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof EngineForm>(key: K, value: EngineForm[K]) {
    setForm(f => f ? { ...f, [key]: value } : f)
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Loading engine…</div>
  if (!form)   return (
    <div style={{ padding: 40 }}>
      <div style={{ color: '#dc2626', marginBottom: 16 }}>{error || 'Engine not found.'}</div>
      <Link href="/admin/ai-engines" className="btn btn-secondary btn-sm">← Back to AI Engines</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="admin-breadcrumb">
        <Link href="/admin/ai-engines">AI Engines</Link> / Edit
      </div>
      <div className="admin-page-header" style={{ marginTop: 8 }}>
        <div>
          <h1 className="admin-page-title">Edit — {form.name}</h1>
          <p className="admin-page-subtitle">Update engine settings. API keys are managed separately.</p>
        </div>
        <Link href={`/admin/ai-engines/${params.id}/keys`} className="btn btn-secondary btn-sm">Manage Keys</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {error   && <div className="admin-form-error">{error}</div>}
        {success && <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, color: '#16a34a', fontSize: 13 }}>Saved — redirecting…</div>}

        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px' }}>Basic Info</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Name</label>
              <input className="admin-form-input" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Slug</label>
              <input className="admin-form-input" value={form.slug} onChange={e => set('slug', e.target.value)} required
                placeholder="e.g. perplexity" />
              <span className="admin-form-hint">Must match ENGINE_QUERY_MAP key in process-run/route.ts</span>
            </div>
          </div>

          <div className="admin-form-group" style={{ marginTop: 16 }}>
            <label className="admin-form-label">Description</label>
            <textarea className="admin-form-input" rows={2} value={form.description}
              onChange={e => set('description', e.target.value)} />
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
              Model ID <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(provider-side model identifier)</span>
            </label>
            <input className="admin-form-input" value={form.model_id}
              onChange={e => set('model_id', e.target.value)}
              placeholder="e.g. claude-haiku-4-5-20251001, gpt-4o-mini, gemini-2.0-flash" />
            <span className="admin-form-hint">
              Leave blank for search-only engines (Exa, Bing). For LLM engines, this is the model the citation
              checker and the &quot;Test&quot; button will call. Update here when the provider rotates models —
              no code deploy needed.
            </span>
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="admin-toggle-row">
              <div>
                <div className="admin-toggle-label">Free tier</div>
                <div className="admin-toggle-hint">Free plan users can access this engine</div>
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
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

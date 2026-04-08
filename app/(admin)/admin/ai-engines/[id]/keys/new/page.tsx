'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function NewEngineKeyPage(): React.ReactElement {
  const params    = useParams<{ id: string }>()
  const router    = useRouter()
  const [form, setForm] = useState({ label: '', apiKey: '', monthlyLimit: '1000' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/ai-engines/${params.id}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label:        form.label.trim(),
          apiKey:       form.apiKey.trim(),
          monthlyLimit: parseInt(form.monthlyLimit, 10),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to add key'); return }
      router.push(`/admin/ai-engines/${params.id}/keys`)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="admin-breadcrumb" style={{ marginBottom: 16 }}>
        <Link href="/admin/ai-engines">AI Engines</Link> /
        <Link href={`/admin/ai-engines/${params.id}/keys`}> Keys</Link> / New Key
      </div>
      <h1 className="admin-page-title">Add API Key</h1>
      <p className="admin-page-subtitle">
        The key is encrypted with AES-256 before storage and never shown again after saving.
      </p>

      <form onSubmit={handleSubmit} className="admin-form">
        {error && <div className="admin-form-error">{error}</div>}

        <div className="admin-form-group">
          <label className="admin-form-label">Label</label>
          <input className="admin-form-input" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Account 1, Main Key, Backup Key" required />
          <span className="admin-form-hint">Internal label — helps you identify which account this key belongs to.</span>
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label">API Key</label>
          <input className="admin-form-input" type="password" value={form.apiKey}
            onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
            placeholder="Paste the API key here" required autoComplete="off" />
          <span className="admin-form-hint">Encrypted immediately. Will not be shown again after saving.</span>
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label">Monthly Limit</label>
          <input className="admin-form-input" type="number" min="1" max="1000000"
            value={form.monthlyLimit} onChange={e => setForm(f => ({ ...f, monthlyLimit: e.target.value }))} required />
          <span className="admin-form-hint">Max queries per month for this key. Uptrue will switch to the next key at 999 uses (or this limit).</span>
        </div>

        <div className="admin-form-actions">
          <Link href={`/admin/ai-engines/${params.id}/keys`} className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Encrypting & Saving...' : 'Save Key'}
          </button>
        </div>
      </form>
    </div>
  )
}

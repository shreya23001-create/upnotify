'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteKeyButton({ keyId }: { keyId: string }): React.ReactElement {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this key? This cannot be undone.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ai-engines/keys/${keyId}/delete`, { method: 'POST' })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Failed to delete key.')
      }
    } catch {
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="admin-action-link"
      style={{ color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.3)' }}
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}

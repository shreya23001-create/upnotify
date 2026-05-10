'use client'

import { useState } from 'react'

interface KeyTestResult {
  ok:         boolean
  statusCode: number | null
  message:    string
  latencyMs:  number
}

export function TestKeyButton({ keyId }: { keyId: string }): React.ReactElement {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<KeyTestResult | null>(null)

  async function handleTest(): Promise<void> {
    setLoading(true)
    setResult(null)
    try {
      const res  = await fetch(`/api/admin/ai-engines/keys/${keyId}/test`, { method: 'POST' })
      const data = await res.json() as KeyTestResult | { error: string }
      if ('error' in data) {
        setResult({ ok: false, statusCode: null, message: data.error, latencyMs: 0 })
      } else {
        setResult(data)
      }
    } catch (err) {
      setResult({ ok: false, statusCode: null, message: `Request failed: ${String(err)}`, latencyMs: 0 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
      <button
        type="button"
        onClick={handleTest}
        disabled={loading}
        className="admin-action-link"
      >
        {loading ? 'Testing…' : 'Test'}
      </button>
      {result && (
        <span
          style={{
            fontSize:  11,
            fontWeight: 600,
            color:     result.ok ? '#16a34a' : '#dc2626',
            maxWidth:  240,
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
          title={result.message}
        >
          {result.ok
            ? `OK (${result.latencyMs}ms)`
            : `FAIL${result.statusCode ? ` ${result.statusCode}` : ''}: ${truncate(result.message, 80)}`}
        </span>
      )}
    </div>
  )
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`
}

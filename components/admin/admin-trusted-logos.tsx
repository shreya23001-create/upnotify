'use client'

import { useState, useTransition } from 'react'
import { saveTrustedLogosAction } from '@/app/(admin)/admin/settings/actions'

interface AdminTrustedLogosProps {
  initialLogos: string[]
}

export function AdminTrustedLogos({ initialLogos }: AdminTrustedLogosProps): React.ReactElement {
  const [text, setText] = useState<string>(initialLogos.join('\n'))
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave(): void {
    setMessage(null)
    startTransition(async () => {
      const result = await saveTrustedLogosAction(text)
      if (result.error) {
        setIsError(true)
        setMessage(result.error)
      } else {
        setIsError(false)
        setMessage('Trusted logos saved successfully.')
      }
    })
  }

  const logoUrls = text
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.startsWith('http://') || l.startsWith('https://'))

  return (
    <div className="card" style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Trusted Logos</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Paste logo image URLs below (one per line). These appear in the &quot;Trusted by&quot; section on the landing page.
      </p>

      {message && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 14,
          background: isError ? '#fef2f2' : '#f0fdf4',
          color: isError ? '#dc2626' : '#16a34a',
          border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}`,
        }}>
          {message}
        </div>
      )}

      <textarea
        className="form-input"
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'https://example.com/logo1.svg\nhttps://example.com/logo2.png'}
        style={{ fontFamily: 'monospace', fontSize: 13 }}
        disabled={isPending}
      />

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {logoUrls.length} valid logo URL{logoUrls.length !== 1 ? 's' : ''}
        </span>
        <button className="btn btn-primary" onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Logos'}
        </button>
      </div>

      {logoUrls.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Preview</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            {logoUrls.map((url: string, idx: number) => (
              <img
                key={idx}
                src={url}
                alt={`Partner logo ${idx + 1}`}
                style={{ maxHeight: 40, maxWidth: 120, objectFit: 'contain', opacity: 0.7 }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

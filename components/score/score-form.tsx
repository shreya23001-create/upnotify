'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { FormEvent } from 'react'

function extractDomain(input: string): string {
  let cleaned = input.trim().toLowerCase()
  cleaned = cleaned.replace(/^https?:\/\//, '')
  cleaned = cleaned.split('/')[0] || cleaned
  cleaned = cleaned.split('?')[0] || cleaned
  return cleaned
}

export function ScoreForm(): React.ReactElement {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    if (!url.trim()) return

    const domain = extractDomain(url)
    if (!domain) return

    setLoading(true)
    router.push(`/score/${encodeURIComponent(domain)}`)
  }

  return (
    <form className="score-form" onSubmit={handleSubmit}>
      <div className="score-input-wrapper">
        <svg className="score-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="score-input"
          placeholder="Enter any website URL (e.g. example.com)"
          required
          autoFocus
          autoComplete="url"
          aria-label="Website URL to check"
          disabled={loading}
        />
        <button
          type="submit"
          className="btn btn-primary score-submit-btn"
          disabled={loading || !url.trim()}
        >
          {loading ? 'Checking...' : 'Check Score'}
        </button>
      </div>
    </form>
  )
}

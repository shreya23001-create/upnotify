'use client'

import { useState, useCallback } from 'react'

interface Props {
  title: string
  url: string
  category?: string | null
}

export function BlogShareSubscribe({ title, url, category }: Props): React.ReactElement {
  const [email, setEmail]     = useState('')
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [subMsg, setSubMsg]   = useState('')
  const [copied, setCopied]   = useState(false)

  const encodedUrl   = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const twitterHref  = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback — select the text
    }
  }, [url])

  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setSubStatus('error')
      setSubMsg('Enter a valid email address.')
      return
    }
    setSubStatus('loading')
    try {
      const res = await fetch('/api/v1/blog/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: category ?? 'general' }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (data.success) {
        setSubStatus('success')
        setSubMsg('You\'re subscribed. We\'ll email you when new reports are published.')
        setEmail('')
      } else {
        setSubStatus('error')
        setSubMsg(data.error ?? 'Something went wrong.')
      }
    } catch {
      setSubStatus('error')
      setSubMsg('Network error. Please try again.')
    }
  }, [email, category])

  return (
    <div className="blog-share-subscribe">

      {/* Share row */}
      <div className="blog-share-row">
        <span className="blog-share-label">Share</span>
        <a
          href={twitterHref}
          target="_blank"
          rel="noopener noreferrer"
          className="blog-share-btn"
          aria-label="Share on X / Twitter"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X / Twitter
        </a>
        <a
          href={linkedinHref}
          target="_blank"
          rel="noopener noreferrer"
          className="blog-share-btn"
          aria-label="Share on LinkedIn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </a>
        <button
          onClick={handleCopy}
          className="blog-share-btn"
          aria-label="Copy link"
        >
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Copy link
            </>
          )}
        </button>
      </div>

      {/* Subscribe box */}
      <div className="blog-subscribe-box">
        <div className="blog-subscribe-text">
          <div className="blog-subscribe-title">Get weekly reliability reports</div>
          <div className="blog-subscribe-sub">Uptime rankings, incident summaries, and response time trends — every Monday.</div>
        </div>
        {subStatus === 'success' ? (
          <p className="blog-subscribe-success">{subMsg}</p>
        ) : (
          <form onSubmit={handleSubscribe} className="blog-subscribe-form">
            <input
              type="email"
              className="blog-subscribe-input"
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setSubStatus('idle') }}
              disabled={subStatus === 'loading'}
              required
            />
            <button type="submit" className="blog-subscribe-btn" disabled={subStatus === 'loading'}>
              {subStatus === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
            {subStatus === 'error' && <p className="blog-subscribe-error">{subMsg}</p>}
          </form>
        )}
      </div>

    </div>
  )
}

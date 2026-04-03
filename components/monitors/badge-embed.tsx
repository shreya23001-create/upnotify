'use client'

import { useState } from 'react'
import { getConfig } from '@/lib/utils/config'

type BadgeStyle = 'standard' | 'uptime' | 'shield'

interface BadgeEmbedProps {
  monitorId: string
}

const BADGE_STYLES: { value: BadgeStyle; label: string; description: string }[] = [
  { value: 'standard', label: 'Standard', description: 'Monitored by Uptrue' },
  { value: 'uptime', label: 'Uptime', description: '99.97% Uptime — Uptrue' },
  { value: 'shield', label: 'Shield', description: 'Uptrue ✓ Verified' },
]

export function BadgeEmbed({ monitorId }: BadgeEmbedProps): React.ReactNode {
  const [selectedStyle, setSelectedStyle] = useState<BadgeStyle>('standard')
  const [copied, setCopied] = useState(false)

  const config = getConfig()
  const appUrl = config.app.url
  const badgeUrl = `${appUrl}/api/badge/monitor/${monitorId}?style=${selectedStyle}`
  const statusUrl = `${appUrl}/status`

  const embedCode = `<a href="${statusUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${badgeUrl}" alt="Uptime monitored by Uptrue" width="160" height="32" />\n</a>`

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = embedCode
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Badge &amp; Embed</div>
      </div>
      <div className="card-content">
        <p className="badge-embed-description">
          Embed this badge on your website to show your uptime monitoring status.
          Great for building trust with your visitors.
        </p>

        {/* Style selector */}
        <div className="badge-embed-styles">
          {BADGE_STYLES.map((style) => (
            <button
              key={style.value}
              className={`badge-embed-style-btn ${selectedStyle === style.value ? 'badge-embed-style-btn-active' : ''}`}
              onClick={() => setSelectedStyle(style.value)}
              type="button"
            >
              <span className="badge-embed-style-label">{style.label}</span>
              <span className="badge-embed-style-desc">{style.description}</span>
            </button>
          ))}
        </div>

        {/* Badge preview */}
        <div className="badge-embed-preview">
          <span className="badge-embed-preview-label">Preview</span>
          <div className="badge-embed-preview-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badgeUrl}
              alt="Uptime monitored by Uptrue"
              width={160}
              height={32}
              key={selectedStyle}
            />
          </div>
        </div>

        {/* Embed instructions */}
        <div className="badge-embed-instructions">
          <span className="badge-embed-preview-label">How to embed</span>
          <ol className="badge-embed-steps">
            <li><strong>Step 1:</strong> Copy the HTML code below</li>
            <li><strong>Step 2:</strong> Paste it into your website&apos;s footer or sidebar HTML</li>
            <li><strong>Step 3:</strong> The badge will automatically show your current uptime status</li>
          </ol>
          <p className="badge-embed-help-link">
            Need help? See our{' '}
            <a href="/help/badges" target="_blank" rel="noopener noreferrer">
              badge embedding guide
            </a>
          </p>
        </div>

        {/* Embed code */}
        <div className="badge-embed-code-section">
          <span className="badge-embed-preview-label">HTML Embed Code</span>
          <div className="badge-embed-code-wrapper">
            <pre className="badge-embed-code">{embedCode}</pre>
            <button
              className={`btn btn-sm ${copied ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleCopy}
              type="button"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

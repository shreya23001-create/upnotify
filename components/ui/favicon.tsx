'use client'

import { useState } from 'react'

interface FaviconProps {
  domain: string
  size?: number
}

/** Google's public favicon service — no API key, no rate-limit auth needed.
 *  Falls back to the domain's first letter if the image fails to load
 *  (new/unreachable domains, or the service itself being unavailable). */
export function Favicon({ domain, size = 20 }: FaviconProps): React.ReactElement {
  const [failed, setFailed] = useState(false)
  const bareDomain = domain.replace(/^www\./, '')

  if (failed || !bareDomain) {
    return (
      <span
        className="favicon-fallback"
        style={{ width: size, height: size, fontSize: size * 0.55, lineHeight: `${size}px` }}
        aria-hidden="true"
      >
        {(bareDomain || '?').charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external favicon service, not a project asset
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(bareDomain)}&sz=64`}
      alt=""
      width={size}
      height={size}
      className="favicon-img"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}

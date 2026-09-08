'use client'

import { useEffect, useState } from 'react'

/** Extract a clean hostname from a URL string for display in nudge copy */
export function toolDomain(url: string): string {
  try {
    const full = url.startsWith('http') ? url : `https://${url}`
    return new URL(full).hostname
  } catch {
    return url
  }
}

export type NudgeToolType =
  | 'ssl'
  | 'dns'
  | 'security-headers'
  | 'spf-dmarc'
  | 'http-status'
  | 'redirect-chain'
  | 'port'
  | 'robots-txt'
  | 'blacklist'
  | 'speed'

interface MonitorNudgeProps {
  toolType: NudgeToolType
  domain?: string
  /** Extra context to make the message specific — e.g. days remaining, status code, issue count */
  detail?: string
  signupHref?: string
}

interface NudgeCopy {
  headline: string
  sub: string
  cta: string
  icon: string
}

function getCopy(toolType: NudgeToolType, domain: string, detail?: string): NudgeCopy {
  const d = domain || 'this site'
  switch (toolType) {
    case 'ssl':
      return {
        icon: '🔒',
        headline: detail ? `SSL cert expires in ${detail}` : 'SSL certificate found',
        sub: `Get alerted 30 days before ${d}'s certificate expires — before users see the browser warning.`,
        cta: 'Monitor SSL free',
      }
    case 'dns':
      return {
        icon: '🌐',
        headline: 'DNS records can change without warning',
        sub: `Monitor ${d} for DNS changes and get alerted the moment an A, MX, or NS record is modified.`,
        cta: 'Monitor DNS free',
      }
    case 'security-headers':
      return {
        icon: '🛡️',
        headline: detail ? `${detail} security header${detail === '1' ? '' : 's'} missing` : 'Security headers checked',
        sub: `Headers get removed by accident after deployments. Monitor ${d} and catch regressions instantly.`,
        cta: 'Monitor headers free',
      }
    case 'spf-dmarc':
      return {
        icon: '✉️',
        headline: 'Email authentication needs ongoing monitoring',
        sub: `SPF and DMARC records can be removed accidentally. Monitor ${d} to protect against email spoofing.`,
        cta: 'Monitor SPF/DMARC free',
      }
    case 'http-status':
      return {
        icon: '📡',
        headline: detail ? `${d} returned ${detail}` : 'HTTP status checked',
        sub: `One check is a snapshot. Monitor ${d} every minute and get alerted the moment it goes down or returns an error.`,
        cta: 'Monitor uptime free',
      }
    case 'redirect-chain':
      return {
        icon: '↪️',
        headline: detail ? `${detail} redirect${detail === '1' ? '' : 's'} in the chain` : 'Redirect chain traced',
        sub: `Redirects break silently. Monitor ${d} and get notified when the redirect chain changes or loops.`,
        cta: 'Monitor redirects free',
      }
    case 'port':
      return {
        icon: '🔌',
        headline: 'Ports go down without warning',
        sub: `Monitor ${d} ports 24/7 and get an instant alert the moment a critical port becomes unreachable.`,
        cta: 'Monitor ports free',
      }
    case 'robots-txt':
      return {
        icon: '🤖',
        headline: 'robots.txt changes can kill your SEO',
        sub: `A bad deploy can accidentally block Googlebot. Monitor ${d}'s robots.txt and get alerted on any change.`,
        cta: 'Monitor robots.txt free',
      }
    case 'blacklist':
      return {
        icon: '✅',
        headline: domain ? `${d} is clean today` : 'Blacklist check complete',
        sub: 'IP blacklisting can happen suddenly and silently kill email deliverability. Monitor and get alerted the moment it changes.',
        cta: 'Monitor blacklists free',
      }
    case 'speed':
      return {
        icon: '⚡',
        headline: detail ? `TTFB: ${detail}` : 'Speed test complete',
        sub: `A one-time test is a snapshot. Monitor ${d} continuously and catch performance regressions before users notice.`,
        cta: 'Monitor speed free',
      }
  }
}

export function MonitorNudge({ toolType, domain = '', detail, signupHref = '/signup' }: MonitorNudgeProps): React.ReactElement | null {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (dismissed) return null

  const copy = getCopy(toolType, domain, detail)
  const href = `${signupHref}`

  return (
    <div
      style={{
        marginTop: 32,
        borderRadius: 14,
        border: '1px solid var(--border-primary)',
        background: 'var(--bg-card)',
        padding: '20px 22px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        position: 'relative',
      }}
      role="complementary"
      aria-label="Monitor this with Upnotify"
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 4,
        borderRadius: '14px 0 0 14px',
        background: 'var(--brand-gradient)',
      }} />

      {/* Icon */}
      <div style={{
        width: 44, height: 44, flexShrink: 0,
        background: 'var(--brand-gradient-soft)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, marginLeft: 4,
      }}>
        {copy.icon}
      </div>

      {/* Copy */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
          {copy.headline}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 14 }}>
          {copy.sub}
        </div>
        <a
          href={href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--brand-gradient)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            padding: '8px 16px',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          {copy.cta} →
        </a>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: 18,
          lineHeight: 1,
          padding: 4,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

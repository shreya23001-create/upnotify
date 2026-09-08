'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const DISMISSED_KEY = 'uptrue_onboarding_dismissed'

interface OnboardingChecklistProps {
  hasMonitors: boolean
  hasAlertChannels: boolean
  hasStatusPages: boolean
}

export function OnboardingChecklist({ hasMonitors, hasAlertChannels, hasStatusPages }: OnboardingChecklistProps): React.ReactElement | null {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(DISMISSED_KEY) === 'true'
  })
  const [showCongrats, setShowCongrats] = useState(false)

  const allDone = hasMonitors && hasAlertChannels && hasStatusPages

  useEffect(() => {
    if (allDone && !dismissed) {
      const showTimer = setTimeout(() => setShowCongrats(true), 0)
      const hideTimer = setTimeout(() => {
        localStorage.setItem(DISMISSED_KEY, 'true')
        setDismissed(true)
      }, 5000)
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
    }
  }, [allDone, dismissed])

  const handleDismiss = useCallback((): void => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }, [])

  if (dismissed) return null

  const items = [
    { label: 'Create your first monitor', done: hasMonitors, href: '/dashboard/monitors/new' },
    { label: 'Set up an alert channel', done: hasAlertChannels, href: '/dashboard/alerts/new' },
    { label: 'Configure a status page', done: hasStatusPages, href: '/dashboard/status-pages/new' },
  ]

  const completedCount = items.filter(i => i.done).length

  if (showCongrats) {
    return (
      <div className="card" style={{ border: '1px solid var(--success-border, #34d399)', background: 'var(--success-bg, rgba(16, 185, 129, 0.08))' }}>
        <div className="card-content" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u2705'}</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
            All set! You&apos;re ready to go.
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Your monitors, alerts, and status page are configured. Upnotify is now working for you.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="card-title">Getting Started</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {completedCount} of {items.length} completed
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="btn btn-secondary btn-sm"
          style={{ minWidth: 'auto', padding: '4px 8px', fontSize: 16, lineHeight: 1 }}
          aria-label="Dismiss getting started checklist"
        >
          {'\u2715'}
        </button>
      </div>
      <div className="card-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item) => (
            <Link key={item.label} href={item.href} className="checklist-item" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              color: 'var(--text-primary)',
              background: item.done ? 'var(--success-bg, rgba(16, 185, 129, 0.06))' : 'var(--card-bg, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
              transition: 'background 0.15s',
            }}>
              <span style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
                background: item.done ? 'var(--success-text, #059669)' : 'var(--border-color, rgba(255,255,255,0.12))',
                color: item.done ? '#fff' : 'var(--text-secondary)',
              }}>
                {item.done ? '\u2713' : ' '}
              </span>
              <span style={{
                fontSize: 15,
                fontWeight: 500,
                textDecoration: item.done ? 'line-through' : 'none',
                opacity: item.done ? 0.7 : 1,
              }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

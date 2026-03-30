'use client'

import Link from 'next/link'

interface OnboardingChecklistProps {
  hasMonitors: boolean
  hasAlertChannels: boolean
  hasStatusPages: boolean
}

export function OnboardingChecklist({ hasMonitors, hasAlertChannels, hasStatusPages }: OnboardingChecklistProps) {
  if (hasMonitors && hasAlertChannels && hasStatusPages) return null

  const items = [
    { label: 'Create your first monitor', done: hasMonitors, href: '/dashboard/monitors' },
    { label: 'Set up an alert channel', done: hasAlertChannels, href: '/dashboard/alerts' },
    { label: 'Configure a status page', done: hasStatusPages, href: '/dashboard/status-pages' },
  ]

  return (
    <div className="card">
      <div className="card-header"><div className="card-title">Getting Started</div></div>
      <div className="card-content">
        <div className="space-y-sm">
          {items.map((item) => (
            <Link key={item.label} href={item.href} className="checklist-item">
              <span className={`checklist-icon${item.done ? ' done' : ''}`} />
              <span className={item.done ? 'checklist-done' : ''}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

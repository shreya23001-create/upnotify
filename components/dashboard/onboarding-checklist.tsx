'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle } from 'lucide-react'

interface OnboardingChecklistProps {
  hasMonitors: boolean
  hasAlertChannels: boolean
  hasStatusPages: boolean
}

export function OnboardingChecklist({
  hasMonitors,
  hasAlertChannels,
  hasStatusPages,
}: OnboardingChecklistProps) {
  const allDone = hasMonitors && hasAlertChannels && hasStatusPages
  if (allDone) return null

  const items = [
    { label: 'Create your first monitor', done: hasMonitors, href: '/dashboard/monitors' },
    { label: 'Set up an alert channel', done: hasAlertChannels, href: '/dashboard/alerts' },
    { label: 'Configure a status page', done: hasStatusPages, href: '/dashboard/status-pages' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-md p-2 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-zinc-300" />
              )}
              <span className={item.done ? 'text-zinc-400 line-through' : ''}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

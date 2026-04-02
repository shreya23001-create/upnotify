'use client'

import Link from 'next/link'

export const helpTopics = [
  {
    href: '/dashboard/help/getting-started',
    title: 'Getting Started',
    description: 'Create your first monitor, understand your dashboard, and set up alerts in minutes.',
    icon: '🚀',
    keywords: ['start', 'begin', 'first', 'setup', 'new', 'onboard', 'dashboard'],
  },
  {
    href: '/dashboard/help/monitors',
    title: 'Understanding Monitors',
    description: 'Learn about the 10 monitor types, check intervals, two-confirmation checks, and more.',
    icon: '📡',
    keywords: ['monitor', 'http', 'ssl', 'dns', 'ping', 'keyword', 'port', 'api', 'heartbeat', 'check', 'uptime'],
  },
  {
    href: '/dashboard/help/alerts',
    title: 'Setting Up Alerts',
    description: 'Get notified by email, Slack, Teams, or webhooks when something goes wrong.',
    icon: '🔔',
    keywords: ['alert', 'notification', 'email', 'slack', 'teams', 'webhook', 'severity', 'notify'],
  },
  {
    href: '/dashboard/help/status-pages',
    title: 'Public Status Pages',
    description: 'Create a branded page that shows your customers whether your services are up.',
    icon: '🌐',
    keywords: ['status', 'page', 'public', 'subscriber', 'domain', 'branded', 'uptime'],
  },
  {
    href: '/dashboard/help/billing',
    title: 'Plans & Billing',
    description: 'Understand the plans, upgrade or downgrade, and manage your subscription.',
    icon: '💳',
    keywords: ['plan', 'billing', 'price', 'upgrade', 'downgrade', 'subscription', 'free', 'lite', 'builder', 'scale'],
  },
  {
    href: '/dashboard/help/admin-plans',
    title: 'Managing Plans (Admin)',
    description: 'For super admins: edit plan pricing, toggle visibility, and manage credit rules.',
    icon: '🛡️',
    keywords: ['admin', 'plan', 'pricing', 'visibility', 'credits', 'super admin', 'manage'],
  },
]

export function HelpSidebar({ currentPath }: { currentPath: string }): React.ReactElement {
  return (
    <nav className="help-sidebar" aria-label="Help topics navigation">
      <div className="help-sidebar-title">
        <Link href="/dashboard/help">Help Topics</Link>
      </div>
      <ul className="help-sidebar-list">
        {helpTopics.map((topic) => (
          <li key={topic.href}>
            <Link
              href={topic.href}
              className={`help-sidebar-link${currentPath === topic.href ? ' active' : ''}`}
            >
              <span className="help-sidebar-icon">{topic.icon}</span>
              <span>{topic.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

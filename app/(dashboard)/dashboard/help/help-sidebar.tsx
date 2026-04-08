'use client'

import Link from 'next/link'

interface HelpTopic {
  href: string
  title: string
  description: string
  icon: string
  keywords: string[]
  adminOnly?: boolean
}

export const helpTopics: HelpTopic[] = [
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
    href: '/dashboard/help/watchdog',
    title: 'Watchdog — Competitor Tracking',
    description: 'Monitor competitor uptime, compare reliability, and benchmark your performance.',
    icon: '🐕',
    keywords: ['watchdog', 'competitor', 'compare', 'benchmark', 'rival', 'uptime', 'tracking'],
  },
  {
    href: '/dashboard/help/credits',
    title: 'Community Credits',
    description: 'Earn credits towards your bill by embedding badges, referring friends, and more.',
    icon: '🎁',
    keywords: ['credit', 'earn', 'badge', 'referral', 'review', 'bug', 'discount', 'reward'],
  },
  {
    href: '/dashboard/help/referrals',
    title: 'Referral Program',
    description: 'Share your link, earn free months when friends sign up and upgrade.',
    icon: '🤝',
    keywords: ['referral', 'refer', 'invite', 'friend', 'free month', 'share', 'link'],
  },
  {
    href: '/dashboard/help/tools',
    title: 'Free Tools',
    description: 'SSL Checker, Uptime Calculator, and Uptrue Score — free, no signup needed.',
    icon: '🧰',
    keywords: ['tool', 'ssl', 'checker', 'uptime', 'calculator', 'score', 'free'],
  },
  {
    href: '/dashboard/help/ai-visibility',
    title: 'AI Visibility',
    description: 'Generate your llms.txt file, monitor AI citations, and improve your AI search presence with GEO and AEO.',
    icon: '✨',
    keywords: ['ai', 'seo', 'geo', 'aeo', 'llms', 'llms.txt', 'citation', 'visibility', 'chatgpt', 'perplexity', 'gemini', 'ai search'],
  },
  // Compete help hidden — launching in v1.5
  {
    href: '/dashboard/help/incidents',
    title: 'Incidents',
    description: 'Manage outage lifecycle from detection to resolution.',
    icon: '\uD83D\uDEA8',
    keywords: ['incident', 'down', 'outage', 'investigating', 'resolved', 'recovery'],
  },
  {
    href: '/dashboard/help/team',
    title: 'Team & Invites',
    description: 'Invite members, manage roles, and switch organisations.',
    icon: '\uD83D\uDC65',
    keywords: ['team', 'invite', 'member', 'role', 'organisation', 'switch'],
  },
  {
    href: '/dashboard/help/cancel-pause',
    title: 'Cancel or Pause',
    description: 'Pause your subscription for up to 3 months or cancel anytime.',
    icon: '\u23F8\uFE0F',
    keywords: ['cancel', 'pause', 'subscription', 'resume', 'downgrade', 'stop'],
  },
  {
    href: '/dashboard/help/admin-plans',
    title: 'Managing Plans (Admin)',
    description: 'For super admins: edit plan pricing, toggle visibility, and manage credit rules.',
    icon: '\uD83D\uDEE1\uFE0F',
    keywords: ['admin', 'plan', 'pricing', 'visibility', 'credits', 'super admin', 'manage'],
    adminOnly: true,
  },
]

interface HelpSidebarProps {
  currentPath: string
  isSuperAdmin?: boolean
}

export function HelpSidebar({ currentPath, isSuperAdmin = false }: HelpSidebarProps): React.ReactElement {
  const visibleTopics = helpTopics.filter(topic => !topic.adminOnly || isSuperAdmin)

  return (
    <nav className="help-sidebar" aria-label="Help topics navigation">
      <div className="help-sidebar-title">
        <Link href="/dashboard/help">Help Topics</Link>
      </div>
      <ul className="help-sidebar-list">
        {visibleTopics.map((topic) => (
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

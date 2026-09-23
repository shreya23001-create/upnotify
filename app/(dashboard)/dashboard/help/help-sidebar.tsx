'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { IconWordpress } from '@/components/icons'

export { IconWordpress as WordPressIcon }

interface HelpTopic {
  href: string
  title: string
  description: string
  icon: React.ReactElement | '__wp__'
  keywords: string[]
  adminOnly?: boolean
}

export const helpTopics: HelpTopic[] = [
  {
    href: '/dashboard/help/getting-started',
    title: 'Getting Started',
    description: 'Create your first monitor, understand your dashboard, and set up alerts in minutes.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    keywords: ['start', 'begin', 'first', 'setup', 'new', 'onboard', 'dashboard'],
  },
  {
    href: '/dashboard/help/monitors',
    title: 'Understanding Monitors',
    description: 'Learn about all 24 monitor types, check intervals, two-confirmation checks, and more.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    keywords: ['monitor', 'http', 'ssl', 'dns', 'ping', 'keyword', 'port', 'api', 'heartbeat', 'check', 'uptime'],
  },
  {
    href: '/dashboard/help/alerts',
    title: 'Setting Up Alerts',
    description: 'Get notified by email, Slack, Teams, or webhooks when something goes wrong.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    keywords: ['alert', 'notification', 'email', 'slack', 'teams', 'webhook', 'severity', 'notify'],
  },
  {
    href: '/dashboard/help/status-pages',
    title: 'Public Status Pages',
    description: 'Create a branded page that shows your customers whether your services are up.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    keywords: ['status', 'page', 'public', 'subscriber', 'domain', 'branded', 'uptime'],
  },
  {
    href: '/dashboard/help/billing',
    title: 'Plans & Billing',
    description: 'Understand the plans, upgrade or downgrade, and manage your subscription.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    keywords: ['plan', 'billing', 'price', 'upgrade', 'downgrade', 'subscription', 'free', 'lite', 'builder', 'scale'],
  },
  {
    href: '/dashboard/help/credits',
    title: 'Community Credits',
    description: 'Earn credits towards your bill by embedding badges, referring friends, and more.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    keywords: ['credit', 'earn', 'badge', 'referral', 'review', 'bug', 'discount', 'reward'],
  },
  {
    href: '/dashboard/help/referrals',
    title: 'Referral Program',
    description: 'Share your link, earn free months when friends sign up and upgrade.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    keywords: ['referral', 'refer', 'invite', 'friend', 'free month', 'share', 'link'],
  },
  {
    href: '/dashboard/help/tools',
    title: 'Free Tools',
    description: 'SSL Checker, Uptime Calculator, and Upnotify Score — free, no signup needed.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    keywords: ['tool', 'ssl', 'checker', 'uptime', 'calculator', 'score', 'free'],
  },
  {
    href: '/dashboard/help/ai-visibility',
    title: 'AI Visibility',
    description: 'Generate your llms.txt file, monitor AI citations, and improve your AI search presence.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>,
    keywords: ['ai', 'seo', 'geo', 'aeo', 'llms', 'llms.txt', 'citation', 'visibility', 'chatgpt', 'perplexity', 'gemini', 'ai search'],
  },
  {
    href: '/dashboard/help/ai-profile',
    title: 'AI Profile',
    description: 'Discover what AI engines actually think your site is. Find miscategorisations and knowledge gaps.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6a6 6 0 1 0 6 6"/><circle cx="12" cy="12" r="2"/></svg>,
    keywords: ['ai', 'profile', 'introspection', 'category', 'recognition', 'awareness', 'chatgpt', 'claude', 'gemini', 'perplexity'],
  },
  {
    href: '/dashboard/help/incidents',
    title: 'Incidents',
    description: 'Manage outage lifecycle from detection to resolution.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    keywords: ['incident', 'down', 'outage', 'investigating', 'resolved', 'recovery'],
  },
  {
    href: '/dashboard/help/cancel-pause',
    title: 'Cancel or Pause',
    description: 'Pause your subscription for up to 3 months or cancel anytime.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>,
    keywords: ['cancel', 'pause', 'subscription', 'resume', 'downgrade', 'stop'],
  },
  {
    href: '/dashboard/help/admin-plans',
    title: 'Managing Plans (Admin)',
    description: 'For super admins: edit plan pricing, toggle visibility, and manage credit rules.',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    keywords: ['admin', 'plan', 'pricing', 'visibility', 'credits', 'super admin', 'manage'],
    adminOnly: true,
  },
]

interface HelpSidebarProps {
  currentPath: string
  isSuperAdmin?: boolean
}

interface SidebarSection {
  label: string
  topics: HelpTopic[]
}

function buildSections(topics: HelpTopic[]): SidebarSection[] {
  const monitoring = ['getting-started', 'monitors', 'alerts', 'status-pages', 'incidents']
  const features   = ['ai-visibility', 'ai-profile', 'tools', 'compete']
  const account    = ['billing', 'credits', 'referrals', 'cancel-pause']

  function slug(href: string) { return href.split('/').pop() ?? '' }

  return [
    { label: 'Monitoring', topics: topics.filter(t => monitoring.includes(slug(t.href))) },
    { label: 'Features',   topics: topics.filter(t => features.includes(slug(t.href))) },
    { label: 'Account',    topics: topics.filter(t => account.includes(slug(t.href))) },
    { label: 'Admin',      topics: topics.filter(t => t.adminOnly) },
  ].filter(s => s.topics.length > 0)
}

export function HelpSidebar({ currentPath, isSuperAdmin = false }: HelpSidebarProps): React.ReactElement {
  const visibleTopics = helpTopics.filter(topic => !topic.adminOnly || isSuperAdmin)
  const sections = buildSections(visibleTopics)

  return (
    <nav className="help-sidebar" aria-label="Help topics navigation">
      <div className="help-sidebar-brand">
        <div className="help-sidebar-brand-icon">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <Link href="/dashboard/help" className="help-sidebar-brand-label">Help Center</Link>
      </div>
      {sections.map((section, i) => (
        <Fragment key={section.label}>
          {i > 0 && <span className="help-sidebar-divider" aria-hidden="true" />}
          {section.topics.map((topic) => (
            <Link
              key={topic.href}
              href={topic.href}
              className={`help-sidebar-link${currentPath === topic.href ? ' active' : ''}`}
            >
              <span className="help-sidebar-icon">
                {topic.icon === '__wp__' ? <IconWordpress size={15} /> : topic.icon}
              </span>
              <span>{topic.title}</span>
            </Link>
          ))}
        </Fragment>
      ))}
    </nav>
  )
}

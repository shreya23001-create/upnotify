/**
 * The sidebar tabs a member's access can be restricted to. Must stay in
 * sync with components/dashboard/sidebar.tsx's mainNavItems/secondaryNavItems
 * hrefs and the requireTabAccess() guard calls in each page.tsx — see
 * lib/auth/require-tab-access.ts.
 */
export interface TabAccessOption {
  href: string
  label: string
  /** lucide-react icon name, matching the sidebar's icon for this tab. */
  icon: 'dashboard' | 'activity' | 'alertTriangle' | 'globe' | 'trendingUp' | 'inbox' | 'settings' | 'helpCircle'
  sensitive?: boolean
}

export const TAB_ACCESS_OPTIONS: TabAccessOption[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/dashboard/monitors', label: 'Monitors', icon: 'activity' },
  { href: '/dashboard/alerts', label: 'Alert Channels', icon: 'alertTriangle' },
  { href: '/dashboard/incidents', label: 'Incidents', icon: 'alertTriangle' },
  { href: '/dashboard/status-pages', label: 'Status Pages', icon: 'globe' },
  { href: '/dashboard/reports', label: 'Reports', icon: 'trendingUp' },
  { href: '/dashboard/support', label: 'Support', icon: 'inbox' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'settings', sensitive: true },
  { href: '/dashboard/help', label: 'Help', icon: 'helpCircle' },
]

/** Tabs checked by default for a new Member — Settings is deliberately
 *  excluded since it holds billing/company info and requires explicit
 *  opt-in by the admin creating the account. */
export const DEFAULT_MEMBER_ACCESS: string[] = TAB_ACCESS_OPTIONS
  .map(t => t.href)
  .filter(href => href !== '/dashboard/settings')

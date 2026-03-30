'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Activity,
  Globe,
  FileText,
  Bell,
  Building2,
  Settings,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { useAuth } from '@/components/providers/auth-provider'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/monitors', label: 'Monitors', icon: Activity },
  { href: '/dashboard/status-pages', label: 'Status Pages', icon: Globe },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAgency } = useWorkspace()
  const { user } = useAuth()

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 md:block">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
          <Link href="/dashboard" className="text-lg font-bold">
            Uptrue
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {isAgency && (
            <NavLink
              href="/dashboard/clients"
              label="Clients"
              icon={Building2}
              isActive={pathname.startsWith('/dashboard/clients')}
            />
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)
              }
            />
          ))}
          {user?.is_super_admin && (
            <NavLink
              href="/admin"
              label="Admin"
              icon={Shield}
              isActive={pathname.startsWith('/admin')}
            />
          )}
        </nav>
      </div>
    </aside>
  )
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

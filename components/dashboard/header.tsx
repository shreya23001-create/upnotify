'use client'

import { Menu, LogOut, Settings } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/components/providers/auth-provider'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { WorkspaceSwitcher } from './workspace-switcher'
import { Sidebar } from './sidebar'
import Link from 'next/link'

export function Header() {
  const { user, signOut } = useAuth()
  const { organisation } = useWorkspace()

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <header className="flex h-14 items-center gap-4 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950 md:px-6">
      <Sheet>
        <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex-1">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {organisation?.name}
        </span>
      </div>

      <WorkspaceSwitcher />

      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.full_name ?? 'User'}</p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link href="/dashboard/settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { requireActivatedOrg } from '@/lib/auth/require-activated-org'
import { requireTabAccess } from '@/lib/auth/require-tab-access'
import './help.css'

export const metadata: Metadata = {
  title: 'Help Center — Upnotify',
  description: 'Learn how to monitor your websites, set up alerts, create status pages, and manage your Upnotify account.',
}

export default async function HelpLayout({ children }: { children: React.ReactNode }): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await requireActivatedOrg(user.org_id)
  requireTabAccess(user, '/dashboard/help')

  return <>{children}</>
}

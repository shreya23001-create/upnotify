export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user || !user.is_super_admin) {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-zinc-900 px-6 text-white dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-lg font-bold">
            Uptrue Admin
          </Link>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-300 hover:text-white"
        >
          Back to Dashboard
        </Link>
      </header>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}

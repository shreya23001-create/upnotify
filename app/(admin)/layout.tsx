export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || !user.is_super_admin) redirect('/dashboard')

  return (
    <div>
      <header className="admin-header">
        <Link href="/admin">Uptrue Admin</Link>
        <Link href="/dashboard" className="admin-header-back">Back to Dashboard</Link>
      </header>
      <main className="main-content">{children}</main>
    </div>
  )
}

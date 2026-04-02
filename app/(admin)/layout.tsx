export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  // Temporarily log admin check for debugging
  if (!user) redirect('/login')
  if (!user.is_super_admin) {
    // Debug: redirect to a specific URL so we can tell this is the source
    redirect('/dashboard?blocked=admin-layout&email=' + encodeURIComponent(user.email) + '&is_super_admin=' + user.is_super_admin)
  }

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

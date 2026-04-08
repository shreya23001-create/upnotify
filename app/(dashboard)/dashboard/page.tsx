import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/db/users'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 16 }}>
      I have removed everything from there
    </div>
  )
}

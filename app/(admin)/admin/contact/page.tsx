import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { ContactMessagesContent } from '@/components/admin/contact-messages-content'

export const metadata = { title: 'Contact Messages — Admin' }

export default async function AdminContactPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user || !await canAccessAdminModule(user.email, !!user.is_super_admin, 'system')) {
    redirect('/admin')
  }

  return (
    <div className="space-y">
      <h1 className="admin-page-title">Contact Messages</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Messages submitted via the contact form. Verified messages appear in Inbox; unconfirmed emails go to Spam.
      </p>
      <ContactMessagesContent />
    </div>
  )
}

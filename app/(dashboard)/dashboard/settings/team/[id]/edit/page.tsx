import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserById } from '@/lib/db/users'
import { requireActivatedOrg } from '@/lib/auth/require-activated-org'
import { requireTabAccess } from '@/lib/auth/require-tab-access'
import { TeamMemberForm } from '@/components/dashboard/settings/team-member-form'

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await requireActivatedOrg(user.org_id)
  requireTabAccess(user, '/dashboard/settings')

  const canManageTeam = user.role === 'admin' || user.is_super_admin
  if (!canManageTeam) redirect('/dashboard/settings?tab=team')

  const { id } = await params
  const member = await getUserById(id)
  if (!member || member.org_id !== user.org_id) notFound()

  return (
    <div className="db-content tmf-page">
      <div className="tmf-page-inner">
        <nav className="breadcrumbs tmf-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/dashboard/settings?tab=team" className="breadcrumb-link">Team</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{member.full_name ?? member.email}</span>
        </nav>

        <div className="tmf-card">
          <TeamMemberForm editingMember={member} />
        </div>
      </div>
    </div>
  )
}

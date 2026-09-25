import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { requireActivatedOrg } from '@/lib/auth/require-activated-org'
import { requireTabAccess } from '@/lib/auth/require-tab-access'
import { TeamMemberForm } from '@/components/dashboard/settings/team-member-form'

export default async function NewTeamMemberPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await requireActivatedOrg(user.org_id)
  requireTabAccess(user, '/dashboard/settings')

  const canManageTeam = user.role === 'admin' || user.is_super_admin
  if (!canManageTeam) redirect('/dashboard/settings?tab=team')

  return (
    <div className="db-content tmf-page">
      <div className="tmf-page-inner">
        <nav className="breadcrumbs tmf-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/dashboard/settings?tab=team" className="breadcrumb-link">Team</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Add Member</span>
        </nav>

        <div className="tmf-card">
          <TeamMemberForm />
        </div>
      </div>
    </div>
  )
}

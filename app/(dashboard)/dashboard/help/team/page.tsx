'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { HelpSidebar } from '../help-sidebar'

export default function HelpTeamPage(): React.ReactElement {
  const pathname = usePathname()
  return (
    <div className="help-layout">
      <HelpSidebar currentPath={pathname} />
      <article className="help-content">
        <h1 className="help-title">Team &amp; Invites</h1>
        <p className="help-intro">Invite team members to your organisation so they can view monitors, manage alerts, and collaborate on incident response.</p>

        <section className="help-section">
          <h2>Inviting Team Members</h2>
          <ol>
            <li>Go to <Link href="/dashboard/settings?tab=team">Settings &gt; Team</Link></li>
            <li>Enter the email address and select a role (admin or member)</li>
            <li>Click <strong>Send Invite</strong></li>
            <li>The person receives an email with an accept link</li>
            <li>Once accepted, they join your organisation and can access the dashboard</li>
          </ol>
          <p>If the person already has an Uptrue account, they also get an in-app notification.</p>
        </section>

        <section className="help-section">
          <h2>Roles</h2>
          <ul>
            <li><strong>Admin</strong> — full access: create monitors, manage alerts, invite members, manage billing</li>
            <li><strong>Member</strong> — can view monitors, acknowledge incidents, but cannot change settings or billing</li>
            <li><strong>Viewer</strong> — read-only access to the dashboard</li>
          </ul>
        </section>

        <section className="help-section">
          <h2>Team Member Limits</h2>
          <p>The number of team members you can invite depends on your plan. Check <Link href="/dashboard/settings?tab=billing">Settings &gt; Billing</Link> to see your current limit. If you need more, upgrade your plan.</p>
        </section>

        <section className="help-section">
          <h2>Switching Organisations</h2>
          <p>If you accept an invite to another organisation, you will be moved to that organisation. A banner will appear at the top of your dashboard with a button to switch back to your original organisation at any time.</p>
        </section>

        <section className="help-section">
          <h2>Removing Team Members</h2>
          <p>Admins can remove team members from <strong>Settings &gt; Team</strong>. Removed members lose access immediately but their data contributions (incidents, notes) are preserved.</p>
        </section>
      </article>
    </div>
  )
}

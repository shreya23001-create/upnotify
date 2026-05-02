import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule, canWriteAdminModule } from '@/lib/db/admin-roles'
import { getAllTickets, countTicketsByStatus } from '@/lib/db/support'
import type { TicketFilter } from '@/lib/db/support'

export const metadata: Metadata = { title: 'Support Tickets — Admin' }

const STATUS_LABEL: Record<string, string> = {
  open:            'Open',
  in_progress:     'In Progress',
  waiting_on_user: 'Waiting',
  resolved:        'Resolved',
  closed:          'Closed',
}

const STATUS_CLASS: Record<string, string> = {
  open:            'support-badge-open',
  in_progress:     'support-badge-progress',
  waiting_on_user: 'support-badge-waiting',
  resolved:        'support-badge-resolved',
  closed:          'support-badge-closed',
}

const PRIORITY_CLASS: Record<string, string> = {
  urgent: 'support-priority-urgent',
  high:   'support-priority-high',
  normal: 'support-priority-normal',
  low:    'support-priority-low',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface PageProps {
  searchParams: Promise<{ status?: string; priority?: string }>
}

export default async function AdminSupportPage({ searchParams }: PageProps): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isSuperAdmin = !!user.is_super_admin
  const [canRead, canWrite] = await Promise.all([
    canAccessAdminModule(user.email, isSuperAdmin, 'support'),
    canWriteAdminModule(user.email, isSuperAdmin, 'support'),
  ])
  if (!canRead) redirect('/admin')

  const { status: statusFilter, priority: priorityFilter } = await searchParams

  const [tickets, counts] = await Promise.all([
    getAllTickets({
      status:   (statusFilter   ?? 'all') as TicketFilter['status'],
      priority: (priorityFilter ?? 'all') as TicketFilter['priority'],
      limit:    100,
    }),
    countTicketsByStatus(),
  ])

  const activeFilter = statusFilter ?? 'all'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">All customer support requests</p>
        </div>
        {!canWrite && (
          <span className="badge badge-outline" style={{ fontSize: 12 }}>Read only</span>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="support-admin-tabs">
        {[
          { key: 'all',            label: 'All',        count: Object.values(counts).reduce((a, b) => a + b, 0) },
          { key: 'open',           label: 'Open',       count: counts.open },
          { key: 'in_progress',    label: 'In Progress',count: counts.in_progress },
          { key: 'waiting_on_user',label: 'Waiting',    count: counts.waiting_on_user },
          { key: 'resolved',       label: 'Resolved',   count: counts.resolved },
          { key: 'closed',         label: 'Closed',     count: counts.closed },
        ].map(tab => (
          <Link
            key={tab.key}
            href={`/admin/support${tab.key !== 'all' ? `?status=${tab.key}` : ''}`}
            className={`support-admin-tab${activeFilter === tab.key ? ' active' : ''}`}
          >
            {tab.label}
            {tab.count > 0 && <span className="support-admin-tab-count">{tab.count}</span>}
          </Link>
        ))}
      </div>

      {/* Tickets table */}
      {tickets.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No tickets match this filter.
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="support-admin-table-wrap">
            <table className="support-admin-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Category</th>
                  <th>Msgs</th>
                  <th>Assigned</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>
                      <Link href={`/admin/support/${ticket.id}`} className="support-admin-subject-link">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={`/admin/user360?org_id=${ticket.org_id}`}
                        className="support-customer360-link"
                        title="View Customer 360"
                      >
                        <span className="support-customer360-name">
                          {ticket.org_name ?? 'Unknown'}
                        </span>
                        <span className="support-customer360-badge">360</span>
                      </Link>
                    </td>
                    <td>
                      <span className={`support-badge ${STATUS_CLASS[ticket.status] ?? ''}`}>
                        {STATUS_LABEL[ticket.status] ?? ticket.status}
                      </span>
                    </td>
                    <td>
                      <span className={`support-priority-pill ${PRIORITY_CLASS[ticket.priority] ?? ''}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {ticket.category.replace(/_/g, ' ')}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      {ticket.message_count}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {ticket.assigned_to ?? '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {timeAgo(ticket.updated_at)}
                      {ticket.last_reply_by === 'user' && (
                        <span className="support-needs-reply">● needs reply</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

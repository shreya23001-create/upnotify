'use client'

import { useState, useEffect, useCallback } from 'react'

interface TeamInvite {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
}

interface TeamInviteFormProps {
  canInvite: boolean
  teamMemberLimit: number
  teamMemberCount: number
  onInviteSent: () => void
}

export function TeamInviteForm({
  canInvite,
  teamMemberLimit,
  teamMemberCount,
  onInviteSent,
}: TeamInviteFormProps): React.ReactElement {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)

  const fetchInvites = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/v1/team')
      const data = (await res.json()) as { invites?: TeamInvite[] }
      if (data.invites) {
        setInvites(data.invites)
      }
    } catch {
      // Silently fail — invites are supplementary info
    } finally {
      setLoadingInvites(false)
    }
  }, [])

  useEffect(() => {
    void fetchInvites()
  }, [fetchInvites])

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/v1/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, role }),
      })
      const data = (await res.json()) as { error?: string; invite?: TeamInvite }

      if (!res.ok) {
        setError(data.error ?? 'Failed to send invite.')
        return
      }

      setSuccess(`Invite sent to ${trimmedEmail}.`)
      setEmail('')
      setRole('member')
      onInviteSent()

      // Refresh invites list
      void fetchInvites()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email, role, onInviteSent, fetchInvites])

  const handleCancelInvite = useCallback(async (inviteId: string): Promise<void> => {
    try {
      const res = await fetch('/api/v1/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      })
      if (res.ok) {
        // Keep the row visible with an updated status rather than removing
        // it — this list shows full invite history, not just pending ones.
        setInvites((prev) => prev.map((inv) => inv.id === inviteId ? { ...inv, status: 'cancelled' } : inv))
      }
    } catch {
      // Silently fail
    }
  }, [])

  if (!canInvite) {
    return (
      <p className="stt-upgrade-notice">
        {teamMemberLimit === 0
          ? 'Your current plan does not include team members. Upgrade to add teammates.'
          : `Team member limit reached (${teamMemberCount - 1}/${teamMemberLimit}). Upgrade your plan to invite more members.`}
      </p>
    )
  }

  return (
    <div>
      <form className="stt-invite-form" onSubmit={(e) => { void handleSubmit(e) }}>
        <div className="form-group stt-invite-field-email">
          <label className="form-label" htmlFor="invite-email">Email Address</label>
          <input
            id="invite-email"
            className="form-input"
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group stt-invite-field-role">
          <label className="form-label" htmlFor="invite-role">Role</label>
          <select
            id="invite-role"
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          className="stt-save-btn stt-invite-submit"
          disabled={loading}
        >
          {loading ? 'Sending…' : '+ Invite Member'}
        </button>
      </form>

      {teamMemberLimit > 0 && (
        <p className="stt-invite-hint">
          {teamMemberCount - 1} of {teamMemberLimit} team member slots used (excludes owner).
        </p>
      )}

      {error && <p className="stt-invite-error">{error}</p>}
      {success && <p className="stt-invite-success">{success}</p>}

      {/* Invited members section — full history, not just currently pending */}
      {!loadingInvites && invites.length > 0 && (
        <div className="stt-subsection stt-invite-history">
          <div className="stt-subsection-label">Invited Members</div>
          <div className="stt-invite-list">
            {invites.map((inv) => {
              const isExpired = inv.status === 'pending' && new Date(inv.expires_at) < new Date()
              const displayStatus = isExpired ? 'expired' : inv.status
              const STATUS_CLASS: Record<string, string> = {
                pending: 'stt-invite-status--pending',
                accepted: 'stt-invite-status--accepted',
                cancelled: 'stt-invite-status--cancelled',
                expired: 'stt-invite-status--expired',
              }
              const STATUS_LABEL: Record<string, string> = {
                pending: 'Pending',
                accepted: 'Accepted',
                cancelled: 'Cancelled',
                expired: 'Expired',
              }
              const canCancel = inv.status === 'pending' && !isExpired

              return (
                <div key={inv.id} className="stt-invite-row">
                  <div className="stt-invite-row-main">
                    <span className="stt-invite-email">{inv.email}</span>
                    <span className="badge badge-outline stt-invite-role-badge">{inv.role}</span>
                    <span className={`stt-invite-status ${STATUS_CLASS[displayStatus] ?? STATUS_CLASS.pending}`}>
                      {STATUS_LABEL[displayStatus] ?? STATUS_LABEL.pending}
                    </span>
                  </div>
                  <div className="stt-invite-row-meta">
                    <span className="stt-invite-date">
                      {inv.status === 'pending'
                        ? `Expires ${new Date(inv.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                        : `Sent ${new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                    </span>
                    {canCancel && (
                      <button
                        className="btn btn-ghost btn-sm stt-invite-cancel-btn"
                        onClick={() => { void handleCancelInvite(inv.id) }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

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
        setInvites((prev) => prev.filter((inv) => inv.id !== inviteId))
      }
    } catch {
      // Silently fail
    }
  }, [])

  if (!canInvite) {
    return (
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-muted)',
        borderRadius: 8,
        border: '1px solid var(--border-primary)',
        marginBottom: 16,
      }}>
        {teamMemberLimit === 0
          ? 'Your current plan does not include team members. Upgrade to add teammates.'
          : `Team member limit reached (${teamMemberCount - 1}/${teamMemberLimit}). Upgrade your plan to invite more members.`}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <form className="team-invite-form" onSubmit={(e) => { void handleSubmit(e) }}>
        <div className="team-invite-field" style={{ flex: 2 }}>
          <label htmlFor="invite-email">Email Address</label>
          <input
            id="invite-email"
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="team-invite-field" style={{ flex: 1, minWidth: 140 }}>
          <label htmlFor="invite-role">Role</label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={loading}
          style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}
        >
          {loading ? 'Sending...' : '+ Invite Member'}
        </button>
      </form>

      {teamMemberLimit > 0 && (
        <p className="team-limit-notice">
          {teamMemberCount - 1} of {teamMemberLimit} team member slots used (excludes owner).
        </p>
      )}

      {error && (
        <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</p>
      )}
      {success && (
        <p style={{ color: '#059669', fontSize: 13, marginTop: 8 }}>{success}</p>
      )}

      {/* Pending invites section */}
      {!loadingInvites && invites.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 12,
          }}>
            Pending Invites
          </h4>
          <div style={{
            border: '1px solid var(--border-primary)',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            {invites.map((inv, index) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderTop: index > 0 ? '1px solid var(--border-primary)' : 'none',
                  background: 'var(--bg-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                    {inv.email}
                  </span>
                  <span
                    className="badge badge-outline"
                    style={{ textTransform: 'capitalize', fontSize: 11 }}
                  >
                    {inv.role}
                  </span>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                  }}>
                    Pending
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Expires {new Date(inv.expires_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#ef4444', fontSize: 13 }}
                    onClick={() => { void handleCancelInvite(inv.id) }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

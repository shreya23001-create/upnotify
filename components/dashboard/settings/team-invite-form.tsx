'use client'

import { useState, useCallback } from 'react'
import type { User } from '@/lib/types'

interface TeamInviteFormProps {
  canInvite: boolean
  teamMemberLimit: number
  teamMemberCount: number
  onMemberAdded: (member: User) => void
}

export function TeamInviteForm({
  canInvite,
  teamMemberLimit,
  teamMemberCount,
  onMemberAdded,
}: TeamInviteFormProps): React.ReactElement {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      const data: Record<string, unknown> = await res.json()

      if (!res.ok) {
        setError((data.error as string) || 'Failed to invite team member.')
        return
      }

      setSuccess(`${trimmedEmail} has been added to the team.`)
      setEmail('')
      setRole('member')

      if (data.user) {
        onMemberAdded(data.user as User)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email, role, onMemberAdded])

  if (!canInvite) {
    return (
      <div className="team-limit-notice" style={{ padding: '12px 16px', background: 'var(--bg-muted)', borderRadius: 8, border: '1px solid var(--border-primary)', marginBottom: 16 }}>
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
          {loading ? 'Adding...' : '+ Invite Member'}
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
    </div>
  )
}

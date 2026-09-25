'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, RefreshCw, User as UserIcon, Mail, Lock,
  UserCog, ShieldCheck, Plus, LayoutDashboard, Activity,
  AlertTriangle, Globe, TrendingUp, Inbox, Settings as SettingsIcon,
  HelpCircle,
} from 'lucide-react'
import type { User } from '@/lib/types'
import { TAB_ACCESS_OPTIONS, DEFAULT_MEMBER_ACCESS, type TabAccessOption } from '@/lib/constants/tab-access'

interface TeamMemberFormProps {
  /** When set, the form edits this existing member's role/access instead
   *  of creating a new account — name/email/password become read-only. */
  editingMember?: User | null
}

const TAB_ICON: Record<TabAccessOption['icon'], React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  dashboard: LayoutDashboard,
  activity: Activity,
  alertTriangle: AlertTriangle,
  globe: Globe,
  trendingUp: TrendingUp,
  inbox: Inbox,
  settings: SettingsIcon,
  helpCircle: HelpCircle,
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  let out = ''
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function passwordStrength(pw: string): { pct: number; label: string; className: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  const levels = [
    { pct: 25, label: 'Weak', className: 'weak' },
    { pct: 50, label: 'Fair', className: 'fair' },
    { pct: 75, label: 'Good', className: 'good' },
    { pct: 100, label: 'Strong', className: 'strong' },
  ]
  return levels[Math.max(0, score - 1)] ?? levels[0]
}

export function TeamMemberForm({ editingMember }: TeamMemberFormProps): React.ReactElement {
  const router = useRouter()
  const isEditing = Boolean(editingMember)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [access, setAccess] = useState<string[]>(DEFAULT_MEMBER_ACCESS)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editingMember) {
      const existingAccess = (editingMember as unknown as { tab_access?: string[] | null }).tab_access
      const existingRole: 'member' | 'admin' = editingMember.role === 'admin' ? 'admin' : 'member'
      setName(editingMember.full_name ?? '')
      setEmail(editingMember.email)
      setRole(existingRole)
      setAccess(existingRole === 'admin' ? TAB_ACCESS_OPTIONS.map(t => t.href) : (existingAccess ?? DEFAULT_MEMBER_ACCESS))
    } else {
      setPassword(generatePassword())
    }
  }, [editingMember])

  // Role = Admin auto-checks every tab (still editable); switching back to
  // Member resets to the sensible default (only on a fresh create — editing
  // an existing member's picks isn't reset just by toggling the pill twice).
  const handleRoleChange = useCallback((next: 'member' | 'admin'): void => {
    setRole(next)
    if (next === 'admin') {
      setAccess(TAB_ACCESS_OPTIONS.map(t => t.href))
    } else if (!isEditing) {
      setAccess(DEFAULT_MEMBER_ACCESS)
    }
  }, [isEditing])

  const toggleAccess = useCallback((href: string): void => {
    setAccess(prev => prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href])
  }, [])

  const selectAll = useCallback((): void => setAccess(TAB_ACCESS_OPTIONS.map(t => t.href)), [])
  const clearAll = useCallback((): void => setAccess([]), [])

  const isValid = useMemo(() => {
    if (isEditing) return access.length > 0
    return name.trim().length >= 2 && email.includes('@') && password.length >= 8 && access.length > 0
  }, [isEditing, name, email, password, access])

  const strength = useMemo(() => passwordStrength(password), [password])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      if (isEditing && editingMember) {
        const res = await fetch('/api/v1/team/create-member', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: editingMember.id, role, access }),
        })
        const data = await res.json() as { error?: string }
        if (!res.ok) {
          setError(data.error ?? 'Failed to update member.')
          return
        }
      } else {
        const res = await fetch('/api/v1/team/create-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role, access }),
        })
        const data = await res.json() as { error?: string }
        if (!res.ok) {
          setError(data.error ?? 'Failed to add team member.')
          return
        }
      }
      router.push('/dashboard/settings?tab=team')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="tmf" onSubmit={(e) => { void handleSubmit(e) }}>
      {error && <div className="form-error" style={{ margin: '0 28px' }}>{error}</div>}

      {/* ── Basic Info ── */}
      <div className="tmf-section">
        <div className="tmf-section-label">Basic Info</div>

        <div className="tmf-row-2">
          <div className="form-group">
            <label className="form-label" htmlFor="member-name">Name</label>
            <div className="tmf-input-icon-wrap">
              <UserIcon size={14} strokeWidth={2} className="tmf-input-icon" />
              <input
                id="member-name"
                className="form-input tmf-input-with-icon"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                disabled={isEditing}
                placeholder="e.g. Priya Sharma"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <div className="tmf-role-toggle">
              <div className={`tmf-role-slider${role === 'admin' ? ' tmf-role-slider--admin' : ''}`} />
              <button
                type="button"
                className={`tmf-role-option${role === 'member' ? ' active' : ''}`}
                onClick={() => handleRoleChange('member')}
              >
                <UserCog size={14} strokeWidth={2.25} /> Member
              </button>
              <button
                type="button"
                className={`tmf-role-option${role === 'admin' ? ' active' : ''}`}
                onClick={() => handleRoleChange('admin')}
              >
                <ShieldCheck size={14} strokeWidth={2.25} /> Admin
              </button>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="form-group">
            <label className="form-label" htmlFor="member-email">Email</label>
            <div className="tmf-input-icon-wrap">
              <Mail size={14} strokeWidth={2} className="tmf-input-icon" />
              <input
                id="member-email"
                type="email"
                className="form-input tmf-input-with-icon"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isEditing}
                placeholder="colleague@company.com"
              />
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="tmf-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="member-email">Email</label>
              <div className="tmf-input-icon-wrap">
                <Mail size={14} strokeWidth={2} className="tmf-input-icon" />
                <input
                  id="member-email"
                  type="email"
                  className="form-input tmf-input-with-icon"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="colleague@company.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="member-password">Password</label>
              <div className="invite-password-row">
                <div className="tmf-input-icon-wrap" style={{ flex: 1 }}>
                  <Lock size={14} strokeWidth={2} className="tmf-input-icon" />
                  <input
                    id="member-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input tmf-input-with-icon"
                    style={{ paddingRight: 36 }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="invite-password-toggle"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPassword(generatePassword())}
                  title="Generate a new password"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              <div className="tmf-strength">
                <div className="tmf-strength-track">
                  <div className={`tmf-strength-fill tmf-strength-fill--${strength.className}`} style={{ width: `${strength.pct}%` }} />
                </div>
                <span className={`tmf-strength-label tmf-strength-label--${strength.className}`}>{strength.label}</span>
              </div>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="tmf-callout">
            <Mail size={13} strokeWidth={2} />
            <span>This password (and the login link) will be emailed to the member.</span>
          </div>
        )}
      </div>

      {/* ── Access Permissions ── */}
      <div className="tmf-section">
        <div className="tmf-section-label">Permissions</div>

        <div className="form-group">
          <div className="tmf-access-header">
            <label className="form-label" style={{ margin: 0 }}>Access</label>
            {role === 'member' && (
              <span className="tmf-access-count">{access.length} of {TAB_ACCESS_OPTIONS.length} permissions selected</span>
            )}
            {role === 'member' && (
              <div className="tmf-access-quick-actions">
                <button type="button" onClick={selectAll}>Select All</button>
                <span>·</span>
                <button type="button" onClick={clearAll}>Clear All</button>
              </div>
            )}
          </div>

          {role === 'admin' ? (
            <div className="tmf-callout tmf-callout--info" style={{ marginTop: 8 }}>
              <ShieldCheck size={13} strokeWidth={2} />
              <span>Admins always have access to every tab.</span>
            </div>
          ) : (
            <div className="tmf-access-grid">
              {TAB_ACCESS_OPTIONS.map(opt => {
                const Icon = TAB_ICON[opt.icon]
                const checked = access.includes(opt.href)
                return (
                  <label key={opt.href} className={`tmf-access-row${checked ? ' checked' : ''}`}>
                    <span className="tmf-access-row-icon"><Icon size={15} strokeWidth={2} /></span>
                    <span className="tmf-access-row-label">
                      {opt.label}
                      {opt.sensitive && <span className="tmf-access-restricted-tag"><Lock size={9} strokeWidth={2.5} /> Restricted</span>}
                    </span>
                    <span className="tmf-switch">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAccess(opt.href)}
                      />
                      <span className="tmf-switch-track"><span className="tmf-switch-thumb" /></span>
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="tmf-footer">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/settings?tab=team')} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="stt-save-btn" disabled={!isValid || submitting}>
          {submitting ? (
            <span className="tmf-spinner" />
          ) : (
            <Plus size={14} strokeWidth={2.5} />
          )}
          {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Member'}
        </button>
      </div>
    </form>
  )
}

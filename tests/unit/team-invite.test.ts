import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

let mockCurrentUser: unknown = null
vi.mock('@/lib/db/users', () => ({
  getCurrentUser: () => mockCurrentUser,
}))

const mockCreateTeamInvite = vi.fn()
const mockCancelTeamInvite = vi.fn()
const mockRemoveTeamMember = vi.fn()
const mockGetOrgInvites = vi.fn()
vi.mock('@/lib/db/team', () => ({
  createTeamInvite: (...args: unknown[]) => mockCreateTeamInvite(...args),
  cancelTeamInvite: (...args: unknown[]) => mockCancelTeamInvite(...args),
  removeTeamMember: (...args: unknown[]) => mockRemoveTeamMember(...args),
  getOrgInvites: (...args: unknown[]) => mockGetOrgInvites(...args),
}))

let mockLimitCheck: { allowed: boolean; currentCount: number; limit: number } = {
  allowed: true,
  currentCount: 1,
  limit: 5,
}
vi.mock('@/lib/utils/plan-limits', () => ({
  checkTeamMemberLimit: vi.fn().mockImplementation(() => mockLimitCheck),
}))

vi.mock('@/lib/db/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/services/email', () => ({
  sendTeamInviteEmail: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/db/user-messages', () => ({
  sendUserMessage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/utils/config', () => ({
  getServerConfig: () => ({
    app: { url: 'http://localhost:3000' },
    supabase: { url: '', anonKey: '', serviceRoleKey: '' },
    resend: { apiKey: '', fromEmail: '', fromName: '' },
    stripe: { secretKey: '', webhookSecret: '' },
    razorpay: { keyId: '', keySecret: '', webhookSecret: '' },
    anthropic: { apiKey: '' },
    cron: { secret: '' },
    twitter: { consumerKey: '', consumerSecret: '', accessToken: '', accessTokenSecret: '', bearerToken: '' },
    linkedin: { accessToken: '', memberId: '', organizationId: '' },
    telegram: { botToken: '', chatId: '' },
    blogApproval: { secret: '' },
    support: { apiKey: '', webhookUrl: '', webhookSecret: '' },
    adminEmails: [],
    admin: { emails: [] },
    analytics: { gaMeasurementId: '', gtmId: '' },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: { name: 'Test Org' }, error: null }),
          ilike: () => ({
            single: () => ({ data: null, error: null }),
          }),
        }),
        ilike: () => ({
          single: () => ({ data: null, error: null }),
        }),
      }),
    }),
  }),
}))

import { POST, DELETE } from '@/app/api/v1/team/route'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost/api/v1/team', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest(body: unknown) {
  return new NextRequest('http://localhost/api/v1/team', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// S05: Invite team member
// ---------------------------------------------------------------------------

describe('S05 — POST /api/v1/team (invite team member)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentUser = {
      id: 'user-owner',
      org_id: 'org-1',
      email: 'owner@test.com',
      full_name: 'Test Owner',
      role: 'admin',
      is_super_admin: false,
    }
    mockLimitCheck = { allowed: true, currentCount: 1, limit: 5 }
    mockCreateTeamInvite.mockResolvedValue({
      success: true,
      invite: { id: 'inv-1', token: 'tok-abc123' },
    })
  })

  it('S05: returns 401 when not authenticated', async () => {
    mockCurrentUser = null
    const res = await POST(makePostRequest({ email: 'new@test.com', role: 'member' }))
    expect(res.status).toBe(401)
  })

  it('S05: returns 403 when user lacks permission (non-admin role)', async () => {
    mockCurrentUser = { ...mockCurrentUser as object, role: 'member', is_super_admin: false }
    const res = await POST(makePostRequest({ email: 'new@test.com', role: 'member' }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/permission/i)
  })

  it('S05: returns 400 when email is missing', async () => {
    const res = await POST(makePostRequest({ role: 'member' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/email/i)
  })

  it('S05: returns 400 when email is invalid', async () => {
    const res = await POST(makePostRequest({ email: 'not-an-email', role: 'member' }))
    expect(res.status).toBe(400)
  })

  it('S05: returns 400 when role is invalid', async () => {
    const res = await POST(makePostRequest({ email: 'new@test.com', role: 'superuser' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/role/i)
  })

  it('S05: returns 403 when plan limit is reached (Free plan blocks invite)', async () => {
    mockLimitCheck = { allowed: false, currentCount: 1, limit: 0 }
    const res = await POST(makePostRequest({ email: 'new@test.com', role: 'member' }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/limit/i)
  })

  it('S05: successfully creates invite and returns 200', async () => {
    const res = await POST(makePostRequest({ email: 'new@test.com', role: 'member' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.invite).toBeDefined()
  })

  it('S05: invite is created with lowercase trimmed email', async () => {
    await POST(makePostRequest({ email: '  New@Test.COM  ', role: 'member' }))
    expect(mockCreateTeamInvite).toHaveBeenCalledWith(
      'org-1',
      'new@test.com',
      'member',
      'user-owner'
    )
  })

  it('S07: Free plan (maxTeamMembers=0) blocks invite server-side with 403', async () => {
    mockLimitCheck = { allowed: false, currentCount: 1, limit: 0 }
    const res = await POST(makePostRequest({ email: 'another@test.com', role: 'member' }))
    expect(res.status).toBe(403)
  })
})

// ---------------------------------------------------------------------------
// S08: Remove team member
// ---------------------------------------------------------------------------

describe('S08 — DELETE /api/v1/team (remove team member)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentUser = {
      id: 'user-owner',
      org_id: 'org-1',
      email: 'owner@test.com',
      role: 'admin',
      is_super_admin: false,
    }
    mockRemoveTeamMember.mockResolvedValue({ success: true })
    mockCancelTeamInvite.mockResolvedValue({ success: true })
  })

  it('S08: returns 401 when not authenticated', async () => {
    mockCurrentUser = null
    const res = await DELETE(makeDeleteRequest({ userId: 'user-2' }))
    expect(res.status).toBe(401)
  })

  it('S08: returns 403 when user lacks permission', async () => {
    mockCurrentUser = { ...mockCurrentUser as object, role: 'member', is_super_admin: false }
    const res = await DELETE(makeDeleteRequest({ userId: 'user-2' }))
    expect(res.status).toBe(403)
  })

  it('S08: returns 400 when neither userId nor inviteId is provided', async () => {
    const res = await DELETE(makeDeleteRequest({}))
    expect(res.status).toBe(400)
  })

  it('S08: successfully removes a team member and returns 200', async () => {
    const res = await DELETE(makeDeleteRequest({ userId: 'user-2' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mockRemoveTeamMember).toHaveBeenCalledWith('org-1', 'user-2', 'user-owner')
  })

  it('S08: returns 400 when removeTeamMember fails', async () => {
    mockRemoveTeamMember.mockResolvedValue({ success: false, error: 'Cannot remove the org owner.' })
    const res = await DELETE(makeDeleteRequest({ userId: 'user-owner' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/owner/i)
  })

  it('S08: can cancel a pending invite by inviteId', async () => {
    const res = await DELETE(makeDeleteRequest({ inviteId: 'inv-1' }))
    expect(res.status).toBe(200)
    expect(mockCancelTeamInvite).toHaveBeenCalledWith('org-1', 'inv-1')
  })
})

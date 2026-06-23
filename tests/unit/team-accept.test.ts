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

let mockInvite: unknown = null
vi.mock('@/lib/db/team', () => ({
  getInviteByToken: () => mockInvite,
  acceptTeamInvite: vi.fn().mockResolvedValue({ success: true }),
}))

let mockLimitCheck: { allowed: boolean; currentCount: number; limit: number } = {
  allowed: true,
  currentCount: 1,
  limit: 3,
}
vi.mock('@/lib/utils/plan-limits', () => ({
  checkTeamMemberLimit: vi.fn().mockImplementation(() => mockLimitCheck),
}))

vi.mock('@/lib/db/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/v1/team/accept/route'
import { checkTeamMemberLimit } from '@/lib/utils/plan-limits'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown = { token: 'valid-token-abc' }) {
  return new NextRequest('http://localhost/api/v1/team/accept', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Tests — Bug #112: TOCTOU race on team invite accept
// ---------------------------------------------------------------------------

describe('POST /api/v1/team/accept — TOCTOU limit check (bug #112)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentUser = { id: 'user-2', org_id: 'org-1', email: 'joiner@test.com' }
    mockInvite = { id: 'inv-1', org_id: 'org-1', email: 'joiner@test.com' }
    mockLimitCheck = { allowed: true, currentCount: 1, limit: 3 }
  })

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser = null
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/not authenticated/i)
  })

  it('returns 400 when token is missing', async () => {
    const res = await POST(makeRequest({ }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/token/i)
  })

  it('returns 400 when token is empty string', async () => {
    const res = await POST(makeRequest({ token: '' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/token/i)
  })

  it('returns 400 when invite is not found (TOCTOU: invite expired or already used)', async () => {
    // Bug #112: getInviteByToken is called BEFORE acceptTeamInvite to prevent race.
    // If the invite was already used or expired between creation and acceptance, we return 400.
    mockInvite = null
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/expired|not found|already used/i)
  })

  it('returns 403 when org has reached team member limit at accept-time (TOCTOU fix)', async () => {
    // Bug #112: the invite was created when the org had capacity, but another invite was
    // accepted first, filling the limit. We must re-check at accept time.
    mockLimitCheck = { allowed: false, currentCount: 4, limit: 3 }
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/team member limit/i)
  })

  it('returns 200 and succeeds when invite is valid and org has capacity', async () => {
    mockLimitCheck = { allowed: true, currentCount: 2, limit: 3 }
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('checks the TARGET org from the invite, not the current user org', async () => {
    // The TOCTOU fix uses invite.org_id (the org being joined), not user.org_id.
    // This test verifies that checkTeamMemberLimit is called with the invite's org.
    mockInvite = { id: 'inv-2', org_id: 'org-target', email: 'joiner@test.com' }
    mockCurrentUser = { id: 'user-2', org_id: 'org-different', email: 'joiner@test.com' }
    mockLimitCheck = { allowed: true, currentCount: 1, limit: 3 }

    await POST(makeRequest())
    expect(vi.mocked(checkTeamMemberLimit)).toHaveBeenCalledWith('org-target')
    expect(vi.mocked(checkTeamMemberLimit)).not.toHaveBeenCalledWith('org-different')
  })
})

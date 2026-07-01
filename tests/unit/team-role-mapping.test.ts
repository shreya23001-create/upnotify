import { describe, it, expect, vi } from 'vitest'

// Keep the module import side-effect-free (no real Supabase/env needed).
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { inviteRoleToUserRole } from '@/lib/db/team'

// Regression: accepting a "member" invite wrote role='member', which the
// users.role CHECK constraint ('admin'|'manager'|'viewer'|'client', 00002)
// rejects → the accept failed with 400 "Failed to join organisation".

describe('inviteRoleToUserRole — invite role → valid users.role', () => {
  it("maps 'member' to a constraint-valid role ('viewer'), never 'member'", () => {
    const role = inviteRoleToUserRole('member')
    expect(role).toBe('viewer')
    expect(['admin', 'manager', 'viewer', 'client']).toContain(role)
  })

  it("maps 'admin' to 'admin'", () => {
    expect(inviteRoleToUserRole('admin')).toBe('admin')
  })

  it('never returns a value outside the users.role CHECK constraint', () => {
    for (const input of ['member', 'admin', 'owner', 'anything', '']) {
      expect(['admin', 'manager', 'viewer', 'client']).toContain(inviteRoleToUserRole(input))
    }
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Supabase mock setup
// ---------------------------------------------------------------------------

interface MockQueryResult {
  data: unknown
  error: { message: string } | null
  count?: number | null
}

/**
 * Registry of mock responses keyed by table name.
 * Each table can have custom select/delete/insert behaviour.
 */
const mockTableResponses: Record<string, {
  selectResult?: MockQueryResult
  deleteResult?: { error: { message: string } | null }
  countResult?: { count: number | null; error: { message: string } | null }
}> = {}

/**
 * Track which tables were queried with delete() so we can assert
 * the cascade order in tests.
 */
const deletedTables: string[] = []
const insertedAuditLogs: Array<Record<string, unknown>> = []

function resetMockDb(): void {
  for (const key of Object.keys(mockTableResponses)) {
    delete mockTableResponses[key]
  }
  deletedTables.length = 0
  insertedAuditLogs.length = 0
}

function setTableDefaults(): void {
  // By default all tables return 0 rows and no errors
  const tables = [
    'users', 'organisations', 'monitors', 'incidents', 'alert_channels',
    'check_results', 'status_pages', 'subscriptions', 'invoices',
    'voice_call_logs', 'alerts', 'maintenance_windows',
    'status_page_subscribers', 'reports', 'api_keys',
    'contact_preferences', 'agency_tags', 'stripe_connect_payouts',
    'admin_permissions', 'workspaces', 'audit_log',
  ]
  for (const table of tables) {
    mockTableResponses[table] = {
      selectResult: { data: [], error: null },
      deleteResult: { error: null },
      countResult: { count: 0, error: null },
    }
  }
}

// Build a fluent mock Supabase client for the server (createClient) path.
// Uses a recursive builder so any chain of .eq().gte().order().limit().single() works.
function buildFluentChain(result: MockQueryResult): Record<string, unknown> {
  const terminal = {
    data: result.data,
    error: result.error,
    then: (resolve: (v: unknown) => void) => resolve({ data: result.data, error: result.error }),
  }
  const chain: Record<string, unknown> = {
    ...terminal,
    eq: () => chain,
    gte: () => chain,
    lte: () => chain,
    order: () => chain,
    limit: () => chain,
    single: () => result,
    maybeSingle: () => result,
  }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (table: string) => {
      const responses = mockTableResponses[table] ?? {
        selectResult: { data: [], error: null },
      }
      const selectResult = responses.selectResult ?? { data: [], error: null }
      return {
        select: () => buildFluentChain(selectResult),
      }
    },
  }),
}))

// Build a fluent mock for the admin client (service-role) path
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const responses = mockTableResponses[table] ?? {
        countResult: { count: 0, error: null },
        deleteResult: { error: null },
        selectResult: { data: [], error: null },
      }
      return {
        select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === 'exact') {
            return {
              eq: () => responses.countResult ?? { count: 0, error: null },
            }
          }
          const selectData = responses.selectResult ?? { data: null, error: null }
          return {
            eq: () => ({
              ...selectData,
              single: () => selectData,
              eq: () => ({
                ...selectData,
                single: () => selectData,
              }),
            }),
          }
        },
        delete: () => {
          deletedTables.push(table)
          return {
            eq: () => responses.deleteResult ?? { error: null },
          }
        },
        insert: (data: Record<string, unknown>) => {
          if (table === 'audit_log') {
            insertedAuditLogs.push(data)
          }
          return { error: null }
        },
      }
    },
    auth: {
      admin: {
        deleteUser: vi.fn().mockReturnValue({ error: null }),
        signOut: vi.fn().mockReturnValue({ error: null }),
      },
    },
  }),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Import modules under test
// ---------------------------------------------------------------------------

import { exportUserData, deleteUserAccount } from '@/lib/db/gdpr'

// ---------------------------------------------------------------------------
// Tests — Data Export
// ---------------------------------------------------------------------------

describe('GDPR data export', () => {
  beforeEach(() => {
    resetMockDb()
    setTableDefaults()
  })

  it('returns all user data in structured format', async () => {
    // Set up user data
    mockTableResponses['users'] = {
      selectResult: {
        data: {
          id: 'usr-001',
          email: 'john@example.com',
          full_name: 'John Doe',
          role: 'owner',
          created_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      },
    }
    mockTableResponses['organisations'] = {
      selectResult: {
        data: {
          id: 'org-001',
          name: 'Acme Inc',
          slug: 'acme',
          created_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      },
    }
    mockTableResponses['monitors'] = {
      selectResult: {
        data: [{
          id: 'mon-001',
          name: 'API Monitor',
          type: 'http',
          target: 'https://api.acme.com',
          status: 'up',
          check_interval_seconds: 60,
          created_at: '2026-01-15T00:00:00Z',
        }],
        error: null,
      },
    }

    const result = await exportUserData('usr-001', 'org-001')

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.user.id).toBe('usr-001')
    expect(result.data.user.email).toBe('john@example.com')
    expect(result.data.user.fullName).toBe('John Doe')
    expect(result.data.organisation?.name).toBe('Acme Inc')
    expect(result.data.monitors).toHaveLength(1)
    expect(result.data.monitors[0].name).toBe('API Monitor')
    expect(result.data.exportedAt).toBeDefined()
  })

  it('excludes sensitive fields — no password hashes or API key hashes', async () => {
    mockTableResponses['users'] = {
      selectResult: {
        data: {
          id: 'usr-001',
          email: 'john@example.com',
          full_name: 'John Doe',
          role: 'owner',
          created_at: '2026-01-01T00:00:00Z',
          // These fields should NOT appear in the export
          password_hash: '$2b$12$secret',
          api_key_hash: 'sha256:deadbeef',
        },
        error: null,
      },
    }

    const result = await exportUserData('usr-001', 'org-001')

    expect(result.success).toBe(true)
    if (!result.success) return

    const userData = result.data.user
    expect(userData).not.toHaveProperty('password_hash')
    expect(userData).not.toHaveProperty('api_key_hash')
    expect(userData).not.toHaveProperty('passwordHash')
    expect(userData).not.toHaveProperty('apiKeyHash')

    // Only expected fields present
    expect(Object.keys(userData)).toEqual(['id', 'email', 'fullName', 'role', 'createdAt'])
  })

  it('returns empty arrays when user has no monitors or incidents', async () => {
    mockTableResponses['users'] = {
      selectResult: {
        data: {
          id: 'usr-001',
          email: 'jane@example.com',
          full_name: 'Jane',
          role: 'member',
          created_at: '2026-03-01T00:00:00Z',
        },
        error: null,
      },
    }

    const result = await exportUserData('usr-001', 'org-001')

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.monitors).toEqual([])
    expect(result.data.incidents).toEqual([])
    expect(result.data.alertChannels).toEqual([])
    expect(result.data.checkResults).toEqual([])
    expect(result.data.statusPages).toEqual([])
    expect(result.data.billing.subscription).toBeNull()
    expect(result.data.billing.invoices).toEqual([])
  })

  it('returns error when user is not found', async () => {
    mockTableResponses['users'] = {
      selectResult: {
        data: null,
        error: { message: 'No rows found' },
      },
    }

    const result = await exportUserData('usr-nonexistent', 'org-001')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toBe('User not found')
  })

  it('handles null organisation gracefully', async () => {
    mockTableResponses['users'] = {
      selectResult: {
        data: {
          id: 'usr-001',
          email: 'solo@example.com',
          full_name: null,
          role: 'member',
          created_at: '2026-03-01T00:00:00Z',
        },
        error: null,
      },
    }
    mockTableResponses['organisations'] = {
      selectResult: { data: null, error: null },
    }

    const result = await exportUserData('usr-001', 'org-001')

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.organisation).toBeNull()
    expect(result.data.user.fullName).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Tests — Account Deletion
// ---------------------------------------------------------------------------

describe('GDPR account deletion', () => {
  beforeEach(() => {
    resetMockDb()
    setTableDefaults()

    // Default: sole org member → org will be deleted via cascade
    mockTableResponses['users'] = {
      countResult: { count: 0, error: null },
      deleteResult: { error: null },
    }
    mockTableResponses['organisations'] = {
      countResult: { count: 1, error: null },
      deleteResult: { error: null },
    }
  })

  it('returns success and deletes organisation when user is sole member', async () => {
    const result = await deleteUserAccount('usr-001', 'org-001')

    expect(result.success).toBe(true)
    // Organisation was deleted — Postgres cascade handled the rest
    expect(deletedTables).toContain('organisations')
    // User row was NOT separately deleted (org cascade removes it)
    expect(deletedTables).not.toContain('users')
  })

  it('deletes only user row when other org members remain', async () => {
    mockTableResponses['users'] = {
      countResult: { count: 2, error: null },
      deleteResult: { error: null },
    }

    const result = await deleteUserAccount('usr-001', 'org-001')

    expect(result.success).toBe(true)
    // Organisation preserved — other members still there
    expect(deletedTables).not.toContain('organisations')
    // Only the user row was removed
    expect(deletedTables).toContain('users')
  })

  it('returns failure with failedStep when org deletion fails', async () => {
    mockTableResponses['organisations'] = {
      countResult: { count: 1, error: null },
      deleteResult: { error: { message: 'Permission denied' } },
    }

    const result = await deleteUserAccount('usr-001', 'org-001')

    expect(result.success).toBe(false)
    expect(result.failedStep).toBe('organisation')
    expect(result.error).toBe('Permission denied')
  })

  it('returns failure with failedStep when user-row deletion fails', async () => {
    mockTableResponses['users'] = {
      countResult: { count: 2, error: null },
      deleteResult: { error: { message: 'FK constraint' } },
    }

    const result = await deleteUserAccount('usr-001', 'org-001')

    expect(result.success).toBe(false)
    expect(result.failedStep).toBe('users')
    expect(result.error).toBe('FK constraint')
  })

  it('writes audit log entries before and after deletion', async () => {
    await deleteUserAccount('usr-001', 'org-001')

    expect(insertedAuditLogs.length).toBeGreaterThanOrEqual(2)

    const startLog = insertedAuditLogs.find(
      (l) => l.action === 'account.deletion_started'
    )
    expect(startLog).toBeDefined()
    expect(startLog?.user_id).toBe('usr-001')
    expect(startLog?.org_id).toBe('org-001')

    const completedLog = insertedAuditLogs.find(
      (l) => l.action === 'account.deletion_completed'
    )
    expect(completedLog).toBeDefined()
  })
})

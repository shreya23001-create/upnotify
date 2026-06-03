import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the admin client with a chainable fake. Each test wires the leaf
// response (`.delete()...then()` for prune, `.insert()...then()` for acquire,
// `.delete()...then()` for release).
const tableHandlers: Record<string, {
  insertResp?: { error: { code?: string; message: string } | null }
  deleteResp?: { error: { message: string } | null }
}> = { cron_locks: {} }

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      delete: () => ({
        eq: () => ({
          lte: () => Promise.resolve({ error: tableHandlers[table]?.deleteResp?.error ?? null }),
          then: (resolve: (v: { error: { message: string } | null }) => void) =>
            resolve({ error: tableHandlers[table]?.deleteResp?.error ?? null }),
        }),
      }),
      insert: () => Promise.resolve({ error: tableHandlers[table]?.insertResp?.error ?? null }),
    }),
  }),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { acquireCronLock, releaseCronLock } from '@/lib/utils/cron-lock'

beforeEach(() => {
  tableHandlers.cron_locks = {}
})

describe('acquireCronLock', () => {
  it('returns true when insert succeeds (no existing lock)', async () => {
    tableHandlers.cron_locks = { insertResp: { error: null } }
    expect(await acquireCronLock('check-runner', 60_000)).toBe(true)
  })

  it('returns false when insert fails with unique-violation (23505)', async () => {
    tableHandlers.cron_locks = { insertResp: { error: { code: '23505', message: 'duplicate' } } }
    expect(await acquireCronLock('check-runner', 60_000)).toBe(false)
  })

  it('fails closed on unknown insert error', async () => {
    tableHandlers.cron_locks = { insertResp: { error: { message: 'permission denied' } } }
    expect(await acquireCronLock('check-runner', 60_000)).toBe(false)
  })
})

describe('releaseCronLock', () => {
  it('resolves even when delete errors (TTL will reclaim)', async () => {
    tableHandlers.cron_locks = { deleteResp: { error: { message: 'noop' } } }
    await expect(releaseCronLock('check-runner')).resolves.toBeUndefined()
  })
})

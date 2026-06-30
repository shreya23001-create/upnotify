import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Supabase server mock — records chain calls, resolves with injected data
// ---------------------------------------------------------------------------

type ChainResult = { data: unknown; error: unknown; count: number | null }

let resolveWith: ChainResult = { data: [], error: null, count: 0 }

function makeChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'neq', 'order', 'range']
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  // range is the terminal — return a promise
  ;(chain as Record<string, unknown>).then = (
    onFulfilled: (v: ChainResult) => unknown
  ) => Promise.resolve(resolveWith).then(onFulfilled)
  return chain
}

const orderSpy = vi.fn()
const rangeSpy = vi.fn()
const eqSpy = vi.fn()
const neqSpy = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => {
      const chain = makeChain()
      // Wrap spied methods to record args while still chaining
      chain.order = vi.fn().mockImplementation((...args: unknown[]) => {
        orderSpy(...args)
        return chain
      })
      chain.range = vi.fn().mockImplementation((...args: unknown[]) => {
        rangeSpy(...args)
        // range is terminal — make chain thenable with resolveWith
        ;(chain as Record<string, unknown>).then = (
          onFulfilled: (v: ChainResult) => unknown
        ) => Promise.resolve(resolveWith).then(onFulfilled)
        return chain
      })
      chain.eq = vi.fn().mockImplementation((...args: unknown[]) => {
        eqSpy(...args)
        return chain
      })
      chain.neq = vi.fn().mockImplementation((...args: unknown[]) => {
        neqSpy(...args)
        return chain
      })
      return chain
    },
  }),
}))

import { getAllIncidentsByOrgPaged } from '@/lib/db/incidents'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  resolveWith = { data: [], error: null, count: 0 }
})

describe('getAllIncidentsByOrgPaged — pagination & sort (#97 fix)', () => {
  it('applies primary sort by started_at descending', async () => {
    resolveWith = { data: [], error: null, count: 0 }
    await getAllIncidentsByOrgPaged('org-1', 1, 20)
    const calls = orderSpy.mock.calls
    const primary = calls.find((call: unknown[]) => call[0] === 'started_at')
    expect(primary).toBeDefined()
    expect(primary?.[1]).toEqual({ ascending: false })
  })

  it('applies secondary sort by id descending (prevents duplicate rows on tied timestamps)', async () => {
    resolveWith = { data: [], error: null, count: 0 }
    await getAllIncidentsByOrgPaged('org-1', 1, 20)
    const calls = orderSpy.mock.calls
    const secondary = calls.find((call: unknown[]) => call[0] === 'id')
    expect(secondary).toBeDefined()
    expect(secondary?.[1]).toEqual({ ascending: false })
  })

  it('secondary sort is applied AFTER primary sort (preserves intent)', async () => {
    resolveWith = { data: [], error: null, count: 0 }
    await getAllIncidentsByOrgPaged('org-1', 1, 20)
    const cols = orderSpy.mock.calls.map((call: unknown[]) => call[0])
    const primaryIdx = cols.indexOf('started_at')
    const secondaryIdx = cols.indexOf('id')
    expect(primaryIdx).toBeGreaterThanOrEqual(0)
    expect(secondaryIdx).toBeGreaterThan(primaryIdx)
  })

  it('calculates correct range for page 1', async () => {
    await getAllIncidentsByOrgPaged('org-1', 1, 20)
    expect(rangeSpy).toHaveBeenCalledWith(0, 19)
  })

  it('calculates correct range for page 2', async () => {
    await getAllIncidentsByOrgPaged('org-1', 2, 20)
    expect(rangeSpy).toHaveBeenCalledWith(20, 39)
  })

  it('calculates correct range for page 3 with pageSize 10', async () => {
    await getAllIncidentsByOrgPaged('org-1', 3, 10)
    expect(rangeSpy).toHaveBeenCalledWith(20, 29)
  })

  it('returns empty array and zero totals on DB error', async () => {
    resolveWith = { data: null, error: { message: 'DB unavailable' }, count: null }
    const result = await getAllIncidentsByOrgPaged('org-1', 1, 20)
    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
    expect(result.openTotal).toBe(0)
    expect(result.resolvedTotal).toBe(0)
  })

  it('maps monitor name from joined monitors field', async () => {
    resolveWith = {
      data: [{ id: 'inc-1', started_at: '2026-01-01T00:00:00Z', monitors: { name: 'My Site' } }],
      error: null,
      count: 1,
    }
    const result = await getAllIncidentsByOrgPaged('org-1', 1, 20)
    expect(result.data[0]?.monitor_name).toBe('My Site')
  })

  it('sets monitor_name to null when no monitor joined', async () => {
    resolveWith = {
      data: [{ id: 'inc-2', started_at: '2026-01-01T00:00:00Z', monitors: null }],
      error: null,
      count: 1,
    }
    const result = await getAllIncidentsByOrgPaged('org-1', 1, 20)
    expect(result.data[0]?.monitor_name).toBeNull()
  })
})

describe('getAllIncidentsByOrgPaged — status filter', () => {
  it('filters open incidents (neq resolved)', async () => {
    resolveWith = { data: [], error: null, count: 0 }
    await getAllIncidentsByOrgPaged('org-1', 1, 20, 'open')
    const neqArgs = neqSpy.mock.calls.find((call: unknown[]) => call[0] === 'status')
    expect(neqArgs).toBeDefined()
    expect(neqArgs?.[1]).toBe('resolved')
  })

  it('filters resolved incidents (eq resolved)', async () => {
    resolveWith = { data: [], error: null, count: 0 }
    await getAllIncidentsByOrgPaged('org-1', 1, 20, 'resolved')
    const eqArgs = eqSpy.mock.calls.find(
      (call: unknown[]) => call[0] === 'status' && call[1] === 'resolved'
    )
    expect(eqArgs).toBeDefined()
  })
})

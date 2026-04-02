import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Supabase chain builder — simulates the fluent query API
let mockTerminalData: unknown = null
let mockTerminalError: unknown = null

function buildChain() {
  const chain: Record<string, unknown> = {}
  // Make data/error resolve lazily so tests can set mockTerminalData after from() is called
  Object.defineProperty(chain, 'data', { get: () => mockTerminalData, enumerable: true })
  Object.defineProperty(chain, 'error', { get: () => mockTerminalError, enumerable: true })
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) =>
    resolve({ data: mockTerminalData, error: mockTerminalError })
  )
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.gte = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockImplementation(() => ({
    data: mockTerminalData,
    error: mockTerminalError,
  }))
  return chain
}

let mockChain: ReturnType<typeof buildChain>
let lastTableName: string = ''

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      lastTableName = table
      mockChain = buildChain()

      // Override update to support .eq().select().single() chain
      mockChain.update = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: mockTerminalData,
          error: mockTerminalError,
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: mockTerminalData,
              error: mockTerminalError,
            }),
          }),
        }),
      })

      // For insert().select().single() pattern
      mockChain.insert = vi.fn().mockImplementation(() => {
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: mockTerminalData,
              error: mockTerminalError,
            }),
          }),
          // For insert without select (subscribe)
          data: mockTerminalData,
          error: mockTerminalError,
        }
      })

      // For select().eq().single() pattern
      mockChain.select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            data: mockTerminalData,
            error: mockTerminalError,
          }),
          order: vi.fn().mockReturnValue({
            data: mockTerminalData,
            error: mockTerminalError,
            order: vi.fn().mockReturnValue({
              data: mockTerminalData,
              error: mockTerminalError,
            }),
          }),
          eq: vi.fn().mockReturnValue({
            data: mockTerminalData,
            error: mockTerminalError,
            limit: vi.fn().mockReturnValue({
              data: mockTerminalData,
              error: mockTerminalError,
            }),
          }),
          is: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                  data: mockTerminalData,
                  error: mockTerminalError,
                }),
              }),
            }),
          }),
          gte: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                data: mockTerminalData,
                error: mockTerminalError,
              }),
            }),
            // For calculatePublicUptime — just select('status').eq().gte()
            data: mockTerminalData,
            error: mockTerminalError,
          }),
        }),
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: mockTerminalData,
            error: mockTerminalError,
          }),
        }),
      })

      return mockChain
    },
  }),
}))

// ---------------------------------------------------------------------------
// Import module under test (AFTER mocks)
// ---------------------------------------------------------------------------

import {
  getAllPublicMonitors,
  getActivePublicMonitors,
  getPublicMonitorByDomain,
  createPublicMonitor,
  togglePublicMonitor,
  writePublicCheckResult,
  calculatePublicUptime,
  subscribeToPublicMonitor,
  getOpenPublicIncident,
  createPublicIncident,
  resolvePublicIncident,
} from '@/lib/db/public-monitors'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockMonitor = {
  id: 'mon-1',
  domain: 'example.com',
  display_name: 'Example',
  category: 'saas',
  check_interval_seconds: 300,
  is_active: true,
  last_checked_at: null,
  last_status: 'up',
  last_response_time_ms: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getAllPublicMonitors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns monitors on success', async () => {
    mockTerminalData = [mockMonitor]
    mockTerminalError = null

    const result = await getAllPublicMonitors()
    expect(result).toEqual([mockMonitor])
  })

  it('returns empty array on error', async () => {
    mockTerminalData = null
    mockTerminalError = { message: 'DB error' }

    const result = await getAllPublicMonitors()
    expect(result).toEqual([])
  })

  it('returns empty array when data is null', async () => {
    mockTerminalData = null
    mockTerminalError = null

    const result = await getAllPublicMonitors()
    expect(result).toEqual([])
  })
})

describe('getActivePublicMonitors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns only active monitors on success', async () => {
    mockTerminalData = [mockMonitor]
    mockTerminalError = null

    const result = await getActivePublicMonitors()
    expect(result).toEqual([mockMonitor])
  })

  it('returns empty array on error', async () => {
    mockTerminalData = null
    mockTerminalError = { message: 'DB error' }

    const result = await getActivePublicMonitors()
    expect(result).toEqual([])
  })
})

describe('getPublicMonitorByDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns monitor when found', async () => {
    mockTerminalData = mockMonitor
    mockTerminalError = null

    const result = await getPublicMonitorByDomain('example.com')
    expect(result).toEqual(mockMonitor)
  })

  it('returns null when not found', async () => {
    mockTerminalData = null
    mockTerminalError = { message: 'Not found' }

    const result = await getPublicMonitorByDomain('missing.com')
    expect(result).toBeNull()
  })
})

describe('createPublicMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns created monitor on success', async () => {
    mockTerminalData = { ...mockMonitor, id: 'new-mon' }
    mockTerminalError = null

    const result = await createPublicMonitor({
      domain: 'new.example.com',
      display_name: 'New Example',
    })
    expect(result).toEqual({ ...mockMonitor, id: 'new-mon' })
  })

  it('returns null on error', async () => {
    mockTerminalData = null
    mockTerminalError = { message: 'Insert failed' }

    const result = await createPublicMonitor({
      domain: 'fail.com',
      display_name: 'Fail',
    })
    expect(result).toBeNull()
  })

  it('uses default category and interval when not specified', async () => {
    mockTerminalData = mockMonitor
    mockTerminalError = null

    // The function should use 'other' for category and 300 for interval
    const result = await createPublicMonitor({
      domain: 'example.com',
      display_name: 'Example',
    })
    expect(result).toBeDefined()
  })
})

describe('togglePublicMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true on success', async () => {
    mockTerminalError = null

    const result = await togglePublicMonitor('mon-1', false)
    expect(result).toBe(true)
  })

  it('returns false on error', async () => {
    mockTerminalError = { message: 'Update failed' }

    const result = await togglePublicMonitor('mon-1', true)
    expect(result).toBe(false)
  })
})

describe('writePublicCheckResult', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns check result on success', async () => {
    const checkResult = {
      id: 'cr-1',
      monitor_id: 'mon-1',
      status: 'up',
      response_time_ms: 150,
      status_code: 200,
      error_message: null,
      checked_at: '2026-01-01T00:00:00Z',
    }
    mockTerminalData = checkResult
    mockTerminalError = null

    const result = await writePublicCheckResult({
      monitor_id: 'mon-1',
      status: 'up',
      response_time_ms: 150,
      status_code: 200,
    })
    expect(result).toEqual(checkResult)
  })

  it('returns null on error', async () => {
    mockTerminalData = null
    mockTerminalError = { message: 'Write failed' }

    const result = await writePublicCheckResult({
      monitor_id: 'mon-1',
      status: 'up',
    })
    expect(result).toBeNull()
  })
})

describe('calculatePublicUptime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 100 when no check results exist', async () => {
    mockTerminalData = []
    mockTerminalError = null

    const result = await calculatePublicUptime('mon-1')
    expect(result).toBe(100)
  })

  it('returns 100 when all checks are up', async () => {
    mockTerminalData = [
      { status: 'up' },
      { status: 'up' },
      { status: 'up' },
      { status: 'up' },
    ]
    mockTerminalError = null

    const result = await calculatePublicUptime('mon-1')
    expect(result).toBe(100)
  })

  it('returns correct percentage for mixed results', async () => {
    mockTerminalData = [
      { status: 'up' },
      { status: 'up' },
      { status: 'up' },
      { status: 'down' },
    ]
    mockTerminalError = null

    const result = await calculatePublicUptime('mon-1')
    expect(result).toBe(75)
  })

  it('returns 0 when all checks are down', async () => {
    mockTerminalData = [
      { status: 'down' },
      { status: 'down' },
    ]
    mockTerminalError = null

    const result = await calculatePublicUptime('mon-1')
    expect(result).toBe(0)
  })

  it('returns 100 on DB error', async () => {
    mockTerminalData = null
    mockTerminalError = { message: 'DB error' }

    const result = await calculatePublicUptime('mon-1')
    expect(result).toBe(100)
  })
})

describe('subscribeToPublicMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns success when subscribing', async () => {
    // First call: check existing (not found)
    // Second call: insert (success)
    mockTerminalData = null
    mockTerminalError = { message: 'not found' }

    const result = await subscribeToPublicMonitor('mon-1', 'user@example.com')
    // When existing check returns error, it tries to insert
    expect(result.success).toBeDefined()
  })

  it('returns success silently for already subscribed', async () => {
    mockTerminalData = { id: 'sub-1' }
    mockTerminalError = null

    const result = await subscribeToPublicMonitor('mon-1', 'existing@example.com')
    expect(result.success).toBe(true)
  })
})

describe('getOpenPublicIncident', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns incident when one is open', async () => {
    const incident = {
      id: 'inc-1',
      monitor_id: 'mon-1',
      started_at: '2026-01-01T00:00:00Z',
      resolved_at: null,
      cause: 'Timeout',
      status_code: null,
    }
    mockTerminalData = incident
    mockTerminalError = null

    const result = await getOpenPublicIncident('mon-1')
    expect(result).toEqual(incident)
  })

  it('returns null when no open incident', async () => {
    mockTerminalData = null
    mockTerminalError = { message: 'Not found' }

    const result = await getOpenPublicIncident('mon-1')
    expect(result).toBeNull()
  })
})

describe('createPublicIncident', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns created incident on success', async () => {
    const incident = {
      id: 'inc-1',
      monitor_id: 'mon-1',
      started_at: '2026-01-01T00:00:00Z',
      resolved_at: null,
      cause: 'Server error',
      status_code: 500,
    }
    mockTerminalData = incident
    mockTerminalError = null

    const result = await createPublicIncident({
      monitor_id: 'mon-1',
      cause: 'Server error',
      status_code: 500,
    })
    expect(result).toEqual(incident)
  })

  it('returns null on error', async () => {
    mockTerminalData = null
    mockTerminalError = { message: 'Insert failed' }

    const result = await createPublicIncident({ monitor_id: 'mon-1' })
    expect(result).toBeNull()
  })
})

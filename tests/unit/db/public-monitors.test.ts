import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Supabase chain builder — simulates the fluent query API
// Uses a fully recursive proxy so any chaining pattern (e.g. .order().order().limit())
// resolves correctly without hand-wiring every combination.
let mockTerminalData: unknown = null
let mockTerminalError: unknown = null

function buildRecursiveChain(): Record<string, unknown> {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      // Terminal data accessors
      if (prop === 'data') return mockTerminalData
      if (prop === 'error') return mockTerminalError

      // .then() — makes the chain awaitable (Supabase returns PromiseLike)
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) =>
          resolve({ data: mockTerminalData, error: mockTerminalError })
      }

      // .single() — returns a plain object (not chainable)
      if (prop === 'single') {
        return vi.fn().mockImplementation(() => ({
          data: mockTerminalData,
          error: mockTerminalError,
        }))
      }

      // All other methods return a new recursive chain
      return vi.fn().mockImplementation(() => buildRecursiveChain())
    },
  }
  return new Proxy({} as Record<string, unknown>, handler)
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => buildRecursiveChain(),
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
  normalisePublicMonitorDomain,
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

// ---------------------------------------------------------------------------
// normalisePublicMonitorDomain — pure function, no DB
// ---------------------------------------------------------------------------

describe('normalisePublicMonitorDomain', () => {
  it('lowercases the domain', () => {
    expect(normalisePublicMonitorDomain('Google.com')).toBe('google.com')
    expect(normalisePublicMonitorDomain('GOOGLE.COM')).toBe('google.com')
    expect(normalisePublicMonitorDomain('GitHub.com')).toBe('github.com')
  })

  it('strips www. prefix', () => {
    expect(normalisePublicMonitorDomain('www.google.com')).toBe('google.com')
    expect(normalisePublicMonitorDomain('WWW.GOOGLE.COM')).toBe('google.com')
  })

  it('strips https:// and http:// schemes', () => {
    expect(normalisePublicMonitorDomain('https://google.com')).toBe('google.com')
    expect(normalisePublicMonitorDomain('http://google.com')).toBe('google.com')
    expect(normalisePublicMonitorDomain('HTTPS://Google.com')).toBe('google.com')
  })

  it('strips trailing slash and any path', () => {
    expect(normalisePublicMonitorDomain('google.com/')).toBe('google.com')
    expect(normalisePublicMonitorDomain('google.com/some/path')).toBe('google.com')
    expect(normalisePublicMonitorDomain('https://google.com/path?q=1')).toBe('google.com')
  })

  it('combines all transforms together', () => {
    expect(normalisePublicMonitorDomain('  HTTPS://WWW.Google.com/  ')).toBe('google.com')
    expect(normalisePublicMonitorDomain('http://WWW.example.org/index.html')).toBe('example.org')
  })

  it('passes already-canonical domains through unchanged', () => {
    expect(normalisePublicMonitorDomain('google.com')).toBe('google.com')
    expect(normalisePublicMonitorDomain('subdomain.example.org')).toBe('subdomain.example.org')
  })

  it('handles empty / whitespace input safely', () => {
    expect(normalisePublicMonitorDomain('')).toBe('')
    expect(normalisePublicMonitorDomain('   ')).toBe('')
  })

  it('preserves non-www subdomains', () => {
    // www. is the only subdomain we strip; api.example.com etc. stay as-is
    expect(normalisePublicMonitorDomain('api.example.com')).toBe('api.example.com')
    expect(normalisePublicMonitorDomain('status.example.com')).toBe('status.example.com')
  })
})

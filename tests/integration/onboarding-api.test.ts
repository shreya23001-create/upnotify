import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CheckerResult } from '@/lib/checkers/types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetCurrentUser = vi.fn()
vi.mock('@/lib/db/users', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

const mockGetWorkspacesByOrg = vi.fn()
vi.mock('@/lib/db/workspaces', () => ({
  getWorkspacesByOrg: (...args: unknown[]) => mockGetWorkspacesByOrg(...args),
}))

const mockCreateMonitor = vi.fn()
const mockUpdateMonitorStatus = vi.fn()
vi.mock('@/lib/db/monitors', () => ({
  createMonitor: (...args: unknown[]) => mockCreateMonitor(...args),
  updateMonitorStatus: (...args: unknown[]) => mockUpdateMonitorStatus(...args),
}))

const mockCheckMonitorLimit = vi.fn()
vi.mock('@/lib/utils/plan-limits', () => ({
  checkMonitorLimit: (...args: unknown[]) => mockCheckMonitorLimit(...args),
}))

const mockDispatchChecker = vi.fn()
vi.mock('@/lib/services/checker', () => ({
  dispatchChecker: (...args: unknown[]) => mockDispatchChecker(...args),
}))

const mockWriteCheckResult = vi.fn()
vi.mock('@/lib/db/check-results', () => ({
  writeCheckResult: (...args: unknown[]) => mockWriteCheckResult(...args),
}))

vi.mock('@/lib/services/email-nurture', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/utils/config', () => ({
  getConfig: () => ({
    supabase: { url: 'http://localhost:54321', anonKey: 'test-anon-key' },
    app: { url: 'http://localhost:3000' },
    admin: { emails: [] },
    analytics: { gaMeasurementId: '' },
  }),
  getServerConfig: () => ({
    supabase: { url: 'http://localhost:54321', anonKey: 'test-anon-key', serviceRoleKey: 'test-service-key' },
    stripe: { secretKey: 'sk_test_xxx', webhookSecret: 'whsec_test' },
    resend: { apiKey: '', fromEmail: 'test@test.com', fromName: 'Test' },
    anthropic: { apiKey: 'test-key' },
    cron: { secret: 'test-cron-secret' },
  }),
}))

// ---------------------------------------------------------------------------
// Import module under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/v1/onboarding/route'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('https://uptrue.io/api/v1/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const mockUser = {
  id: 'user-1',
  org_id: 'org-1',
  email: 'test@example.com',
}

const mockWorkspace = {
  id: 'ws-1',
  org_id: 'org-1',
  name: 'Default Workspace',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockGetWorkspacesByOrg.mockResolvedValue([mockWorkspace])
    mockCheckMonitorLimit.mockResolvedValue({ allowed: true, currentCount: 0, limit: 10 })
    mockCreateMonitor.mockImplementation((data: Record<string, unknown>) =>
      Promise.resolve({ id: `mon-${Date.now()}`, ...data })
    )
    mockDispatchChecker.mockResolvedValue({
      status: 'up',
      responseTimeMs: 150,
      statusCode: 200,
    } as CheckerResult)
    mockWriteCheckResult.mockResolvedValue({ id: 'cr-1' })
    mockUpdateMonitorStatus.mockResolvedValue(undefined)
  })

  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = createRequest({
        url: 'https://example.com',
        monitors: [{ type: 'http', name: 'HTTP Check', target: 'https://example.com' }],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Not authenticated')
    })
  })

  describe('input validation', () => {
    it('returns 400 when URL is missing', async () => {
      const request = createRequest({
        monitors: [{ type: 'http', name: 'Test', target: 'https://example.com' }],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('Invalid URL')
    })

    it('returns 400 when URL is invalid', async () => {
      const request = createRequest({
        url: 'not-a-valid-url',
        monitors: [{ type: 'http', name: 'Test', target: 'test' }],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('Invalid URL')
    })

    it('returns 400 when monitors array is empty', async () => {
      const request = createRequest({
        url: 'https://example.com',
        monitors: [],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('At least one monitor')
    })

    it('returns 400 when monitors array is missing', async () => {
      const request = createRequest({
        url: 'https://example.com',
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
    })

    it('returns 400 when more than 4 monitors requested', async () => {
      const monitors = Array.from({ length: 5 }, (_, i) => ({
        type: 'http',
        name: `Monitor ${i}`,
        target: `https://example.com/${i}`,
      }))

      const request = createRequest({
        url: 'https://example.com',
        monitors,
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('Maximum 4')
    })
  })

  describe('plan limit enforcement', () => {
    it('returns 403 when monitor limit is reached', async () => {
      mockCheckMonitorLimit.mockResolvedValue({
        allowed: false,
        currentCount: 10,
        limit: 10,
      })

      const request = createRequest({
        url: 'https://example.com',
        monitors: [{ type: 'http', name: 'Test', target: 'https://example.com' }],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(403)
      expect(body.error).toContain('Monitor limit reached')
    })

    // engineering-app#55 — used to be a check-once-create-many off-by-one:
    // a Lite user at 1/3 monitors passed the gate (1 < 3) and the loop then
    // created up to 4 more, ending at 5 on a 3-cap plan. Now the route
    // computes `remaining = limit - currentCount` and slices the request.
    it('caps the create loop at remaining headroom under the plan limit', async () => {
      mockCheckMonitorLimit.mockResolvedValue({
        allowed: true,
        currentCount: 1,
        limit: 3,   // 2 monitors of headroom
      })

      const request = createRequest({
        url: 'https://example.com',
        monitors: [
          { type: 'http',    name: 'a', target: 'https://example.com' },
          { type: 'ssl',     name: 'b', target: 'https://example.com' },
          { type: 'dns',     name: 'c', target: 'https://example.com' },
          { type: 'keyword', name: 'd', target: 'https://example.com' },
        ],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(mockCreateMonitor).toHaveBeenCalledTimes(2)        // capped at headroom
      expect(body.monitors).toHaveLength(2)
      expect(body.skipped).toBe(2)
    })

    it('reports skipped = 0 when the request fits the headroom', async () => {
      mockCheckMonitorLimit.mockResolvedValue({
        allowed: true,
        currentCount: 0,
        limit: 10,
      })

      const request = createRequest({
        url: 'https://example.com',
        monitors: [
          { type: 'http', name: 'a', target: 'https://example.com' },
          { type: 'ssl',  name: 'b', target: 'https://example.com' },
        ],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(mockCreateMonitor).toHaveBeenCalledTimes(2)
      expect(body.skipped).toBe(0)
    })

    it('treats unlimited (limit=null) as no cap on the loop', async () => {
      mockCheckMonitorLimit.mockResolvedValue({
        allowed: true,
        currentCount: 99,
        limit: null,   // unlimited plan
      })

      const request = createRequest({
        url: 'https://example.com',
        monitors: [
          { type: 'http', name: 'a', target: 'https://example.com' },
          { type: 'ssl',  name: 'b', target: 'https://example.com' },
          { type: 'dns',  name: 'c', target: 'https://example.com' },
        ],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(mockCreateMonitor).toHaveBeenCalledTimes(3)
      expect(body.skipped).toBe(0)
    })
  })

  describe('successful monitor creation', () => {
    it('creates monitors and runs first check', async () => {
      const request = createRequest({
        url: 'https://example.com',
        monitors: [
          { type: 'http', name: 'HTTP Check', target: 'https://example.com' },
          { type: 'ssl', name: 'SSL Check', target: 'example.com' },
        ],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.monitors).toHaveLength(2)
      expect(mockCreateMonitor).toHaveBeenCalledTimes(2)
      expect(mockDispatchChecker).toHaveBeenCalledTimes(2)
      expect(mockWriteCheckResult).toHaveBeenCalledTimes(2)
      expect(mockUpdateMonitorStatus).toHaveBeenCalledTimes(2)
    })

    it('returns check results with monitor data', async () => {
      const request = createRequest({
        url: 'https://example.com',
        monitors: [
          { type: 'http', name: 'HTTP Check', target: 'https://example.com' },
        ],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(body.monitors[0]).toMatchObject({
        name: 'HTTP Check',
        type: 'http',
        target: 'https://example.com',
        status: 'up',
        responseTimeMs: 150,
        statusCode: 200,
        metadata: null,
      })
    })

    it('skips invalid monitor types', async () => {
      const request = createRequest({
        url: 'https://example.com',
        monitors: [
          { type: 'http', name: 'HTTP Check', target: 'https://example.com' },
          { type: 'invalid_type', name: 'Bad Monitor', target: 'example.com' },
        ],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(body.success).toBe(true)
      // Only the valid http monitor should be created
      expect(body.monitors).toHaveLength(1)
      expect(mockCreateMonitor).toHaveBeenCalledTimes(1)
    })
  })

  describe('workspace not found', () => {
    it('returns 400 when no workspace exists', async () => {
      mockGetWorkspacesByOrg.mockResolvedValue([])

      const request = createRequest({
        url: 'https://example.com',
        monitors: [{ type: 'http', name: 'Test', target: 'https://example.com' }],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('No workspace')
    })
  })

  describe('error handling', () => {
    it('continues if one monitor creation fails', async () => {
      mockCreateMonitor
        .mockResolvedValueOnce(null) // first fails
        .mockResolvedValueOnce({ id: 'mon-2', name: 'SSL', type: 'ssl', target: 'example.com' })

      const request = createRequest({
        url: 'https://example.com',
        monitors: [
          { type: 'http', name: 'HTTP Check', target: 'https://example.com' },
          { type: 'ssl', name: 'SSL Check', target: 'example.com' },
        ],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(body.success).toBe(true)
      // Both monitors are in the results: one with status 'error', one successful
      expect(body.monitors).toHaveLength(2)
      expect(body.monitors[0].status).toBe('error')
      expect(body.monitors[1].status).toBe('up')
    })

    it('handles checker failure gracefully', async () => {
      mockDispatchChecker.mockRejectedValue(new Error('Check timed out'))

      const request = createRequest({
        url: 'https://example.com',
        monitors: [
          { type: 'http', name: 'HTTP Check', target: 'https://example.com' },
        ],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.monitors[0].status).toBe('down')
      expect(body.monitors[0].errorMessage).toContain('Check timed out')
    })

    it('returns 500 on unexpected error', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Unexpected DB error'))

      const request = createRequest({
        url: 'https://example.com',
        monitors: [{ type: 'http', name: 'Test', target: 'https://example.com' }],
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.error).toContain('Something went wrong')
    })
  })
})

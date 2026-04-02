import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()

function buildChain(terminal: () => unknown) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockImplementation(terminal)
  // For calls that don't end with .single(), the chain itself is the result
  return chain
}

let mockChain: ReturnType<typeof buildChain>
let mockTerminalData: unknown = null
let mockTerminalError: unknown = null

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      mockChain = buildChain(() => ({
        data: mockTerminalData,
        error: mockTerminalError,
      }))
      // Override order to return the terminal result directly (for getAllPlans)
      mockChain.order = vi.fn().mockReturnValue({
        data: mockTerminalData,
        error: mockTerminalError,
      })
      // Override select to return the chain AND also store for eq chaining
      const originalSelect = mockChain.select as ReturnType<typeof vi.fn>
      mockChain.select = vi.fn().mockImplementation((...args: unknown[]) => {
        mockSelect(...args)
        return mockChain
      })
      mockChain.insert = vi.fn().mockImplementation((data: unknown) => {
        mockInsert(data)
        return mockChain
      })
      mockChain.update = vi.fn().mockImplementation((data: unknown) => {
        mockUpdate(data)
        return mockChain
      })
      mockChain.eq = vi.fn().mockImplementation((...args: unknown[]) => {
        mockEq(...args)
        return mockChain
      })
      return mockChain
    },
  }),
}))

// Must import AFTER mocks
import {
  getAllPlans,
  getPlanBySlug,
  getPlanById,
  updatePlan,
  createPlan,
  togglePlanActive,
  getSubscriberCountsByPlan,
} from '@/lib/db/plans'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockPlan = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Starter',
  slug: 'starter',
  type: 'direct',
  price_monthly_gbp: 19,
  price_monthly_usd: 24,
  price_monthly_inr: 1999,
  price_annual_gbp: null,
  price_annual_usd: null,
  price_annual_inr: null,
  onboarding_fee_gbp: 0,
  monitor_limit: 10,
  client_workspace_limit: null,
  max_team_members: 3,
  check_interval_seconds: 300,
  data_retention_days: 90,
  has_api_access: true,
  has_ai_predictive: false,
  has_status_page_custom_domain: false,
  has_white_label: false,
  has_voice_calls: false,
  voice_call_monthly_limit: 0,
  is_visible: true,
  stripe_price_id_monthly: null,
  stripe_price_id_annual: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lib/db/plans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTerminalData = null
    mockTerminalError = null
  })

  // ── getAllPlans ──────────────────────────────────────────────────────

  describe('getAllPlans', () => {
    it('returns plans ordered by price ascending on success', async () => {
      mockTerminalData = [mockPlan]
      mockTerminalError = null
      const result = await getAllPlans()
      expect(result).toEqual([mockPlan])
    })

    it('returns empty array on error', async () => {
      mockTerminalData = null
      mockTerminalError = { message: 'connection failed' }
      const result = await getAllPlans()
      expect(result).toEqual([])
    })

    it('returns empty array when data is null', async () => {
      mockTerminalData = null
      mockTerminalError = null
      const result = await getAllPlans()
      expect(result).toEqual([])
    })
  })

  // ── getPlanBySlug ───────────────────────────────────────────────────

  describe('getPlanBySlug', () => {
    it('returns plan when found', async () => {
      mockTerminalData = mockPlan
      mockTerminalError = null
      const result = await getPlanBySlug('starter')
      expect(result).toEqual(mockPlan)
    })

    it('returns null on error', async () => {
      mockTerminalData = null
      mockTerminalError = { message: 'not found' }
      const result = await getPlanBySlug('nonexistent')
      expect(result).toBeNull()
    })
  })

  // ── getPlanById ─────────────────────────────────────────────────────

  describe('getPlanById', () => {
    it('returns plan when found', async () => {
      mockTerminalData = mockPlan
      mockTerminalError = null
      const result = await getPlanById(mockPlan.id)
      expect(result).toEqual(mockPlan)
    })

    it('returns null on error', async () => {
      mockTerminalData = null
      mockTerminalError = { message: 'not found' }
      const result = await getPlanById('bad-id')
      expect(result).toBeNull()
    })
  })

  // ── updatePlan ──────────────────────────────────────────────────────

  describe('updatePlan', () => {
    it('returns updated plan on success', async () => {
      const updated = { ...mockPlan, name: 'Starter Pro' }
      mockTerminalData = updated
      mockTerminalError = null
      const result = await updatePlan(mockPlan.id, { name: 'Starter Pro' })
      expect(result).toEqual(updated)
    })

    it('returns null on error', async () => {
      mockTerminalData = null
      mockTerminalError = { message: 'update failed' }
      const result = await updatePlan(mockPlan.id, { name: 'X' })
      expect(result).toBeNull()
    })
  })

  // ── createPlan ──────────────────────────────────────────────────────

  describe('createPlan', () => {
    it('returns created plan on success', async () => {
      mockTerminalData = mockPlan
      mockTerminalError = null
      const { id, created_at, updated_at, ...planData } = mockPlan
      const result = await createPlan(planData as Parameters<typeof createPlan>[0])
      expect(result).toEqual(mockPlan)
    })

    it('returns null on error', async () => {
      mockTerminalData = null
      mockTerminalError = { message: 'duplicate slug' }
      const { id, created_at, updated_at, ...planData } = mockPlan
      const result = await createPlan(planData as Parameters<typeof createPlan>[0])
      expect(result).toBeNull()
    })
  })

  // ── togglePlanActive ────────────────────────────────────────────────

  describe('togglePlanActive', () => {
    it('returns plan with updated visibility on success', async () => {
      const toggled = { ...mockPlan, is_visible: false }
      mockTerminalData = toggled
      mockTerminalError = null
      const result = await togglePlanActive(mockPlan.id, false)
      expect(result).toEqual(toggled)
      expect(result?.is_visible).toBe(false)
    })

    it('returns null on error', async () => {
      mockTerminalData = null
      mockTerminalError = { message: 'not found' }
      const result = await togglePlanActive('bad-id', true)
      expect(result).toBeNull()
    })
  })
})

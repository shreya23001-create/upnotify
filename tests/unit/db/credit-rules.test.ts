import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

let mockTerminalData: unknown = null
let mockTerminalError: unknown = null

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.update = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.single = vi.fn().mockImplementation(() => ({
        data: mockTerminalData,
        error: mockTerminalError,
      }))
      chain.order = vi.fn().mockReturnValue({
        data: mockTerminalData,
        error: mockTerminalError,
      })
      return chain
    },
  }),
}))

import {
  getAllCreditRules,
  updateCreditRule,
  toggleCreditRuleActive,
} from '@/lib/db/credit-rules'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockRule = {
  id: 'cr-001',
  rule_key: 'referral_signup',
  display_name: 'Referral Sign-up Bonus',
  credit_amount_pence: 500,
  credit_type: 'referral',
  max_per_user: 10,
  max_credit_per_month_pence: 5000,
  is_active: true,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lib/db/credit-rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTerminalData = null
    mockTerminalError = null
  })

  // ── getAllCreditRules ────────────────────────────────────────────────

  describe('getAllCreditRules', () => {
    it('returns all rules ordered by rule_key on success', async () => {
      mockTerminalData = [mockRule]
      mockTerminalError = null
      const result = await getAllCreditRules()
      expect(result).toEqual([mockRule])
    })

    it('returns empty array on error', async () => {
      mockTerminalData = null
      mockTerminalError = { message: 'connection timeout' }
      const result = await getAllCreditRules()
      expect(result).toEqual([])
    })

    it('returns empty array when data is null', async () => {
      mockTerminalData = null
      mockTerminalError = null
      const result = await getAllCreditRules()
      expect(result).toEqual([])
    })
  })

  // ── updateCreditRule ────────────────────────────────────────────────

  describe('updateCreditRule', () => {
    it('returns updated rule on success', async () => {
      const updated = { ...mockRule, credit_amount_pence: 750 }
      mockTerminalData = updated
      mockTerminalError = null
      const result = await updateCreditRule('cr-001', { credit_amount_pence: 750 })
      expect(result).toEqual(updated)
      expect(result?.credit_amount_pence).toBe(750)
    })

    it('returns null on error', async () => {
      mockTerminalData = null
      mockTerminalError = { message: 'not found' }
      const result = await updateCreditRule('bad-id', { credit_amount_pence: 100 })
      expect(result).toBeNull()
    })
  })

  // ── toggleCreditRuleActive ──────────────────────────────────────────

  describe('toggleCreditRuleActive', () => {
    it('returns rule with is_active toggled to false', async () => {
      const deactivated = { ...mockRule, is_active: false }
      mockTerminalData = deactivated
      mockTerminalError = null
      const result = await toggleCreditRuleActive('cr-001', false)
      expect(result).toEqual(deactivated)
      expect(result?.is_active).toBe(false)
    })

    it('returns rule with is_active toggled to true', async () => {
      const activated = { ...mockRule, is_active: true }
      mockTerminalData = activated
      mockTerminalError = null
      const result = await toggleCreditRuleActive('cr-001', true)
      expect(result).toEqual(activated)
      expect(result?.is_active).toBe(true)
    })

    it('returns null on error', async () => {
      mockTerminalData = null
      mockTerminalError = { message: 'rule not found' }
      const result = await toggleCreditRuleActive('bad-id', true)
      expect(result).toBeNull()
    })
  })
})

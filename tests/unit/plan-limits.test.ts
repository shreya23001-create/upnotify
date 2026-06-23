import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

/** Controls what the mocked supabase returns for each `.from(table)` call. */
let mockSubscriptionResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockCountResult: { count: number | null } = { count: 0 }

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (_table: string) => {
      // Subscriptions query (used by getPlanLimits):
      //   .select('*, plans(*)').eq('org_id', orgId).in('status', [...]).order(...).limit(1).maybeSingle()
      // Count queries (monitors, workspaces, users):
      //   .select('id', { count: 'exact', head: true }).eq(...)
      return {
        select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === 'exact') {
            // Count query — flat terminal
            return {
              eq: () => ({ count: mockCountResult.count }),
            }
          }
          // Subscription query — full fluent chain
          const chain: Record<string, unknown> = {}
          const terminal = {
            single:      () => mockSubscriptionResult,
            maybeSingle: () => mockSubscriptionResult,
          }
          Object.assign(chain, {
            eq:    () => chain,
            in:    () => chain,
            order: () => chain,
            limit: () => ({ ...terminal }),
            ...terminal,
          })
          return chain
        },
      }
    },
  }),
}))

import {
  getPlanLimits,
  checkMonitorLimit,
  checkWorkspaceLimit,
  checkFeatureAccess,
  checkTeamMemberLimit,
} from '@/lib/utils/plan-limits'

// ---------------------------------------------------------------------------
// Plan fixtures
// ---------------------------------------------------------------------------

const starterPlan = {
  monitor_limit: 10,
  client_workspace_limit: 3,
  max_team_members: 3,
  has_api_access: true,
  has_ai_predictive: false,
  has_status_page_custom_domain: false,
  has_white_label: false,
  has_voice_calls: false,
  check_interval_seconds: 300,
}

const usageBasedPlan = {
  monitor_limit: null, // unlimited
  client_workspace_limit: null,
  max_team_members: 50,
  has_api_access: true,
  has_ai_predictive: true,
  has_status_page_custom_domain: true,
  has_white_label: true,
  has_voice_calls: true,
  check_interval_seconds: 30,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lib/utils/plan-limits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSubscriptionResult = { data: null, error: null }
    mockCountResult = { count: 0 }
  })

  // ── getPlanLimits ───────────────────────────────────────────────────

  describe('getPlanLimits', () => {
    it('returns Free defaults when no active subscription exists', async () => {
      mockSubscriptionResult = { data: null, error: null }
      const limits = await getPlanLimits('org-no-sub')
      expect(limits).toEqual({
        monitors: 3,
        workspaces: 1,
        maxTeamMembers: 0,
        competitors: 3,
        hasEmailAlerts: true,
        hasSlackTeams: false,
        hasWebhooks: false,
        hasStatusPages: false,
        statusPageLimit: 0,
        hasStatusPageCustomDomain: false,
        hasAiPredictive: false,
        aiReportLimit: 0,
        hasApiAccess: false,
        hasWhiteLabel: false,
        hasVoiceCalls: false,
        checkIntervalSeconds: 600,
        wpMonitors: 0,
      })
    })

    it('returns Free defaults when subscription has no plan joined', async () => {
      mockSubscriptionResult = { data: { plans: null }, error: null }
      const limits = await getPlanLimits('org-broken-sub')
      expect(limits).toEqual({
        monitors: 3,
        workspaces: 1,
        maxTeamMembers: 0,
        competitors: 3,
        hasEmailAlerts: true,
        hasSlackTeams: false,
        hasWebhooks: false,
        hasStatusPages: false,
        statusPageLimit: 0,
        hasStatusPageCustomDomain: false,
        hasAiPredictive: false,
        aiReportLimit: 0,
        hasApiAccess: false,
        hasWhiteLabel: false,
        hasVoiceCalls: false,
        checkIntervalSeconds: 600,
        wpMonitors: 0,
      })
    })

    it('returns plan limits from active subscription', async () => {
      mockSubscriptionResult = {
        data: { plans: starterPlan },
        error: null,
      }
      const limits = await getPlanLimits('org-starter')
      expect(limits.monitors).toBe(10)
      expect(limits.workspaces).toBe(3)
      expect(limits.maxTeamMembers).toBe(3)
      expect(limits.hasApiAccess).toBe(true)
      expect(limits.hasAiPredictive).toBe(false)
      expect(limits.checkIntervalSeconds).toBe(300)
    })

    it('handles usage-based plan with null (unlimited) limits', async () => {
      mockSubscriptionResult = {
        data: { plans: usageBasedPlan },
        error: null,
      }
      const limits = await getPlanLimits('org-usage')
      expect(limits.monitors).toBeNull()
      expect(limits.workspaces).toBeNull()
      expect(limits.hasWhiteLabel).toBe(true)
    })
  })

  // ── checkMonitorLimit ───────────────────────────────────────────────

  describe('checkMonitorLimit', () => {
    it('allows when user is within monitor limit', async () => {
      mockSubscriptionResult = { data: { plans: starterPlan }, error: null }
      mockCountResult = { count: 5 }
      const result = await checkMonitorLimit('org-ok')
      expect(result.allowed).toBe(true)
      expect(result.currentCount).toBe(5)
      expect(result.limit).toBe(10)
      expect(result.shouldNudge).toBe(false)
    })

    it('blocks when user is at exact monitor limit', async () => {
      mockSubscriptionResult = { data: { plans: starterPlan }, error: null }
      mockCountResult = { count: 10 }
      const result = await checkMonitorLimit('org-at-limit')
      expect(result.allowed).toBe(false)
      expect(result.currentCount).toBe(10)
      expect(result.limit).toBe(10)
    })

    it('blocks when user is above limit (data corruption scenario)', async () => {
      mockSubscriptionResult = { data: { plans: starterPlan }, error: null }
      mockCountResult = { count: 15 }
      const result = await checkMonitorLimit('org-over')
      expect(result.allowed).toBe(false)
      expect(result.currentCount).toBe(15)
      expect(result.limit).toBe(10)
    })

    it('applies Free defaults (3 monitors) when no subscription', async () => {
      mockSubscriptionResult = { data: null, error: null }
      mockCountResult = { count: 2 }
      const result = await checkMonitorLimit('org-free')
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(3)
    })

    it('blocks Free user at 3 monitors', async () => {
      mockSubscriptionResult = { data: null, error: null }
      mockCountResult = { count: 3 }
      const result = await checkMonitorLimit('org-free-full')
      expect(result.allowed).toBe(false)
      expect(result.limit).toBe(3)
      expect(result.currentCount).toBe(3)
    })

    it('allows unlimited monitors on usage-based plan', async () => {
      mockSubscriptionResult = { data: { plans: usageBasedPlan }, error: null }
      mockCountResult = { count: 100 }
      const result = await checkMonitorLimit('org-usage')
      expect(result.allowed).toBe(true)
      expect(result.limit).toBeNull()
    })

    it('nudges at 15 monitors on usage-based plan', async () => {
      mockSubscriptionResult = { data: { plans: usageBasedPlan }, error: null }
      mockCountResult = { count: 15 }
      const result = await checkMonitorLimit('org-nudge')
      expect(result.allowed).toBe(true)
      expect(result.shouldNudge).toBe(true)
    })

    it('does not nudge at 14 monitors on usage-based plan', async () => {
      mockSubscriptionResult = { data: { plans: usageBasedPlan }, error: null }
      mockCountResult = { count: 14 }
      const result = await checkMonitorLimit('org-no-nudge')
      expect(result.allowed).toBe(true)
      expect(result.shouldNudge).toBe(false)
    })
  })

  // ── checkWorkspaceLimit ─────────────────────────────────────────────

  describe('checkWorkspaceLimit', () => {
    it('allows when within workspace limit', async () => {
      mockSubscriptionResult = { data: { plans: starterPlan }, error: null }
      mockCountResult = { count: 1 }
      const result = await checkWorkspaceLimit('org-ok')
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(3)
    })

    it('blocks at exact workspace limit', async () => {
      mockSubscriptionResult = { data: { plans: starterPlan }, error: null }
      mockCountResult = { count: 3 }
      const result = await checkWorkspaceLimit('org-full')
      expect(result.allowed).toBe(false)
      expect(result.limit).toBe(3)
    })

    it('applies Free default of 1 workspace when no subscription', async () => {
      mockSubscriptionResult = { data: null, error: null }
      mockCountResult = { count: 0 }
      const result = await checkWorkspaceLimit('org-free')
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(1)
    })
  })

  // ── checkTeamMemberLimit ────────────────────────────────────────────

  describe('checkTeamMemberLimit', () => {
    it('allows solo owner when team member limit is 0 (Free tier)', async () => {
      // limit=0 means solo only; owner counts as 1 user
      mockSubscriptionResult = { data: null, error: null }
      mockCountResult = { count: 1 }
      const result = await checkTeamMemberLimit('org-solo')
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(0)
      expect(result.currentCount).toBe(1)
    })

    it('blocks adding second member when limit is 0 (solo only)', async () => {
      mockSubscriptionResult = { data: null, error: null }
      mockCountResult = { count: 2 }
      const result = await checkTeamMemberLimit('org-solo-over')
      expect(result.allowed).toBe(false)
      expect(result.limit).toBe(0)
      expect(result.currentCount).toBe(2)
    })

    it('allows team members within limit (owner + members < limit + 1)', async () => {
      // Starter has max_team_members=3, so allowed count is 3+1=4 total users
      mockSubscriptionResult = { data: { plans: starterPlan }, error: null }
      mockCountResult = { count: 3 }
      const result = await checkTeamMemberLimit('org-team')
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(3)
    })

    it('blocks at exact team member limit', async () => {
      // 3 team members + 1 owner = 4, so count=4 means we are at the limit
      mockSubscriptionResult = { data: { plans: starterPlan }, error: null }
      mockCountResult = { count: 4 }
      const result = await checkTeamMemberLimit('org-team-full')
      expect(result.allowed).toBe(false)
      expect(result.limit).toBe(3)
    })

    it('blocks when above team member limit (data corruption)', async () => {
      mockSubscriptionResult = { data: { plans: starterPlan }, error: null }
      mockCountResult = { count: 10 }
      const result = await checkTeamMemberLimit('org-team-over')
      expect(result.allowed).toBe(false)
      expect(result.limit).toBe(3)
    })

    it('handles null count as 0', async () => {
      mockSubscriptionResult = { data: null, error: null }
      mockCountResult = { count: null }
      const result = await checkTeamMemberLimit('org-null-count')
      // count=0 with limit=0: 0 <= 1 is true
      expect(result.allowed).toBe(true)
      expect(result.currentCount).toBe(0)
    })
  })

  // ── checkFeatureAccess ──────────────────────────────────────────────

  describe('checkFeatureAccess', () => {
    it('returns true for features included in plan', async () => {
      mockSubscriptionResult = { data: { plans: starterPlan }, error: null }
      const result = await checkFeatureAccess('org-starter', 'hasApiAccess')
      expect(result).toBe(true)
    })

    it('returns false for features not included in plan', async () => {
      mockSubscriptionResult = { data: { plans: starterPlan }, error: null }
      const result = await checkFeatureAccess('org-starter', 'hasWhiteLabel')
      expect(result).toBe(false)
    })

    it('returns false for all premium features on Free tier', async () => {
      mockSubscriptionResult = { data: null, error: null }
      expect(await checkFeatureAccess('org-free', 'hasApiAccess')).toBe(false)
      expect(await checkFeatureAccess('org-free', 'hasAiPredictive')).toBe(false)
      expect(await checkFeatureAccess('org-free', 'hasStatusPageCustomDomain')).toBe(false)
      expect(await checkFeatureAccess('org-free', 'hasWhiteLabel')).toBe(false)
      expect(await checkFeatureAccess('org-free', 'hasVoiceCalls')).toBe(false)
    })
  })
})

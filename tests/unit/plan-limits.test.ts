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
      // Count queries (monitors, workspaces, users, reports):
      //   .select('id', { count: 'exact', head: true }).eq(...)[.gte(...)]
      return {
        select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === 'exact') {
            // Count query — supports .eq().gte() chain used by checkAiReportLimit (bug #111)
            const countTerminal = { count: mockCountResult.count }
            return {
              eq: () => ({
                ...countTerminal,
                gte: () => countTerminal,
                lte: () => countTerminal,
              }),
              gte: () => countTerminal,
              lte: () => countTerminal,
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
  checkAiReportLimit,
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

// Builder plan — used for bug #111 (AI report limit) and bug #113 (white-label)
const builderPlan = {
  monitor_limit: 50,
  client_workspace_limit: 10,
  max_team_members: 10,
  has_api_access: true,
  has_ai_predictive: true,
  has_status_page_custom_domain: false,
  has_white_label: false,
  has_voice_calls: false,
  check_interval_seconds: 60,
  ai_report_limit: 5,
  competitor_limit: 10,
  has_email_alerts: true,
  has_slack_teams: true,
  has_webhooks: true,
  has_status_pages: true,
  status_page_limit: 3,
  wp_monitor_limit: 5,
}

// Scale plan — unlimited AI reports and white-label
const scalePlan = {
  ...builderPlan,
  monitor_limit: null,
  ai_report_limit: -1,
  has_white_label: true,
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

    it('retains plan limits for past_due subscription (bug #104)', async () => {
      // past_due means payment failed but Stripe is still retrying.
      // The org paid for this plan — they must NOT be silently downgraded to Free
      // while Stripe works through its retry schedule.
      // This test simulates the DB returning a past_due row (because
      // .in('status', ['active','cancelling','paused','past_due']) now includes 'past_due').
      mockSubscriptionResult = { data: { plans: starterPlan }, error: null }
      const limits = await getPlanLimits('org-past-due')
      expect(limits.monitors).toBe(10)           // NOT Free default of 3
      expect(limits.maxTeamMembers).toBe(3)       // plan value, not Free 0
      expect(limits.checkIntervalSeconds).toBe(300) // plan value, not Free 600
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
    it('blocks adding member when limit is 0 (Free tier solo plan)', async () => {
      // limit=0 means solo plan — no additional members can ever be added.
      // checkTeamMemberLimit answers "can we add another member?" so limit=0 → false.
      mockSubscriptionResult = { data: null, error: null }
      mockCountResult = { count: 1 }
      const result = await checkTeamMemberLimit('org-solo')
      expect(result.allowed).toBe(false)
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

    it('handles null count as 0 (Free tier, still blocked)', async () => {
      // count=null (no users recorded) treated as 0; limit=0 still blocks new members
      mockSubscriptionResult = { data: null, error: null }
      mockCountResult = { count: null }
      const result = await checkTeamMemberLimit('org-null-count')
      expect(result.allowed).toBe(false)
      expect(result.currentCount).toBe(0)
      expect(result.limit).toBe(0)
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

    it('returns true for hasWhiteLabel on Scale plan (bug #113)', async () => {
      mockSubscriptionResult = { data: { plans: scalePlan }, error: null }
      const result = await checkFeatureAccess('org-scale', 'hasWhiteLabel')
      expect(result).toBe(true)
    })

    it('returns false for hasWhiteLabel on Builder plan (bug #113)', async () => {
      mockSubscriptionResult = { data: { plans: builderPlan }, error: null }
      const result = await checkFeatureAccess('org-builder', 'hasWhiteLabel')
      expect(result).toBe(false)
    })
  })

  // ── checkAiReportLimit ──────────────────────────────────────────────
  // Bug #111: previously always returned allowed=true; now correctly queries DB.

  describe('checkAiReportLimit', () => {
    it('blocks immediately when plan has aiReportLimit=0 (Free tier)', async () => {
      mockSubscriptionResult = { data: null, error: null } // Free defaults: aiReportLimit=0
      const result = await checkAiReportLimit('org-free')
      expect(result.allowed).toBe(false)
      expect(result.currentCount).toBe(0)
      expect(result.limit).toBe(0)
    })

    it('allows unlimited reports when aiReportLimit=-1 (Scale plan)', async () => {
      mockSubscriptionResult = { data: { plans: scalePlan }, error: null } // aiReportLimit=-1
      const result = await checkAiReportLimit('org-scale')
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(-1)
    })

    it('allows when current month count is under limit', async () => {
      mockSubscriptionResult = { data: { plans: builderPlan }, error: null } // aiReportLimit=5
      mockCountResult = { count: 3 }
      const result = await checkAiReportLimit('org-builder')
      expect(result.allowed).toBe(true)
      expect(result.currentCount).toBe(3)
      expect(result.limit).toBe(5)
    })

    it('blocks when current month count equals limit', async () => {
      mockSubscriptionResult = { data: { plans: builderPlan }, error: null } // aiReportLimit=5
      mockCountResult = { count: 5 }
      const result = await checkAiReportLimit('org-builder-full')
      expect(result.allowed).toBe(false)
      expect(result.currentCount).toBe(5)
      expect(result.limit).toBe(5)
    })

    it('blocks when current month count exceeds limit (corruption scenario)', async () => {
      mockSubscriptionResult = { data: { plans: builderPlan }, error: null } // aiReportLimit=5
      mockCountResult = { count: 8 }
      const result = await checkAiReportLimit('org-builder-over')
      expect(result.allowed).toBe(false)
      expect(result.currentCount).toBe(8)
      expect(result.limit).toBe(5)
    })

    it('handles null DB count as 0 (first report of month)', async () => {
      mockSubscriptionResult = { data: { plans: builderPlan }, error: null }
      mockCountResult = { count: null }
      const result = await checkAiReportLimit('org-builder-first')
      expect(result.allowed).toBe(true)
      expect(result.currentCount).toBe(0)
      expect(result.limit).toBe(5)
    })

    it('Scale plan gets unlimited (aiReportLimit=-1) — migration 00104 fix (bug #117)', async () => {
      // Migration 00036 incorrectly set ai_report_limit=0 for Scale.
      // Migration 00104 fixes it to -1 (unlimited). This test verifies the -1 path.
      mockSubscriptionResult = { data: { plans: scalePlan }, error: null } // ai_report_limit: -1
      const result = await checkAiReportLimit('org-scale')
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(-1)
      // With aiReportLimit=-1, the DB is NOT queried — short-circuits immediately
    })

    it('aiReportLimit=0 blocks even if DB count is 0 (Free/Lite — not Scale)', async () => {
      // Ensures 0 means "feature off" (Free/Lite), not "unlimited" (Scale uses -1)
      mockSubscriptionResult = { data: null, error: null } // Free defaults: aiReportLimit=0
      mockCountResult = { count: 0 }
      const result = await checkAiReportLimit('org-free')
      expect(result.allowed).toBe(false)
      expect(result.limit).toBe(0)
    })
  })
})

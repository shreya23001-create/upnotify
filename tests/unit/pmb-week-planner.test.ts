import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}))

vi.mock('@/lib/utils/config', () => ({
  getServerConfig: vi.fn(() => ({
    cron: { secret: 'test-secret' },
  })),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock('@/lib/utils/cron-logger', () => ({
  startCronRun: vi.fn(() => 'run-001'),
  endCronRun: vi.fn(),
  getTriggeredBy: vi.fn(() => 'test'),
}))

describe('PMB week-planner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('generates only leaderboard runs (no pairwise)', async () => {
    // Simulate the logic from week-planner/route.ts
    const monitors = [
      { id: 'mon-1', domain: 'stripe.com', display_name: 'Stripe', category: 'fintech', pmb_category: 'fintech', pmb_enabled: true },
      { id: 'mon-2', domain: 'aws.amazon.com', display_name: 'AWS', category: 'cloud', pmb_category: 'cloud', pmb_enabled: true },
      { id: 'mon-3', domain: 'square.com', display_name: 'Square', category: 'fintech', pmb_category: 'fintech', pmb_enabled: true },
      { id: 'mon-4', domain: 'gcp.google.com', display_name: 'Google Cloud', category: 'cloud', pmb_category: 'cloud', pmb_enabled: true },
    ]

    const categories = [
      { slug: 'fintech', display_name: 'Fintech', emoji: '💳', default_keywords: [], is_active: true },
      { slug: 'cloud', display_name: 'Cloud', emoji: '☁️', default_keywords: [], is_active: true },
    ]

    // Build category map
    const categoryMap = new Map(categories.map(c => [c.slug, c]))

    // Group monitors by category (same logic as week-planner)
    const byCategory = new Map<string, typeof monitors>()
    for (const m of monitors) {
      const slug = m.pmb_category ?? m.category
      if (!categoryMap.has(slug)) continue
      const group = byCategory.get(slug) ?? []
      group.push(m)
      byCategory.set(slug, group)
    }

    // Generate runs (NEW: leaderboard only, no pairwise)
    interface LeaderboardRun {
      post_type: string
      category_slug: string
      monitor_id: string | null
      compare_monitor_id: string | null
    }
    const allRuns: LeaderboardRun[] = []

    for (const [slug, group] of byCategory.entries()) {
      // Leaderboard only (pairwise removed)
      if (group.length >= 2) {
        allRuns.push({
          post_type: 'leaderboard',
          category_slug: slug,
          monitor_id: null,
          compare_monitor_id: null,
        })
      }
    }

    // Assertions
    expect(allRuns.length).toBe(2)
    expect(allRuns.every(r => r.post_type === 'leaderboard')).toBe(true)
    expect(allRuns.some(r => r.category_slug === 'fintech')).toBe(true)
    expect(allRuns.some(r => r.category_slug === 'cloud')).toBe(true)
    expect(allRuns.every(r => r.monitor_id === null && r.compare_monitor_id === null)).toBe(true)
  })

  it('produces zero pairwise runs', async () => {
    // Verify pairwise generation is completely removed
    const monitors = [
      { id: 'mon-1', domain: 'a.com', display_name: 'A', category: 'test', pmb_category: 'test', pmb_enabled: true },
      { id: 'mon-2', domain: 'b.com', display_name: 'B', category: 'test', pmb_category: 'test', pmb_enabled: true },
      { id: 'mon-3', domain: 'c.com', display_name: 'C', category: 'test', pmb_category: 'test', pmb_enabled: true },
      { id: 'mon-4', domain: 'd.com', display_name: 'D', category: 'test', pmb_category: 'test', pmb_enabled: true },
    ]

    const categories = [
      { slug: 'test', display_name: 'Test', emoji: '🧪', default_keywords: [], is_active: true },
    ]

    const categoryMap = new Map(categories.map(c => [c.slug, c]))
    const byCategory = new Map<string, typeof monitors>()

    for (const m of monitors) {
      const slug = m.pmb_category ?? m.category
      if (!categoryMap.has(slug)) continue
      const group = byCategory.get(slug) ?? []
      group.push(m)
      byCategory.set(slug, group)
    }

    interface LeaderboardRun {
      post_type: string
      category_slug: string
      monitor_id: null
      compare_monitor_id: null
    }
    const allRuns: LeaderboardRun[] = []

    for (const [slug, group] of byCategory.entries()) {
      // Only leaderboard — NO pairwise loop
      if (group.length >= 2) {
        allRuns.push({
          post_type: 'leaderboard',
          category_slug: slug,
          monitor_id: null,
          compare_monitor_id: null,
        })
      }
    }

    const pairwiseCount = allRuns.filter(r => r.post_type === 'pairwise').length
    expect(pairwiseCount).toBe(0)
    expect(allRuns.length).toBe(1)
  })

  it('does not generate pairwise when category has only 1 monitor', async () => {
    const monitors = [
      { id: 'mon-1', domain: 'lonely.com', display_name: 'Lonely', category: 'solo', pmb_category: 'solo', pmb_enabled: true },
    ]

    const categories = [
      { slug: 'solo', display_name: 'Solo', emoji: '🎭', default_keywords: [], is_active: true },
    ]

    const categoryMap = new Map(categories.map(c => [c.slug, c]))
    const byCategory = new Map<string, typeof monitors>()

    for (const m of monitors) {
      const slug = m.pmb_category ?? m.category
      if (!categoryMap.has(slug)) continue
      const group = byCategory.get(slug) ?? []
      group.push(m)
      byCategory.set(slug, group)
    }

    interface LeaderboardRun {
      post_type: string
      category_slug: string
      monitor_id: null
      compare_monitor_id: null
    }
    const allRuns: LeaderboardRun[] = []

    for (const [slug, group] of byCategory.entries()) {
      // Needs ≥2 monitors for leaderboard
      if (group.length >= 2) {
        allRuns.push({
          post_type: 'leaderboard',
          category_slug: slug,
          monitor_id: null,
          compare_monitor_id: null,
        })
      }
    }

    expect(allRuns.length).toBe(0)
  })
})

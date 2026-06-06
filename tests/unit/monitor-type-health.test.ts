import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

interface MonitorRow { id: string; type: string }
interface CheckRow   { monitor_id: string; status: 'up' | 'down' | 'degraded'; response_time_ms: number | null; error_message: string | null }

let mockMonitors: MonitorRow[] = []
let mockChecks:   CheckRow[]   = []

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'monitors') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: mockMonitors, error: null }),
            }),
          }),
        }
      }
      if (table === 'check_results') {
        return {
          select: () => ({
            gte: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: mockChecks, error: null }),
              }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { computeMonitorTypeHealth } from '@/app/api/admin/monitor-type-health/route'

describe('computeMonitorTypeHealth', () => {
  beforeEach(() => {
    mockMonitors = []
    mockChecks   = []
  })

  it('returns one row per type in monitorTypeCount, even when the type has zero checks in window', async () => {
    // Regression for the bug shipped: types with no rows in the limited
    // check_results page disappeared from the dashboard entirely.
    mockMonitors = [
      { id: 'm-ssl-1',  type: 'ssl' },
      { id: 'm-ssl-2',  type: 'ssl' },
      { id: 'm-ping-1', type: 'ping' },
    ]
    mockChecks = [
      { monitor_id: 'm-ping-1', status: 'up', response_time_ms: 50, error_message: null },
    ]

    const out = await computeMonitorTypeHealth(24)

    const types = out.map(r => r.type).sort()
    expect(types).toEqual(['ping', 'ssl'])

    const ssl = out.find(r => r.type === 'ssl')!
    expect(ssl.status).toBe('no-data')
    expect(ssl.totalMonitors).toBe(2)
    expect(ssl.totalChecks).toBe(0)
  })

  it('does not drop a type when its check_results land outside the LIMIT page', async () => {
    // The pre-fix path returned check_results in physical/index order, so
    // types whose monitor_ids sorted high lost all their rows to the limit.
    // With explicit .order('checked_at', DESC) and ample CHECKS_CAP, every
    // type that has any check in the window must appear with counts > 0.
    mockMonitors = [
      { id: 'm-a', type: 'http' },
      { id: 'm-b', type: 'cookie-consent' },
      { id: 'm-c', type: 'sitemap' },
    ]
    mockChecks = [
      { monitor_id: 'm-a', status: 'up', response_time_ms: 100, error_message: null },
      { monitor_id: 'm-b', status: 'up', response_time_ms: 200, error_message: null },
      { monitor_id: 'm-c', status: 'up', response_time_ms: 300, error_message: null },
    ]

    const out = await computeMonitorTypeHealth(1)

    for (const t of ['http', 'cookie-consent', 'sitemap']) {
      const row = out.find(r => r.type === t)!
      expect(row, `${t} present`).toBeDefined()
      expect(row.totalChecks, `${t} totalChecks > 0`).toBeGreaterThan(0)
      expect(row.status, `${t} status`).not.toBe('no-data')
    }
  })

  it('drops check_results whose monitor_id is unknown (paused or stale)', async () => {
    mockMonitors = [{ id: 'm-known', type: 'http' }]
    mockChecks = [
      { monitor_id: 'm-known',   status: 'up',   response_time_ms: 100, error_message: null },
      { monitor_id: 'm-deleted', status: 'down', response_time_ms: null, error_message: 'gone' },
    ]
    const out = await computeMonitorTypeHealth(1)
    expect(out).toHaveLength(1)
    expect(out[0].totalChecks).toBe(1)
    expect(out[0].downChecks).toBe(0)
  })

  it('computes uptime %, avg response time, and failure breakdown', async () => {
    mockMonitors = [{ id: 'm-1', type: 'http' }]
    mockChecks = [
      { monitor_id: 'm-1', status: 'up',       response_time_ms: 100, error_message: null },
      { monitor_id: 'm-1', status: 'up',       response_time_ms: 200, error_message: null },
      { monitor_id: 'm-1', status: 'up',       response_time_ms: 300, error_message: null },
      { monitor_id: 'm-1', status: 'down',     response_time_ms: 800, error_message: 'timeout' },
    ]
    const out = await computeMonitorTypeHealth(1)
    expect(out[0].totalChecks).toBe(4)
    expect(out[0].upChecks).toBe(3)
    expect(out[0].downChecks).toBe(1)
    expect(out[0].uptimePercent).toBe(75)
    expect(out[0].avgResponseMs).toBe(350)
    expect(out[0].failingMonitors).toBe(1)
    expect(out[0].status).toBe('healthy') // 25% failure < 75% threshold
  })

  it('returns [] when there are no active monitors', async () => {
    mockMonitors = []
    mockChecks   = []
    const out = await computeMonitorTypeHealth(24)
    expect(out).toEqual([])
  })
})

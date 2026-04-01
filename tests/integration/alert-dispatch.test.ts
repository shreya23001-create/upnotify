import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSendAlertEmail = vi.fn()
vi.mock('@/lib/services/email', () => ({
  sendAlertEmail: (...args: unknown[]) => mockSendAlertEmail(...args),
}))

const mockSendSlackAlert = vi.fn()
vi.mock('@/lib/services/slack', () => ({
  sendSlackAlert: (...args: unknown[]) => mockSendSlackAlert(...args),
}))

const mockSendWebhookAlert = vi.fn()
vi.mock('@/lib/services/webhook', () => ({
  sendWebhookAlert: (...args: unknown[]) => mockSendWebhookAlert(...args),
}))

const mockSupabaseFrom = vi.fn()
const mockSupabaseSelect = vi.fn()
const mockSupabaseInsert = vi.fn()
const mockSupabaseEq = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      mockSupabaseFrom(table)
      return {
        select: (...args: unknown[]) => {
          mockSupabaseSelect(...args)
          return {
            eq: (_col: string, _val: string) => {
              mockSupabaseEq(_col, _val)
              return {
                eq: (_col2: string, _val2: unknown) => {
                  mockSupabaseEq(_col2, _val2)
                  return { data: mockChannelsData, error: null }
                },
              }
            },
          }
        },
        insert: (data: unknown) => {
          mockSupabaseInsert(data)
          return { error: null }
        },
      }
    },
  }),
}))

vi.mock('@/lib/utils/config', () => ({
  getConfig: () => ({
    app: { url: 'https://uptrue.io' },
  }),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Import module under test
// ---------------------------------------------------------------------------

import { dispatchAlerts, dispatchRecoveryAlerts } from '@/lib/services/alert-dispatcher'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let mockChannelsData: Array<Record<string, unknown>> = []

function makeIncident(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'inc-001',
    org_id: 'org-001',
    workspace_id: 'ws-001',
    monitor_id: 'mon-001',
    title: 'API Server is down',
    status: 'open',
    severity: 'high',
    started_at: '2026-04-01T10:00:00Z',
    resolved_at: null,
    ...overrides,
  }
}

function makeMonitor(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'mon-001',
    org_id: 'org-001',
    name: 'API Server',
    type: 'http',
    target: 'https://api.example.com',
    status: 'down',
    ...overrides,
  }
}

function makeEmailChannel(): Record<string, unknown> {
  return {
    id: 'ch-email',
    org_id: 'org-001',
    type: 'email',
    name: 'Email Alert',
    is_enabled: true,
    severity_filter: ['high', 'critical'],
    config: { email: 'ops@example.com' },
  }
}

function makeSlackChannel(): Record<string, unknown> {
  return {
    id: 'ch-slack',
    org_id: 'org-001',
    type: 'slack',
    name: 'Slack Alert',
    is_enabled: true,
    severity_filter: ['high', 'critical'],
    config: { slackWebhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' },
  }
}

function makeWebhookChannel(secret?: string): Record<string, unknown> {
  return {
    id: 'ch-webhook',
    org_id: 'org-001',
    type: 'webhook',
    name: 'Webhook Alert',
    is_enabled: true,
    severity_filter: ['high', 'critical'],
    config: {
      webhookUrl: 'https://hooks.example.com/uptrue',
      ...(secret && { webhookSecret: secret }),
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('alert-dispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannelsData = []
  })

  // ── Email alert ────────────────────────────────────────────────────

  it('sends email alert via Resend when email channel matches severity', async () => {
    mockChannelsData = [makeEmailChannel()]
    mockSendAlertEmail.mockResolvedValue({ success: true })

    const incident = makeIncident()
    const monitor = makeMonitor()
    await dispatchAlerts(incident as never, monitor as never)

    expect(mockSendAlertEmail).toHaveBeenCalledTimes(1)
    expect(mockSendAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ops@example.com',
        subject: expect.stringContaining('API Server'),
      })
    )
    // Alert recorded in DB
    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-001',
        incident_id: 'inc-001',
        channel_id: 'ch-email',
        status: 'sent',
      })
    )
  })

  it('records failed status when email send fails', async () => {
    mockChannelsData = [makeEmailChannel()]
    mockSendAlertEmail.mockResolvedValue({ success: false, error: 'Invalid recipient' })

    await dispatchAlerts(makeIncident() as never, makeMonitor() as never)

    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error_message: 'Invalid recipient',
      })
    )
  })

  // ── Slack alert ────────────────────────────────────────────────────

  it('sends Slack alert with blocks', async () => {
    mockChannelsData = [makeSlackChannel()]
    mockSendSlackAlert.mockResolvedValue({ success: true })

    await dispatchAlerts(makeIncident() as never, makeMonitor() as never)

    expect(mockSendSlackAlert).toHaveBeenCalledTimes(1)
    expect(mockSendSlackAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx',
        text: expect.stringContaining('API Server'),
        blocks: expect.arrayContaining([
          expect.objectContaining({ type: 'section' }),
        ]),
      })
    )
  })

  // ── Webhook alert with HMAC signing ────────────────────────────────

  it('sends webhook alert with HMAC secret', async () => {
    const secret = 'whsec_test123'
    mockChannelsData = [makeWebhookChannel(secret)]
    mockSendWebhookAlert.mockResolvedValue({ success: true })

    await dispatchAlerts(makeIncident() as never, makeMonitor() as never)

    expect(mockSendWebhookAlert).toHaveBeenCalledTimes(1)
    expect(mockSendWebhookAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://hooks.example.com/uptrue',
        secret: 'whsec_test123',
        payload: expect.objectContaining({
          event: 'incident.created',
          incident: expect.objectContaining({ id: 'inc-001' }),
          monitor: expect.objectContaining({ id: 'mon-001' }),
        }),
      })
    )
  })

  it('sends webhook without HMAC when no secret is configured', async () => {
    mockChannelsData = [makeWebhookChannel()]
    mockSendWebhookAlert.mockResolvedValue({ success: true })

    await dispatchAlerts(makeIncident() as never, makeMonitor() as never)

    expect(mockSendWebhookAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://hooks.example.com/uptrue',
        secret: undefined,
      })
    )
  })

  // ── Severity filter ────────────────────────────────────────────────

  it('does not send alert when severity does not match channel filter', async () => {
    mockChannelsData = [makeEmailChannel()]

    // Incident severity 'low' is not in the channel's ['high', 'critical'] filter
    const incident = makeIncident({ severity: 'low' })
    await dispatchAlerts(incident as never, makeMonitor() as never)

    expect(mockSendAlertEmail).not.toHaveBeenCalled()
    expect(mockSendSlackAlert).not.toHaveBeenCalled()
    expect(mockSendWebhookAlert).not.toHaveBeenCalled()
  })

  // ── No channels configured ────────────────────────────────────────

  it('does nothing when no alert channels exist for the org', async () => {
    mockChannelsData = []

    await dispatchAlerts(makeIncident() as never, makeMonitor() as never)

    expect(mockSendAlertEmail).not.toHaveBeenCalled()
    expect(mockSendSlackAlert).not.toHaveBeenCalled()
    expect(mockSendWebhookAlert).not.toHaveBeenCalled()
  })

  // ── Recovery alerts ───────────────────────────────────────────────

  it('sends recovery alert with resolved status', async () => {
    mockChannelsData = [makeWebhookChannel()]
    mockSendWebhookAlert.mockResolvedValue({ success: true })

    const resolvedIncident = makeIncident({
      status: 'resolved',
      resolved_at: '2026-04-01T10:15:00Z',
    })
    await dispatchRecoveryAlerts(resolvedIncident as never, makeMonitor() as never)

    expect(mockSendWebhookAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          event: 'incident.resolved',
          incident: expect.objectContaining({
            status: 'resolved',
          }),
        }),
      })
    )
  })

  // ── Multiple channels ─────────────────────────────────────────────

  it('dispatches to all matching channels in parallel', async () => {
    mockChannelsData = [
      makeEmailChannel(),
      makeSlackChannel(),
      makeWebhookChannel('secret'),
    ]
    mockSendAlertEmail.mockResolvedValue({ success: true })
    mockSendSlackAlert.mockResolvedValue({ success: true })
    mockSendWebhookAlert.mockResolvedValue({ success: true })

    await dispatchAlerts(makeIncident() as never, makeMonitor() as never)

    expect(mockSendAlertEmail).toHaveBeenCalledTimes(1)
    expect(mockSendSlackAlert).toHaveBeenCalledTimes(1)
    expect(mockSendWebhookAlert).toHaveBeenCalledTimes(1)
    // Three alert records inserted
    expect(mockSupabaseInsert).toHaveBeenCalledTimes(3)
  })

  // ── Channel dispatch error does not crash others ──────────────────

  it('continues dispatching when one channel throws', async () => {
    mockChannelsData = [makeEmailChannel(), makeSlackChannel()]
    mockSendAlertEmail.mockRejectedValue(new Error('SMTP timeout'))
    mockSendSlackAlert.mockResolvedValue({ success: true })

    // Should not throw — uses Promise.allSettled internally
    await dispatchAlerts(makeIncident() as never, makeMonitor() as never)

    expect(mockSendSlackAlert).toHaveBeenCalledTimes(1)
  })
})

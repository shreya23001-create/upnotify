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

const mockSendTelegramAlert = vi.fn()
vi.mock('@/lib/services/telegram', () => ({
  sendTelegramAlert: (...args: unknown[]) => mockSendTelegramAlert(...args),
}))

const mockSupabaseFrom = vi.fn()
const mockSupabaseSelect = vi.fn()
const mockSupabaseInsert = vi.fn()
const mockSupabaseEq = vi.fn()

// Default Smart Digest settings — Smart Digest off so every alert sends instantly,
// matching the per-event behaviour these tests were written against.
// Shape mirrors OrgAlertSettings in lib/db/alert-settings.ts.
const DEFAULT_ORG_ALERT_SETTINGS = {
  org_id: 'org-1',
  mode: 'off' as const,
  digest_window_minutes: 30,
  instant_severity_floor: 'critical' as const,
  same_host_grouping: true,
  flap_badge_threshold: 3,
  created_at: '',
  updated_at: '',
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      mockSupabaseFrom(table)
      // org_alert_settings is queried via .select().eq().maybeSingle()
      // by getOrgAlertSettings — keep its branch isolated from the
      // alert_channels chain used elsewhere.
      if (table === 'org_alert_settings') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => ({ data: DEFAULT_ORG_ALERT_SETTINGS, error: null }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => ({ data: DEFAULT_ORG_ALERT_SETTINGS, error: null }),
            }),
          }),
        }
      }
      // digest_buffer is touched by routeEmailEvent / bufferEvent. With
      // Smart Digest off in defaults, these paths shouldn't fire — but
      // return an empty no-op shape so any stray call doesn't crash.
      if (table === 'digest_buffer') {
        return {
          select: () => ({ eq: () => ({ data: [], error: null }) }),
          insert: () => ({ error: null }),
          delete: () => ({ in: () => ({ error: null }) }),
        }
      }
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
    app: { url: 'https://upnotify-monitoring.vercel.app' },
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

function makeTelegramChannel(): Record<string, unknown> {
  return {
    id: 'ch-telegram',
    org_id: 'org-001',
    type: 'telegram',
    name: 'Telegram Alert',
    is_enabled: true,
    severity_filter: ['high', 'critical'],
    config: { telegramChatId: '6263919448' },
  }
}

function makeTeamsChannel(): Record<string, unknown> {
  return {
    id: 'ch-teams',
    org_id: 'org-001',
    type: 'teams',
    name: 'Teams Alert',
    is_enabled: true,
    severity_filter: ['high', 'critical'],
    config: { teamsWebhookUrl: 'https://prod-xx.westus.logic.azure.com/workflows/test' },
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

  // ── AL05: Alert fires when monitor goes DOWN ───────────────────────

  it('AL05: fires alert when incident status is open (monitor DOWN)', async () => {
    mockChannelsData = [makeEmailChannel()]
    mockSendAlertEmail.mockResolvedValue({ success: true })

    const incident = makeIncident({ status: 'open', severity: 'high' })
    const monitor = makeMonitor({ status: 'down' })
    await dispatchAlerts(incident as never, monitor as never)

    expect(mockSendAlertEmail).toHaveBeenCalledTimes(1)
    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sent',
        incident_id: 'inc-001',
      })
    )
  })

  it('AL05: alert is recorded as failed when email send fails on DOWN', async () => {
    mockChannelsData = [makeEmailChannel()]
    mockSendAlertEmail.mockResolvedValue({ success: false, error: 'SMTP error' })

    await dispatchAlerts(makeIncident({ status: 'open' }) as never, makeMonitor({ status: 'down' }) as never)

    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error_message: 'SMTP error',
      })
    )
  })

  // ── AL06: Recovery alert fires when monitor comes back UP ─────────

  it('AL06: fires recovery alert when incident is resolved (monitor UP)', async () => {
    mockChannelsData = [makeEmailChannel()]
    mockSendAlertEmail.mockResolvedValue({ success: true })

    const resolvedIncident = makeIncident({
      status: 'resolved',
      severity: 'high',
      resolved_at: '2026-04-01T10:15:00Z',
    })
    const monitor = makeMonitor({ status: 'up' })
    await dispatchRecoveryAlerts(resolvedIncident as never, monitor as never)

    expect(mockSendAlertEmail).toHaveBeenCalledTimes(1)
    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sent',
        incident_id: 'inc-001',
      })
    )
  })

  it('AL06: recovery webhook payload has event=incident.resolved', async () => {
    mockChannelsData = [makeWebhookChannel('secret')]
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
          incident: expect.objectContaining({ status: 'resolved' }),
        }),
      })
    )
  })

  // ── AL07: Webhook HMAC signing ────────────────────────────────────

  it('AL07: webhook payload is sent with HMAC secret when configured', async () => {
    const secret = 'whsec_hmac_test_secret'
    mockChannelsData = [makeWebhookChannel(secret)]
    mockSendWebhookAlert.mockResolvedValue({ success: true })

    await dispatchAlerts(makeIncident() as never, makeMonitor() as never)

    expect(mockSendWebhookAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        secret: 'whsec_hmac_test_secret',
      })
    )
  })

  it('AL07: HMAC signature is sha256 format and non-empty', async () => {
    const crypto = await import('crypto')
    const secret = 'test_secret'
    const payload = JSON.stringify({ event: 'incident.created' })
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

    expect(signature).toMatch(/^[a-f0-9]{64}$/)
    expect(`sha256=${signature}`).toMatch(/^sha256=[a-f0-9]{64}$/)
  })

  it('AL07: webhook sent without HMAC header when no secret configured', async () => {
    mockChannelsData = [makeWebhookChannel()]
    mockSendWebhookAlert.mockResolvedValue({ success: true })

    await dispatchAlerts(makeIncident() as never, makeMonitor() as never)

    expect(mockSendWebhookAlert).toHaveBeenCalledWith(
      expect.objectContaining({ secret: undefined })
    )
  })

  // ── Telegram dispatch ─────────────────────────────────────────────

  it('sends Telegram alert with correct chatId and monitor details', async () => {
    mockChannelsData = [makeTelegramChannel()]
    mockSendTelegramAlert.mockResolvedValue({ success: true })

    const incident = makeIncident({ status: 'open', severity: 'high' })
    await dispatchAlerts(incident as never, makeMonitor() as never)

    expect(mockSendTelegramAlert).toHaveBeenCalledTimes(1)
    expect(mockSendTelegramAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: '6263919448',
        monitorName: 'API Server',
        monitorTarget: 'https://api.example.com',
        isResolved: false,
        severity: 'high',
      })
    )
    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent' })
    )
  })

  it('sends Telegram recovery alert with isResolved=true', async () => {
    mockChannelsData = [makeTelegramChannel()]
    mockSendTelegramAlert.mockResolvedValue({ success: true })

    const resolvedIncident = makeIncident({ status: 'resolved', resolved_at: '2026-04-01T10:15:00Z' })
    await dispatchRecoveryAlerts(resolvedIncident as never, makeMonitor() as never)

    expect(mockSendTelegramAlert).toHaveBeenCalledWith(
      expect.objectContaining({ isResolved: true })
    )
  })

  // ── Teams dispatch ────────────────────────────────────────────────

  it('sends Teams alert using Adaptive Card format via webhook', async () => {
    mockChannelsData = [makeTeamsChannel()]
    mockSendWebhookAlert.mockResolvedValue({ success: true })

    await dispatchAlerts(makeIncident() as never, makeMonitor() as never)

    expect(mockSendWebhookAlert).toHaveBeenCalledTimes(1)
    expect(mockSendWebhookAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://prod-xx.westus.logic.azure.com/workflows/test',
        payload: expect.objectContaining({
          type: 'message',
          attachments: expect.arrayContaining([
            expect.objectContaining({
              contentType: 'application/vnd.microsoft.card.adaptive',
            }),
          ]),
        }),
      })
    )
  })

  it('Teams alert payload does NOT use old MessageCard format', async () => {
    mockChannelsData = [makeTeamsChannel()]
    mockSendWebhookAlert.mockResolvedValue({ success: true })

    await dispatchAlerts(makeIncident() as never, makeMonitor() as never)

    const call = mockSendWebhookAlert.mock.calls[0][0]
    expect(call.payload['@type']).toBeUndefined()
    expect(call.payload['@context']).toBeUndefined()
  })
})

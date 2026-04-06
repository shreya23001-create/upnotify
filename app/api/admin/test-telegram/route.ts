import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConfig, getServerConfig } from '@/lib/utils/config'
import { sendTelegramAlert } from '@/lib/services/telegram'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/test-telegram
 *
 * Admin-only. Sends a test Telegram alert to verify the bot token and Chat ID work.
 *
 * Body (optional):
 *   chatId — override the Chat ID to test (defaults to reading from query param or body)
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const config = getConfig()

  if (!user || !config.admin.emails.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as { chatId?: string }
  const serverConfig = getServerConfig()

  const diagnostics = {
    botTokenConfigured: !!serverConfig.telegram.botToken,
    botTokenLength: serverConfig.telegram.botToken.length,
    adminChatIdConfigured: !!serverConfig.telegram.chatId,
    targetChatId: body.chatId || serverConfig.telegram.chatId || '(none)',
  }

  if (!serverConfig.telegram.botToken) {
    return NextResponse.json({
      ok: false,
      error: 'TELEGRAM_BOT_TOKEN is not set in environment variables',
      diagnostics,
    }, { status: 500 })
  }

  const targetChatId = body.chatId || serverConfig.telegram.chatId

  if (!targetChatId) {
    return NextResponse.json({
      ok: false,
      error: 'No chatId provided. Pass { chatId: "your-chat-id" } in the request body.',
      diagnostics,
    }, { status: 400 })
  }

  const result = await sendTelegramAlert({
    chatId: targetChatId,
    monitorName: 'Test Monitor (github.com)',
    monitorTarget: 'https://github.com',
    isResolved: false,
    severity: 'P2',
    monitorUrl: `${config.app.url}/dashboard/monitors/test`,
  })

  return NextResponse.json({
    ok: result.success,
    error: result.error ?? null,
    targetChatId,
    diagnostics,
  })
}

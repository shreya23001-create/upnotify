import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getTicketById, getMessages } from '@/lib/db/support'
import { logger } from '@/lib/utils/logger'
import Anthropic from '@anthropic-ai/sdk'
import { getServerConfig } from '@/lib/utils/config'

/**
 * POST /api/v1/support/tickets/[id]/ai-draft
 * Admin only. Generates an AI draft reply based on ticket history.
 * Returns { draft: string }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
    if (!adminEmails.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const [ticket, messages] = await Promise.all([
      getTicketById(id),
      getMessages(id),
    ])

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const { anthropic: { apiKey } } = getServerConfig()
    if (!apiKey) {
      return NextResponse.json({ error: 'AI drafting is not configured.' }, { status: 503 })
    }

    const client = new Anthropic({ apiKey })

    const conversation = messages.map(m =>
      `[${m.author_type === 'admin' ? 'Support Team' : 'User'}]: ${m.body}`
    ).join('\n\n')

    const prompt = `You are a friendly, professional support agent for Upnotify — an uptime monitoring SaaS.

A customer has submitted a support ticket. Draft a helpful, concise reply.

Ticket subject: ${ticket.subject}
Category: ${ticket.category}
Priority: ${ticket.priority}
Status: ${ticket.status}

Conversation so far:
${conversation || '(No messages yet — this is the first reply)'}

Write a professional support reply that:
- Acknowledges the customer's issue
- Provides a clear, helpful response or next steps
- Is warm but concise (2-4 short paragraphs)
- Does NOT include a subject line or greeting like "Dear Customer" — start with the main content
- Does NOT include a sign-off like "Best regards" — end with the message content only

Reply:`

    const response = await Promise.race([
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI draft timed out')), 15000)
      ),
    ])

    const draft = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    return NextResponse.json({ success: true, draft })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('AI draft route error', { error: message })
    return NextResponse.json({ error: 'Something went wrong generating the draft.' }, { status: 500 })
  }
}

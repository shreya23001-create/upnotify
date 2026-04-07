import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getTicketById, addMessage } from '@/lib/db/support'
import { dispatchSupportWebhook } from '@/lib/services/support-alerts'
import { logger } from '@/lib/utils/logger'

async function getAuthContext(request: NextRequest): Promise<{
  userId: string | null
  orgId:  string | null
  name:   string | null
  isAdmin: boolean
}> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    if (process.env.SUPPORT_API_KEY && token === process.env.SUPPORT_API_KEY) {
      return { userId: null, orgId: null, name: 'Support Team', isAdmin: true }
    }
  }
  const user = await getCurrentUser()
  if (!user) return { userId: null, orgId: null, name: null, isAdmin: false }
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  return {
    userId:  user.id,
    orgId:   user.org_id,
    name:    user.full_name ?? user.email,
    isAdmin: adminEmails.includes(user.email),
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/support/tickets/:id/messages
// Users reply to own ticket | Admin/Bearer reply as admin
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await getAuthContext(request)
    if (!auth.userId && !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { id } = await params

    // Load ticket — user must own it, admin can reply to any
    const ticket = await getTicketById(id, auth.isAdmin ? undefined : auth.orgId ?? undefined)
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'Ticket is closed — cannot add messages' }, { status: 400 })
    }

    const body = await request.json() as Record<string, unknown>
    const { message, author_name } = body as { message?: string; author_name?: string }

    if (!message || typeof message !== 'string' || message.trim().length < 1) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }

    const authorType = auth.isAdmin ? 'admin' : 'user'
    const authorName = author_name?.trim()
      || auth.name
      || (auth.isAdmin ? 'Support Team' : 'User')

    const newMessage = await addMessage({
      ticketId:   id,
      orgId:      ticket.org_id,
      authorType,
      authorName,
      body:       message.trim(),
    })

    if (!newMessage) {
      return NextResponse.json({ error: 'Failed to add message' }, { status: 500 })
    }

    dispatchSupportWebhook('ticket.message_added', {
      ticket_id:   id,
      message:     newMessage,
      author_type: authorType,
    }).catch(() => undefined)

    logger.info('Support message added', { ticketId: id, authorType })
    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (err) {
    logger.error('POST /api/v1/support/tickets/[id]/messages failed', { error: String(err) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

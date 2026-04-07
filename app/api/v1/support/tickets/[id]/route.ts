import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getTicketById, getMessages, updateTicket, deleteTicket } from '@/lib/db/support'
import { dispatchSupportWebhook } from '@/lib/services/support-alerts'
import { logger } from '@/lib/utils/logger'
import type { TicketStatus, TicketPriority } from '@/lib/db/support'

async function getAuthContext(request: NextRequest): Promise<{
  userId: string | null; orgId: string | null; isAdmin: boolean
}> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    if (process.env.SUPPORT_API_KEY && token === process.env.SUPPORT_API_KEY) {
      return { userId: null, orgId: null, isAdmin: true }
    }
  }
  const user = await getCurrentUser()
  if (!user) return { userId: null, orgId: null, isAdmin: false }
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  return { userId: user.id, orgId: user.org_id, isAdmin: adminEmails.includes(user.email) }
}

// ---------------------------------------------------------------------------
// GET /api/v1/support/tickets/:id
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await getAuthContext(request)
    if (!auth.userId && !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { id } = await params
    // Admin sees any ticket; user only sees own org
    const ticket = await getTicketById(id, auth.isAdmin ? undefined : auth.orgId ?? undefined)
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const messages = await getMessages(id)
    return NextResponse.json({ ticket, messages })
  } catch (err) {
    logger.error('GET /api/v1/support/tickets/[id] failed', { error: String(err) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/support/tickets/:id  — admin only
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await getAuthContext(request)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const ticket = await getTicketById(id)
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const body = await request.json() as Record<string, unknown>
    const { status, priority, assigned_to } = body as {
      status?:      string
      priority?:    string
      assigned_to?: string | null
    }

    const validStatuses: TicketStatus[] = ['open', 'in_progress', 'waiting_on_user', 'resolved', 'closed']
    const validPriorities: TicketPriority[] = ['low', 'normal', 'high', 'urgent']

    const updates: Parameters<typeof updateTicket>[1] = {}
    if (status      && validStatuses.includes(status as TicketStatus))       updates.status      = status as TicketStatus
    if (priority    && validPriorities.includes(priority as TicketPriority)) updates.priority    = priority as TicketPriority
    if ('assigned_to' in body) updates.assigned_to = typeof assigned_to === 'string' ? assigned_to : null
    if (updates.status === 'resolved' || updates.status === 'closed') {
      updates.resolved_at = new Date().toISOString()
    }

    const updated = await updateTicket(id, updates)
    if (!updated) return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })

    if (updates.status && updates.status !== ticket.status) {
      dispatchSupportWebhook('ticket.status_changed', {
        ticket: updated, previous_status: ticket.status,
      }).catch(() => undefined)
    }
    if (updates.status === 'closed') {
      dispatchSupportWebhook('ticket.closed', { ticket: updated }).catch(() => undefined)
    }

    logger.info('Support ticket updated', { ticketId: id, updates })
    return NextResponse.json({ ticket: updated })
  } catch (err) {
    logger.error('PATCH /api/v1/support/tickets/[id] failed', { error: String(err) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/support/tickets/:id  — admin only
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await getAuthContext(request)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const deleted = await deleteTicket(id)
    if (!deleted) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    logger.info('Support ticket deleted', { ticketId: id })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('DELETE /api/v1/support/tickets/[id] failed', { error: String(err) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

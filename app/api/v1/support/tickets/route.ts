import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { createTicket, getTicketsByOrg, getAllTickets } from '@/lib/db/support'
import { alertAdminNewTicket, dispatchSupportWebhook } from '@/lib/services/support-alerts'
import { logger } from '@/lib/utils/logger'
import type { TicketCategory, TicketPriority, TicketFilter } from '@/lib/db/support'

// ---------------------------------------------------------------------------
// Auth helper — supports both session and Bearer (for future external tool)
// ---------------------------------------------------------------------------

async function getAuthContext(request: NextRequest): Promise<{
  userId: string | null
  orgId:  string | null
  email:  string | null
  name:   string | null
  isAdmin: boolean
}> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supportApiKey = process.env.SUPPORT_API_KEY
    if (supportApiKey && token === supportApiKey) {
      return { userId: null, orgId: null, email: null, name: 'Support API', isAdmin: true }
    }
  }
  const user = await getCurrentUser()
  if (!user) return { userId: null, orgId: null, email: null, name: null, isAdmin: false }
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  return {
    userId:  user.id,
    orgId:   user.org_id,
    email:   user.email,
    name:    user.full_name ?? user.email,
    isAdmin: adminEmails.includes(user.email),
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/support/tickets
// User: own org tickets | Admin/Bearer: all tickets with filters
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthContext(request)
    if (!auth.userId && !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const url = new URL(request.url)
    const filter: TicketFilter = {
      status:   (url.searchParams.get('status')   ?? 'all') as TicketFilter['status'],
      priority: (url.searchParams.get('priority') ?? 'all') as TicketFilter['priority'],
      category: (url.searchParams.get('category') ?? 'all') as TicketFilter['category'],
      page:     parseInt(url.searchParams.get('page')  ?? '1', 10),
      limit:    parseInt(url.searchParams.get('limit') ?? '50', 10),
    }

    if (auth.isAdmin) {
      const orgId = url.searchParams.get('org_id') ?? undefined
      const tickets = await getAllTickets({ ...filter, orgId })
      return NextResponse.json({ tickets })
    }

    const tickets = await getTicketsByOrg(auth.orgId!, filter)
    return NextResponse.json({ tickets })
  } catch (err) {
    logger.error('GET /api/v1/support/tickets failed', { error: String(err) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/support/tickets  — create ticket (users only)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthContext(request)
    if (!auth.userId || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json() as Record<string, unknown>
    const { subject, category, priority, message, attachments } = body as {
      subject?:     string
      category?:    string
      priority?:    string
      message?:     string
      attachments?: unknown
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      return NextResponse.json({ error: 'Subject is required (min 3 characters)' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ error: 'Message is required (min 10 characters)' }, { status: 400 })
    }

    const validCategories: TicketCategory[] = ['billing', 'technical', 'feature_request', 'bug', 'general']
    const validPriorities: TicketPriority[] = ['low', 'normal', 'high', 'urgent']

    const ticket = await createTicket({
      orgId:        auth.orgId,
      userId:       auth.userId,
      subject:      subject.trim(),
      category:     (validCategories.includes(category as TicketCategory) ? category : 'general') as TicketCategory,
      priority:     (validPriorities.includes(priority as TicketPriority) ? priority : 'normal') as TicketPriority,
      firstMessage: message.trim(),
      authorName:   (auth.name ?? auth.email ?? 'User'),
      firstMessageAttachments: Array.isArray(attachments)
        ? (attachments as Array<Record<string, unknown>>).map(a => ({
            path: typeof a?.path === 'string' ? a.path : '',
            name: typeof a?.name === 'string' ? a.name : undefined,
            mime: typeof a?.mime === 'string' ? a.mime : undefined,
            size: typeof a?.size === 'number' ? a.size : undefined,
          }))
        : undefined,
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    logger.info('Support ticket created', { orgId: auth.orgId, ticketId: ticket.id })

    // Fire-and-forget: admin alert + webhook
    alertAdminNewTicket(ticket, auth.email ?? 'unknown').catch(() => undefined)
    dispatchSupportWebhook('ticket.created', { ticket }).catch(() => undefined)

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (err) {
    logger.error('POST /api/v1/support/tickets failed', { error: String(err) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TicketCategory = 'billing' | 'technical' | 'feature_request' | 'bug' | 'general'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TicketStatus   = 'open' | 'in_progress' | 'waiting_on_user' | 'resolved' | 'closed'
export type AuthorType     = 'user' | 'admin'

export interface SupportTicket {
  id:             string
  org_id:         string
  user_id:        string
  subject:        string
  category:       TicketCategory
  priority:       TicketPriority
  status:         TicketStatus
  assigned_to:    string | null
  message_count:  number
  last_reply_at:  string | null
  last_reply_by:  AuthorType | null
  resolved_at:    string | null
  created_at:     string
  updated_at:     string
}

export interface SupportMessage {
  id:          string
  ticket_id:   string
  org_id:      string
  author_type: AuthorType
  author_name: string | null
  body:        string
  created_at:  string
}

export interface TicketFilter {
  status?:   TicketStatus | 'all'
  priority?: TicketPriority | 'all'
  category?: TicketCategory | 'all'
  orgId?:    string
  page?:     number
  limit?:    number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untyped(client: unknown): any { return client }

// ---------------------------------------------------------------------------
// Tickets — user-scoped (uses server client with RLS)
// ---------------------------------------------------------------------------

export async function createTicket(params: {
  orgId:     string
  userId:    string
  subject:   string
  category:  TicketCategory
  priority:  TicketPriority
  firstMessage: string
  authorName: string
}): Promise<SupportTicket | null> {
  const supabase = await createClient()

  const { data: ticket, error } = await untyped(supabase)
    .from('support_tickets')
    .insert({
      org_id:        params.orgId,
      user_id:       params.userId,
      subject:       params.subject,
      category:      params.category,
      priority:      params.priority,
      message_count: 1,
      last_reply_at: new Date().toISOString(),
      last_reply_by: 'user',
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create support ticket', { error: error.message })
    return null
  }

  // Write first message
  const { error: msgError } = await untyped(supabase)
    .from('support_messages')
    .insert({
      ticket_id:   ticket.id,
      org_id:      params.orgId,
      author_type: 'user',
      author_name: params.authorName,
      body:        params.firstMessage,
    })

  if (msgError) {
    logger.error('Failed to write first ticket message', { error: msgError.message })
  }

  return ticket as SupportTicket
}

export async function getTicketsByOrg(
  orgId: string,
  filter: TicketFilter = {}
): Promise<SupportTicket[]> {
  const supabase = await createClient()
  let query = untyped(supabase)
    .from('support_tickets')
    .select('*')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })

  if (filter.status && filter.status !== 'all') {
    query = query.eq('status', filter.status)
  }

  const limit = filter.limit ?? 50
  const offset = ((filter.page ?? 1) - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) {
    logger.error('Failed to get tickets by org', { error: error.message, orgId })
    return []
  }
  return (data ?? []) as SupportTicket[]
}

export async function getTicketById(
  id: string,
  orgId?: string
): Promise<SupportTicket | null> {
  const supabase = orgId ? await createClient() : createAdminClient()
  let query = untyped(supabase).from('support_tickets').select('*').eq('id', id)

  if (orgId) query = query.eq('org_id', orgId)

  const { data, error } = await query.single()
  if (error) {
    logger.error('Failed to get ticket', { error: error.message, id })
    return null
  }
  return data as SupportTicket
}

// ---------------------------------------------------------------------------
// Tickets — admin (uses admin client, bypasses RLS)
// ---------------------------------------------------------------------------

export async function getAllTickets(filter: TicketFilter = {}): Promise<SupportTicket[]> {
  const supabase = createAdminClient()
  let query = untyped(supabase)
    .from('support_tickets')
    .select('*')
    .order('updated_at', { ascending: false })

  if (filter.status   && filter.status   !== 'all') query = query.eq('status',   filter.status)
  if (filter.priority && filter.priority !== 'all') query = query.eq('priority', filter.priority)
  if (filter.category && filter.category !== 'all') query = query.eq('category', filter.category)
  if (filter.orgId)                                 query = query.eq('org_id',   filter.orgId)

  const limit = filter.limit ?? 100
  const offset = ((filter.page ?? 1) - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) {
    logger.error('Failed to get all tickets', { error: error.message })
    return []
  }
  return (data ?? []) as SupportTicket[]
}

export async function countTicketsByStatus(): Promise<Record<TicketStatus, number>> {
  const supabase = createAdminClient()
  const statuses: TicketStatus[] = ['open', 'in_progress', 'waiting_on_user', 'resolved', 'closed']
  const counts: Record<string, number> = {}

  await Promise.all(statuses.map(async (status) => {
    const { count } = await untyped(supabase)
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)
    counts[status] = count ?? 0
  }))

  return counts as Record<TicketStatus, number>
}

export async function updateTicket(
  id: string,
  updates: {
    status?:      TicketStatus
    priority?:    TicketPriority
    assigned_to?: string | null
    resolved_at?: string | null
  }
): Promise<SupportTicket | null> {
  const supabase = createAdminClient()
  const { data, error } = await untyped(supabase)
    .from('support_tickets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update ticket', { error: error.message, id })
    return null
  }
  return data as SupportTicket
}

export async function deleteTicket(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await untyped(supabase)
    .from('support_tickets')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Failed to delete ticket', { error: error.message, id })
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function getMessages(ticketId: string): Promise<SupportMessage[]> {
  // Use admin client — messages are fetched server-side in both user and admin views
  const supabase = createAdminClient()
  const { data, error } = await untyped(supabase)
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('Failed to get messages', { error: error.message, ticketId })
    return []
  }
  return (data ?? []) as SupportMessage[]
}

export async function addMessage(params: {
  ticketId:   string
  orgId:      string
  authorType: AuthorType
  authorName: string
  body:       string
}): Promise<SupportMessage | null> {
  const supabase = createAdminClient()

  const { data: message, error } = await untyped(supabase)
    .from('support_messages')
    .insert({
      ticket_id:   params.ticketId,
      org_id:      params.orgId,
      author_type: params.authorType,
      author_name: params.authorName,
      body:        params.body,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to add message', { error: error.message, ticketId: params.ticketId })
    return null
  }

  // Fetch current message_count then increment
  const { data: currentTicket } = await untyped(supabase)
    .from('support_tickets')
    .select('message_count')
    .eq('id', params.ticketId)
    .single()

  const ticketUpdates: Record<string, unknown> = {
    message_count: ((currentTicket as { message_count: number } | null)?.message_count ?? 0) + 1,
    last_reply_at: new Date().toISOString(),
    last_reply_by: params.authorType,
    updated_at:    new Date().toISOString(),
  }
  // User reply on a waiting ticket moves it back to in_progress
  if (params.authorType === 'user') {
    ticketUpdates.status = 'in_progress'
  }

  await untyped(supabase)
    .from('support_tickets')
    .update(ticketUpdates)
    .eq('id', params.ticketId)

  return message as SupportMessage
}

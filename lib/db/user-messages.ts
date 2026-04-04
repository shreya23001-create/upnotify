import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface UserMessage {
  id: string
  org_id: string | null
  user_id: string
  title: string
  body: string
  type: 'info' | 'warning' | 'success' | 'error' | 'system'
  category: 'general' | 'billing' | 'plan' | 'system' | 'announcement' | 'credit'
  is_read: boolean
  read_at: string | null
  action_url: string | null
  action_label: string | null
  created_at: string
  expires_at: string | null
  metadata: Record<string, unknown>
}

export async function getUserMessages(userId: string, limit = 20): Promise<UserMessage[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('user_messages')
    .select('*')
    .eq('user_id', userId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []) as UserMessage[]
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { count, error } = await supabase
    .from('user_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .or(`expires_at.is.null,expires_at.gt.${now}`)

  if (error) return 0
  return count ?? 0
}

export async function markMessageRead(messageId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('user_id', userId)

  return !error
}

export async function markAllRead(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false)

  return !error
}

/**
 * Send a message to a specific user. Used by system events
 * (plan expiry, credit approval, team invite, etc.)
 */
export async function sendUserMessage(params: {
  userId: string
  orgId?: string
  title: string
  body: string
  type?: 'info' | 'warning' | 'success' | 'error' | 'system'
  category?: 'general' | 'billing' | 'plan' | 'system' | 'announcement' | 'credit'
  actionUrl?: string
  actionLabel?: string
  expiresAt?: string
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('user_messages').insert({
    user_id: params.userId,
    org_id: params.orgId ?? null,
    title: params.title,
    body: params.body,
    type: params.type ?? 'info',
    category: params.category ?? 'general',
    action_url: params.actionUrl ?? null,
    action_label: params.actionLabel ?? null,
    expires_at: params.expiresAt ?? null,
    metadata: params.metadata ?? {},
  })

  return !error
}

/**
 * Broadcast a message to all users matching a plan/audience filter.
 * Used by admin panel for announcements, outage notices, etc.
 */
export async function broadcastMessage(params: {
  title: string
  body: string
  type?: 'info' | 'warning' | 'success' | 'error' | 'system'
  category?: string
  audience: 'all' | 'free' | 'lite' | 'builder' | 'scale' | 'trial' | 'agency'
  sentBy: string
  actionUrl?: string
  actionLabel?: string
}): Promise<{ recipientCount: number }> {
  const supabase = createAdminClient()

  // Get target users based on audience
  let userIds: string[] = []

  if (params.audience === 'all') {
    const { data } = await supabase.from('users').select('id')
    userIds = (data ?? []).map(u => u.id)
  } else if (params.audience === 'trial') {
    // Users on trial (no active subscription)
    const { data: allUsers } = await supabase.from('users').select('id, org_id')
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('org_id')
      .eq('status', 'active')

    const activeOrgIds = new Set((activeSubs ?? []).map(s => s.org_id))
    userIds = (allUsers ?? []).filter(u => !activeOrgIds.has(u.org_id)).map(u => u.id)
  } else {
    // Filter by plan slug
    const { data: orgs } = await supabase
      .from('subscriptions')
      .select('org_id, plans!inner(slug)')
      .eq('status', 'active')
      .eq('plans.slug', params.audience)

    const orgIds = (orgs ?? []).map((o: Record<string, unknown>) => o.org_id as string)
    if (orgIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .in('org_id', orgIds)

      userIds = (users ?? []).map(u => u.id)
    }
  }

  if (userIds.length === 0) {
    return { recipientCount: 0 }
  }

  // Insert messages for all recipients
  const messages = userIds.map(userId => ({
    user_id: userId,
    title: params.title,
    body: params.body,
    type: params.type ?? 'info',
    category: params.category ?? 'announcement',
    action_url: params.actionUrl ?? null,
    action_label: params.actionLabel ?? null,
  }))

  await supabase.from('user_messages').insert(messages)

  // Log the broadcast
  await supabase.from('admin_broadcasts').insert({
    title: params.title,
    body: params.body,
    type: params.type ?? 'info',
    category: params.category ?? 'announcement',
    audience: params.audience,
    sent_by: params.sentBy,
    recipient_count: userIds.length,
    action_url: params.actionUrl ?? null,
    action_label: params.actionLabel ?? null,
  })

  return { recipientCount: userIds.length }
}

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// email_providers and email_routing are new tables — not yet in generated types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

export type EmailProviderType = 'resend' | 'sendgrid' | 'smtp'

export type EmailType =
  | 'monitor_alert'
  | 'incident_notification'
  | 'blog_approval'
  | 'team_invite'
  | 'citation_report'
  | 'system'

export interface EmailProvider {
  id: string
  name: string
  type: EmailProviderType
  config: Record<string, unknown>
  from_email: string
  from_name: string
  is_active: boolean
  test_last_at: string | null
  test_status: 'ok' | 'error' | null
  test_error: string | null
  created_at: string
  updated_at: string
}

export interface EmailRouting {
  email_type: EmailType
  provider_id: string | null
  fallback_provider_id: string | null
  updated_at: string
}

export async function getEmailProviders(): Promise<EmailProvider[]> {
  const { data, error } = await db()
    .from('email_providers')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { logger.error('Failed to fetch email providers', { error: error.message }); return [] }
  return (data ?? []) as EmailProvider[]
}

export async function getEmailProvider(id: string): Promise<EmailProvider | null> {
  const { data, error } = await db()
    .from('email_providers')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) { logger.error('Failed to fetch email provider', { id, error: error.message }); return null }
  return data as EmailProvider | null
}

export async function createEmailProvider(input: {
  name: string; type: EmailProviderType; config: Record<string, unknown>
  from_email: string; from_name: string; is_active: boolean
}): Promise<EmailProvider | null> {
  const { data, error } = await db()
    .from('email_providers')
    .insert(input)
    .select()
    .single()
  if (error) { logger.error('Failed to create email provider', { error: error.message }); return null }
  return data as EmailProvider
}

export async function updateEmailProvider(
  id: string,
  input: Partial<Pick<EmailProvider, 'name' | 'type' | 'config' | 'from_email' | 'from_name' | 'is_active' | 'test_last_at' | 'test_status' | 'test_error'>>
): Promise<boolean> {
  const { error } = await db()
    .from('email_providers')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { logger.error('Failed to update email provider', { id, error: error.message }); return false }
  return true
}

export async function deleteEmailProvider(id: string): Promise<boolean> {
  const { error } = await db()
    .from('email_providers')
    .delete()
    .eq('id', id)
  if (error) { logger.error('Failed to delete email provider', { id, error: error.message }); return false }
  return true
}

export async function getEmailRoutings(): Promise<EmailRouting[]> {
  const { data, error } = await db()
    .from('email_routing')
    .select('*')
    .order('email_type')
  if (error) { logger.error('Failed to fetch email routings', { error: error.message }); return [] }
  return (data ?? []) as EmailRouting[]
}

export async function updateEmailRouting(
  emailType: EmailType, providerId: string | null, fallbackProviderId: string | null
): Promise<boolean> {
  const { error } = await db()
    .from('email_routing')
    .update({ provider_id: providerId, fallback_provider_id: fallbackProviderId, updated_at: new Date().toISOString() })
    .eq('email_type', emailType)
  if (error) { logger.error('Failed to update email routing', { emailType, error: error.message }); return false }
  return true
}

export async function resolveProviderForType(emailType: EmailType): Promise<EmailProvider | null> {
  const { data: routing } = await db()
    .from('email_routing')
    .select('provider_id, fallback_provider_id')
    .eq('email_type', emailType)
    .maybeSingle()

  const providerId = routing?.provider_id ?? null

  if (!providerId) {
    const { data: sys } = await db()
      .from('email_routing')
      .select('provider_id')
      .eq('email_type', 'system')
      .maybeSingle()
    if (!sys?.provider_id) return null
    return getEmailProvider(sys.provider_id as string)
  }

  const provider = await getEmailProvider(providerId as string)
  if (provider?.is_active) return provider

  const fallbackId = routing?.fallback_provider_id ?? null
  if (fallbackId) return getEmailProvider(fallbackId as string)
  return null
}

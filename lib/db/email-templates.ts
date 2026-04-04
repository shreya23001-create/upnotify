import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailTemplate {
  id: string
  template_key: string
  name: string
  subject: string
  body_text: string
  body_html: string
  is_active: boolean
  category: 'onboarding' | 'billing' | 'engagement' | 'system'
  variables: string[]
  send_count: number
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface UpdateEmailTemplateInput {
  subject?: string
  body_text?: string
  body_html?: string
  is_active?: boolean
  name?: string
  category?: EmailTemplate['category']
  variables?: string[]
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getAllEmailTemplates(): Promise<EmailTemplate[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    logger.error('Failed to fetch email templates', { error: error.message })
    return []
  }

  return (data ?? []) as EmailTemplate[]
}

export async function getEmailTemplateByKey(templateKey: string): Promise<EmailTemplate | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', templateKey)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    logger.error('Failed to fetch email template', { templateKey, error: error.message })
    return null
  }

  return data as EmailTemplate
}

export async function updateEmailTemplate(
  templateKey: string,
  updates: UpdateEmailTemplateInput
): Promise<EmailTemplate | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_templates')
    .update(updates)
    .eq('template_key', templateKey)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update email template', { templateKey, error: error.message })
    return null
  }

  return data as EmailTemplate
}

export async function toggleEmailTemplateActive(
  templateKey: string,
  isActive: boolean
): Promise<EmailTemplate | null> {
  return updateEmailTemplate(templateKey, { is_active: isActive })
}

export async function incrementEmailTemplateSendCount(templateKey: string): Promise<void> {
  const supabase = createAdminClient()

  // Fetch and update
  {
    const template = await getEmailTemplateByKey(templateKey)
    if (template) {
      await supabase
        .from('email_templates')
        .update({
          send_count: template.send_count + 1,
          last_sent_at: new Date().toISOString(),
        })
        .eq('template_key', templateKey)
    }
  }
}

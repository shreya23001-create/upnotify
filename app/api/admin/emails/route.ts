import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAllEmailTemplates,
  updateEmailTemplate,
  type UpdateEmailTemplateInput,
} from '@/lib/db/email-templates'

export const dynamic = 'force-dynamic'

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ isAdmin: boolean; email: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { isAdmin: false, email: '' }

  const adminEmailsRaw = process.env.ADMIN_EMAILS || ''
  const adminEmails = adminEmailsRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAdminUser = adminEmails.includes(user.email.toLowerCase())

  return { isAdmin: isAdminUser, email: user.email }
}

// ---------------------------------------------------------------------------
// GET — list all email templates
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { isAdmin: admin } = await isAdmin(supabase)

  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const templates = await getAllEmailTemplates()
  return NextResponse.json({ success: true, templates })
}

// ---------------------------------------------------------------------------
// PATCH — update a single template
// ---------------------------------------------------------------------------

export async function PATCH(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { isAdmin: admin } = await isAdmin(supabase)

  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as {
    template_key: string
    subject?: string
    body_text?: string
    body_html?: string
    is_active?: boolean
    name?: string
    category?: string
  }

  if (!body.template_key) {
    return NextResponse.json({ error: 'template_key is required' }, { status: 400 })
  }

  const updates: UpdateEmailTemplateInput = {}
  if (body.subject !== undefined) updates.subject = body.subject
  if (body.body_text !== undefined) updates.body_text = body.body_text
  if (body.body_html !== undefined) updates.body_html = body.body_html
  if (body.is_active !== undefined) updates.is_active = body.is_active
  if (body.name !== undefined) updates.name = body.name
  if (body.category !== undefined) {
    const validCategories = ['onboarding', 'billing', 'engagement', 'system']
    if (!validCategories.includes(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    updates.category = body.category as UpdateEmailTemplateInput['category']
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const updated = await updateEmailTemplate(body.template_key, updates)
  if (!updated) {
    return NextResponse.json({ error: 'Template not found or update failed' }, { status: 404 })
  }

  return NextResponse.json({ success: true, template: updated })
}

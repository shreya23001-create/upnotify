import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/services/email'

export const maxDuration = 30
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { escapeHtml } from '@/lib/utils/escape-html'
import { checkRateLimit, CONTACT_FORM_RATE_LIMIT } from '@/lib/utils/rate-limiter'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any

const SUBJECTS = ['General Enquiry', 'Agency Enquiry', 'Partnership', 'Billing', 'Feature Request']

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Anti-spam-relay: 5 submissions per hour per IP. Returns 429 with
  // Retry-After so well-behaved clients (and CDNs) can back off cleanly.
  const rate = checkRateLimit(req, CONTACT_FORM_RATE_LIMIT, 'contact-form')
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))),
        },
      },
    )
  }

  try {
    const body = await req.json() as {
      name?: string; email?: string; subject?: string; message?: string
    }

    const name    = body.name?.trim()
    const email   = body.email?.trim().toLowerCase()
    const subject = body.subject?.trim()
    const message = body.message?.trim()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (email.length > 254) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }
    if (!SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: 'Invalid subject.' }, { status: 400 })
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters).' }, { status: 400 })
    }

    const hdrs = await headers()
    const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? null

    const token = crypto.randomBytes(32).toString('hex')
    const config = getServerConfig()
    const appUrl = config.app.url

    const { error } = await db()
      .from('contact_messages')
      .insert({ name, email, subject, message, verification_token: token, ip_address: ip })

    if (error) {
      logger.error('Failed to save contact message', { error: error.message })
      return NextResponse.json({ error: 'Failed to save message. Please try again.' }, { status: 500 })
    }

    const verifyUrl = `${appUrl}/api/contact/verify?token=${token}`

    await sendEmail(
      email,
      'Please confirm your message to Upnotify',
      `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:40px auto;color:#111;">
        <h2 style="font-size:20px;margin-bottom:8px;">Confirm your message</h2>
        <p style="color:#555;margin-bottom:20px;">
          Hi ${escapeHtml(name)}, thanks for reaching out. Click the button below to confirm your message and send it to our team.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr><td style="border-radius:6px;background:#111827;">
            <a href="${verifyUrl}" style="display:block;padding:12px 28px;color:#fff;font-weight:600;font-size:15px;text-decoration:none;">
              Confirm &amp; Send Message
            </a>
          </td></tr>
        </table>
        <p style="font-size:13px;color:#888;">This link expires in 24 hours. If you didn't submit this message, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="font-size:12px;color:#aaa;">Your message: <em>${escapeHtml(subject)}</em></p>
      </body></html>`,
      'system'
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Contact form error', { error: String(err) })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

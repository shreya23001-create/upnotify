import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/services/email'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { escapeHtml } from '@/lib/utils/escape-html'
import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/utils/rate-limiter'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any

const EXPIRY_HOURS = 24

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Token brute-force guard: 10 attempts per 15 min per IP. Tokens are
  // 32-byte hex (untractable to guess) but a rate limit is cheap belt+braces.
  const rate = checkRateLimit(req, AUTH_RATE_LIMIT, 'contact-verify')
  if (!rate.allowed) {
    return NextResponse.redirect(new URL('/contact?error=rate-limited', req.url))
  }

  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/contact?error=invalid', req.url))
  }

  const { data: msg, error } = await db()
    .from('contact_messages')
    .select('*')
    .eq('verification_token', token)
    .maybeSingle()

  if (error || !msg) {
    return NextResponse.redirect(new URL('/contact?error=invalid', req.url))
  }

  if (msg.status !== 'pending_verification') {
    // Already verified
    return NextResponse.redirect(new URL('/contact?verified=already', req.url))
  }

  const ageHours = (Date.now() - new Date(msg.created_at).getTime()) / 3600000
  if (ageHours > EXPIRY_HOURS) {
    return NextResponse.redirect(new URL('/contact?error=expired', req.url))
  }

  await db()
    .from('contact_messages')
    .update({ status: 'verified', verified_at: new Date().toISOString() })
    .eq('id', msg.id)

  // Notify admin
  const config = getServerConfig()
  const adminEmail = config.adminEmails[0] ?? 'noreply@crozent.com'
  const adminUrl = `${config.app.url}/admin/contact`

  await sendEmail(
    adminEmail,
    `[Contact] ${escapeHtml(msg.subject)} — from ${escapeHtml(msg.name)}`,
    `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:40px auto;color:#111;">
      <h2 style="font-size:18px;margin-bottom:4px;">New contact message</h2>
      <p style="color:#555;font-size:14px;margin-bottom:20px;">Verified and ready for review.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:8px;font-size:13px;color:#888;width:80px;">From</td><td style="padding:8px;font-size:14px;font-weight:600;">${escapeHtml(msg.name)}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px;font-size:13px;color:#888;">Email</td><td style="padding:8px;font-size:14px;">${escapeHtml(msg.email)}</td></tr>
        <tr><td style="padding:8px;font-size:13px;color:#888;">Subject</td><td style="padding:8px;font-size:14px;">${escapeHtml(msg.subject)}</td></tr>
      </table>
      <div style="background:#f9fafb;border-radius:6px;padding:16px;margin-bottom:20px;font-size:14px;line-height:1.7;color:#333;">
        ${escapeHtml(msg.message).replace(/\n/g, '<br>')}
      </div>
      <a href="${adminUrl}" style="display:inline-block;padding:10px 24px;background:#111827;color:#fff;font-weight:600;font-size:14px;text-decoration:none;border-radius:6px;">
        View in Admin →
      </a>
    </body></html>`,
    'system'
  )

  logger.info('Contact message verified', { id: msg.id, email: msg.email })
  return NextResponse.redirect(new URL('/contact?verified=true', req.url))
}

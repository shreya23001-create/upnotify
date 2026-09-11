import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSubmission, getUserSubmissions } from '@/lib/db/credit-submissions'
import { getCurrentUser } from '@/lib/db/users'
import { sendAlertEmail } from '@/lib/services/email'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

const CREDIT_AMOUNTS: Record<string, number> = {
  trustpilot_review: 200,   // £2.00
  g2_review: 200,           // £2.00
  capterra_review: 200,     // £2.00
  blog_post: 500,           // £5.00
  social_share: 100,        // £1.00
  bug_report: 300,          // £3.00
}

const VALID_TYPES = Object.keys(CREDIT_AMOUNTS)

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const submissions = await getUserSubmissions(user.id)
  return NextResponse.json({ success: true, submissions })
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentUser = await getCurrentUser()
  if (!currentUser?.org_id) {
    return NextResponse.json({ error: 'No organisation found' }, { status: 400 })
  }

  const body = await request.json() as {
    creditType: string
    submissionUrl?: string
    evidenceText?: string
  }

  if (!body.creditType || !VALID_TYPES.includes(body.creditType)) {
    return NextResponse.json({ error: 'Invalid credit type' }, { status: 400 })
  }

  if (!body.submissionUrl && !body.evidenceText) {
    return NextResponse.json({ error: 'Please provide a URL or description of your submission' }, { status: 400 })
  }

  const creditAmount = CREDIT_AMOUNTS[body.creditType] ?? 0

  // Enforce £10/month (1000p) cap per org — count pending + approved this calendar month
  const MONTHLY_CAP_PENCE = 1000
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: monthlyRows } = await supabase
    .from('credit_submissions')
    .select('credit_amount_pence, status')
    .eq('org_id', currentUser.org_id)
    .in('status', ['pending', 'approved'])
    .gte('created_at', monthStart.toISOString())

  const monthlyTotal = (monthlyRows ?? []).reduce((sum, r) => sum + (r.credit_amount_pence ?? 0), 0)
  if (monthlyTotal + creditAmount > MONTHLY_CAP_PENCE) {
    return NextResponse.json(
      { error: `Monthly credit cap of £${(MONTHLY_CAP_PENCE / 100).toFixed(2)} reached. Unused credits do not roll over.` },
      { status: 422 }
    )
  }

  const submission = await createSubmission({
    orgId: currentUser.org_id,
    userId: user.id,
    creditType: body.creditType,
    submissionUrl: body.submissionUrl,
    evidenceText: body.evidenceText,
    creditAmountPence: creditAmount,
  })

  if (!submission) {
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }

  // Notify admin via email
  try {
    const config = getServerConfig()
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
    const creditType = body.creditType.replace(/_/g, ' ')

    for (const adminEmail of adminEmails) {
      await sendAlertEmail({
        to: adminEmail,
        subject: `[Upnotify] New credit submission: ${creditType}`,
        body: `A user has submitted a credit request.\n\nType: ${creditType}\nUser: ${user.email}\nURL: ${body.submissionUrl || 'N/A'}\nAmount: \u00A3${(creditAmount / 100).toFixed(2)}\n\nReview it at: ${config.app.url}/admin/credits`,
      })
    }
  } catch (err) {
    logger.warn('Failed to send admin credit notification email', {
      error: err instanceof Error ? err.message : 'Unknown',
    })
  }

  return NextResponse.json({ success: true, submission })
}

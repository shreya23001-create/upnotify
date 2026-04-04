import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAllSubmissions,
  getAllPendingSubmissions,
  getSubmissionStats,
  approveSubmission,
  rejectSubmission,
} from '@/lib/db/credit-submissions'
import { sendUserMessage } from '@/lib/db/user-messages'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<{ isAdmin: boolean; email: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { isAdmin: false, email: '' }

  const adminEmailsRaw = process.env.ADMIN_EMAILS || ''
  const adminEmails = adminEmailsRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return { isAdmin: adminEmails.includes(user.email.toLowerCase()), email: user.email }
}

export async function GET(): Promise<NextResponse> {
  const { isAdmin: admin } = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [submissions, stats] = await Promise.all([
    getAllSubmissions(),
    getSubmissionStats(),
  ])

  return NextResponse.json({ success: true, submissions, stats })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const { isAdmin: admin, email } = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    submissionId: string
    action: 'approve' | 'reject'
    notes?: string
  }

  if (!body.submissionId || !body.action) {
    return NextResponse.json({ error: 'submissionId and action are required' }, { status: 400 })
  }

  if (body.action === 'approve') {
    const success = await approveSubmission(body.submissionId, email, body.notes)
    if (!success) {
      return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })
    }

    // Fetch the submission to get user_id for notification
    const allSubs = await getAllSubmissions(200)
    const sub = allSubs.find(s => s.id === body.submissionId)
    if (sub) {
      const creditType = sub.credit_type.replace(/_/g, ' ')
      await sendUserMessage({
        userId: sub.user_id,
        orgId: sub.org_id,
        title: 'Credit Approved!',
        body: `Your ${creditType} submission has been approved. \u00A3${(sub.credit_amount_pence / 100).toFixed(2)} credit has been added to your account.`,
        type: 'success',
        category: 'credit',
        actionUrl: '/dashboard/settings?tab=credits',
        actionLabel: 'View Credits',
      })
    }

    return NextResponse.json({ success: true })
  }

  if (body.action === 'reject') {
    const success = await rejectSubmission(body.submissionId, email, body.notes)
    if (!success) {
      return NextResponse.json({ error: 'Failed to reject' }, { status: 500 })
    }

    // Notify user of rejection with encouragement
    const allSubs = await getAllSubmissions(200)
    const sub = allSubs.find(s => s.id === body.submissionId)
    if (sub) {
      const creditType = sub.credit_type.replace(/_/g, ' ')
      const reason = body.notes || 'It did not meet our review guidelines this time.'
      await sendUserMessage({
        userId: sub.user_id,
        orgId: sub.org_id,
        title: 'Credit Submission Update',
        body: `Your ${creditType} submission was not approved. ${reason} Don\u2019t worry \u2014 you can submit a new one anytime. We appreciate your effort!`,
        type: 'info',
        category: 'credit',
        actionUrl: '/dashboard/settings?tab=credits',
        actionLabel: 'Try Again',
      })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

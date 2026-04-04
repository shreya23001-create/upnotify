import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSubmission, getUserSubmissions } from '@/lib/db/credit-submissions'
import { getCurrentUser } from '@/lib/db/users'

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

  return NextResponse.json({ success: true, submission })
}

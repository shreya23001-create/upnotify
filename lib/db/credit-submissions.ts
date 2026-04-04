import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CreditSubmission {
  id: string
  org_id: string
  user_id: string
  credit_type: string
  submission_url: string | null
  evidence_text: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  credit_amount_pence: number
  created_at: string
}

export async function getUserSubmissions(userId: string): Promise<CreditSubmission[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('credit_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as CreditSubmission[]
}

export async function createSubmission(params: {
  orgId: string
  userId: string
  creditType: string
  submissionUrl?: string
  evidenceText?: string
  creditAmountPence: number
}): Promise<CreditSubmission | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('credit_submissions')
    .insert({
      org_id: params.orgId,
      user_id: params.userId,
      credit_type: params.creditType,
      submission_url: params.submissionUrl ?? null,
      evidence_text: params.evidenceText ?? null,
      credit_amount_pence: params.creditAmountPence,
    })
    .select()
    .single()

  if (error) return null
  return data as CreditSubmission
}

// ---------- Admin functions ----------

async function enrichWithUserEmails(submissions: CreditSubmission[]): Promise<(CreditSubmission & { user_email?: string; user_name?: string })[]> {
  if (submissions.length === 0) return []
  const supabase = createAdminClient()

  const userIds = [...new Set(submissions.map(s => s.user_id))]
  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('id', userIds)

  const userMap = new Map((users ?? []).map(u => [u.id, u]))

  return submissions.map(s => {
    const user = userMap.get(s.user_id)
    return { ...s, user_email: user?.email ?? undefined, user_name: user?.full_name ?? undefined }
  })
}

export async function getAllPendingSubmissions(): Promise<(CreditSubmission & { user_email?: string; user_name?: string })[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('credit_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return []
  return enrichWithUserEmails((data ?? []) as CreditSubmission[])
}

export async function getAllSubmissions(limit = 100): Promise<(CreditSubmission & { user_email?: string; user_name?: string })[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('credit_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return enrichWithUserEmails((data ?? []) as CreditSubmission[])
}

export async function getSubmissionStats(): Promise<{
  total: number
  pending: number
  approved: number
  rejected: number
  totalCreditsPence: number
}> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('credit_submissions')
    .select('status, credit_amount_pence')

  if (error) return { total: 0, pending: 0, approved: 0, rejected: 0, totalCreditsPence: 0 }

  const rows = data ?? []
  return {
    total: rows.length,
    pending: rows.filter(r => r.status === 'pending').length,
    approved: rows.filter(r => r.status === 'approved').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
    totalCreditsPence: rows
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.credit_amount_pence ?? 0), 0),
  }
}

export async function approveSubmission(
  submissionId: string,
  reviewedBy: string,
  notes?: string
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data: submission, error: fetchError } = await supabase
    .from('credit_submissions')
    .select('*')
    .eq('id', submissionId)
    .single()

  if (fetchError || !submission) return false

  const { error } = await supabase
    .from('credit_submissions')
    .update({
      status: 'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes ?? null,
    })
    .eq('id', submissionId)

  if (error) return false

  // Award the credit
  await supabase.from('user_credits').insert({
    org_id: submission.org_id,
    user_id: submission.user_id,
    rule_key: submission.credit_type,
    amount_pence: submission.credit_amount_pence,
    earned_at: new Date().toISOString(),
  })

  return true
}

export async function rejectSubmission(
  submissionId: string,
  reviewedBy: string,
  notes?: string
): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('credit_submissions')
    .update({
      status: 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes ?? 'Does not meet our review guidelines. Please try again with a different review.',
    })
    .eq('id', submissionId)

  return !error
}

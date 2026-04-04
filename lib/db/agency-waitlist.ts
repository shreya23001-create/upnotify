import { createAdminClient } from '@/lib/supabase/admin'

export interface AgencyWaitlistEntry {
  id: string
  name: string
  email: string
  phone: string | null
  country: string | null
  city: string | null
  business_name: string | null
  website: string | null
  num_clients: number | null
  status: 'pending' | 'approved' | 'rejected' | 'contacted'
  ai_report: AgencyAiReport | null
  ai_score: number | null
  notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface AgencyAiReport {
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  riskLevel: 'low' | 'medium' | 'high'
  businessSizeEstimate: string
  potentialRevenue: string
  legitimacyAssessment: string
}

export interface AgencyWaitlistStats {
  total: number
  pending: number
  approved: number
  rejected: number
  contacted: number
}

export async function getAgencyWaitlistEntries(params: {
  status?: string
  limit?: number
  offset?: number
}): Promise<{ entries: AgencyWaitlistEntry[]; total: number }> {
  const supabase = createAdminClient()
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  let query = supabase
    .from('agency_waitlist')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  const { data, error, count } = await query

  if (error) return { entries: [], total: 0 }
  return { entries: (data ?? []) as AgencyWaitlistEntry[], total: count ?? 0 }
}

export async function getAgencyWaitlistStats(): Promise<AgencyWaitlistStats> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('agency_waitlist')
    .select('status')

  if (error) return { total: 0, pending: 0, approved: 0, rejected: 0, contacted: 0 }

  const rows = data ?? []
  return {
    total: rows.length,
    pending: rows.filter(r => r.status === 'pending').length,
    approved: rows.filter(r => r.status === 'approved').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
    contacted: rows.filter(r => r.status === 'contacted').length,
  }
}

export async function updateAgencyWaitlistStatus(
  entryId: string,
  status: 'approved' | 'rejected' | 'contacted',
  reviewedBy: string,
  notes?: string
): Promise<boolean> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    status,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
  }

  if (notes !== undefined) {
    updateData.notes = notes
  }

  const { error } = await supabase
    .from('agency_waitlist')
    .update(updateData)
    .eq('id', entryId)

  return !error
}

export async function getAgencyWaitlistEntry(entryId: string): Promise<AgencyWaitlistEntry | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('agency_waitlist')
    .select('*')
    .eq('id', entryId)
    .single()

  if (error) return null
  return data as AgencyWaitlistEntry
}

export async function updateAgencyWaitlistAiReport(
  entryId: string,
  aiReport: AgencyAiReport,
  aiScore: number
): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('agency_waitlist')
    .update({
      ai_report: aiReport as unknown as Record<string, never>,
      ai_score: aiScore,
    })
    .eq('id', entryId)

  return !error
}

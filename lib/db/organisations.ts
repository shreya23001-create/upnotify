import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Organisation } from '@/lib/types'
import { getCurrentUser } from './users'

export async function getOrganisation(orgId: string): Promise<Organisation | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (error) {
    logger.error('Failed to get organisation', { error: error.message })
    return null
  }
  return data
}

export async function getCurrentOrganisation(): Promise<Organisation | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return getOrganisation(user.org_id)
}

export async function updateOrganisation(
  orgId: string,
  updates: { name?: string; slug?: string; timezone?: string }
): Promise<Organisation | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organisations')
    .update(updates)
    .eq('id', orgId)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update organisation', { error: error.message })
    return null
  }
  return data
}

export async function updateCompanyDetails(
  orgId: string,
  details: {
    company_name?: string
    company_address_line1?: string
    company_address_line2?: string
    company_city?: string
    company_postcode?: string
    company_country?: string
    company_registration_number?: string
    company_vat_number?: string
    billing_email?: string
    logo_url?: string
  }
): Promise<Organisation | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('organisations')
    .update(details as Record<string, unknown>)
    .eq('id', orgId)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update company details', {
      error: error.message,
    })
    return null
  }
  return data
}

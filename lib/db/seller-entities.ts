import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

export interface SellerEntity {
  id?: string
  currency_code: string
  legal_name: string
  address_lines: string[]
  registration_number: string | null
  tax_label: 'VAT' | 'GST' | null
  tax_number: string | null
  pan: string | null
  tan: string | null
  email: string
  website: string | null
}

// Hardcoded fallback used when:
//   1. Migration 00092 hasn't been applied yet (zero-downtime deploy safety)
//   2. DB read fails at render time (network blip / Supabase outage)
//   3. Invoice currency has no matching row (defensive)
//
// Keep these in lockstep with the migration's seed rows so behaviour is
// identical whether the data comes from DB or fallback.
const FALLBACK_BY_CURRENCY: Record<string, SellerEntity> = {
  gbp: {
    currency_code: 'gbp',
    legal_name: 'Crozent Techlabs Private Limited',
    address_lines: [
      'B-59, B-Block, Chipyana',
      'Noida – 201009',
      'Uttar Pradesh, India',
    ],
    registration_number: null,
    tax_label: 'GST',
    tax_number: '09AAMCC8947M1ZP',
    pan: 'AAMCC8947M',
    tan: 'MRTC07685G',
    email: 'shreya23001@gmail.com',
    website: 'crozent.com',
  },
  inr: {
    currency_code: 'inr',
    legal_name: 'Crozent Techlabs Private Limited',
    address_lines: [
      'B-59, B-Block, Chipyana',
      'Noida – 201009',
      'Uttar Pradesh, India',
    ],
    registration_number: null,
    tax_label: 'GST',
    tax_number: '09AAMCC8947M1ZP',
    pan: 'AAMCC8947M',
    tan: 'MRTC07685G',
    email: 'shreya23001@gmail.com',
    website: 'crozent.com',
  },
}

function client(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}

/**
 * Returns the seller entity that issues invoices for this currency.
 * Never returns null — falls back to a hardcoded entity if the DB row
 * is missing or unreadable, so invoice rendering can't break.
 *
 * Currency comparison is case-insensitive ('GBP' / 'gbp' both work).
 * Unknown currencies fall back to the GBP entity (Crozent Techlabs).
 */
export async function getSellerEntityByCurrency(currency: string): Promise<SellerEntity> {
  const code = (currency || '').toLowerCase()
  const fallback = FALLBACK_BY_CURRENCY[code] ?? FALLBACK_BY_CURRENCY.gbp

  try {
    const supabase = client()
    const { data, error } = await supabase
      .from('seller_entities')
      .select('*')
      .eq('currency_code', code)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      logger.warn('seller-entities: DB read failed, using fallback', { currency: code, error: error.message })
      return fallback
    }
    if (!data) {
      // Migration not yet applied OR row deactivated — fallback covers both.
      return fallback
    }
    return data as SellerEntity
  } catch (e) {
    logger.warn('seller-entities: unexpected error, using fallback', { currency: code, error: e instanceof Error ? e.message : String(e) })
    return fallback
  }
}

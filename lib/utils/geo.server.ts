import { headers } from 'next/headers'

export type SupportedCurrency = 'gbp' | 'inr'

/**
 * Detect visitor country from Vercel's geo headers.
 * SERVER ONLY — uses next/headers. Do not import in client components.
 */
export async function getVisitorCountry(): Promise<string> {
  // Local dev override — set GEO_COUNTRY_OVERRIDE=IN in .env.local to test INR flow
  const override = process.env.GEO_COUNTRY_OVERRIDE
  if (override) return override.toUpperCase()

  try {
    const h = await headers()
    // x-vercel-ip-country is set by Vercel's edge network (not available on localhost)
    return h.get('x-vercel-ip-country') ?? 'GB'
  } catch {
    return 'GB'
  }
}

/**
 * Returns the default currency for the visitor's country.
 * SERVER ONLY — uses next/headers. Do not import in client components.
 */
export async function getDefaultCurrency(): Promise<SupportedCurrency> {
  const country = await getVisitorCountry()
  return country === 'IN' ? 'inr' : 'gbp'
}

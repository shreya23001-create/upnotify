import { headers } from 'next/headers'

export type SupportedCurrency = 'gbp' | 'inr'

/**
 * Detect visitor country from Vercel's geo headers.
 * Returns 'IN' for India, 'GB' for UK, or the raw country code.
 * Falls back to 'GB' if header is not present (dev, non-Vercel environments).
 */
export async function getVisitorCountry(): Promise<string> {
  try {
    const h = await headers()
    return h.get('x-vercel-ip-country') ?? 'GB'
  } catch {
    return 'GB'
  }
}

/**
 * Returns the default currency for the visitor's country.
 * India → INR, everything else → GBP.
 */
export async function getDefaultCurrency(): Promise<SupportedCurrency> {
  const country = await getVisitorCountry()
  return country === 'IN' ? 'inr' : 'gbp'
}

/**
 * Format a price in paise to a readable INR string.
 * e.g. 99900 → "₹999"
 */
export function formatInr(paise: number): string {
  const rupees = paise / 100
  return `₹${rupees.toLocaleString('en-IN')}`
}

/**
 * Format a price in pence to a readable GBP string.
 * e.g. 1200 → "£12"
 */
export function formatGbp(pence: number): string {
  const pounds = pence / 100
  return pounds % 1 === 0 ? `£${pounds}` : `£${pounds.toFixed(2)}`
}

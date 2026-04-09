/**
 * Debug endpoint — shows detected country and currency.
 * Only active in non-production environments.
 * Visit: /api/debug/geo
 */
import { NextResponse } from 'next/server'
import { getVisitorCountry, getDefaultCurrency } from '@/lib/utils/geo.server'
import { getEnvironment } from '@/lib/utils/environment'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  if (getEnvironment() === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const country = await getVisitorCountry()
  const currency = await getDefaultCurrency()

  return NextResponse.json({ country, currency, message: `Detected: ${country} → ${currency.toUpperCase()}` })
}

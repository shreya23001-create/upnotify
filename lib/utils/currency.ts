import type { SupportedCurrency } from './geo.server'

export type { SupportedCurrency }

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

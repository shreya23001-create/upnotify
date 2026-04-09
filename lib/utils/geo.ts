// Server-only geo utilities — re-exported for backwards compatibility.
// Client components must import from '@/lib/utils/currency' instead.
export type { SupportedCurrency } from './geo.server'
export { getVisitorCountry, getDefaultCurrency } from './geo.server'
export { formatInr, formatGbp } from './currency'

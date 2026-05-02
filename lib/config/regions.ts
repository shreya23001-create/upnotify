export interface CheckRegion {
  id: string
  label: string
  flag: string
}

export const CHECK_REGIONS: CheckRegion[] = [
  { id: 'iad1',  label: 'US East (Virginia)',   flag: '🇺🇸' },
  { id: 'sfo1',  label: 'US West (San Jose)',    flag: '🇺🇸' },
  { id: 'lhr1',  label: 'EU West (London)',      flag: '🇬🇧' },
  { id: 'fra1',  label: 'EU Central (Frankfurt)',flag: '🇩🇪' },
  { id: 'sin1',  label: 'Asia (Singapore)',      flag: '🇸🇬' },
  { id: 'bom1',  label: 'Asia (Mumbai)',         flag: '🇮🇳' },
  { id: 'syd1',  label: 'Oceania (Sydney)',      flag: '🇦🇺' },
]

const REGION_MAP = new Map(CHECK_REGIONS.map(r => [r.id, r]))

export function getRegionLabel(regionId: string | null | undefined): string {
  if (!regionId) return '—'
  const r = REGION_MAP.get(regionId)
  return r ? `${r.flag} ${r.label}` : regionId
}

/** Returns the region this function is currently running in (Vercel sets VERCEL_REGION). */
export function getCurrentRegion(): string {
  return process.env.VERCEL_REGION ?? 'iad1'
}

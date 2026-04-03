import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

interface TrustedLogosData {
  logos: string[]
}

async function fetchLogos(): Promise<string[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('page_sections')
      .select('content')
      .eq('section_key', 'trusted_logos')
      .single()

    if (error || !data) return []

    const content = data.content as unknown as TrustedLogosData | null
    return content?.logos ?? []
  } catch (err) {
    logger.warn('TrustedLogos: failed to fetch', {
      error: err instanceof Error ? err.message : String(err),
    })
    return []
  }
}

export async function TrustedLogos(): Promise<React.ReactElement | null> {
  const logos = await fetchLogos()

  if (logos.length === 0) return null

  return (
    <div className="trusted-logos-row">
      {logos.map((url, idx) => (
        <img
          key={idx}
          src={url}
          alt={`Trusted partner ${idx + 1}`}
          className="trusted-logo-img"
          loading="lazy"
        />
      ))}
    </div>
  )
}

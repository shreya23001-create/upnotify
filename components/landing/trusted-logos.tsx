import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

const DEFAULT_LOGOS = ['GitHub', 'Stripe', 'Shopify', 'Vercel', 'Cloudflare', 'Notion', 'Slack', 'OpenAI', 'AWS', 'Figma']

interface TrustedLogosData {
  logos?: string[]
  names?: string[]
}

async function fetchLogoNames(): Promise<string[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('page_sections')
      .select('content')
      .eq('section_key', 'trusted_logos')
      .single()

    if (error || !data) return DEFAULT_LOGOS
    const content = data.content as unknown as TrustedLogosData | null
    return content?.names ?? DEFAULT_LOGOS
  } catch (err) {
    logger.warn('TrustedLogos: failed to fetch', {
      error: err instanceof Error ? err.message : String(err),
    })
    return DEFAULT_LOGOS
  }
}

export async function TrustedLogos(): Promise<React.ReactElement> {
  const names = await fetchLogoNames()

  return (
    <div className="sp-logos">
      {names.map((name) => (
        <div key={name} className="sp-logo-item">{name}</div>
      ))}
    </div>
  )
}

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

function LogoRow({ names, direction }: { names: string[]; direction: 'left' | 'right' }): React.ReactElement {
  const doubled = [...names, ...names]
  return (
    <div className="sp-logos-track">
      <div className={direction === 'left' ? 'sp-logos-scroll-left' : 'sp-logos-scroll-right'}>
        {doubled.map((name, i) => (
          <div key={`${name}-${i}`} className="sp-logo-item">{name}</div>
        ))}
      </div>
    </div>
  )
}

export async function TrustedLogos(): Promise<React.ReactElement> {
  const names = await fetchLogoNames()
  const mid = Math.ceil(names.length / 2)
  const rowA = names.slice(0, mid)
  const rowB = names.slice(mid)

  return (
    <div className="sp-logos">
      <LogoRow names={rowA} direction="left" />
      <LogoRow names={rowB} direction="right" />
    </div>
  )
}

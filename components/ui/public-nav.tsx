import { getLandingSection } from '@/lib/db/page-sections'
import type { NavContent } from '@/lib/types/cms'
import { PublicNavClient } from './public-nav-client'

// ── Default nav links (mirrors seeded DB content) ─────────────────────────────

const DEFAULT_LINKS: NavContent['links'] = [
  { label: 'Monitoring', href: '/monitoring' },
  { label: 'WordPress',  href: '/wordpress-monitor', badge: 'Plugin' },
  { label: 'Tools',      href: '/tools',             badge: 'Free' },
  { label: 'Tracker',    href: '/tracker',           badge: 'Free' },
  { label: 'Pricing',    href: '/#pricing' },
  { label: 'Blog',       href: '/blog' },
]

// ── Server wrapper — fetches CMS content, renders client inner ────────────────

export async function PublicNav(): Promise<React.ReactElement> {
  const section = await getLandingSection('nav')

  // If section exists in DB and is explicitly hidden, render nothing
  if (section && !section.is_visible) return <></>

  const cms = section?.content as NavContent | undefined

  return (
    <PublicNavClient
      links={cms?.links ?? DEFAULT_LINKS}
      ctaPrimary={cms?.cta_primary}
      ctaSecondary={cms?.cta_secondary}
    />
  )
}

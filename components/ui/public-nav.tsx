import { unstable_cache } from 'next/cache'
import { getLandingSection } from '@/lib/db/page-sections'
import type { NavContent } from '@/lib/types/cms'
import { PublicNavClient } from './public-nav-client'

// ── Default nav links (mirrors seeded DB content) ─────────────────────────────

const DEFAULT_LINKS: NavContent['links'] = [
  { label: 'Monitor',    href: '/monitoring' },
  { label: 'Pricing',    href: '/#pricing' },
  { label: 'Blogs',      href: '/blog' },
  { label: 'About Us',   href: '/about' },
  { label: 'Contact Us', href: '/contact' },
]

// Cache the CMS nav section for 60 seconds. Previously this component called
// `noStore()`, which opted every public page out of static rendering — that
// killed ISR site-wide and was the root cause of engineering-app#69 (site
// capacity capped at ~150 concurrent users). `unstable_cache` keeps the nav
// editable from the admin/SQL within a minute, but lets the rest of the page
// participate in ISR. Tagged 'nav' so an admin save can `revalidateTag('nav')`
// for instant propagation.
const getCachedNavSection = unstable_cache(
  async () => getLandingSection('nav'),
  ['public-nav'],
  { revalidate: 60, tags: ['nav'] },
)

// ── Server wrapper — fetches CMS content, renders client inner ────────────────

export async function PublicNav(): Promise<React.ReactElement> {
  const section = await getCachedNavSection()

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

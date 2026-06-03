import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

// engineering-app#69 — removed `export const dynamic = 'force-dynamic'`.
// That single line previously cascaded onto EVERY public page, killing ISR
// and capping the site at ~150 concurrent users (full load-test results in
// the issue). The CMS-driven nav now caches via `unstable_cache` inside
// PublicNav (60s revalidate, tag 'nav') and PublicFooter (no DB call apart
// from getLandingSection — caches via Next.js fetch dedup). Individual
// pages opt into the appropriate ISR window via their own `revalidate`
// export.

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* WCAG 2.1 — keyboard users need a way to skip past the nav. The link
          is visually hidden until it receives focus, at which point it slides
          into the top-left of the viewport. Styling lives in app/styles.css
          under `.skip-link`. */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <PublicNav />
      <main id="main-content">
        {children}
      </main>
      <PublicFooter />
    </>
  )
}

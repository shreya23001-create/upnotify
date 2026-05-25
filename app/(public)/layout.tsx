import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

// Force dynamic rendering across the whole public surface so the CMS-driven
// nav and footer (page_sections rows) are fresh on every request. Belt-and-
// braces with the noStore() inside PublicNav itself.
//
// This single file is the canonical home for nav + footer on every public
// page. Adding a new public route = drop the page.tsx anywhere under
// app/(public)/ and it inherits nav/footer automatically.
//
// Routes that should NOT have the public nav (auth, dashboard, admin, status
// pages, transactional flows) live OUTSIDE this group at app/(auth), etc.
export const dynamic = 'force-dynamic'

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

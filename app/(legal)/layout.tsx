import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export default function LegalLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="legal-layout">
      <PublicNav />
      <main className="legal-content" style={{ paddingTop: 80 }}>{children}</main>
      <PublicFooter />
    </div>
  )
}

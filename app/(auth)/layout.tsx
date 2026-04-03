import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <PublicNav />
      <div className="auth-container" style={{ paddingTop: 80 }}>
        <div className="auth-wrapper">{children}</div>
      </div>
      <PublicFooter />
    </div>
  )
}

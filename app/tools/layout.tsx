import type { Metadata } from 'next'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: {
    template: '%s | Uptrue Tools',
    default: 'Free Website Monitoring Tools | Uptrue',
  },
  description:
    'Free tools for website owners: SSL certificate checker, uptime calculator, and more. No signup required.',
}

export default function ToolsLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="tools-layout">
      <PublicNav />
      <main style={{ paddingTop: 0 }}>
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}

import type { Metadata } from 'next'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: {
    template: '%s | Uptrue Tracker',
    default: 'Website Status Tracker | Uptrue',
  },
  description: 'Real-time uptime monitoring for popular websites and services. Check if sites are down right now.',
}

export default function TrackerLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="tracker-layout">
      <PublicNav />
      <main className="tracker-main" style={{ paddingTop: 0 }}>
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}

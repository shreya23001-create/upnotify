import type { Metadata } from 'next'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const metadata: Metadata = {
  title: {
    template: '%s | Uptrue Leaderboard',
    default: 'Uptime Leaderboard — Most Reliable Websites | Uptrue',
  },
  description:
    'See the most reliable websites ranked by uptime percentage. Real-time leaderboard powered by Uptrue monitoring data.',
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="leaderboard-layout">
      <PublicNav />
      <main style={{ paddingTop: 64 }}>
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}

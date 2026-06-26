import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s',
    default: 'Uptime Leaderboard — Most Reliable Websites | Uptrue',
  },
  description:
    'See the most reliable websites ranked by uptime percentage. Real-time leaderboard powered by Uptrue monitoring data.',
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="leaderboard-layout">
      
      <main style={{ paddingTop: 64 }}>
        {children}
      </main>
      
    </div>
  )
}

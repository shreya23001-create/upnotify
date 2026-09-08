import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s',
    default: 'Website Status Tracker | Upnotify',
  },
  description: 'Real-time uptime monitoring for popular websites and services. Check if sites are down right now.',
}

export default function TrackerLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="tracker-layout">
      
      <main className="tracker-main" style={{ paddingTop: 0 }}>
        {children}
      </main>
      
    </div>
  )
}

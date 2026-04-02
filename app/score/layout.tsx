import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Website Health Score',
  description:
    'Check your website health score for free. Uptrue Score analyses uptime, SSL, DNS, security headers, and performance — giving you an instant A+ to F grade.',
  openGraph: {
    title: 'Website Health Score | Uptrue',
    description:
      'Free website health checker. Get an instant score across 5 categories: uptime, SSL, DNS, security headers, and performance.',
  },
}

export default function ScoreLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="score-layout">
      {children}
    </div>
  )
}

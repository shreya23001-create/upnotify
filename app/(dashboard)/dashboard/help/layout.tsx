import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center — Uptrue',
  description: 'Learn how to monitor your websites, set up alerts, create status pages, and manage your Uptrue account.',
}

export default function HelpLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>
}

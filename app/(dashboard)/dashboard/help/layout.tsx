import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center — Upnotify',
  description: 'Learn how to monitor your websites, set up alerts, create status pages, and manage your Upnotify account.',
}

export default function HelpLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Status Page — Uptrue',
}

export default function StatusLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="status-page-layout">
      {children}
    </div>
  )
}

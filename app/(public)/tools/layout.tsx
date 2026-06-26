import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s',
    default: 'Free Website Monitoring Tools | Uptrue',
  },
  description:
    'Free tools for website owners: SSL certificate checker, uptime calculator, and more. No signup required.',
}

export default function ToolsLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="tools-layout">
      
      <main style={{ paddingTop: 0 }}>
        {children}
      </main>
      
    </div>
  )
}

import type { Metadata } from 'next'
import { UptimeCalculatorTool } from '@/components/tools/uptime-calculator-tool'

export const metadata: Metadata = {
  title: 'Free Uptime Calculator & SLA Tool | Uptrue',
  description:
    'Calculate allowed downtime for any uptime SLA percentage. See how much downtime 99.9%, 99.99%, and other SLA levels mean per year, month, week, and day.',
  alternates: { canonical: 'https://uptrue.io/tools/uptime-calculator' },
  openGraph: {
    title: 'Free Uptime Calculator & SLA Tool | Uptrue',
    description:
      'Calculate allowed downtime for any uptime SLA. Free tool, no signup required.',
    url: 'https://uptrue.io/tools/uptime-calculator',
    type: 'website',
  },
}

export default function UptimeCalculatorPage(): React.ReactElement {
  return (
    <div className="tools-page">
      <div className="tools-hero">
        <h1 className="tools-hero-title">Uptime & SLA Calculator</h1>
        <p className="tools-hero-subtitle">
          Calculate exactly how much downtime each SLA level allows. Enter an uptime percentage
          or a downtime budget to see the conversion.
        </p>
      </div>

      <div className="tools-container">
        <UptimeCalculatorTool />

        <div className="tools-cta">
          <h2>Monitor your uptime automatically</h2>
          <p>
            Stop calculating downtime manually. Let Uptrue track your uptime 24/7
            and alert you the moment something goes wrong.
          </p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </a>
        </div>
      </div>
    </div>
  )
}

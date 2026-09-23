'use client'

import { useState, useEffect, useTransition } from 'react'
import { FileBarChart, AlertCircle } from 'lucide-react'
import { CustomSelect, type SelectOption } from '@/components/ui/custom-select'
import { Favicon } from '@/components/ui/favicon'
import { ReportSkeleton } from './report-skeleton'
import { ReportView } from './report-view'
import type { ReportPeriod, WebsiteReportMetrics } from '@/lib/services/report-metrics'

interface WebsiteOption { domain: string; monitorCount: number }

const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

interface ApiResponse {
  success: boolean
  metrics: WebsiteReportMetrics
}

export function ReportExplorer({ websites }: { websites: WebsiteOption[] }): React.ReactElement {
  const [domain, setDomain] = useState<string>(websites[0]?.domain ?? '')
  const [period, setPeriod] = useState<ReportPeriod>('daily')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!domain) return
    let cancelled = false
    startTransition(async () => {
      setError(null)
      try {
        const res = await fetch(`/api/v1/reports/monitor?domain=${encodeURIComponent(domain)}&period=${period}`)
        const json = await res.json() as ApiResponse & { error?: string }
        if (cancelled) return
        if (!json.success) { setError(json.error ?? 'Failed to load report'); setData(null); return }
        // JSON has no Date type — range.start/until arrive as ISO strings
        // and must be rehydrated into real Dates before ReportView uses
        // their .getTime()/date-math methods. Both range and availableRange
        // carry this shape.
        type RawRange = { start: string; until: string; period: string; label: string }
        const hydrate = (r: RawRange): typeof json.metrics.range => ({ ...r, start: new Date(r.start), until: new Date(r.until) }) as typeof json.metrics.range
        json.metrics.range = hydrate(json.metrics.range as unknown as RawRange)
        json.metrics.availableRange = hydrate(json.metrics.availableRange as unknown as RawRange)
        setData(json)
      } catch {
        if (!cancelled) setError('Failed to load report')
      }
    })
    return () => { cancelled = true }
  }, [domain, period])

  if (websites.length === 0) {
    return (
      <div className="rpt-empty-state">
        <div className="rpt-empty-state-icon"><FileBarChart size={26} strokeWidth={1.5} /></div>
        <h3>No report data yet</h3>
        <p>Once your monitors collect enough data, your report will appear here. Add a monitor to a website to get started.</p>
      </div>
    )
  }

  const websiteOptions: SelectOption[] = websites.map(w => ({
    value: w.domain,
    label: w.domain,
    icon: <Favicon domain={w.domain} size={16} />,
  }))
  const selectedWebsite = websites.find(w => w.domain === domain)

  return (
    <div className="rpt-explorer">
      <div className="rpt-controls no-print">
        <div className="rpt-control">
          <label className="rpt-control-label">Website</label>
          <CustomSelect options={websiteOptions} value={domain} onChange={setDomain} />
        </div>
        <div className="rpt-control rpt-control-period">
          <label className="rpt-control-label">Report period</label>
          <div className="rpt-period-toggle">
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.value}
                type="button"
                className={`rpt-period-btn${period === p.value ? ' rpt-period-btn--active' : ''}`}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {selectedWebsite && (
          <div className="rpt-type-hint">
            <span className="rpt-type-hint-name">{selectedWebsite.monitorCount} monitor{selectedWebsite.monitorCount === 1 ? '' : 's'}</span>
            <span className="rpt-type-hint-desc">Combined health report across all monitors for this website</span>
          </div>
        )}
      </div>

      {isPending && <ReportSkeleton />}

      {!isPending && error && (
        <div className="rpt-error-state">
          <div className="rpt-empty-state-icon rpt-empty-state-icon--warn"><AlertCircle size={26} strokeWidth={1.5} /></div>
          <h3>Couldn&apos;t load this report</h3>
          <p>{error}</p>
        </div>
      )}

      {!isPending && !error && data && (
        <ReportView metrics={data.metrics} />
      )}
    </div>
  )
}

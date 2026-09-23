// Client-safe constants and types split out of report-metrics.ts, which
// pulls in server-only DB helpers (lib/db/incidents.ts -> next/headers).
// Components rendered on the client (report-view.tsx) must import from
// here instead of report-metrics.ts directly, or Next.js bundles the
// server-only chain into client JS and the build fails.

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type ReportHealthStatus = 'operational' | 'attention' | 'incident'

export const HEALTH_STATUS_LABEL: Record<ReportHealthStatus, string> = {
  operational: 'Operational',
  attention: 'Attention Required',
  incident: 'Incident',
}

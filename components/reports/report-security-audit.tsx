import { AlertTriangle } from 'lucide-react'
import { SvgGauge } from './charts/svg-gauge'

interface SecurityMonitorResult {
  monitorId: string
  name: string
  type: string
  target: string
  status: string
  detail?: string
}

interface SecurityAuditData {
  securityScore?: number
  securityMonitors?: SecurityMonitorResult[]
}

const SECURITY_TYPES: Record<string, { label: string; riskIfFailing: string }> = {
  ssl:                { label: 'SSL Certificate',         riskIfFailing: 'Visitors see security warnings; HTTPS broken' },
  'security-headers': { label: 'HTTP Security Headers',   riskIfFailing: 'Vulnerable to XSS, clickjacking, data injection' },
  blacklist:          { label: 'Blacklist Status',         riskIfFailing: 'Email delivery failing; browser trust warnings' },
  'spf-dmarc':        { label: 'SPF / DMARC Records',     riskIfFailing: 'Domain can be spoofed in phishing emails' },
  'ip-change':        { label: 'IP Address Monitor',      riskIfFailing: 'Potential DNS hijacking or unauthorised migration' },
  'whois-change':     { label: 'WHOIS Registrar',         riskIfFailing: 'Domain ownership or registrar changed unexpectedly' },
  'nameserver-change':{ label: 'Nameserver Monitor',      riskIfFailing: 'Full DNS control transferred to unknown party' },
}

function statusColor(status: string): string {
  if (status === 'up') return '#10b981'
  if (status === 'degraded') return '#f59e0b'
  if (status === 'down') return '#ef4444'
  return '#94a3b8'
}

function riskBadge(status: string): { label: string; bg: string; color: string } {
  if (status === 'up') return { label: 'Pass', bg: '#ecfdf5', color: '#10b981' }
  if (status === 'degraded') return { label: 'Warning', bg: '#fffbeb', color: '#d97706' }
  if (status === 'down') return { label: 'Fail', bg: '#fef2f2', color: '#ef4444' }
  return { label: 'Unknown', bg: '#f8fafc', color: '#94a3b8' }
}

export function ReportSecurityAudit({ data }: { data: SecurityAuditData }): React.ReactElement {
  const score = data.securityScore ?? 0
  const monitors = data.securityMonitors ?? []

  const failing = monitors.filter(m => m.status === 'down')
  const warning = monitors.filter(m => m.status === 'degraded')
  const passing = monitors.filter(m => m.status === 'up')

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
        Security Audit Report
      </h2>

      {/* Score + summary row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 28, padding: '20px 24px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <SvgGauge value={score} size={110} label="Security Score" />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{passing.length}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Passing</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{warning.length}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Warnings</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{failing.length}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Failing</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
            {score >= 90
              ? 'Security posture is strong. All critical controls are passing.'
              : score >= 70
              ? 'Security posture needs attention. Address warnings before they become incidents.'
              : 'Security posture is at risk. Failing checks require immediate action.'}
          </div>
        </div>
      </div>

      {/* Per-monitor breakdown */}
      {monitors.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Check</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Target</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {monitors.map((m, i) => {
              const badge = riskBadge(m.status)
              const typeInfo = SECURITY_TYPES[m.type]
              return (
                <tr key={m.monitorId} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 500, color: '#1e293b' }}>{typeInfo?.label ?? m.name}</div>
                    {m.status !== 'up' && typeInfo && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} /> {typeInfo.riskIfFailing}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>{m.target}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: statusColor(m.status), fontSize: 12 }}>
                    {m.detail ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8' }}>
          No security monitors found. Add SSL, Security Headers, Blacklist, or SPF/DMARC monitors to get a security audit.
        </div>
      )}
    </div>
  )
}

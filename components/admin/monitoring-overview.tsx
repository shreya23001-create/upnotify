'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Globe, Lock, Radio, Search, CalendarClock, Plug, Wifi, Zap, HeartPulse,
  Eye, ShieldCheck, Timer, Bot, MapPin, Mail, Landmark, Map as MapIcon, Link2,
  MailCheck, Ban, Package, Cookie, Network, AlertTriangle, CheckCircle2,
  Gauge,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface AdminMonitor {
  id: string
  name: string
  type: string
  status: string
  severity: string
  orgName: string
  responseTimeMs: number | null
}

interface Summary {
  total: number
  up: number
  down: number
  degraded: number
}

const MONITOR_TYPE_ICONS: Record<string, LucideIcon> = {
  http: Globe, ssl: Lock, dns: Radio, keyword: Search, domain: CalendarClock,
  port: Plug, ping: Wifi, api: Zap, heartbeat: HeartPulse, competitor: Eye,
  'security-headers': ShieldCheck, 'response-time': Timer, 'robots-txt': Bot,
  'ip-change': MapPin, 'mx-health': Mail, 'whois-change': Landmark, sitemap: MapIcon,
  'redirect-chain': Link2, 'spf-dmarc': MailCheck, blacklist: Ban,
  'page-size': Package, 'cookie-consent': Cookie, 'nameserver-change': Network,
}

const MONITOR_TYPE_LABELS: Record<string, string> = {
  http: 'HTTP/HTTPS', ssl: 'SSL Certificate', dns: 'DNS Records', keyword: 'Keyword',
  domain: 'Domain Expiry', port: 'Port Check', ping: 'Ping', api: 'API Endpoint',
  heartbeat: 'Heartbeat', competitor: 'Page Change', 'security-headers': 'Security Headers',
  'response-time': 'Response Time', 'robots-txt': 'robots.txt', 'ip-change': 'IP Change',
  'mx-health': 'MX Health', 'whois-change': 'WHOIS Change', sitemap: 'Sitemap',
  'redirect-chain': 'Redirect Chain', 'spf-dmarc': 'SPF/DMARC', blacklist: 'Blacklist',
  'page-size': 'Page Size', 'cookie-consent': 'Cookie Consent', 'nameserver-change': 'Nameserver',
}

export function MonitoringOverview(): React.ReactElement {
  const [summary, setSummary] = useState<Summary>({ total: 0, up: 0, down: 0, degraded: 0 })
  const [monitors, setMonitors] = useState<AdminMonitor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/monitors?page=0&pageSize=200')
      if (res.ok) {
        const data = await res.json() as { success: boolean; summary: Summary; monitors: AdminMonitor[] }
        if (data.success) {
          setSummary(data.summary)
          setMonitors(data.monitors)
        }
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div style={{ marginTop: 32 }}>
        <h2 className="admin-section-title">Monitoring Overview</h2>
        <div className="admin-mon-skeleton" />
      </div>
    )
  }

  const total = summary.total || 1
  const upPct = Math.round((summary.up / total) * 100)
  const downPct = Math.round((summary.down / total) * 100)
  const degradedPct = Math.round((summary.degraded / total) * 100)
  const pausedPct = Math.max(0, 100 - upPct - downPct - degradedPct)

  const typeMap = new Map<string, number>()
  for (const m of monitors) {
    typeMap.set(m.type, (typeMap.get(m.type) ?? 0) + 1)
  }
  const typeBreakdown = [...typeMap.entries()].sort((a, b) => b[1] - a[1])
  const maxTypeCount = typeBreakdown[0]?.[1] ?? 1

  const slowest = [...monitors]
    .filter(m => m.responseTimeMs !== null && m.responseTimeMs > 0)
    .sort((a, b) => (b.responseTimeMs ?? 0) - (a.responseTimeMs ?? 0))
    .slice(0, 5)

  const downMonitors = monitors.filter(m => m.status === 'down').slice(0, 5)

  return (
    <div style={{ marginTop: 32 }}>
      <h2 className="admin-section-title">Monitoring Overview</h2>

      <div className="admin-mon-distribution">
        <div className="admin-mon-bar">
          {upPct > 0 && <div className="admin-mon-bar-seg admin-mon-bar-up" style={{ width: `${upPct}%` }}>{upPct}%</div>}
          {downPct > 0 && <div className="admin-mon-bar-seg admin-mon-bar-down" style={{ width: `${downPct}%` }}>{downPct}%</div>}
          {degradedPct > 0 && <div className="admin-mon-bar-seg admin-mon-bar-degraded" style={{ width: `${degradedPct}%` }}>{degradedPct}%</div>}
          {pausedPct > 0 && <div className="admin-mon-bar-seg admin-mon-bar-paused" style={{ width: `${pausedPct}%` }} />}
        </div>
        <div className="admin-mon-legend">
          <span className="admin-mon-legend-item"><span className="admin-mon-dot admin-mon-dot-up" />Up: <strong>{summary.up}</strong></span>
          <span className="admin-mon-legend-item"><span className="admin-mon-dot admin-mon-dot-down" />Down: <strong>{summary.down}</strong></span>
          <span className="admin-mon-legend-item"><span className="admin-mon-dot admin-mon-dot-degraded" />Degraded: <strong>{summary.degraded}</strong></span>
          <span className="admin-mon-legend-item admin-mon-legend-total">Total: <strong>{summary.total}</strong></span>
        </div>
      </div>

      <div className="admin-mon-grid">
        <div className="card admin-mon-card">
          <div className="admin-mon-card-header">
            <Gauge size={16} strokeWidth={2} />
            <h3>By Monitor Type</h3>
          </div>
          <div className="admin-mon-type-list">
            {typeBreakdown.map(([type, count]) => {
              const Icon = MONITOR_TYPE_ICONS[type] ?? Globe
              return (
                <div key={type} className="admin-mon-type-row">
                  <span className="admin-mon-type-icon"><Icon size={13} strokeWidth={2} /></span>
                  <span className="admin-mon-type-label">{MONITOR_TYPE_LABELS[type] ?? type}</span>
                  <div className="admin-mon-type-track">
                    <div className="admin-mon-type-fill" style={{ width: `${(count / maxTypeCount) * 100}%` }} />
                  </div>
                  <span className="admin-mon-type-count">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card admin-mon-card">
          <div className="admin-mon-card-header">
            {downMonitors.length > 0 ? <AlertTriangle size={16} strokeWidth={2} color="#ef4444" /> : <CheckCircle2 size={16} strokeWidth={2} color="#22c55e" />}
            <h3 style={{ color: downMonitors.length > 0 ? '#ef4444' : undefined }}>
              {downMonitors.length > 0 ? `Currently Down (${downMonitors.length})` : 'All Clear'}
            </h3>
          </div>
          {downMonitors.length === 0 ? (
            <p className="admin-mon-empty">No monitors are currently down.</p>
          ) : (
            <div className="admin-mon-down-list">
              {downMonitors.map(m => (
                <div key={m.id} className="admin-mon-down-row">
                  <span className="admin-mon-down-name">{m.name}</span>
                  <span className="badge badge-danger">{m.severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {slowest.length > 0 && (
        <div className="card admin-mon-card" style={{ marginTop: 16 }}>
          <div className="admin-mon-card-header">
            <Timer size={16} strokeWidth={2} />
            <h3>Slowest Response Times</h3>
          </div>
          <div className="admin-mon-slow-list">
            {slowest.map(m => (
              <div key={m.id} className="admin-mon-slow-row">
                <span>{m.name} <span className="admin-mon-slow-org">({m.orgName})</span></span>
                <span
                  className="admin-mon-slow-time"
                  style={{ color: (m.responseTimeMs ?? 0) > 3000 ? '#ef4444' : (m.responseTimeMs ?? 0) > 1000 ? '#f59e0b' : undefined }}
                >
                  {m.responseTimeMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  Check, Minus, Activity, ShieldCheck, Sparkles, FileBarChart, Building2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ComparisonRow {
  feature: string
  values: Array<boolean | string>
  type: 'boolean' | 'text'
  highlight?: number
}

interface ComparisonMatrixProps {
  eyebrow?: string
  headline?: React.ReactNode
  subheadline?: string
  competitors: string[]
  rows: ComparisonRow[]
  footnote?: string
}

// Feature rows are grouped by matching keywords against the feature label —
// the CMS schema (ComparisonTableContent) has no group field, so this stays
// entirely presentational and works unmodified with existing CMS content.
const GROUPS: Array<{ label: string; icon: LucideIcon; keywords: string[] }> = [
  { label: 'Monitoring', icon: Activity, keywords: ['check interval', 'monitor types', 'status page', 'alert channels'] },
  { label: 'Reliability', icon: ShieldCheck, keywords: ['false alarm', 'gdpr', 'eu data'] },
  { label: 'Intelligence', icon: Sparkles, keywords: ['ai-powered', 'ai outage', 'ai seo', 'ai citation', 'llms.txt', 'watchdog'] },
  { label: 'Reporting', icon: FileBarChart, keywords: ['leaderboard', 'tracker', 'report'] },
  { label: 'Business', icon: Building2, keywords: ['price', 'plan'] },
]

function groupFor(feature: string): { label: string; icon: LucideIcon } {
  const lower = feature.toLowerCase()
  for (const group of GROUPS) {
    if (group.keywords.some(kw => lower.includes(kw))) return group
  }
  return { label: 'More', icon: Sparkles }
}

function groupRows(rows: ComparisonRow[]): Array<{ label: string; icon: LucideIcon; rows: ComparisonRow[] }> {
  const order: string[] = []
  const map = new Map<string, { label: string; icon: LucideIcon; rows: ComparisonRow[] }>()
  for (const row of rows) {
    const { label, icon } = groupFor(row.feature)
    if (!map.has(label)) {
      map.set(label, { label, icon, rows: [] })
      order.push(label)
    }
    map.get(label)!.rows.push(row)
  }
  return order.map(label => map.get(label)!)
}

export function ComparisonMatrix({
  eyebrow, headline, subheadline, competitors, rows, footnote,
}: ComparisonMatrixProps): React.ReactElement {
  const groups = groupRows(rows)
  const [activeCompetitor, setActiveCompetitor] = useState(0) // for mobile card switcher

  return (
    <section className="cmx-section">
      <div className="container">
        <div className="cmx-header reveal-title">
          <div className="section-eyebrow">{eyebrow ?? 'Side by side'}</div>
          <h2 className="section-title">{headline}</h2>
          <p className="section-sub">{subheadline}</p>
        </div>

        {/* ── Desktop / tablet: layered matrix ── */}
        <div className="cmx-matrix reveal">
          <div className="cmx-matrix-head" style={{ gridTemplateColumns: `1.4fr repeat(${competitors.length}, 1fr)` }}>
            <div className="cmx-matrix-head-label">Capability</div>
            {competitors.map((name, i) => (
              <div key={name} className={`cmx-col-head${i === 0 ? ' cmx-col-head-primary' : ''}`}>
                {i === 0 && <span className="cmx-col-head-glow" aria-hidden="true" />}
                <span className="cmx-col-head-name">{name}</span>
                {i === 0 && <span className="cmx-col-head-badge">Best value</span>}
              </div>
            ))}
          </div>

          {groups.map((group) => (
            <div className="cmx-group" key={group.label}>
              <div className="cmx-group-label">
                <group.icon size={13} strokeWidth={2.25} />
                {group.label}
              </div>
              {group.rows.map((row) => (
                <div
                  key={row.feature}
                  className="cmx-row"
                  style={{ gridTemplateColumns: `1.4fr repeat(${competitors.length}, 1fr)` }}
                >
                  <div className="cmx-row-feature">{row.feature}</div>
                  {row.values.map((val, colIdx) => (
                    <div key={colIdx} className={`cmx-cell${colIdx === 0 ? ' cmx-cell-primary' : ''}`}>
                      {row.type === 'boolean' ? (
                        val ? (
                          <span className="cmx-check"><Check size={13} strokeWidth={3} /></span>
                        ) : (
                          <span className="cmx-dash"><Minus size={12} strokeWidth={2.5} /></span>
                        )
                      ) : (
                        <span className={`cmx-chip${row.highlight === colIdx ? ' cmx-chip-highlight' : ''}`}>
                          {String(val)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── Mobile: swipeable per-competitor cards ── */}
        <div className="cmx-mobile">
          <div className="cmx-mobile-tabs" role="tablist" aria-label="Choose a product to compare">
            {competitors.map((name, i) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={activeCompetitor === i}
                className={`cmx-mobile-tab${activeCompetitor === i ? ' cmx-mobile-tab-active' : ''}`}
                onClick={() => setActiveCompetitor(i)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="cmx-mobile-card">
            {groups.map((group) => (
              <div className="cmx-mobile-group" key={group.label}>
                <div className="cmx-group-label">
                  <group.icon size={13} strokeWidth={2.25} />
                  {group.label}
                </div>
                {group.rows.map((row) => {
                  const val = row.values[activeCompetitor]
                  return (
                    <div className="cmx-mobile-row" key={row.feature}>
                      <span className="cmx-mobile-row-feature">{row.feature}</span>
                      {row.type === 'boolean' ? (
                        val ? (
                          <span className="cmx-check"><Check size={13} strokeWidth={3} /></span>
                        ) : (
                          <span className="cmx-dash"><Minus size={12} strokeWidth={2.5} /></span>
                        )
                      ) : (
                        <span className={`cmx-chip${row.highlight === activeCompetitor ? ' cmx-chip-highlight' : ''}`}>
                          {String(val)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <p className="cmx-footnote">
          {footnote ?? 'Comparison based on publicly available information. Features may vary by plan.'}
        </p>
      </div>
    </section>
  )
}

'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface SeverityGroup {
  severity: string
  items: string[]
}

interface SeverityStyle {
  bg: string
  color: string
  label: string
}

export function AlertConditionsAccordion({
  groups,
  severityBadge,
}: {
  groups: SeverityGroup[]
  severityBadge: Record<string, SeverityStyle>
}) {
  const [openSeverity, setOpenSeverity] = useState<string | null>(groups[0]?.severity ?? null)

  function toggle(severity: string): void {
    setOpenSeverity(openSeverity === severity ? null : severity)
  }

  return (
    <div className="faq-grid" style={{ maxWidth: 'none', margin: 0, gap: 12 }}>
      {groups.map(group => {
        const isOpen = openSeverity === group.severity
        const style = severityBadge[group.severity]
        return (
          <div key={group.severity} className={`faq-item${isOpen ? ' open' : ''}`} style={{ borderColor: `${style.color}22` }}>
            <div
              className="faq-q"
              onClick={() => toggle(group.severity)}
              role="button"
              aria-expanded={isOpen}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: style.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: style.color }}>
                  {style.label}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  · {group.items.length} {group.items.length === 1 ? 'condition' : 'conditions'}
                </span>
              </span>
              <div className="faq-chevron">
                <ChevronDown size={12} strokeWidth={2.5} />
              </div>
            </div>
            <div className="faq-a">
              {group.items.map((text, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '5px 0', lineHeight: 1.6 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)', flexShrink: 0, marginTop: 8 }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type TimelineBarStatus = 'up' | 'down' | 'degraded' | 'none'

export interface TimelineBarDataPoint {
  timestamp: Date | string
  value?: number        // 0–100, controls bar height when scaleByValue=true; drives color if no status
  status?: TimelineBarStatus
  tooltipLabel?: string // overrides the default "value%" line in the tooltip
}

interface TimelineBarGraphProps {
  data: TimelineBarDataPoint[]
  /** Override auto-detected interval in seconds */
  intervalSeconds?: number
  /** Max bars to display (oldest are dropped from the left). Default: 90 */
  maxBars?: number
  /** Fixed bar height in px. When `value` is also present, this is the max height. Default: 40 */
  height?: number
  /** Whether bars scale in height proportional to `value`. Default: false */
  scaleByValue?: boolean
  /** Section label rendered above the graph */
  label?: string
  /** Show "X ago … Now" footer labels. Default: true */
  showFooter?: boolean
}

interface TooltipState {
  index: number
  x: number   // fixed-position left (px)
  y: number   // fixed-position top (px)
}

// ─── helpers ────────────────────────────────────────────────────────────────

function toDate(ts: Date | string): Date {
  return ts instanceof Date ? ts : new Date(ts)
}

function detectIntervalSeconds(sorted: Date[]): number {
  if (sorted.length < 2) return 60
  const deltas: number[] = []
  for (let i = 1; i < Math.min(sorted.length, 10); i++) {
    deltas.push((sorted[i].getTime() - sorted[i - 1].getTime()) / 1000)
  }
  const median = deltas.slice().sort((a, b) => a - b)[Math.floor(deltas.length / 2)]
  return Math.max(1, Math.round(median))
}

function formatTimestamp(date: Date, intervalSec: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const h24  = date.getHours()
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  const h12  = h24 % 12 === 0 ? 12 : h24 % 12

  if (intervalSec < 60) {
    return `${h12}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${ampm}`
  }
  if (intervalSec < 3600) {
    return `${months[date.getMonth()]} ${date.getDate()}, ${h12}:${pad(date.getMinutes())} ${ampm}`
  }
  if (intervalSec < 86400) {
    return `${months[date.getMonth()]} ${date.getDate()}, ${h12}:00 ${ampm}`
  }
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

function formatRelativeDuration(seconds: number, count: number): string {
  const total = seconds * count
  if (total < 3600) return `${Math.round(total / 60)}m ago`
  if (total < 86400) return `${Math.round(total / 3600)}h ago`
  return `${Math.round(total / 86400)}d ago`
}

function statusColor(status: TimelineBarStatus | undefined): string {
  if (status === 'up')       return 'var(--color-up, #10b981)'
  if (status === 'down')     return 'var(--color-down, #ef4444)'
  if (status === 'degraded') return 'var(--color-warn, #f59e0b)'
  return 'var(--tlbg-none, #d1d5db)'   // visible muted gray for no-data slots
}

// ─── component ──────────────────────────────────────────────────────────────

export function TimelineBarGraph({
  data,
  intervalSeconds,
  maxBars = 90,
  height = 40,
  scaleByValue = false,
  label,
  showFooter = true,
}: TimelineBarGraphProps): React.ReactElement {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const { bars, intervalSec } = useMemo(() => {
    if (data.length === 0) return { bars: [], intervalSec: 60 }

    // Sort oldest → newest so index 0 = left, last = right
    const sorted = [...data].sort(
      (a, b) => toDate(a.timestamp).getTime() - toDate(b.timestamp).getTime()
    )

    const dates = sorted.map(d => toDate(d.timestamp))
    const detectedInterval = intervalSeconds ?? detectIntervalSeconds(dates)

    // Keep only the most recent `maxBars` items
    const trimmed = sorted.slice(-maxBars)

    return {
      bars: trimmed.map(d => ({
        date:         toDate(d.timestamp),
        value:        d.value,
        status:       d.status,
        tooltipLabel: d.tooltipLabel,
      })),
      intervalSec: detectedInterval,
    }
  }, [data, intervalSeconds, maxBars])

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      index,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }, [])

  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  if (bars.length === 0) {
    return (
      <div className="tlbg-empty">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        No data yet
      </div>
    )
  }

  const rangeLabel = formatRelativeDuration(intervalSec, bars.length)
  const tooltipBar  = tooltip !== null ? bars[tooltip.index] : null

  return (
    <div className="tlbg-wrap">
      {label && <div className="tlbg-label">{label}</div>}

      <div className="tlbg-track" style={{ height: `${height}px`, gap: bars.length > 100 ? '1px' : bars.length > 30 ? '2px' : '3px' }}>
        {bars.map((bar, i) => {
          const barHeight = scaleByValue && bar.value != null
            ? Math.max(4, (bar.value / 100) * height)
            : height

          const color = bar.status
            ? statusColor(bar.status)
            : bar.value != null
              ? bar.value >= 90 ? 'var(--color-up, #10b981)'
                : bar.value >= 50 ? 'var(--color-warn, #f59e0b)'
                : 'var(--color-down, #ef4444)'
              : 'var(--color-up, #10b981)'

          const isHovered = tooltip?.index === i

          return (
            <div
              key={i}
              className="tlbg-bar-wrap"
              onMouseEnter={(e) => handleMouseEnter(e, i)}
              onMouseLeave={handleMouseLeave}
              style={{ height: `${height}px` }}
            >
              <div
                className={`tlbg-bar${isHovered ? ' tlbg-bar-hovered' : ''}`}
                style={{
                  height: `${barHeight}px`,
                  background: color,
                  alignSelf: 'flex-end',
                }}
                role="img"
                aria-label={formatTimestamp(bar.date, intervalSec)}
              />
            </div>
          )
        })}
      </div>

      {showFooter && (
        <div className="tlbg-footer">
          <span>{rangeLabel}</span>
          <span>Now</span>
        </div>
      )}

      {/* Portal tooltip — renders at document.body so no parent overflow:hidden clips it */}
      {tooltip !== null && tooltipBar !== null && typeof document !== 'undefined' && createPortal(
        <TooltipPortal
          bar={tooltipBar}
          x={tooltip.x}
          y={tooltip.y}
          intervalSec={intervalSec}
          flipLeft={tooltip.x > window.innerWidth / 2}
        />,
        document.body
      )}
    </div>
  )
}

// ─── portal tooltip ──────────────────────────────────────────────────────────

interface TooltipPortalProps {
  bar: { date: Date; value?: number; status?: TimelineBarStatus; tooltipLabel?: string }
  x: number
  y: number
  intervalSec: number
  flipLeft: boolean
}

function TooltipPortal({ bar, x, y, intervalSec, flipLeft }: TooltipPortalProps): React.ReactElement {
  const color = statusColor(bar.status)
  const formattedTs = formatTimestamp(bar.date, intervalSec)

  return (
    <div
      className="tlbg-tooltip-portal"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: `translate(${flipLeft ? 'calc(-100% + 8px)' : '-50%'}, calc(-100% - 10px))`,
        zIndex: 9999,
      }}
    >
      <span className="tlbg-tooltip-ts">{formattedTs}</span>
      {(bar.tooltipLabel != null || bar.value != null) && (
        <span className="tlbg-tooltip-val">
          {bar.tooltipLabel ?? `${bar.value!.toFixed(1)}%`}
        </span>
      )}
      {bar.status && bar.status !== 'none' && (
        <span className="tlbg-tooltip-status" style={{ color }}>
          {bar.status.charAt(0).toUpperCase() + bar.status.slice(1)}
        </span>
      )}
    </div>
  )
}

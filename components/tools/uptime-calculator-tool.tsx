'use client'

import { useState } from 'react'

interface DowntimeResult {
  perYear: string
  perMonth: string
  perWeek: string
  perDay: string
}

const MINUTES_PER_YEAR = 525960
const MINUTES_PER_MONTH = 43830
const MINUTES_PER_WEEK = 10080
const MINUTES_PER_DAY = 1440

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 1) {
    const seconds = Math.round(totalMinutes * 60)
    return `${seconds}s`
  }
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = Math.round(totalMinutes % 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  return parts.join(' ') || '0m'
}

function calculateDowntime(uptimePct: number): DowntimeResult {
  const downtimeFraction = (100 - uptimePct) / 100
  return {
    perYear: formatDuration(MINUTES_PER_YEAR * downtimeFraction),
    perMonth: formatDuration(MINUTES_PER_MONTH * downtimeFraction),
    perWeek: formatDuration(MINUTES_PER_WEEK * downtimeFraction),
    perDay: formatDuration(MINUTES_PER_DAY * downtimeFraction),
  }
}

const COMMON_SLAS = [
  { label: '99%', value: 99 },
  { label: '99.5%', value: 99.5 },
  { label: '99.9%', value: 99.9 },
  { label: '99.95%', value: 99.95 },
  { label: '99.99%', value: 99.99 },
  { label: '99.999%', value: 99.999 },
]

export function UptimeCalculatorTool(): React.ReactElement {
  const [uptimeInput, setUptimeInput] = useState('99.9')
  const [mode, setMode] = useState<'uptime' | 'downtime'>('uptime')
  const [downtimeMinutes, setDowntimeMinutes] = useState('')

  const uptimeValue = parseFloat(uptimeInput)
  const isValidUptime = !isNaN(uptimeValue) && uptimeValue >= 0 && uptimeValue <= 100

  const downtimeResult = isValidUptime ? calculateDowntime(uptimeValue) : null

  const downtimeMinutesValue = parseFloat(downtimeMinutes)
  const isValidDowntime = !isNaN(downtimeMinutesValue) && downtimeMinutesValue >= 0
  const reversePct = isValidDowntime
    ? Math.round((1 - downtimeMinutesValue / MINUTES_PER_MONTH) * 1000000) / 10000
    : null

  return (
    <div className="uptime-calculator">
      {/* Mode toggle */}
      <div className="uptime-calc-mode-toggle">
        <button
          className={`uptime-calc-mode-btn ${mode === 'uptime' ? 'active' : ''}`}
          onClick={() => setMode('uptime')}
        >
          Uptime % &rarr; Downtime
        </button>
        <button
          className={`uptime-calc-mode-btn ${mode === 'downtime' ? 'active' : ''}`}
          onClick={() => setMode('downtime')}
        >
          Downtime &rarr; Uptime %
        </button>
      </div>

      {mode === 'uptime' && (
        <div className="uptime-calc-section">
          <div className="uptime-calc-input-row">
            <label className="form-label" htmlFor="uptime-input">Desired Uptime (%)</label>
            <input
              id="uptime-input"
              type="number"
              className="form-input uptime-calc-input"
              value={uptimeInput}
              onChange={(e) => setUptimeInput(e.target.value)}
              min="0"
              max="100"
              step="0.001"
            />
          </div>

          {/* Quick presets */}
          <div className="uptime-calc-presets">
            {COMMON_SLAS.map((sla) => (
              <button
                key={sla.value}
                className={`uptime-calc-preset ${uptimeValue === sla.value ? 'active' : ''}`}
                onClick={() => setUptimeInput(String(sla.value))}
              >
                {sla.label}
              </button>
            ))}
          </div>

          {downtimeResult && (
            <div className="uptime-calc-results">
              <h3 className="uptime-calc-results-title">
                Allowed Downtime at {uptimeValue}% Uptime
              </h3>
              <div className="uptime-calc-results-grid">
                <div className="card uptime-calc-result-card">
                  <span className="uptime-calc-result-period">Per Year</span>
                  <span className="uptime-calc-result-value">{downtimeResult.perYear}</span>
                </div>
                <div className="card uptime-calc-result-card">
                  <span className="uptime-calc-result-period">Per Month</span>
                  <span className="uptime-calc-result-value">{downtimeResult.perMonth}</span>
                </div>
                <div className="card uptime-calc-result-card">
                  <span className="uptime-calc-result-period">Per Week</span>
                  <span className="uptime-calc-result-value">{downtimeResult.perWeek}</span>
                </div>
                <div className="card uptime-calc-result-card">
                  <span className="uptime-calc-result-period">Per Day</span>
                  <span className="uptime-calc-result-value">{downtimeResult.perDay}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'downtime' && (
        <div className="uptime-calc-section">
          <div className="uptime-calc-input-row">
            <label className="form-label" htmlFor="downtime-input">
              Allowed Downtime Per Month (minutes)
            </label>
            <input
              id="downtime-input"
              type="number"
              className="form-input uptime-calc-input"
              value={downtimeMinutes}
              onChange={(e) => setDowntimeMinutes(e.target.value)}
              min="0"
              step="1"
              placeholder="e.g., 43"
            />
          </div>

          {reversePct !== null && isValidDowntime && (
            <div className="uptime-calc-results">
              <h3 className="uptime-calc-results-title">
                {downtimeMinutesValue} min/month = {reversePct}% Uptime
              </h3>
              <div className="uptime-calc-results-grid">
                <div className="card uptime-calc-result-card">
                  <span className="uptime-calc-result-period">Uptime %</span>
                  <span className="uptime-calc-result-value"
                    style={{ color: reversePct >= 99.9
                      ? 'var(--color-success, #22c55e)'
                      : reversePct >= 99
                        ? 'var(--color-warning, #f59e0b)'
                        : 'var(--color-danger, #ef4444)'
                    }}>
                    {reversePct}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SLA comparison table */}
      <div className="card uptime-calc-sla-table-card">
        <h3 style={{ margin: '0 0 16px' }}>SLA Comparison Table</h3>
        <table className="uptime-calc-sla-table">
          <thead>
            <tr>
              <th>SLA Level</th>
              <th>Downtime / Year</th>
              <th>Downtime / Month</th>
              <th>Downtime / Week</th>
              <th>Downtime / Day</th>
            </tr>
          </thead>
          <tbody>
            {COMMON_SLAS.map((sla) => {
              const dt = calculateDowntime(sla.value)
              return (
                <tr key={sla.value} className={uptimeValue === sla.value ? 'sla-row-active' : ''}>
                  <td><strong>{sla.label}</strong></td>
                  <td>{dt.perYear}</td>
                  <td>{dt.perMonth}</td>
                  <td>{dt.perWeek}</td>
                  <td>{dt.perDay}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

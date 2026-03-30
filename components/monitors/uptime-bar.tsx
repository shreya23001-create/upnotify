'use client'

interface UptimeSlot {
  slot: string
  status: 'up' | 'down' | 'degraded' | 'none'
}

const slotClass: Record<string, string> = {
  up: 'uptime-slot-up',
  down: 'uptime-slot-down',
  degraded: 'uptime-slot-degraded',
  none: 'uptime-slot-none',
}

export function UptimeBar({ slots }: { slots: UptimeSlot[] }) {
  return (
    <div className="uptime-bar">
      {slots.map((s, i) => (
        <div key={i} className={`uptime-slot ${slotClass[s.status]}`}>
          <span className="uptime-tooltip">{s.slot} — {s.status}</span>
        </div>
      ))}
    </div>
  )
}

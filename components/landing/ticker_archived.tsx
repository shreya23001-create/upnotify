'use client'

const EVENTS = [
  { type: 'up', site: 'github.com', label: 'operational', time: '2m ago' },
  { type: 'down', site: 'stripe.com', label: 'elevated latency', time: '5m ago' },
  { type: 'recover', site: 'shopify.com', label: 'recovered', time: '11m ago' },
  { type: 'up', site: 'vercel.com', label: 'operational', time: '1m ago' },
  { type: 'up', site: 'cloudflare.com', label: 'operational', time: '3m ago' },
  { type: 'down', site: 'notion.so', label: 'partial outage', time: '8m ago' },
  { type: 'recover', site: 'figma.com', label: 'recovered', time: '14m ago' },
  { type: 'up', site: 'slack.com', label: 'operational', time: '2m ago' },
  { type: 'down', site: 'aws.amazon.com', label: 'elevated latency', time: '6m ago' },
  { type: 'recover', site: 'openai.com', label: 'recovered', time: '19m ago' },
  { type: 'up', site: 'google.com', label: 'operational', time: '1m ago' },
  { type: 'up', site: 'discord.com', label: 'operational', time: '4m ago' },
  { type: 'down', site: 'zoom.us', label: 'degraded performance', time: '10m ago' },
  { type: 'recover', site: 'intercom.com', label: 'recovered', time: '22m ago' },
  { type: 'up', site: 'salesforce.com', label: 'operational', time: '3m ago' },
  { type: 'up', site: 'netflix.com', label: 'operational', time: '2m ago' },
  { type: 'recover', site: 'anthropic.com', label: 'recovered', time: '17m ago' },
  { type: 'up', site: 'linear.app', label: 'operational', time: '5m ago' },
]

export function Ticker(): React.ReactElement {
  // Duplicate for seamless loop
  const all = [...EVENTS, ...EVENTS]
  return (
    <div className="pub-ticker">
      <div className="ticker-badge">LIVE</div>
      <div className="ticker-track-wrap">
        <div className="ticker-track">
          {all.map((e, i) => (
            <div key={i} className={`ticker-event ${e.type}`}>
              <span className={`ticker-dot ${e.type}`} />
              <strong>{e.site}</strong>
              — {e.label}
              <span className="ticker-time">{e.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

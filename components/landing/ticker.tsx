'use client'

const EVENTS = [
  { type: 'up',      site: 'github.com',      msg: 'operational',          time: '2m ago' },
  { type: 'down',    site: 'stripe.com',       msg: 'elevated latency',     time: '5m ago' },
  { type: 'recover', site: 'shopify.com',      msg: 'recovered',            time: '11m ago' },
  { type: 'up',      site: 'vercel.com',       msg: 'operational',          time: '1m ago' },
  { type: 'up',      site: 'cloudflare.com',   msg: 'operational',          time: '3m ago' },
  { type: 'down',    site: 'notion.so',        msg: 'partial outage',       time: '8m ago' },
  { type: 'recover', site: 'figma.com',        msg: 'recovered',            time: '14m ago' },
  { type: 'up',      site: 'slack.com',        msg: 'operational',          time: '2m ago' },
  { type: 'down',    site: 'aws.amazon.com',   msg: 'elevated latency',     time: '6m ago' },
  { type: 'recover', site: 'openai.com',       msg: 'recovered',            time: '19m ago' },
  { type: 'up',      site: 'google.com',       msg: 'operational',          time: '1m ago' },
  { type: 'up',      site: 'discord.com',      msg: 'operational',          time: '4m ago' },
  { type: 'down',    site: 'zoom.us',          msg: 'degraded performance', time: '10m ago' },
  { type: 'recover', site: 'intercom.com',     msg: 'recovered',            time: '22m ago' },
  { type: 'up',      site: 'salesforce.com',   msg: 'operational',          time: '3m ago' },
  { type: 'up',      site: 'netflix.com',      msg: 'operational',          time: '2m ago' },
  { type: 'recover', site: 'anthropic.com',    msg: 'recovered',            time: '17m ago' },
  { type: 'up',      site: 'linear.app',       msg: 'operational',          time: '5m ago' },
]

export function Ticker(): React.ReactElement {
  const doubled = [...EVENTS, ...EVENTS]

  return (
    <div className="pub-ticker">
      <div className="ticker-badge">LIVE</div>
      <div className="ticker-track-wrap">
        <div className="ticker-track">
          {doubled.map((ev, i) => (
            <div key={i} className={`ticker-event ${ev.type}`}>
              <span className={`ticker-dot ${ev.type}`} />
              <strong>{ev.site}</strong>
              {' — '}
              {ev.msg}
              {' '}
              <span className="ticker-time">{ev.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

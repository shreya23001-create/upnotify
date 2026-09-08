import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Upnotify — Uptime Monitoring for Agencies & Teams'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)',
          padding: '0',
          position: 'relative',
        }}
      >
        {/* Bottom stats bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
            background: 'rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          {['10 Monitor Types', 'AI Reports', 'Status Pages', '1-min Intervals'].map((stat) => (
            <span key={stat} style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>{stat}</span>
          ))}
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '60px 105px', flex: 1 }}>
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            <div
              style={{
                width: 52,
                height: 52,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
                border: '1.5px solid rgba(255,255,255,0.3)',
              }}
            >
              <span style={{ color: 'white', fontSize: 24, fontWeight: 800 }}>U</span>
            </div>
            <span style={{ color: 'white', fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>Upnotify</span>
          </div>

          {/* Headline */}
          <div style={{ color: 'white', fontSize: 64, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginBottom: 24 }}>
            Uptime Monitoring
            <br />
            for Agencies & Teams
          </div>

          {/* Subheadline */}
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 24, fontWeight: 500, marginBottom: 16 }}>
            Monitoring + Competitive Intelligence
          </div>

          {/* URL */}
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20, fontWeight: 600, marginTop: 'auto' }}>
            uptrue.io
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}

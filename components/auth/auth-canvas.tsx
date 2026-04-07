'use client'

import { useEffect, useRef } from 'react'

type DrawType = 'welcome' | 'monitor' | 'alert' | 'recovery' | 'upgrade'

interface Scene {
  title: string
  sub: string
  draw: DrawType
}

const SCENES: Scene[] = [
  { title: 'Your monitors are watching.', sub: 'We check every 30 seconds, around the clock.', draw: 'welcome' },
  { title: 'Add your first monitor.', sub: 'We check every 30 seconds from multiple regions.', draw: 'monitor' },
  { title: 'Something goes wrong at 2:47am.', sub: "You're alerted instantly. Before your customers.", draw: 'alert' },
  { title: 'You fix it. Nobody noticed.', sub: 'Your status page kept customers calm.', draw: 'recovery' },
  { title: 'Most teams outgrow 3 monitors in a week.', sub: 'Starter is £10/yr. Cancel any time.', draw: 'upgrade' },
]

const SCENE_DURS = [2600, 3000, 3000, 2800, 3200]

interface AuthCanvasProps {
  onSceneChange?: (title: string, sub: string) => void
}

export function AuthCanvas({ onSceneChange }: AuthCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const hero = canvas?.closest('.auth-left') as HTMLElement | null
    if (!canvas || !hero) return

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    let W = 0, H = 0
    let raf: number | null = null
    let startT: number | null = null
    let sceneIdx = -1

    function resize() {
      W = canvas!.width  = hero!.offsetWidth
      H = canvas!.height = hero!.offsetHeight
    }

    function rr(x: number, y: number, w: number, h: number, r: number | number[], fill: string | null, stroke: string | null, alpha: number) {
      ctx!.globalAlpha = alpha
      ctx!.beginPath()
      ctx!.roundRect(x, y, w, h, Array.isArray(r) ? r : [r])
      if (fill)   { ctx!.fillStyle = fill;   ctx!.fill() }
      if (stroke) { ctx!.strokeStyle = stroke; ctx!.lineWidth = 1; ctx!.stroke() }
      ctx!.globalAlpha = 1
    }

    function t2(str: string, x: number, y: number, size: number, color: string, alpha: number, weight = '500') {
      ctx!.globalAlpha = alpha
      ctx!.font = `${weight} ${size}px Inter, -apple-system, sans-serif`
      ctx!.fillStyle = color
      ctx!.fillText(str, x, y)
      ctx!.globalAlpha = 1
    }

    function drawWelcome(_t: number) {
      const prog = Math.min(1, _t / 800)
      const cx = W / 2, cy = H * 0.42
      rr(cx-90, cy-60, 180, 120, 12, 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.12)', prog * 0.9)
      const cr = 22, cAlpha = Math.min(1, Math.max(0, (_t-200)/500)) * prog
      ctx.globalAlpha = cAlpha
      ctx.beginPath(); ctx.arc(cx, cy-18, cr, 0, Math.PI*2)
      ctx.fillStyle = 'rgba(16,185,129,0.15)'; ctx.fill()
      ctx.beginPath(); ctx.arc(cx, cy-18, cr, 0, Math.PI*2)
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx-10,cy-18); ctx.lineTo(cx-3,cy-10); ctx.lineTo(cx+11,cy-26)
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke()
      ctx.globalAlpha = 1
      const tAlpha = Math.min(1, Math.max(0, (_t-400)/400))
      ctx.textAlign = 'center'
      t2('Monitors active', cx, cy+18, 11, 'rgba(255,255,255,0.7)', tAlpha, '600')
      rr(cx-30, cy+28, 60, 18, 9, '#3b82f622', '#3b82f655', tAlpha * 0.9)
      t2('Free plan', cx, cy+40, 9, '#60a5fa', tAlpha, '700')
      ctx.textAlign = 'left'
    }

    function drawMonitor(_t: number) {
      const cx = W * 0.5, cy = H * 0.42
      const cardAlpha = Math.min(1, _t/600) * 0.9
      rr(cx-110, cy-52, 220, 40, 8, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.12)', cardAlpha)
      const url = 'api.yoursite.com'
      const chars = Math.floor(Math.min(url.length, (_t-200)/90))
      const typed = url.slice(0, chars)
      t2('https://', cx-102, cy-27, 10, 'rgba(255,255,255,0.25)', cardAlpha, '400')
      t2(typed, cx-62, cy-27, 10, 'rgba(255,255,255,0.85)', cardAlpha, '500')
      if (chars < url.length && Math.floor(_t/500)%2===0) {
        rr(cx-62+chars*6.2, cy-38, 1.5, 14, 0, 'rgba(255,255,255,0.6)', null, cardAlpha)
      }
      const resAlpha = Math.min(1, Math.max(0, (_t-1800)/600))
      rr(cx-110, cy+2, 220, 44, 8, 'rgba(16,185,129,0.08)', 'rgba(16,185,129,0.25)', resAlpha)
      ctx.globalAlpha = resAlpha
      ctx.beginPath(); ctx.arc(cx-92, cy+24, 5, 0, Math.PI*2)
      ctx.fillStyle = '#10b981'; ctx.fill()
      ctx.globalAlpha = 1
      t2('Online', cx-82, cy+28, 10, '#10b981', resAlpha, '700')
      t2('142ms · All regions', cx+10, cy+28, 9, 'rgba(255,255,255,0.4)', resAlpha, '400')
      ctx.textAlign = 'center'
      t2('✓ Monitor active', cx, cy+62, 10, 'rgba(255,255,255,0.3)', resAlpha, '500')
      ctx.textAlign = 'left'
    }

    function drawAlert(_t: number) {
      const cx = W * 0.5
      const dropProg = Math.min(1, Math.max(0, (_t-300)/700))
      const ease = 1 - Math.pow(1-dropProg, 3)
      const cardY = H*0.28 - 30*(1-ease)
      const cardAlpha = dropProg
      rr(cx-120, cardY, 240, 58, 10, 'rgba(239,68,68,0.1)', 'rgba(239,68,68,0.4)', cardAlpha)
      const pulse = 0.6 + 0.4*Math.sin(_t/400)
      ctx.globalAlpha = cardAlpha * pulse
      ctx.beginPath(); ctx.arc(cx-98, cardY+18, 5, 0, Math.PI*2)
      ctx.fillStyle = '#ef4444'; ctx.fill()
      ctx.globalAlpha = 1
      t2('checkout.shop.io is DOWN', cx-84, cardY+22, 10, '#fca5a5', cardAlpha, '700')
      t2('Uptrue is alerting your team now', cx-84, cardY+38, 9, 'rgba(255,255,255,0.4)', cardAlpha, '400')
      const clockAlpha = Math.min(1, Math.max(0, (_t-800)/500))
      ctx.textAlign = 'center'
      t2('2:47 AM', cx, H*0.58, 26, 'rgba(255,255,255,0.06)', clockAlpha, '800')
      t2('While you were asleep.', cx, H*0.67, 11, 'rgba(255,255,255,0.2)', clockAlpha, '400')
      ctx.textAlign = 'left'
    }

    function drawRecovery(_t: number) {
      const cx = W * 0.5, cy = H * 0.38
      const prog = Math.min(1, _t/700)
      rr(cx-110, cy-30, 220, 90, 10, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', prog * 0.85)
      rr(cx-110, cy-30, 220, 22, [10,10,0,0], 'rgba(255,255,255,0.04)', null, prog * 0.7)
      ctx.textAlign = 'center'
      t2('status.yoursite.com', cx, cy-14, 8, 'rgba(255,255,255,0.25)', prog, '500')
      ctx.textAlign = 'left'
      const bannerAlpha = Math.min(1, Math.max(0, (_t-400)/500))
      rr(cx-96, cy+4, 192, 22, 5, 'rgba(16,185,129,0.15)', 'rgba(16,185,129,0.3)', bannerAlpha)
      ctx.globalAlpha = bannerAlpha
      ctx.beginPath(); ctx.arc(cx-78, cy+15, 4, 0, Math.PI*2)
      ctx.fillStyle = '#10b981'; ctx.fill()
      ctx.globalAlpha = 1
      t2('All Systems Operational', cx-66, cy+19, 9, '#6ee7b7', bannerAlpha, '600')
      const barsAlpha = Math.min(1, Math.max(0, (_t-700)/500))
      for (let i = 0; i < 28; i++) {
        const bx = cx-96 + i*7
        ctx.globalAlpha = barsAlpha * 0.7
        ctx.fillStyle = '#10b981'
        ctx.beginPath(); ctx.roundRect(bx, cy+36, 5, 14, 1); ctx.fill()
      }
      ctx.globalAlpha = 1
      const recAlpha = Math.min(1, Math.max(0, (_t-900)/500))
      ctx.textAlign = 'center'
      t2('Recovered · 2m 14s downtime', cx, cy+68, 9, 'rgba(255,255,255,0.25)', recAlpha, '500')
      ctx.textAlign = 'left'
    }

    function drawUpgrade(_t: number) {
      const cx = W * 0.5, cy = H * 0.35
      const prog = Math.min(1, _t/800)
      ctx.textAlign = 'center'
      t2('Most teams upgrade within a week.', cx, cy, 11, 'rgba(255,255,255,0.2)', prog, '500')
      t2('Starter plan — £10/yr', cx, cy+24, 13, 'rgba(59,130,246,0.5)', prog * 0.9, '700')
      ctx.textAlign = 'left'
    }

    function setScene(idx: number) {
      if (idx === sceneIdx) return
      sceneIdx = idx
      const scene = SCENES[idx]
      onSceneChange?.(scene.title, scene.sub)
    }

    function draw(ts: number) {
      if (startT === null) startT = ts
      if (!W || !H) resize()
      const elapsed = ts - startT

      let cumDur = 0, newIdx = 0
      for (let i = 0; i < SCENE_DURS.length; i++) {
        cumDur += SCENE_DURS[i]
        if (elapsed < cumDur) { newIdx = i; break }
        if (i === SCENE_DURS.length - 1) { startT = ts; newIdx = 0 }
      }
      if (newIdx !== sceneIdx) setScene(newIdx)

      const sceneOffset = SCENE_DURS.slice(0, sceneIdx).reduce((a,b)=>a+b, 0)
      const sceneT = elapsed - sceneOffset

      ctx.clearRect(0, 0, W, H)
      const drawType = SCENES[sceneIdx]?.draw
      if (drawType === 'welcome')  drawWelcome(sceneT)
      if (drawType === 'monitor')  drawMonitor(sceneT)
      if (drawType === 'alert')    drawAlert(sceneT)
      if (drawType === 'recovery') drawRecovery(sceneT)
      if (drawType === 'upgrade')  drawUpgrade(sceneT)

      raf = requestAnimationFrame(draw)
    }

    resize()
    setScene(0)
    let _rt: ReturnType<typeof setTimeout>
    window.addEventListener('resize', () => { clearTimeout(_rt); _rt = setTimeout(resize, 150) })
    raf = requestAnimationFrame(draw)

    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [onSceneChange])

  return <canvas ref={canvasRef} className="auth-canvas" aria-hidden="true" />
}

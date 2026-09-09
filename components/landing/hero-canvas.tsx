'use client'

import { useEffect, useRef } from 'react'

export function HeroCanvas(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Skip animation on mobile/tablet — avoids overlap issues and saves battery
    if (window.innerWidth < 900) return

    const canvas = canvasRef.current
    const hero = canvas?.closest('section')
    if (!canvas || !hero) return

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    let W = 0, H = 0
    let raf: number | null = null
    let startT: number | null = null

    const BASE_ALPHA = 0.32
    const CYCLE = 13000

    function getPhase(ms: number) {
      const t = ms % CYCLE
      if (t < 7000) return { name: 'normal',     t,        pct: 0 }
      if (t < 8200) return { name: 'degrading',  t: t-7000, pct: (t-7000)/1200 }
      if (t < 10200){ const p=(t-8200)/2000; return { name:'down',      t:t-8200,  pct:p } }
      if (t < 12000){ const p=(t-10200)/1800; return { name:'recovering',t:t-10200,pct:p } }
      return { name: 'normal', t, pct: 1 }
    }

    function rr(x: number, y: number, w: number, h: number, r: number | number[], fill: string|null, stroke: string|null, alpha: number) {
      ctx.globalAlpha = alpha
      ctx.beginPath()
      const radii = Array.isArray(r) ? r : [r, r, r, r]
      ctx.roundRect(x, y, w, h, radii)
      if (fill)   { ctx.fillStyle = fill;   ctx.fill() }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke() }
      ctx.globalAlpha = 1
    }

    function txt(str: string, x: number, y: number, size: number, color: string, alpha: number, weight = '500') {
      ctx.globalAlpha = alpha
      ctx.font = `${weight} ${size}px Inter, -apple-system, sans-serif`
      ctx.fillStyle = color
      ctx.fillText(str, x, y)
      ctx.globalAlpha = 1
    }

    function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.min(1, Math.max(0, t)) }

    function drawUptimeBars(x: number, y: number, w: number, h: number, pctDown: number, fade: number) {
      const bars = 28, bw = (w - bars) / bars
      for (let i = 0; i < bars; i++) {
        const isDown = pctDown > 0 && i >= bars - Math.round(bars * pctDown * 0.3)
        ctx.globalAlpha = BASE_ALPHA * fade * 0.8
        ctx.fillStyle = isDown ? '#ef4444' : '#10b981'
        ctx.beginPath()
        ctx.roundRect(x + i * (bw + 1), y, bw, h, 1)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    function drawGhost(ms: number, fade: number) {
      const ph = getPhase(ms)
      const isDown = ph.name === 'down'
      const isDeg  = ph.name === 'degrading'
      const isRec  = ph.name === 'recovering'

      const uptimePct = isDown ? lerp(99.94, 98.20, ph.pct) :
                        isRec  ? lerp(98.20, 99.94, ph.pct) : 99.94
      const downCount = isDown ? Math.round(lerp(0, 2, Math.min(1, ph.pct * 2.5))) :
                        isRec  ? Math.round(lerp(2, 0, ph.pct)) : 0
      const healthyCount = 24 - downCount - (isDeg ? 1 : 0)
      const respTime  = isDown ? Math.round(lerp(142, 8200, ph.pct)) :
                        isDeg  ? Math.round(lerp(142, 680, ph.pct))  :
                        isRec  ? Math.round(lerp(8200, 142, ph.pct)) : 142

      const a = BASE_ALPHA * fade

      const lx = W * 0.04, ly = H * 0.08, panW = W * 0.30

      rr(lx, ly, 56, H * 0.84, 8, '#0c1322', null, a * 0.6)
      ;[0.15,0.22,0.29,0.36,0.50,0.57,0.64].forEach(yf => {
        ctx.globalAlpha = a * 0.5
        ctx.fillStyle = '#94a3b8'
        ctx.beginPath(); ctx.roundRect(lx+8, H*yf, 40, 6, 3); ctx.fill()
        ctx.globalAlpha = 1
      })
      rr(lx+4, H*0.15-1, 48, 8, 3, 'rgba(56,189,248,0.3)', null, a*1.2)
      rr(lx+64, ly, panW, 36, 6, '#ffffff', '#e2e8f0', a * 0.7)

      const cardW = (panW - 12) / 2, cardH = 52
      const cy = ly + 44
      const cards = [
        { label:'MONITORS', val:'24',                   color:'#1392FB' },
        { label:'HEALTHY',  val:String(healthyCount),  color:'#10b981' },
        { label:'DOWN',     val:String(downCount),      color:'#ef4444' },
        { label:'AVG RESP', val:(respTime > 999 ? (respTime/1000).toFixed(1)+'s' : respTime+'ms'),
          color: respTime > 2000 ? '#ef4444' : '#1392FB' },
      ]
      cards.forEach((c, i) => {
        const cx2 = lx + 64 + (i % 2) * (cardW + 4)
        const cy2 = cy + Math.floor(i / 2) * (cardH + 4)
        const isAlert = (c.label === 'DOWN' && downCount > 0) ||
                        (c.label === 'HEALTHY' && downCount > 0) ||
                        (c.label === 'AVG RESP' && respTime > 1000)
        const isHealthyAlert = c.label === 'HEALTHY' && downCount > 0
        const borderCol = isHealthyAlert ? '#fde68a' : isAlert ? '#fecaca' : '#e2e8f0'
        const valCol    = isHealthyAlert ? '#d97706' : isAlert ? '#ef4444' : '#0f172a'
        rr(cx2, cy2, cardW, cardH, 5, '#ffffff', borderCol, a * 0.8)
        rr(cx2, cy2+cardH-3, cardW, 3, [0,0,2,2], c.color, null, a * (isAlert ? 1.6 : 0.9))
        txt(c.label, cx2+8, cy2+15, 7, '#94a3b8', a*1.2, '700')
        txt(c.val, cx2+8, cy2+40, isAlert ? 18 : 16, valCol, a*1.4, '800')
      })

      const ty = cy + cardH * 2 + 12
      const tableW = panW
      rr(lx+64, ty, tableW, 16, [4,4,0,0], '#f8fafc', '#e2e8f0', a*0.8)
      txt('MONITOR', lx+72, ty+11, 7, '#94a3b8', a*1.1, '700')
      txt('STATUS',  lx+64+tableW*0.45, ty+11, 7, '#94a3b8', a*1.1, '700')
      txt('UPTIME',  lx+64+tableW*0.65, ty+11, 7, '#94a3b8', a*1.1, '700')

      // second monitor goes slow during degrading, then down during peak incident (downCount===2)
      const blogIsDown = isDown && downCount >= 2
      const blogIsSlow = isDeg || (isDown && downCount < 2)
      const blogRecov  = isRec && ph.pct < 0.6
      const rows = [
        { name:'api.acmecorp.com',  status:'Up',   uptime:'99.98%', down:false, warn:false },
        { name:'checkout.shop.io',
          status: isDown ? 'Down' : isDeg ? 'Slow' : isRec && ph.pct < 0.5 ? 'Slow' : 'Up',
          uptime: uptimePct.toFixed(2)+'%', down: isDown, warn: isDeg || (isRec && ph.pct < 0.5) },
        { name:'cdn.assets.io',     status:'Up',   uptime:'100%',   down:false, warn:false },
        { name:'blog.example.com',
          status: blogIsDown ? 'Down' : (blogIsSlow || blogRecov) ? 'Slow' : 'Up',
          uptime: blogIsDown ? '99.1%' : '99.9%',
          down: blogIsDown, warn: blogIsSlow || blogRecov },
      ]
      rows.forEach((row, i) => {
        const ry = ty + 16 + i * 20
        const rowAlpha = row.down ? a*1.3 : a*0.8
        if (row.down) rr(lx+64, ry, tableW, 20, 0, 'rgba(239,68,68,0.06)', null, 1)
        if (row.warn) rr(lx+64, ry, tableW, 20, 0, 'rgba(245,158,11,0.06)', null, 1)
        txt(row.name, lx+72, ry+13, 8, '#0f172a', rowAlpha*0.9)
        const sc = row.down ? '#ef4444' : row.warn ? '#f59e0b' : '#10b981'
        txt('●', lx+64+tableW*0.44, ry+13, 8, sc, rowAlpha*1.2)
        txt(row.status, lx+64+tableW*0.44+10, ry+13, 8, sc, rowAlpha*1.1, '600')
        txt(row.uptime, lx+64+tableW*0.65, ry+13, 8, row.down?'#ef4444':'#10b981', rowAlpha*1.1, '700')
      })

      const rx = W * 0.66, ry2 = H * 0.08, rpW = W * 0.30
      rr(rx, ry2, rpW, H*0.28, 8, '#ffffff', '#e2e8f0', a*0.7)
      txt('Uptime (90 days)', rx+12, ry2+16, 9, '#0f172a', a*1.1, '600')
      txt(uptimePct.toFixed(2)+'%', rx+rpW-60, ry2+16, 9,
          isDown ? '#ef4444' : '#10b981', a*1.4, '800')
      drawUptimeBars(rx+12, ry2+28, rpW-24, 10, isDown ? ph.pct : isDeg ? ph.pct*0.1 : 0, fade)

      const chartY = ry2 + H*0.28 + 8
      rr(rx, chartY, rpW, H*0.22, 8, '#ffffff', '#e2e8f0', a*0.7)
      txt('Response Time', rx+12, chartY+16, 9, '#0f172a', a*1.1, '600')
      txt((respTime>999 ? (respTime/1000).toFixed(1)+'s' : respTime+'ms'),
          rx+rpW-70, chartY+16, 9, respTime > 2000 ? '#ef4444' : '#1392FB', a*1.4, '800')

      const barData = [60,72,68,80,74,70,65,200,180,160,350,respTime*0.012].map(v => Math.min(v, 400))
      const maxBar = Math.max(...barData)
      const bH = H * 0.10, bYb = chartY + H*0.10
      barData.forEach((v, i) => {
        const bx = rx + 12 + i * ((rpW-24)/barData.length)
        const bh = (v / maxBar) * bH
        const isSpike = i >= barData.length - 3
        ctx.globalAlpha = a * 0.9
        ctx.fillStyle = isSpike && isDown ? '#ef4444' : '#1392FB'
        ctx.beginPath()
        ctx.roundRect(bx, bYb+bH-bh, (rpW-24)/barData.length - 2, bh, 2)
        ctx.fill()
        ctx.globalAlpha = 1
      })

      if (isDown || isDeg) {
        const alertAlpha = isDeg ? ph.pct * 0.5 : Math.min(1, ph.t/400) * 0.55
        rr(W*0.06, H*0.72, W*0.88, 30, 6, 'rgba(239,68,68,0.12)', 'rgba(239,68,68,0.3)', alertAlpha * fade)
        ctx.globalAlpha = alertAlpha * fade * 0.8
        ctx.font = 'bold 10px Inter, sans-serif'
        ctx.fillStyle = '#ef4444'
        ctx.fillText(isDeg
          ? '⚠  checkout.shop.io — Response time degraded · Confirming…'
          : '🔴  INCIDENT · checkout.shop.io is DOWN · Upnotify is alerting your team',
          W*0.06 + 16, H*0.72 + 19)
        ctx.globalAlpha = 1
      }

      if (isRec && ph.pct > 0.3) {
        const recAlpha = Math.min(1, (ph.pct - 0.3) / 0.4) * 0.5
        rr(W*0.06, H*0.72, W*0.88, 30, 6, 'rgba(16,185,129,0.12)', 'rgba(16,185,129,0.3)', recAlpha * fade)
        ctx.globalAlpha = recAlpha * fade * 0.8
        ctx.font = 'bold 10px Inter, sans-serif'
        ctx.fillStyle = '#10b981'
        ctx.fillText('✓  checkout.shop.io — Recovered · Incident duration: 2m 14s', W*0.06+16, H*0.72+19)
        ctx.globalAlpha = 1
      }
    }

    function resize() {
      W = canvas!.width  = hero!.offsetWidth
      H = canvas!.height = hero!.offsetHeight
    }

    function draw(t: number) {
      if (startT === null) startT = t
      if (!W || !H) resize()
      const ms = t - startT
      const fade = Math.min(1, Math.max(0, (ms - 2000) / 1000))
      ctx.clearRect(0, 0, W, H)
      if (fade > 0) drawGhost(ms, fade)
      raf = requestAnimationFrame(draw)
    }

    resize()
    let _rt: ReturnType<typeof setTimeout>
    window.addEventListener('resize', () => { clearTimeout(_rt); _rt = setTimeout(resize, 150) })
    raf = requestAnimationFrame(draw)

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { if (!raf) raf = requestAnimationFrame(draw) }
        else { if (raf) { cancelAnimationFrame(raf); raf = null } }
      }, { threshold: 0 }).observe(hero)
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
}

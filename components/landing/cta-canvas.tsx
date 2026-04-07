'use client'

import { useEffect, useRef } from 'react'

export function CtaCanvas(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const section = canvas?.closest('section')
    if (!canvas || !section) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0
    let raf: number | null = null
    let particles: {
      x: number; y: number; r: number; vy: number; vx: number
      wobble: number; wobbleSpeed: number; wobbleAmp: number
      alpha: number; life: number; maxLife: number
    }[] = []

    function rand(a: number, b: number) { return a + Math.random() * (b - a) }

    function spawn() {
      return {
        x: rand(0, W),
        y: H + rand(0, 20),
        r: rand(1, 3.5),
        vy: rand(0.3, 0.9),
        vx: rand(-0.15, 0.15),
        wobble: rand(0, Math.PI * 2),
        wobbleSpeed: rand(0.008, 0.02),
        wobbleAmp: rand(0.3, 1.0),
        alpha: rand(0.12, 0.40),
        life: 0,
        maxLife: rand(160, 320),
      }
    }

    function resize() {
      W = canvas!.width  = section!.offsetWidth
      H = canvas!.height = section!.offsetHeight
    }

    function init() {
      particles = []
      const count = Math.min(28, Math.floor(W / 55))
      for (let i = 0; i < count; i++) {
        const p = spawn()
        p.y = rand(0, H)
        p.life = Math.floor(Math.random() * p.maxLife)
        particles.push(p)
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H)
      if (Math.random() < 0.04) particles.push(spawn())

      particles = particles.filter(p => {
        p.wobble += p.wobbleSpeed
        p.x += p.vx + Math.sin(p.wobble) * p.wobbleAmp
        p.y -= p.vy
        p.life++
        if (p.y < -10 || p.life >= p.maxLife) return false

        const fade = p.life < 40 ? p.life / 40 : p.life > p.maxLife - 40 ? (p.maxLife - p.life) / 40 : 1
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255,255,255,${(p.alpha * fade).toFixed(3)})`
        ctx!.fill()
        return true
      })

      raf = requestAnimationFrame(draw)
    }

    resize()
    init()

    let _rt: ReturnType<typeof setTimeout>
    window.addEventListener('resize', () => {
      clearTimeout(_rt)
      _rt = setTimeout(() => { resize(); init() }, 150)
    }, { passive: true })

    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (!raf) { init(); raf = requestAnimationFrame(draw) }
      } else {
        if (raf) { cancelAnimationFrame(raf); raf = null }
      }
    }, { threshold: 0 }).observe(section)

    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={canvasRef} id="ctaCanvas" aria-hidden="true" />
}

'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

interface TestimonialItem {
  quote: string
  name: string
  initials: string
  avatarClass: string
  role?: string
  company?: string
}

const ROW_SIZE = 88
const WINDOW_SIZE = 3
const AUTO_ADVANCE_MS = 4000

function useActiveIndex(n: number): [number, (i: number) => void] {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % n)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [n, active])

  return [active, setActive]
}

function offsetOf(i: number, active: number, n: number): number {
  let d = i - active
  if (d > n / 2) d -= n
  if (d < -n / 2) d += n
  return d
}

function Quote({ current }: { current: TestimonialItem; active: number }): React.ReactElement {
  return (
    <div className="testimonials-showcase-quote">
      <span className="testimonials-showcase-quote-mark">&ldquo;</span>
      <p key={current.name} className="testimonials-showcase-quote-text">{current.quote}</p>
      <div className="testimonials-showcase-quote-author">
        <span className="testimonials-showcase-quote-name">{current.name}</span>
        <span className="testimonials-showcase-quote-role">{current.role ?? current.company ?? ''}</span>
      </div>
    </div>
  )
}

function VerticalShowcase({ items }: { items: TestimonialItem[] }): React.ReactElement {
  const n = items.length
  const [active, setActive] = useActiveIndex(n)
  const current = items[active]

  const anchorX = 27
  const bulgeX = 88
  const windowSize = WINDOW_SIZE * ROW_SIZE
  const topY = ROW_SIZE / 2
  const bottomY = windowSize - ROW_SIZE / 2
  const path = `M ${anchorX} ${topY} Q ${bulgeX} ${windowSize / 2}, ${anchorX} ${bottomY}`

  return (
    <div className="testimonials-showcase testimonials-showcase-vertical">
      <div className="testimonials-showcase-list" style={{ height: windowSize }}>
        <svg
          className="testimonials-showcase-svg"
          viewBox={`0 0 108 ${windowSize}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={path} fill="none" stroke="var(--border-primary)" strokeWidth="1.5" />
        </svg>
        {items.map((t, i) => {
          const offset = offsetOf(i, active, n)
          const visible = Math.abs(offset) <= 1
          const bt = 0.5 + offset / 2
          const rowX = (1 - bt) * (1 - bt) * anchorX + 2 * (1 - bt) * bt * bulgeX + bt * bt * anchorX
          return (
            <button
              key={t.name}
              type="button"
              className={`testimonials-showcase-row ${i === active ? 'is-active' : ''}`}
              style={{
                top: (offset + 1) * ROW_SIZE,
                left: rowX - anchorX,
                height: ROW_SIZE,
                opacity: visible ? undefined : 0,
                pointerEvents: visible ? undefined : 'none',
              }}
              onClick={() => setActive(i)}
              tabIndex={visible ? 0 : -1}
            >
              <span className={`testimonials-showcase-avatar ${t.avatarClass}`}>{t.initials}</span>
              <span className="testimonials-showcase-meta">
                <span className="testimonials-showcase-name">{t.name}</span>
                <span className="testimonials-showcase-rating">
                  <Star size={12} fill="currentColor" strokeWidth={0} />
                  <span>4.9</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <Quote current={current} active={active} />
    </div>
  )
}

function HorizontalShowcase({ items }: { items: TestimonialItem[] }): React.ReactElement {
  const n = items.length
  const [active, setActive] = useActiveIndex(n)
  const current = items[active]

  const anchorY = 27
  const bulgeY = 60
  const windowWidth = WINDOW_SIZE * ROW_SIZE
  const leftX = ROW_SIZE / 2
  const rightX = windowWidth - ROW_SIZE / 2
  const path = `M ${leftX} ${anchorY} Q ${windowWidth / 2} ${bulgeY}, ${rightX} ${anchorY}`

  return (
    <div className="testimonials-showcase-horizontal">
      <div className="testimonials-showcase-list-h" style={{ width: windowWidth }}>
        <svg
          className="testimonials-showcase-svg-h"
          viewBox={`0 0 ${windowWidth} 80`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={path} fill="none" stroke="var(--border-primary)" strokeWidth="1.5" />
        </svg>
        {items.map((t, i) => {
          const offset = offsetOf(i, active, n)
          const visible = Math.abs(offset) <= 1
          const bt = 0.5 + offset / 2
          const colY = (1 - bt) * (1 - bt) * anchorY + 2 * (1 - bt) * bt * bulgeY + bt * bt * anchorY
          return (
            <button
              key={t.name}
              type="button"
              className={`testimonials-showcase-col ${i === active ? 'is-active' : ''}`}
              style={{
                left: (offset + 1) * ROW_SIZE,
                top: colY - anchorY,
                width: ROW_SIZE,
                opacity: visible ? undefined : 0,
                pointerEvents: visible ? undefined : 'none',
              }}
              onClick={() => setActive(i)}
              tabIndex={visible ? 0 : -1}
            >
              <span className={`testimonials-showcase-avatar ${t.avatarClass}`}>{t.initials}</span>
            </button>
          )
        })}
      </div>

      <div className="testimonials-showcase-active-meta">
        <span className="testimonials-showcase-name is-active">{current.name}</span>
        <span className="testimonials-showcase-rating">
          <Star size={12} fill="currentColor" strokeWidth={0} />
          <span>4.9</span>
        </span>
      </div>

      <Quote current={current} active={active} />
    </div>
  )
}

export function TestimonialsShowcase({ items }: { items: TestimonialItem[] }): React.ReactElement {
  return (
    <>
      <VerticalShowcase items={items} />
      <HorizontalShowcase items={items} />
    </>
  )
}

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

export function TestimonialsShowcase({ items }: { items: TestimonialItem[] }): React.ReactElement {
  const n = items.length
  const [active, setActive] = useActiveIndex(n)
  const current = items[active]

  return (
    <div className="testimonials-showcase">
      <div className="testimonials-showcase-dots">
        {items.map((t, i) => (
          <button
            key={t.name}
            type="button"
            className={`testimonials-showcase-dot ${i === active ? 'is-active' : ''}`}
            onClick={() => setActive(i)}
            aria-label={`Show testimonial from ${t.name}`}
          >
            <span className={`testimonials-showcase-avatar sm ${t.avatarClass}`}>{t.initials}</span>
            {i === active && (
              <span className="testimonials-showcase-dot-meta">
                <span className="testimonials-showcase-name">{t.name}</span>
                <span className="testimonials-showcase-rating">
                  <Star size={11} fill="currentColor" strokeWidth={0} />
                  4.9
                </span>
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="testimonials-showcase-quote">
        <span className="testimonials-showcase-quote-mark">&ldquo;</span>
        <p key={current.name} className="testimonials-showcase-quote-text">{current.quote}</p>
        <div className="testimonials-showcase-quote-author">
          <span className={`testimonials-showcase-avatar ${current.avatarClass}`}>{current.initials}</span>
          <div className="testimonials-showcase-quote-author-text">
            <span className="testimonials-showcase-quote-name">{current.name}</span>
            <span className="testimonials-showcase-quote-role">{current.role ?? current.company ?? ''}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

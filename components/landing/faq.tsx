'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FAQ_ITEMS, type FaqItem } from '@/lib/constants/faq'

interface FaqProps {
  items?: FaqItem[]
  eyebrow?: string
  headline?: string
}

export default function Faq({ items, eyebrow, headline }: FaqProps): React.ReactElement {
  const faqItems = items ?? FAQ_ITEMS
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  function toggleItem(index: number): void {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="section faq-section" id="faq">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">{eyebrow ?? 'Got questions?'}</div>
          <h2 className="section-title">{headline ?? <>We&apos;ve got <em className="faq-answers-gradient">Answers.</em></>}</h2>
          <p className="section-sub">Everything you need to know about Uptrue — no fluff.</p>
        </div>
        <div className="faq-grid">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className={`faq-item${openIndex === index ? ' open' : ''}`}
            >
              <div
                className="faq-q"
                onClick={() => toggleItem(index)}
                role="button"
                aria-expanded={openIndex === index}
              >
                {item.question}
                <div className="faq-chevron">
                  <ChevronDown size={12} strokeWidth={2.5} />
                </div>
              </div>
              <div className="faq-a">{item.answer}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

import { useState } from 'react'

interface CompeteFaqItem {
  question: string
  answer: string
}

interface CompeteFaqClientProps {
  items: CompeteFaqItem[]
}

export default function CompeteFaqClient({
  items,
}: CompeteFaqClientProps): React.ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggleItem(index: number): void {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="landing-section landing-faq" id="faq">
      <div className="landing-container">
        <h2 className="landing-section-title">Frequently asked questions</h2>
        <p className="landing-section-subtitle">
          Everything you need to know about Upnotify Compete
        </p>
        <div className="faq-list">
          {items.map((item, index) => (
            <div
              key={index}
              className={`faq-item ${openIndex === index ? 'faq-item-open' : ''}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleItem(index)}
                aria-expanded={openIndex === index}
              >
                <span>{item.question}</span>
                <span className="faq-icon">
                  {openIndex === index ? '\u2212' : '+'}
                </span>
              </button>
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

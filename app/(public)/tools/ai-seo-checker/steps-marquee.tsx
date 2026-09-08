'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, FileWarning, FileCode, Braces, HelpCircle, UserCheck } from 'lucide-react'

function usePageSize(): number {
  const [pageSize, setPageSize] = useState(3)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 860px)')
    const update = (): void => setPageSize(mql.matches ? 1 : 3)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  return pageSize
}

const STEPS = [
  {
    icon: FileWarning,
    title: 'Create or fix your robots.txt',
    body: 'This is the most common and most costly mistake — a missing or over-restrictive robots.txt blocks all AI crawlers at once. Explicitly allow GPTBot, ClaudeBot, PerplexityBot, and Google-Extended.',
  },
  {
    icon: FileCode,
    title: 'Generate and deploy your llms.txt',
    body: 'Even a simple one-page file improves your AI search presence by giving models a direct description of your site. Use the free Upnotify generator to create one tailored to selected AI engines.',
  },
  {
    icon: Braces,
    title: 'Add JSON-LD structured data',
    body: 'At minimum: Organization and WebSite schema on your homepage. Article or BlogPosting on content pages. FAQPage schema on any page with a FAQ section — the primary channel AI engines use to extract verified facts.',
  },
  {
    icon: HelpCircle,
    title: 'Add question-style headings and FAQ sections',
    body: 'AI engines are built to answer questions. Pages with headings like "What is X?" and "How does Y work?" are far more frequently cited than pages that only describe features or products.',
  },
  {
    icon: UserCheck,
    title: 'Add authorship and E-E-A-T signals',
    body: 'A named author, a linked About page, a Privacy Policy, and social profile links all contribute to AI brand presence — the credibility layer that determines whether AI engines trust you as a source.',
  },
]

function StepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }): React.ReactElement {
  return (
    <div className="ai-seo-step-card" style={{ animationDelay: `${index * 0.08}s` }}>
      <span className="ai-seo-step-number">{index + 1}</span>
      <div className="ai-seo-step-title">{step.title}</div>
      <p className="ai-seo-step-body">{step.body}</p>
    </div>
  )
}

export function AiSeoStepsMarquee(): React.ReactElement {
  const pageSize = usePageSize()
  const maxPage = Math.max(0, STEPS.length - pageSize)
  const [start, setStart] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  const clampedStart = Math.min(start, maxPage)
  const visible = STEPS.slice(clampedStart, clampedStart + pageSize)

  function goPrev(): void {
    setDirection('left')
    setStart((s) => Math.max(0, s - 1))
  }

  function goNext(): void {
    setDirection('right')
    setStart((s) => Math.min(maxPage, s + 1))
  }

  return (
    <div className="ai-seo-marquee-wrap">
      <div className="ai-seo-carousel">
        <button
          type="button"
          className={`ai-seo-carousel-arrow prev${clampedStart === 0 ? ' disabled' : ''}`}
          onClick={goPrev}
          aria-label="Previous steps"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        <div className="ai-seo-carousel-viewport">
          <div key={clampedStart} className={`ai-seo-carousel-track slide-${direction}`}>
            {visible.map((step, i) => (
              <StepCard key={clampedStart + i} step={step} index={clampedStart + i} />
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`ai-seo-carousel-arrow next${clampedStart >= maxPage ? ' disabled' : ''}`}
          onClick={goNext}
          aria-label="Next steps"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div className="ai-seo-carousel-dots">
        {Array.from({ length: maxPage + 1 }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`ai-seo-carousel-dot${i === clampedStart ? ' active' : ''}`}
            onClick={() => { setDirection(i > clampedStart ? 'right' : 'left'); setStart(i) }}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

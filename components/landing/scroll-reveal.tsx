'use client'

import { useEffect, useRef } from 'react'

export function ScrollReveal(): null {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    const targets = document.querySelectorAll(
      '.reveal, .reveal-title, .reveal-card, .reveal-stagger > *'
    )
    targets.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  return null
}

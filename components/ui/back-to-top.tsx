'use client'

import { useState, useEffect } from 'react'

export function BackToTop(): React.ReactElement | null {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll(): void {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      className="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      ↑
    </button>
  )
}

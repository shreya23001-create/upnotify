'use client'

import React, { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle(): React.ReactElement {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('uptrue_theme')
    const isDark = saved !== 'light'
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
    setMounted(true)
  }, [])

  function toggle(): void {
    const newDark = !dark
    setDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem('uptrue_theme', newDark ? 'dark' : 'light')
  }

  const cls = ['tt', dark ? 'tt--dark' : 'tt--light', !mounted ? 'tt--no-anim' : ''].filter(Boolean).join(' ')

  return (
    <button
      className={cls}
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      suppressHydrationWarning
    >
      <span className="tt-track">
        {/* sliding thumb — carries the active icon */}
        <span className="tt-thumb">
          {dark ? <Moon size={15} strokeWidth={2} fill="currentColor" /> : <Sun size={16} strokeWidth={2} />}
        </span>
      </span>
    </button>
  )
}

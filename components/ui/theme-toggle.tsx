'use client'

import React, { useState, useEffect } from 'react'

export function ThemeToggle(): React.ReactElement {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('uptrue_theme')
    const isDark = saved === 'dark'
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggle(): void {
    const newDark = !dark
    setDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem('uptrue_theme', newDark ? 'dark' : 'light')
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      suppressHydrationWarning
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

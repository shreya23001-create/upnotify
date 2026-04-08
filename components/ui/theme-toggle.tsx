'use client'

import React, { useState, useEffect } from 'react'

export function ThemeToggle(): React.ReactElement {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('uptrue_theme')
    return saved !== 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

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
    >
      {dark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
    </button>
  )
}

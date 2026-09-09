'use client'

// Dark mode is currently disabled site-wide (see theme-toggle.tsx) — light
// mode is the only theme shown, so this script no longer needs to add the
// dark class before first paint. Kept as a no-op component so existing
// <ThemeScript /> usages don't need to be removed.
export function ThemeScript(): React.ReactElement | null {
  return null
}

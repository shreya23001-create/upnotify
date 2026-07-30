'use client'

export function ThemeScript(): React.ReactElement {
  return (
    <script
      // biome-ignore lint: intentional inline script for theme init before first paint
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var s=localStorage.getItem('uptrue_theme');if(s!=='light')document.documentElement.classList.add('dark');}catch(e){}})();`,
      }}
    />
  )
}

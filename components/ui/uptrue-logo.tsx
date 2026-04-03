interface LogoProps {
  variant?: 'dark' | 'light'
  width?: number
  height?: number
}

/** Uptrue logo — inline SVG, works everywhere, no external file dependency.
 *  Text uses currentColor so it inherits from the parent CSS color,
 *  which auto-switches between light and dark themes via var(--text-primary). */
export function UptrueLogo({ variant = 'dark', width = 140, height = 35 }: LogoProps): React.ReactElement {
  const textColor = variant === 'light' ? '#ffffff' : 'currentColor'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width={width}
      height={height}
      aria-label="Uptrue"
      role="img"
    >
      <defs>
        <linearGradient id={`logo-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        d="M20 6 L36 12 L36 24 C36 32 28 38 20 42 C12 38 4 32 4 24 L4 12 Z"
        fill={`url(#logo-grad-${variant})`}
      />
      <text
        x="10"
        y="30"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="16"
        fontWeight="800"
        fill="white"
        letterSpacing="0.5"
      >
        <tspan dy="0">U</tspan>
        <tspan dy="-5">p</tspan>
      </text>
      <text
        x="46"
        y="34"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="28"
        fontWeight="700"
        fill={textColor}
        letterSpacing="-0.5"
      >
        Uptrue
      </text>
    </svg>
  )
}

/** Uptrue shield icon only — for favicon, badges, small spaces */
export function UptrueIcon({ size = 32 }: { size?: number }): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 48"
      width={size}
      height={size}
      aria-label="Uptrue"
      role="img"
    >
      <defs>
        <linearGradient id="icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        d="M20 2 L38 9 L38 23 C38 32 29 39 20 44 C11 39 2 32 2 23 L2 9 Z"
        fill="url(#icon-grad)"
      />
      <text
        x="9"
        y="27"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="14"
        fontWeight="800"
        fill="white"
      >
        <tspan dy="0">U</tspan>
        <tspan dy="-4">p</tspan>
      </text>
    </svg>
  )
}

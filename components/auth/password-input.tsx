'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  id: string
  name: string
  placeholder?: string
  minLength?: number
  required?: boolean
  autoComplete?: string
  disabled?: boolean
  showToggle?: boolean
}

export function PasswordInput({ id, name, placeholder, minLength, required, autoComplete, disabled, showToggle = true }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  if (!showToggle) {
    return (
      <input
        className="auth-input"
        id={id}
        name={name}
        type="password"
        placeholder={placeholder}
        minLength={minLength}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
      />
    )
  }

  return (
    <div className="auth-password-wrap">
      <input
        className="auth-input"
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        minLength={minLength}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        style={{ paddingRight: 40 }}
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setVisible(v => !v)}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}

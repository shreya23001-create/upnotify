'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'

interface MultiEmailInputProps {
  primaryDefault?: string
  extraDefaults?: string[]
  disabled?: boolean
}

/**
 * Primary email + any number of additional recipients. Renders plain named
 * inputs (email, extra_email) so the server action can read them straight
 * off FormData — no client-side JSON serialization needed.
 */
export function MultiEmailInput({ primaryDefault = '', extraDefaults = [], disabled }: MultiEmailInputProps) {
  const [extraEmails, setExtraEmails] = useState<string[]>(extraDefaults.length > 0 ? extraDefaults : [])

  function addRow(): void {
    setExtraEmails(prev => [...prev, ''])
  }

  function removeRow(index: number): void {
    setExtraEmails(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="ac-form-section">
      <label className="ac-form-label">Email Address</label>
      <input
        className="form-input"
        name="email"
        type="email"
        required
        placeholder="alerts@example.com"
        defaultValue={primaryDefault}
        disabled={disabled}
      />

      {extraEmails.map((email, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            className="form-input"
            name="extra_email"
            type="email"
            placeholder="another@example.com"
            defaultValue={email}
            disabled={disabled}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => removeRow(i)}
            disabled={disabled}
            aria-label="Remove email"
            style={{ padding: '0 12px' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-ghost"
        onClick={addRow}
        disabled={disabled}
        style={{ marginTop: 8, fontSize: 13, padding: '6px 10px' }}
      >
        <Plus size={13} /> Add another email
      </button>
      <p className="ac-form-hint">Alerts will be sent to every email address listed here.</p>
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'

interface KeywordTagInputProps {
  label: string
  helperText: string
  keywords: string[]
  onChange: (keywords: string[]) => void
  variant: 'positive' | 'negative'
  disabled?: boolean
  placeholder?: string
  suggestions?: string[]
  suggestionsLabel?: string
}

export function KeywordTagInput({
  label,
  helperText,
  keywords,
  onChange,
  variant,
  disabled = false,
  placeholder = 'Type a keyword and press Enter',
  suggestions = [],
  suggestionsLabel = 'Suggestions based on your URL (click to add)',
}: KeywordTagInputProps): React.ReactElement {
  const [inputValue, setInputValue] = useState('')

  const addKeyword = useCallback((keyword: string): void => {
    const trimmed = keyword.trim()
    if (trimmed.length === 0) return
    // Prevent duplicates (case-insensitive check)
    const exists = keywords.some(k => k.toLowerCase() === trimmed.toLowerCase())
    if (exists) return
    onChange([...keywords, trimmed])
  }, [keywords, onChange])

  const removeKeyword = useCallback((index: number): void => {
    const updated = keywords.filter((_, i) => i !== index)
    onChange(updated)
  }, [keywords, onChange])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword(inputValue)
      setInputValue('')
    }
    // Allow backspace to remove last tag when input is empty
    if (e.key === 'Backspace' && inputValue === '' && keywords.length > 0) {
      removeKeyword(keywords.length - 1)
    }
  }

  function handleSuggestionClick(suggestion: string): void {
    addKeyword(suggestion)
  }

  const tagClass = variant === 'positive' ? 'keyword-tag keyword-tag-positive' : 'keyword-tag keyword-tag-negative'

  // Filter out suggestions that are already added
  const availableSuggestions = suggestions.filter(
    s => !keywords.some(k => k.toLowerCase() === s.toLowerCase())
  )

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className={`keyword-tag-input ${disabled ? 'keyword-tag-input-disabled' : ''}`}>
        {keywords.map((keyword, index) => (
          <span key={`${keyword}-${index}`} className={tagClass}>
            {keyword}
            {!disabled && (
              <button
                type="button"
                className="keyword-tag-remove"
                onClick={() => removeKeyword(index)}
                aria-label={`Remove ${keyword}`}
              >
                x
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          className="keyword-tag-input-field"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={keywords.length === 0 ? placeholder : ''}
          disabled={disabled}
        />
      </div>
      <span className="form-helper-text">{helperText}</span>

      {availableSuggestions.length > 0 && !disabled && (
        <div className="keyword-suggestions">
          <span className="keyword-suggestions-label">{suggestionsLabel}</span>
          <div className="keyword-suggestions-list">
            {availableSuggestions.map(suggestion => (
              <button
                key={suggestion}
                type="button"
                className={`keyword-suggestion ${variant === 'positive' ? 'keyword-suggestion-positive' : 'keyword-suggestion-negative'}`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

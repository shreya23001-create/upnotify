'use client'

import { useEffect, useRef, useCallback } from 'react'

type ConfirmDialogVariant = 'danger' | 'warning'

interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmText?: string
  variant?: ConfirmDialogVariant
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Delete',
  variant = 'danger',
}: ConfirmDialogProps): React.ReactNode {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      onConfirm()
      return
    }

    // Focus trap: Tab cycles between Cancel and Confirm buttons
    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled])'
      )
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }, [onCancel, onConfirm])

  useEffect((): (() => void) | undefined => {
    if (!isOpen) return undefined

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // Focus the cancel button on open (safer default)
    const timer = setTimeout((): void => {
      cancelBtnRef.current?.focus()
    }, 50)

    return (): void => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      clearTimeout(timer)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>): void {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  return (
    <div
      className="confirm-dialog-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div
          className={`confirm-dialog-icon confirm-dialog-icon-${variant}`}
          aria-hidden="true"
        >
          {variant === 'danger' ? '⚠' : '⚠'}
        </div>
        <h3 id="confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </h3>
        <p id="confirm-dialog-message" className="confirm-dialog-message">
          {message}
        </p>
        <div className="confirm-dialog-actions">
          <button
            ref={cancelBtnRef}
            className="btn btn-secondary confirm-dialog-cancel"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            className={`btn confirm-dialog-confirm confirm-dialog-confirm-${variant}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

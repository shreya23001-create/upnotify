'use client'

import { useState, useRef, useCallback } from 'react'

interface LogoUploadProps {
  currentLogoUrl: string | null
  orgName: string
  onUpload: (base64Data: string) => Promise<{ error?: string }>
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const OUTPUT_SIZE = 200
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onload = (): void => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to read SVG file'))
        }
      }
      reader.onerror = (): void => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = (): void => {
      URL.revokeObjectURL(objectUrl)

      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      // Crop to square from center, then resize
      const minDim = Math.min(img.width, img.height)
      const sx = (img.width - minDim) / 2
      const sy = (img.height - minDim) / 2

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      const base64 = canvas.toDataURL('image/webp', 0.85)
      resolve(base64)
    }

    img.onerror = (): void => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

export function LogoUpload({ currentLogoUrl, orgName, onUpload }: LogoUploadProps): React.ReactElement {
  const [preview, setPreview] = useState<string | null>(currentLogoUrl)
  const [pendingBase64, setPendingBase64] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    setError(null)
    setSuccess(false)
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please select a JPG, PNG, SVG, or WebP image.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be under 2MB.')
      return
    }

    try {
      const base64 = await compressImage(file)
      setPreview(base64)
      setPendingBase64(base64)
    } catch {
      setError('Failed to process image. Please try a different file.')
    }
  }, [])

  const handleUpload = useCallback(async (): Promise<void> => {
    if (!pendingBase64) return
    setIsUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await onUpload(pendingBase64)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setPendingBase64(null)
      }
    } catch {
      setError('Failed to upload logo. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [pendingBase64, onUpload])

  const handleRemove = useCallback((): void => {
    setPreview(null)
    setPendingBase64(null)
    setError(null)
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const initials = getInitials(orgName || 'O')

  return (
    <div className="logo-upload">
      <div className="logo-upload-preview-area">
        <div className="logo-upload-preview">
          {preview ? (
            <img src={preview} alt={`${orgName} logo`} className="logo-upload-image" />
          ) : (
            <span className="logo-upload-initials">{initials}</span>
          )}
        </div>
        <div className="logo-upload-info">
          <div className="logo-upload-title">Organisation Logo</div>
          <div className="logo-upload-desc">
            JPG, PNG, SVG, or WebP. Max 2MB. Will be cropped to a square and resized to 200x200px.
          </div>
          <div className="logo-upload-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Choose File
            </button>
            {pendingBase64 && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            )}
            {preview && (
              <button
                type="button"
                className="btn btn-sm logo-upload-remove-btn"
                onClick={handleRemove}
                disabled={isUploading}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.svg,.webp"
        onChange={handleFileSelect}
        className="logo-upload-input"
        aria-label="Upload organisation logo"
      />

      {error && <div className="logo-upload-error">{error}</div>}
      {success && <div className="logo-upload-success">Logo updated successfully!</div>}
    </div>
  )
}

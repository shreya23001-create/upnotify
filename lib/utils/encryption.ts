/**
 * AES-256-GCM encryption for sensitive values stored in the database
 * (AI engine API keys, third-party credentials).
 *
 * The encryption key comes from AI_ENGINE_ENCRYPTION_SECRET env var —
 * a 64-char hex string (32 bytes). Never hardcoded.
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // bytes
const IV_LENGTH  = 12 // bytes (96 bits — GCM standard)
const TAG_LENGTH = 16 // bytes

function getEncryptionKey(): Buffer {
  const secret = process.env.AI_ENGINE_ENCRYPTION_SECRET
  if (!secret || secret.length < 64) {
    throw new Error('AI_ENGINE_ENCRYPTION_SECRET must be a 64-char hex string (32 bytes)')
  }
  return Buffer.from(secret.slice(0, 64), 'hex')
}

export interface EncryptedValue {
  encrypted: string // hex
  iv: string        // hex
  tag: string       // hex
}

export function encryptValue(plaintext: string): EncryptedValue {
  const key = getEncryptionKey()
  const iv  = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    encrypted: encrypted.toString('hex'),
    iv:        iv.toString('hex'),
    tag:       tag.toString('hex'),
  }
}

export function decryptValue(value: EncryptedValue): string {
  const key  = getEncryptionKey()
  const iv   = Buffer.from(value.iv, 'hex')
  const tag  = Buffer.from(value.tag, 'hex')
  const data = Buffer.from(value.encrypted, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

/** Mask a plaintext key for safe display — shows first 6 chars then stars */
export function maskKey(plaintext: string): string {
  if (plaintext.length <= 6) return '******'
  return plaintext.slice(0, 6) + '••••••••••••'
}

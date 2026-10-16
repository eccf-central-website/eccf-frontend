import crypto from 'crypto'
import { getEncryptionSecret, getHmacSecret } from '@/lib/env'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const PREFIX = 'enc:v1:'
const BLIND_INDEX_PREFIX = 'bidx:v1:'

function getEncryptionKey(): Buffer {
  const secret = getEncryptionSecret()
  return crypto.createHash('sha256').update(secret).digest()
}

function getHmacKey(): Buffer {
  const secret = getHmacSecret()
  return crypto.createHash('sha256').update(secret).digest()
}

/** Check if a string is already encrypted with our AES-256-GCM format */
export function isEncrypted(val?: string | null): boolean {
  return typeof val === 'string' && val.startsWith(PREFIX)
}

/**
 * Encrypt a plain-text string using AES-256-GCM authenticated encryption.
 * Safe to call on already-encrypted strings (will return as-is).
 */
export function encrypt(plainText?: string | null): string {
  if (!plainText || typeof plainText !== 'string') return ''
  if (isEncrypted(plainText)) return plainText

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt an AES-256-GCM ciphertext string back to plain-text.
 * Safe to call on legacy unencrypted strings (will return as-is).
 */
export function decrypt(cipherText?: string | null): string {
  if (!cipherText || typeof cipherText !== 'string') return ''
  if (!isEncrypted(cipherText)) return cipherText

  try {
    const withoutPrefix = cipherText.slice(PREFIX.length)
    const [ivHex, tagHex, encryptedHex] = withoutPrefix.split(':')
    if (!ivHex || !tagHex || !encryptedHex) return cipherText

    const key = getEncryptionKey()
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    console.error('[decrypt] Decryption failed:', err)
    return '[Encrypted Data]'
  }
}

/**
 * Canonical phone number normalizer for lookups (strips non-digits, country code prefixes).
 */
export function normalizePhone(rawPhone?: string | null): string {
  if (!rawPhone || typeof rawPhone !== 'string') return ''
  const digits = rawPhone.replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length >= 13) {
    return digits.slice(3)
  }
  if (digits.startsWith('0') && digits.length >= 11) {
    return digits.slice(1)
  }
  return digits
}

/**
 * Create a one-way HMAC-SHA256 blind index for deterministic lookups and deduplication
 * without revealing the plain phone number in public queries.
 */
export function createBlindIndex(phone?: string | null): string {
  if (!phone) return ''
  const normalized = normalizePhone(phone)
  if (!normalized) return ''
  const hmac = crypto.createHmac('sha256', getHmacKey())
  hmac.update(normalized)
  return `${BLIND_INDEX_PREFIX}${hmac.digest('hex')}`
}

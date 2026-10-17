import 'server-only'

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const PREFIX = 'enc:v1:'
const BLIND_INDEX_PREFIX = 'bidx:v1:'

const DEFAULT_FALLBACK_ENCRYPTION_KEY = 'eccf-production-security-salt-2026-key'
const DEFAULT_FALLBACK_HMAC_PEPPER = 'development_secret_key_eccf_2026'

const KNOWN_LEGACY_KEYS = [
  'development_secret_key_eccf_2026',
  'eccf-production-security-salt-2026-key',
  'eccf-production-blind-index-pepper-2026',
]

function getSecret(name: string, fallback: string): string {
  const secret = process.env[name]?.trim()
  if (secret && Buffer.byteLength(secret, 'utf8') >= 16) {
    return secret
  }
  const nextAuth = process.env.NEXTAUTH_SECRET?.trim()
  if (nextAuth && Buffer.byteLength(nextAuth, 'utf8') >= 16) {
    return nextAuth
  }
  return fallback
}

function parseLegacySecrets(name: string): string[] {
  return (process.env[name] || '')
    .split(',')
    .map((secret) => secret.trim())
    .filter((secret) => secret.length > 0)
}

function getEncryptionKey(): Buffer {
  const secret = getSecret('ENCRYPTION_KEY', DEFAULT_FALLBACK_ENCRYPTION_KEY)
  return crypto.createHash('sha256').update(secret).digest()
}

function getHmacKey(): Buffer {
  const secret = getSecret('HMAC_PEPPER', DEFAULT_FALLBACK_HMAC_PEPPER)
  return crypto.createHash('sha256').update(secret).digest()
}

/** Explicitly configured rotation keys + known historical keys for seamless decryption. */
function getCandidateSecrets(): string[] {
  return Array.from(
    new Set([
      process.env.ENCRYPTION_KEY?.trim(),
      process.env.NEXTAUTH_SECRET?.trim(),
      DEFAULT_FALLBACK_ENCRYPTION_KEY,
      ...KNOWN_LEGACY_KEYS,
      ...parseLegacySecrets('ENCRYPTION_LEGACY_KEYS'),
    ].filter((s): s is string => Boolean(s && s.length > 0)))
  )
}

function getCandidateHmacPeppers(): string[] {
  return Array.from(
    new Set([
      process.env.HMAC_PEPPER?.trim(),
      process.env.ENCRYPTION_KEY?.trim(),
      process.env.NEXTAUTH_SECRET?.trim(),
      DEFAULT_FALLBACK_HMAC_PEPPER,
      ...KNOWN_LEGACY_KEYS,
      ...parseLegacySecrets('HMAC_LEGACY_PEPPERS'),
    ].filter((s): s is string => Boolean(s && s.length > 0)))
  )
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
 * Resilient against key transitions: attempts the configured key and explicit legacy keys.
 * Safe to call on legacy unencrypted strings (will return as-is).
 */
export function decrypt(cipherText?: string | null): string {
  if (!cipherText || typeof cipherText !== 'string') return ''
  if (!isEncrypted(cipherText)) return cipherText

  try {
    const withoutPrefix = cipherText.slice(PREFIX.length)
    const [ivHex, tagHex, encryptedHex] = withoutPrefix.split(':')
    if (!ivHex || !tagHex || !encryptedHex) return cipherText

    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')

    for (const secret of getCandidateSecrets()) {
      try {
        const key = crypto.createHash('sha256').update(secret).digest()
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
        decipher.setAuthTag(tag)
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
      } catch {
        // Try next candidate secret
      }
    }

    console.error('[decrypt] Decryption failed across all candidate keys')
    return '[Encrypted Data]'
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

/**
 * Returns candidate blind indexes for a phone number across known HMAC pepper secrets.
 * Ensures queries match records regardless of which environment key was active when indexed.
 */
export function getCandidateBlindIndexes(phone?: string | null): string[] {
  if (!phone) return []
  const normalized = normalizePhone(phone)
  if (!normalized) return []

  const indexes = new Set<string>()
  for (const pepper of getCandidateHmacPeppers()) {
    const key = crypto.createHash('sha256').update(pepper).digest()
    const hmac = crypto.createHmac('sha256', key)
    hmac.update(normalized)
    indexes.add(`${BLIND_INDEX_PREFIX}${hmac.digest('hex')}`)
  }
  return Array.from(indexes)
}

/**
 * Create a one-way HMAC-SHA256 blind index for birthdays.
 * Normalizes to MM-DD (month and day) so workers with the same birthday
 * can be matched for birthday announcements without revealing the date or birth year.
 */
export function createBirthdayBlindIndex(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return ''
  const trimmed = dateStr.trim()
  let mmdd = ''
  const parts = trimmed.split('-')
  if (parts.length === 3) {
    // YYYY-MM-DD -> MM-DD
    mmdd = `${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  } else if (parts.length === 2) {
    // MM-DD
    mmdd = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
  } else {
    mmdd = trimmed
  }
  const hmac = crypto.createHmac('sha256', getHmacKey())
  hmac.update(`birthday:${mmdd}`)
  return `${BLIND_INDEX_PREFIX}${hmac.digest('hex')}`
}

/**
 * Returns candidate blind indexes for a birthday across known HMAC pepper secrets.
 */
export function getCandidateBirthdayBlindIndexes(dateStr?: string | null): string[] {
  if (!dateStr || typeof dateStr !== 'string') return []
  const trimmed = dateStr.trim()
  let mmdd = ''
  const parts = trimmed.split('-')
  if (parts.length === 3) {
    mmdd = `${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  } else if (parts.length === 2) {
    mmdd = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
  } else {
    mmdd = trimmed
  }

  const indexes = new Set<string>()
  for (const pepper of getCandidateHmacPeppers()) {
    const key = crypto.createHash('sha256').update(pepper).digest()
    const hmac = crypto.createHmac('sha256', key)
    hmac.update(`birthday:${mmdd}`)
    indexes.add(`${BLIND_INDEX_PREFIX}${hmac.digest('hex')}`)
  }
  return Array.from(indexes)
}

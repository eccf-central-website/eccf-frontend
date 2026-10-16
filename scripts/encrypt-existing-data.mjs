import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createClient } from '@sanity/client'

function readEnvFile() {
  const envPath = path.resolve('.env.local')
  if (!fs.existsSync(envPath)) return {}
  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')]
      })
  )
}

const fileEnv = readEnvFile()
const env = (name) => process.env[name] || fileEnv[name]
const projectId = env('NEXT_PUBLIC_SANITY_PROJECT_ID') || 'ynnot4j0'
const dataset = env('NEXT_PUBLIC_SANITY_DATASET') || 'production'
const readToken = env('SANITY_READ_TOKEN')
const writeToken = env('SANITY_WRITE_TOKEN')
const encryptionSecret = env('ENCRYPTION_KEY')
const hmacSecret = env('HMAC_PEPPER')
const legacyEncryptionSecrets = (env('ENCRYPTION_LEGACY_KEYS') || '').split(',').map((value) => value.trim()).filter(Boolean)
const execute = process.argv.includes('--execute')

if (!readToken || !writeToken || !encryptionSecret || !hmacSecret) {
  console.error('SANITY_READ_TOKEN, SANITY_WRITE_TOKEN, ENCRYPTION_KEY, and HMAC_PEPPER are required.')
  process.exit(1)
}
if (Buffer.byteLength(encryptionSecret, 'utf8') < 32 || Buffer.byteLength(hmacSecret, 'utf8') < 32) {
  console.error('ENCRYPTION_KEY and HMAC_PEPPER must each contain at least 32 bytes.')
  process.exit(1)
}

const reader = createClient({ projectId, dataset, apiVersion: '2025-02-19', perspective: 'drafts', useCdn: false, token: readToken })
const writer = reader.withConfig({ token: writeToken })
const privateReader = reader.withConfig({ perspective: 'raw' })
const PREFIX = 'enc:v1:'
const BLIND_INDEX_PREFIX = 'bidx:v1:'
const ALGORITHM = 'aes-256-gcm'

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX)
}

function encrypt(value) {
  if (!value || typeof value !== 'string' || isEncrypted(value)) return value || ''
  const key = crypto.createHash('sha256').update(encryptionSecret).digest()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return `${PREFIX}${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${ciphertext.toString('hex')}`
}

function decrypt(value) {
  if (!value || typeof value !== 'string' || !isEncrypted(value)) return value || ''
  const [ivHex, tagHex, encryptedHex] = value.slice(PREFIX.length).split(':')
  if (!ivHex || !tagHex || !encryptedHex) return '[Encrypted Data]'
  for (const secret of [encryptionSecret, ...legacyEncryptionSecrets]) {
    try {
      const key = crypto.createHash('sha256').update(secret).digest()
      const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
      return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8')
    } catch {
      // Try only explicitly configured key-rotation values.
    }
  }
  return '[Encrypted Data]'
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length >= 13) return digits.slice(3)
  if (digits.startsWith('0') && digits.length >= 11) return digits.slice(1)
  return digits
}

function blindIndex(value) {
  const normalized = normalizePhone(value)
  if (!normalized) return ''
  const digest = crypto.createHmac('sha256', hmacSecret).update(normalized).digest('hex')
  return `${BLIND_INDEX_PREFIX}${digest}`
}

function birthdayBlindIndex(value) {
  const parts = String(value || '').trim().split('-')
  const monthDay = parts.length === 3
    ? `${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    : parts.length === 2
      ? `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
      : String(value || '').trim()
  if (!monthDay) return ''
  const digest = crypto.createHmac('sha256', hmacSecret).update(`birthday:${monthDay}`).digest('hex')
  return `${BLIND_INDEX_PREFIX}${digest}`
}

function privateId(id) {
  return `drafts.${String(id).replace(/^drafts\./, '')}`
}

function toMonthDay(value) {
  const parts = String(value || '').trim().split('-')
  if (parts.length === 3) return `${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  if (parts.length === 2) return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
  return String(value || '').trim()
}

function addPhoneUpdate(doc, set) {
  if (!doc.phoneNumber) return
  const plainPhone = decrypt(doc.phoneNumber)
  if (plainPhone === '[Encrypted Data]') throw new Error('decryption-failed')
  if (!isEncrypted(doc.phoneNumber)) set.phoneNumber = encrypt(plainPhone)
  const index = blindIndex(plainPhone)
  if (index && doc.phoneBlindIndex !== index) set.phoneBlindIndex = index
}

async function run() {
  console.log(`Sanity encryption migration target: ${projectId}/${dataset}`)
  console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY RUN (no changes)'}`)

  const types = ['worker', 'firstTimer', 'welfareRequest', 'prayerRequest']
  const docs = await reader.fetch(`*[_type in $types]{_id, _type, phoneNumber, phoneBlindIndex, roomNumber, passwordHash, birthDate, birthdayBlindIndex, birthMonth, birthDay, requestDetails, request}`, { types })
  const draftIds = docs.map((doc) => privateId(doc._id))
  const presentDraftIds = draftIds.length
    ? await privateReader.fetch('*[_id in $ids]._id', { ids: draftIds })
    : []
  if (presentDraftIds.length !== draftIds.length) {
    console.error('Some operational documents do not have private drafts yet. Run the privacy migration first; no records were changed.')
    process.exit(2)
  }

  const updates = []
  const counts = Object.fromEntries(types.map((type) => [type, { inspected: 0, changed: 0 }]))
  let decryptionFailures = 0

  for (const doc of docs) {
    counts[doc._type].inspected += 1
    const set = {}
    const unset = []

    try {
      addPhoneUpdate(doc, set)
      if (doc.roomNumber) {
        const plainRoom = decrypt(doc.roomNumber)
        if (plainRoom === '[Encrypted Data]') throw new Error('decryption-failed')
        if (!isEncrypted(doc.roomNumber)) set.roomNumber = encrypt(plainRoom)
      }
      if (doc._type === 'worker') {
        if (doc.passwordHash && !isEncrypted(doc.passwordHash)) set.passwordHash = encrypt(doc.passwordHash)
        if (doc.birthDate) {
          const plainDate = decrypt(doc.birthDate)
          if (plainDate === '[Encrypted Data]') throw new Error('decryption-failed')
          const monthDay = toMonthDay(plainDate)
          if (!isEncrypted(doc.birthDate) || monthDay !== plainDate) set.birthDate = encrypt(monthDay)
          const index = birthdayBlindIndex(monthDay)
          if (index && doc.birthdayBlindIndex !== index) set.birthdayBlindIndex = index
        }
        if (doc.birthMonth !== undefined || doc.birthDay !== undefined) unset.push('birthMonth', 'birthDay')
      }
      if (doc._type === 'welfareRequest' && doc.requestDetails) {
        const plainDetails = decrypt(doc.requestDetails)
        if (plainDetails === '[Encrypted Data]') throw new Error('decryption-failed')
        if (!isEncrypted(doc.requestDetails)) set.requestDetails = encrypt(plainDetails)
      }
      if (doc._type === 'prayerRequest' && doc.request) {
        const plainRequest = decrypt(doc.request)
        if (plainRequest === '[Encrypted Data]') throw new Error('decryption-failed')
        if (!isEncrypted(doc.request)) set.request = encrypt(plainRequest)
      }
    } catch {
      decryptionFailures += 1
      continue
    }

    if (Object.keys(set).length || unset.length) {
      updates.push({ patch: { id: privateId(doc._id), set, ...(unset.length ? { unset } : {}) } })
      counts[doc._type].changed += 1
    }
  }

  for (const type of types) {
    console.log(`${type}: inspected ${counts[type].inspected}, updates planned ${counts[type].changed}`)
  }
  console.log(`Records skipped because configured decryption keys could not open a field: ${decryptionFailures}`)
  console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY RUN'}. Planned document updates: ${updates.length}`)

  if (!execute) {
    console.log('No records were changed. Review results, then rerun with --execute to apply draft-only updates.')
    return
  }
  for (let offset = 0; offset < updates.length; offset += 50) {
    await writer.mutate(updates.slice(offset, offset + 50), { visibility: 'sync' })
  }
  console.log('Draft updates were committed.')
  if (decryptionFailures) process.exitCode = 2
}

run().catch(() => {
  console.error('Encryption migration failed. Review credentials, configuration, and Sanity access.')
  process.exit(1)
})

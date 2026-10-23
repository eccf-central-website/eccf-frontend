/**
 * Read-only encryption health check.
 *
 * Reports whether every encrypted operational field can be opened with the
 * currently configured keys. It never prints decrypted values.
 *
 * Usage:
 *   node scripts/check-encryption-health.mjs
 *
 * Exit codes:
 *   0 = every encrypted field was readable
 *   1 = missing credentials, or at least one field could not be decrypted
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createClient } from '@sanity/client'

const PREFIX = 'enc:v1:'
const ALGORITHM = 'aes-256-gcm'

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
        return [
          line.slice(0, index).trim(),
          line.slice(index + 1).trim().replace(/^['"]|['"]$/g, ''),
        ]
      })
  )
}

const fileEnv = readEnvFile()
const env = (name) => process.env[name] || fileEnv[name]
const projectId = env('NEXT_PUBLIC_SANITY_PROJECT_ID')
const dataset = env('NEXT_PUBLIC_SANITY_DATASET') || 'production'
const token = env('SANITY_READ_TOKEN') || env('SANITY_WRITE_TOKEN')

if (!projectId || !token) {
  console.error('NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_READ_TOKEN (or SANITY_WRITE_TOKEN) are required.')
  process.exit(1)
}

const candidates = [
  ['ENCRYPTION_KEY', env('ENCRYPTION_KEY')],
  // Retired NEXTAUTH_SECRET/AUTH_SECRET fallbacks are intentionally not read
  // directly. Add any historical key to ENCRYPTION_LEGACY_KEYS first.
  ...(env('ENCRYPTION_LEGACY_KEYS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value, index) => [`ENCRYPTION_LEGACY_KEYS[${index}]`, value]),
].filter(([, value]) => Boolean(value))

if (candidates.length === 0) {
  console.error('No decryption candidates found. Set ENCRYPTION_KEY (and any legacy keys) first.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-19',
  perspective: 'raw',
  useCdn: false,
  token,
})

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX)
}

function canDecrypt(value, secret) {
  try {
    const [ivHex, tagHex, encryptedHex] = value.slice(PREFIX.length).split(':')
    if (!ivHex || !tagHex || !encryptedHex) return false
    const key = crypto.createHash('sha256').update(secret).digest()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    decipher.update(Buffer.from(encryptedHex, 'hex'))
    decipher.final()
    return true
  } catch {
    return false
  }
}

const typeFields = {
  worker: ['phoneNumber', 'roomNumber', 'birthDate'],
  firstTimer: ['phoneNumber', 'roomNumber'],
  welfareRequest: ['phoneNumber', 'requestDetails'],
  prayerRequest: ['request'],
}

const docs = await client.fetch(
  `*[_type in $types]{
    _id,
    _type,
    phoneNumber,
    roomNumber,
    birthDate,
    requestDetails,
    request
  }`,
  { types: Object.keys(typeFields) }
)

let encryptedFields = 0
let unreadableFields = 0
const failures = []

for (const doc of docs) {
  for (const field of typeFields[doc._type] || []) {
    const value = doc[field]
    if (!isEncrypted(value)) continue
    encryptedFields += 1
    const matched = candidates.filter(([, secret]) => canDecrypt(value, secret)).map(([name]) => name)
    if (matched.length === 0) {
      unreadableFields += 1
      failures.push({ id: doc._id, type: doc._type, field })
    }
  }
}

console.log(`Sanity target: ${projectId}/${dataset}`)
console.log(`Candidate keys: ${candidates.map(([name]) => name).join(', ')}`)
console.log(`Documents scanned: ${docs.length}`)
console.log(`Encrypted fields scanned: ${encryptedFields}`)
console.log(`Unreadable encrypted fields: ${unreadableFields}`)

if (failures.length > 0) {
  console.error('\nFields that no configured key can open (values not printed):')
  for (const failure of failures) {
    console.error(`- ${failure.type} ${failure.id} → ${failure.field}`)
  }
  console.error(
    '\nAdd the missing key to ENCRYPTION_LEGACY_KEYS in this environment (and in Vercel), then rerun this check.'
  )
  process.exit(1)
}

console.log('\nAll encrypted fields are readable with the configured keys.')

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
const currentKey = env('ENCRYPTION_KEY')
const keys = [currentKey, ...(env('ENCRYPTION_LEGACY_KEYS') || '').split(',').map((value) => value.trim()).filter(Boolean)].filter(Boolean)

if (!readToken || !currentKey || Buffer.byteLength(currentKey, 'utf8') < 32) {
  console.error('SANITY_READ_TOKEN and an ENCRYPTION_KEY of at least 32 bytes are required.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2025-02-19', perspective: 'drafts', useCdn: false, token: readToken })
const prefix = 'enc:v1:'

function canDecrypt(value) {
  if (!value || typeof value !== 'string' || !value.startsWith(prefix)) return true
  const [ivHex, tagHex, encryptedHex] = value.slice(prefix.length).split(':')
  if (!ivHex || !tagHex || !encryptedHex) return false
  for (const secret of keys) {
    try {
      const key = crypto.createHash('sha256').update(secret).digest()
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
      decipher.update(Buffer.from(encryptedHex, 'hex'))
      decipher.final()
      return true
    } catch {
      // Try only explicitly configured key-rotation values.
    }
  }
  return false
}

async function run() {
  const docs = await client.fetch(
    `*[_type in ["worker", "firstTimer", "welfareRequest", "prayerRequest"]]{_type, phoneNumber, roomNumber, birthDate, passwordHash, requestDetails, request}`
  )
  let encryptedFields = 0
  let unreadableFields = 0
  const counts = {}

  for (const doc of docs) {
    counts[doc._type] = (counts[doc._type] || 0) + 1
    for (const value of [doc.phoneNumber, doc.roomNumber, doc.birthDate, doc.passwordHash, doc.requestDetails, doc.request]) {
      if (typeof value !== 'string' || !value.startsWith(prefix)) continue
      encryptedFields += 1
      if (!canDecrypt(value)) unreadableFields += 1
    }
  }

  console.log('Encrypted-field verification (no record values are displayed):')
  for (const type of ['worker', 'firstTimer', 'welfareRequest', 'prayerRequest']) {
    console.log(`${type}: ${counts[type] || 0} records`)
  }
  console.log(`Encrypted fields checked: ${encryptedFields}`)
  console.log(`Fields not readable with configured keys: ${unreadableFields}`)
  if (unreadableFields) process.exitCode = 2
}

run().catch(() => {
  console.error('Verification failed. Review credentials, configuration, and Sanity access.')
  process.exit(1)
})

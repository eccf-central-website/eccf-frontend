import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const envPath = path.resolve('.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx !== -1) {
    envVars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
  }
}

const SANITY_WRITE_TOKEN = envVars.SANITY_WRITE_TOKEN
const PROJECT_ID = envVars.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynnot4j0'
const DATASET = envVars.NEXT_PUBLIC_SANITY_DATASET || 'production'
// Same env chain as lib/env.ts. No hardcoded default: the repo is public.
const ENCRYPTION_SECRET = envVars.ENCRYPTION_KEY || envVars.NEXTAUTH_SECRET
if (!ENCRYPTION_SECRET) {
  console.error('Missing ENCRYPTION_KEY / NEXTAUTH_SECRET in .env.local')
  process.exit(1)
}

const PREFIX = 'enc:v1:'
const ALGORITHM = 'aes-256-gcm'

function decrypt(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') return ''
  if (!cipherText.startsWith(PREFIX)) return cipherText

  try {
    const withoutPrefix = cipherText.slice(PREFIX.length)
    const [ivHex, tagHex, encryptedHex] = withoutPrefix.split(':')
    if (!ivHex || !tagHex || !encryptedHex) return cipherText

    const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest()
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    console.error('Decryption failed:', err)
    return '[Encrypted Data]'
  }
}

async function verify() {
  const query = '*[_type in ["worker", "firstTimer", "welfareRequest", "prayerRequest"]]{ _type, fullName, name, phoneNumber, roomNumber, requestDetails, request }'
  const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}?query=` + encodeURIComponent(query)
  
  const res = await fetch(url, { headers: { Authorization: `Bearer ${SANITY_WRITE_TOKEN}` } })
  const data = await res.json()
  
  console.log('Decryption Verification (Authorized Server Side):')
  for (const doc of data.result) {
    console.log(`\nDoc type: ${doc._type} (${doc.fullName || doc.name || 'Anonymous'})`)
    if (doc.phoneNumber) console.log(`  Decrypted phoneNumber:    ${decrypt(doc.phoneNumber)}`)
    if (doc.roomNumber) console.log(`  Decrypted roomNumber:     ${decrypt(doc.roomNumber)}`)
    if (doc.requestDetails) console.log(`  Decrypted requestDetails: ${decrypt(doc.requestDetails)}`)
    if (doc.request) console.log(`  Decrypted prayer request: ${decrypt(doc.request)}`)
  }
}

verify().catch(console.error)

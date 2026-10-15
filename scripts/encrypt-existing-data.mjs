import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// 1. Read .env.local
const envPath = path.resolve('.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    envVars[key] = val
  }
}

const SANITY_WRITE_TOKEN = envVars.SANITY_WRITE_TOKEN
const PROJECT_ID = envVars.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynnot4j0'
const DATASET = envVars.NEXT_PUBLIC_SANITY_DATASET || 'production'
const ENCRYPTION_SECRET =
  envVars.ENCRYPTION_KEY ||
  envVars.NEXTAUTH_SECRET ||
  'eccf-production-security-salt-2026-key'
const HMAC_SECRET =
  envVars.HMAC_PEPPER ||
  envVars.ENCRYPTION_KEY ||
  envVars.NEXTAUTH_SECRET ||
  'eccf-production-blind-index-pepper-2026'

if (!SANITY_WRITE_TOKEN) {
  console.error('Missing SANITY_WRITE_TOKEN in .env.local')
  process.exit(1)
}

// 2. Encryption logic matching lib/encryption.ts
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const PREFIX = 'enc:v1:'
const BLIND_INDEX_PREFIX = 'bidx:v1:'

function getEncryptionKey() {
  return crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest()
}

function getHmacKey() {
  return crypto.createHash('sha256').update(HMAC_SECRET).digest()
}

function isEncrypted(val) {
  return typeof val === 'string' && val.startsWith(PREFIX)
}

function encrypt(plainText) {
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

function normalizePhone(rawPhone) {
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

function createBlindIndex(phone) {
  if (!phone) return ''
  const normalized = normalizePhone(phone)
  if (!normalized) return ''
  const hmac = crypto.createHmac('sha256', getHmacKey())
  hmac.update(normalized)
  return `${BLIND_INDEX_PREFIX}${hmac.digest('hex')}`
}

function decrypt(cipherText) {
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
    console.error('Decryption failed:', err)
    return cipherText
  }
}

function createBirthdayBlindIndex(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return ''
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
  const hmac = crypto.createHmac('sha256', getHmacKey())
  hmac.update(`birthday:${mmdd}`)
  return `${BLIND_INDEX_PREFIX}${hmac.digest('hex')}`
}

// 3. Query Sanity API
async function sanityQuery(query, params = {}) {
  const url = new URL(`https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}`)
  url.searchParams.set('query', query)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(`$${k}`, JSON.stringify(v))
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${SANITY_WRITE_TOKEN}`,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sanity query failed: ${res.status} ${text}`)
  }
  const json = await res.json()
  return json.result
}

// 4. Mutate Sanity API
async function sanityMutate(mutations) {
  const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SANITY_WRITE_TOKEN}`,
    },
    body: JSON.stringify({ mutations }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sanity mutate failed: ${res.status} ${text}`)
  }
  return await res.json()
}

async function run() {
  console.log('--- Starting Sanity PII Encryption & Cleanup Migration ---')

  const mutations = []

  // A. Workers
  const workers = await sanityQuery(
    `*[_type == "worker"]{ _id, fullName, phoneNumber, roomNumber, passwordHash, birthDate, birthdayBlindIndex, birthMonth, birthDay }`
  )
  console.log(`Found ${workers.length} workers.`)
  for (const w of workers) {
    const patch = { id: w._id, set: {}, unset: [] }
    let changed = false

    if (w.phoneNumber && !isEncrypted(w.phoneNumber)) {
      patch.set.phoneNumber = encrypt(w.phoneNumber)
      patch.set.phoneBlindIndex = createBlindIndex(w.phoneNumber)
      changed = true
      console.log(`[Worker] Encrypting phone for: ${w.fullName}`)
    }
    if (w.roomNumber && !isEncrypted(w.roomNumber)) {
      patch.set.roomNumber = encrypt(w.roomNumber)
      changed = true
      console.log(`[Worker] Encrypting room for: ${w.fullName}`)
    }
    // Remove exposed passwordHash completely for safety
    if (w.passwordHash) {
      patch.unset.push('passwordHash')
      changed = true
      console.log(`[Worker] Unsetting exposed passwordHash for: ${w.fullName}`)
    }
    // Encrypt birthDate and create birthdayBlindIndex
    if (w.birthDate) {
      let rawDate = w.birthDate
      if (isEncrypted(w.birthDate)) {
        rawDate = decrypt(w.birthDate)
      } else {
        patch.set.birthDate = encrypt(w.birthDate)
        changed = true
        console.log(`[Worker] Encrypting birthDate for: ${w.fullName}`)
      }
      if (!w.birthdayBlindIndex && rawDate) {
        patch.set.birthdayBlindIndex = createBirthdayBlindIndex(rawDate)
        changed = true
        console.log(`[Worker] Generating birthdayBlindIndex for: ${w.fullName}`)
      }
    }
    // Unset plain birthMonth and birthDay
    if (w.birthMonth !== undefined || w.birthDay !== undefined) {
      patch.unset.push('birthMonth', 'birthDay')
      changed = true
      console.log(`[Worker] Unsetting plain birthMonth & birthDay for: ${w.fullName}`)
    }

    if (changed) {
      const mut = { patch: { id: patch.id } }
      if (Object.keys(patch.set).length > 0) mut.patch.set = patch.set
      if (patch.unset.length > 0) mut.patch.unset = patch.unset
      mutations.push(mut)
    }
  }

  // B. First Timers
  const firstTimers = await sanityQuery(`*[_type == "firstTimer"]{ _id, fullName, phoneNumber, roomNumber }`)
  console.log(`Found ${firstTimers.length} first timers.`)
  for (const ft of firstTimers) {
    const patch = { id: ft._id, set: {} }
    let changed = false

    if (ft.phoneNumber && !isEncrypted(ft.phoneNumber)) {
      patch.set.phoneNumber = encrypt(ft.phoneNumber)
      patch.set.phoneBlindIndex = createBlindIndex(ft.phoneNumber)
      changed = true
      console.log(`[FirstTimer] Encrypting phone for: ${ft.fullName}`)
    }
    if (ft.roomNumber && !isEncrypted(ft.roomNumber)) {
      patch.set.roomNumber = encrypt(ft.roomNumber)
      changed = true
      console.log(`[FirstTimer] Encrypting room for: ${ft.fullName}`)
    }

    if (changed) {
      mutations.push({ patch: { id: patch.id, set: patch.set } })
    }
  }

  // C. Welfare Requests
  const welfare = await sanityQuery(`*[_type == "welfareRequest"]{ _id, name, phoneNumber, requestDetails }`)
  console.log(`Found ${welfare.length} welfare requests.`)
  for (const wf of welfare) {
    const patch = { id: wf._id, set: {} }
    let changed = false

    if (wf.phoneNumber && !isEncrypted(wf.phoneNumber)) {
      patch.set.phoneNumber = encrypt(wf.phoneNumber)
      patch.set.phoneBlindIndex = createBlindIndex(wf.phoneNumber)
      changed = true
      console.log(`[Welfare] Encrypting phone for: ${wf.name}`)
    }
    if (wf.requestDetails && !isEncrypted(wf.requestDetails)) {
      patch.set.requestDetails = encrypt(wf.requestDetails)
      changed = true
      console.log(`[Welfare] Encrypting requestDetails for: ${wf.name}`)
    }

    if (changed) {
      mutations.push({ patch: { id: patch.id, set: patch.set } })
    }
  }

  // D. Prayer Requests
  const prayer = await sanityQuery(`*[_type == "prayerRequest"]{ _id, name, request }`)
  console.log(`Found ${prayer.length} prayer requests.`)
  for (const pr of prayer) {
    const patch = { id: pr._id, set: {} }
    let changed = false

    if (pr.request && !isEncrypted(pr.request)) {
      patch.set.request = encrypt(pr.request)
      changed = true
      console.log(`[Prayer] Encrypting request for: ${pr.name || 'Anonymous'}`)
    }

    if (changed) {
      mutations.push({ patch: { id: patch.id, set: patch.set } })
    }
  }

  console.log(`Total mutations to commit: ${mutations.length}`)
  if (mutations.length > 0) {
    const res = await sanityMutate(mutations)
    console.log('Mutations successfully committed to Sanity:', res)
  } else {
    console.log('No unencrypted records found. All records are already encrypted.')
  }

  console.log('--- Migration Complete ---')
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})

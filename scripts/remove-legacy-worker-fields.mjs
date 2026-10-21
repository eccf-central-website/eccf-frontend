import fs from 'node:fs'
import path from 'node:path'
import dns from 'node:dns'
import { createClient } from '@sanity/client'

dns.setServers(['8.8.8.8', '1.1.1.1'])

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
const writeToken = env('SANITY_WRITE_TOKEN')

if (!writeToken) {
  console.error('SANITY_WRITE_TOKEN is required.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2023-05-03',
  useCdn: false,
  token: writeToken,
  perspective: 'raw'
})

const LEGACY_FIELDS = [
  'team',
  'teams',
  'role',
  'excoPosition',
  'isExcoApproved',
  'verificationStatus',
  'passwordHash',
  'birthMonth',
  'birthDay',
]

async function removeLegacyFields() {
  console.log('Fetching all worker documents across production dataset (published AND drafts)...')
  const docs = await client.fetch(`*[_type == "worker" || _id in path("drafts.**")]{ _id, _type, fullName, team, teams, role, excoPosition, isExcoApproved, verificationStatus, passwordHash, birthMonth, birthDay }`)
  console.log(`Found ${docs.length} documents.`)

  let count = 0

  for (const doc of docs) {
    if (doc._type !== 'worker' && !doc._id.includes('worker')) continue

    const fieldsToUnset = LEGACY_FIELDS.filter((f) => doc[f] !== undefined)

    if (fieldsToUnset.length > 0) {
      console.log(`Unsetting legacy fields [${fieldsToUnset.join(', ')}] on ${doc._id} (${doc.fullName || 'Worker'})...`)
      await client.patch(doc._id).unset(fieldsToUnset).commit()
      console.log(`✓ Cleaned ${doc._id}`)
      count++
    } else {
      console.log(`✓ Document ${doc._id} (${doc.fullName || 'Worker'}) has no legacy fields.`)
    }
  }

  console.log(`\nDone! Successfully cleaned ${count} documents.`)
}

removeLegacyFields().catch(console.error)

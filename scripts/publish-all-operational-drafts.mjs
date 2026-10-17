import { createClient } from '@sanity/client'

const PRIVATE_TYPES = [
  'worker',
  'attendanceLedger',
  'financeLedger',
  'firstTimer',
  'welfareRequest',
  'prayerRequest',
  'subscriber',
]

const execute = process.argv.includes('--execute')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynnot4j0'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (execute && !token) {
  console.error('SANITY_WRITE_TOKEN is required with --execute.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-19',
  useCdn: false,
  token,
})

// Use perspective 'raw' to see both draft and published documents
const rawClient = client.withConfig({ perspective: 'raw' })

const draftDocs = await rawClient.fetch(
  `*[_type in $types && _id in path("drafts.**")]{_id, _type${execute ? ', ...' : ''}}`,
  { types: PRIVATE_TYPES }
)

const counts = Object.fromEntries(PRIVATE_TYPES.map((type) => [type, 0]))
for (const doc of draftDocs) counts[doc._type] = (counts[doc._type] || 0) + 1

console.log(`Sanity target: ${projectId}/${dataset}`)
console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY RUN (no changes)'}`)
console.log(`Total draft documents found: ${draftDocs.length}`)
console.log('Draft operational records by type:')
for (const type of PRIVATE_TYPES) console.log(`  ${type}: ${counts[type]}`)

if (!execute) {
  console.log('\nNo records were changed. Review the counts, then rerun with --execute to publish each record and remove its draft copy.')
  process.exit(0)
}

let published = 0
let failures = 0

for (const draft of draftDocs) {
  const publishedId = draft._id.replace(/^drafts\./, '')
  const publishedDoc = { ...draft, _id: publishedId }
  delete publishedDoc._rev
  delete publishedDoc._createdAt
  delete publishedDoc._updatedAt

  try {
    await client
      .transaction()
      .createOrReplace(publishedDoc)
      .delete(draft._id)
      .commit({ visibility: 'sync' })
    published += 1
  } catch (err) {
    console.error(`Error publishing ${draft._id}:`, err?.message || err)
    failures += 1
  }
}

console.log(`\nSuccessfully published: ${published}`)
console.log(`Failures: ${failures}`)

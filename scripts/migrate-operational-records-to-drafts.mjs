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
  perspective: 'published',
  useCdn: false,
  token,
})

const publishedDocs = await client.fetch(
  `*[_type in $types && !(_id in path("drafts.**"))]{_id, _type${execute ? ', ...' : ''}}`,
  { types: PRIVATE_TYPES }
)

const counts = Object.fromEntries(PRIVATE_TYPES.map((type) => [type, 0]))
for (const doc of publishedDocs) counts[doc._type] = (counts[doc._type] || 0) + 1

console.log(`Sanity target: ${projectId}/${dataset}`)
console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY RUN (no changes)'}`)
console.log('Published operational records by type:')
for (const type of PRIVATE_TYPES) console.log(`  ${type}: ${counts[type]}`)

if (!execute) {
  console.log('\nNo records were changed. Review the counts, then rerun with --execute to move each record to a private draft and remove its published copy.')
  process.exit(0)
}

const draftIds = publishedDocs.map((doc) => `drafts.${doc._id}`)
const existingDraftIds = draftIds.length
  ? await client.withConfig({ perspective: 'raw' }).fetch(
      '*[_id in $ids]._id',
      { ids: draftIds }
    )
  : []
const existingDraftSet = new Set(existingDraftIds)

let migrated = 0
let skippedDraftConflicts = 0
let failures = 0

for (const source of publishedDocs) {
  const draftId = `drafts.${source._id}`
  if (existingDraftSet.has(draftId)) {
    skippedDraftConflicts += 1
    continue
  }

  const draft = { ...source, _id: draftId }
  delete draft._rev
  delete draft._createdAt
  delete draft._updatedAt

  try {
    await client.transaction().create(draft).delete(source._id).commit({ visibility: 'sync' })
    migrated += 1
  } catch (err) {
    console.error('Migration error for ' + source._id + ':', err?.message || err)
    failures += 1
  }
}

console.log(`\nMoved to drafts: ${migrated}`)
console.log(`Left published because a draft already existed: ${skippedDraftConflicts}`)
console.log(`Failed transactions: ${failures}`)
if (skippedDraftConflicts || failures) {
  console.error('Some published operational records may remain public. Resolve conflicts and rerun the script.')
  process.exitCode = 2
} else {
  console.log('Migration finished. Verify anonymous published queries return no operational records before launch.')
}

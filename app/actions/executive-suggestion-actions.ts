'use server'

import { createHash } from 'crypto'
import * as XLSX from 'xlsx'
import { revalidatePath } from 'next/cache'
import { sanityPrivateClient, sanityWriteClient, patchPrivateDocument } from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'
import { sendExecutiveAppointmentEmail } from '@/lib/email/executive-appointment'
import { cleanHonorifics, extractNameTokens, normalizeTokensKey } from '@/lib/executive-matching'
import { executivePositionSignature, mergeExecutivePositions } from '@/lib/executive-positions'
import { getLeaderPostTitle } from '@/lib/dashboard/rbac'

export interface CsvImportResult {
  ok: boolean
  imported: number
  matchedCount: number
  createdCount: number
  unregisteredCount: number
  emailsSent: number
  skipped: string[]
  error?: string
}

export interface ExecutivePreviewRow {
  rowId: string
  rowIndex: number
  rawName: string
  rawPosition: string
  rawRank: string
  rawEmail?: string
  rawHall?: string

  // Worker mapping
  matchedWorkerId?: string
  matchedWorkerName?: string
  isNewWorker: boolean
  workerDisplayName: string

  // Position mapping
  kind: 'csgb' | 'hall' | 'team' | 'unknown'
  office?: string
  csgbRoleRef?: string
  hall?: string
  hallRef?: string
  teamName?: string
  teamRef?: string
  rank: 'lead' | 'assistant'

  status: 'valid' | 'warning' | 'error'
  statusMessage?: string
  selected: boolean
}

export interface PreviewSpreadsheetResult {
  ok: boolean
  rows: ExecutivePreviewRow[]
  totalRows: number
  matchedCount: number
  newWorkerCount: number
  warningCount: number
  allWorkers: { _id: string; fullName: string }[]
  teams: { _id: string; name: string }[]
  csgbRoles: { _id: string; title: string }[]
  halls: { _id: string; name: string }[]
  error?: string
}

export interface CommitImportItem {
  rowId: string
  rawName: string
  workerDisplayName: string
  matchedWorkerId?: string
  isNewWorker: boolean
  kind: 'csgb' | 'hall' | 'team'
  office?: string
  csgbRoleRef?: string
  hall?: string
  hallRef?: string
  teamName?: string
  teamRef?: string
  rank: 'lead' | 'assistant'
  email?: string
}

export interface CommitImportResult {
  ok: boolean
  imported: number
  matchedCount: number
  createdCount: number
  /** Reserved appointments for leaders who have not registered as workers yet. */
  unregisteredCount: number
  emailsSent: number
  /** Leaders who were already emailed in a previous import and were not emailed again. */
  emailsSkipped: number
  skipped: string[]
  error?: string
}

interface WorkerLookupItem {
  _id: string
  fullName: string
  email?: string
  firstName?: string
  lastName?: string
}

interface TeamLookupItem {
  _id: string
  name: string
  key?: string
}

interface CsgbRoleLookupItem {
  _id: string
  title: string
}

interface HallLookupItem {
  _id: string
  name: string
}



function getRowField(row: Record<string, unknown>, aliases: string[]): string {
  const keys = Object.keys(row)
  for (const alias of aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const key of keys) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (cleanKey === cleanAlias) {
        const val = row[key]
        if (val !== undefined && val !== null) {
          const s = String(val).trim()
          if (s) return s
        }
      }
    }
  }
  return ''
}

function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ')
    .trim()
}

/**
 * Intelligent position resolver: Maps raw spreadsheet position/role text
 * to exact Sanity canonical entities (csgbRole, teamUnit, hallResidence).
 */
function parsePositionDetails(
  rawType: string,
  rawValue: string,
  rawRank: string,
  csgbRoles: CsgbRoleLookupItem[],
  halls: HallLookupItem[],
  teams: TeamLookupItem[]
): {
  kind: 'csgb' | 'hall' | 'team'
  office?: string
  csgbRoleRef?: string
  hall?: string
  hallRef?: string
  teamName?: string
  teamRef?: string
  rank: 'lead' | 'assistant'
} | null {
  const combined = `${rawType || ''} ${rawValue || ''}`.toLowerCase().replace(/[,;:]/g, ' ')

  // 1. Detect rank
  let rank: 'lead' | 'assistant' = 'lead'
  const rankLower = (rawRank || '').toLowerCase()
  if (
    rankLower === 'assistant' ||
    rankLower === 'asst' ||
    rankLower.includes('asst') ||
    combined.includes('assistant') ||
    combined.includes('asst') ||
    combined.includes('deputy') ||
    combined.includes('associate')
  ) {
    rank = 'assistant'
  }

  // 2. Check CSGB Offices
  // President
  if (
    (combined.includes('president') || combined.includes('shepherd')) &&
    !combined.includes('vice') &&
    !combined.includes('vp')
  ) {
    const csgbMatch = csgbRoles.find((r) => r._id === 'csgb-role-president') || csgbRoles.find((r) => r.title.toLowerCase().includes('president') && !r.title.toLowerCase().includes('vice'))
    return {
      kind: 'csgb',
      office: 'President & Executive Shepherd',
      csgbRoleRef: csgbMatch?._id || 'csgb-role-president',
      rank: 'lead',
    }
  }

  // VP Admin / Vice President 1
  if (
    combined.includes('vice president 1') ||
    combined.includes('vp 1') ||
    combined.includes('vp1') ||
    combined.includes('vice president i') ||
    combined.includes('vp admin') ||
    combined.includes('vice president admin') ||
    combined.includes('vice president (admin)') ||
    combined.includes('brothers coordinator') ||
    combined.includes("brother's coordinator") ||
    combined.includes("brothers' coordinator")
  ) {
    const csgbMatch = csgbRoles.find((r) => r._id === 'csgb-role-vp-admin') || csgbRoles.find((r) => r.title.toLowerCase().includes('admin'))
    return {
      kind: 'csgb',
      office: 'Vice President - Admin',
      csgbRoleRef: csgbMatch?._id || 'csgb-role-vp-admin',
      rank: 'lead',
    }
  }

  // VP Evangelism / Vice President 2
  if (
    combined.includes('vice president 2') ||
    combined.includes('vp 2') ||
    combined.includes('vp2') ||
    combined.includes('vice president ii') ||
    combined.includes('vp evangelism') ||
    combined.includes('vice president evangelism') ||
    combined.includes('vice president (evangelism)') ||
    combined.includes('sisters coordinator') ||
    combined.includes("sister's coordinator") ||
    combined.includes("sisters' coordinator")
  ) {
    const csgbMatch = csgbRoles.find((r) => r._id === 'csgb-role-vp-evangelism') || csgbRoles.find((r) => r.title.toLowerCase().includes('evangelism'))
    return {
      kind: 'csgb',
      office: 'Vice President - Evangelism',
      csgbRoleRef: csgbMatch?._id || 'csgb-role-vp-evangelism',
      rank: 'lead',
    }
  }

  // General Secretary
  if (
    combined.includes('general secretary') ||
    combined.includes('gen sec') ||
    combined.includes('gen. sec') ||
    (combined.includes('secretary') && !combined.includes('financial') && !combined.includes('bible study'))
  ) {
    const csgbMatch = csgbRoles.find((r) => r._id === 'csgb-role-general-secretary') || csgbRoles.find((r) => r.title.toLowerCase().includes('general secretary'))
    return {
      kind: 'csgb',
      office: 'General Secretary',
      csgbRoleRef: csgbMatch?._id || 'csgb-role-general-secretary',
      rank,
    }
  }

  // Prayer Coordinator
  if (
    combined.includes('prayer coordinator') ||
    combined.includes('prayer coord')
  ) {
    const csgbMatch = csgbRoles.find((r) => r._id === 'csgb-role-prayer-coordinator') || csgbRoles.find((r) => r.title.toLowerCase().includes('prayer coordinator'))
    return {
      kind: 'csgb',
      office: 'Prayer Coordinator',
      csgbRoleRef: csgbMatch?._id || 'csgb-role-prayer-coordinator',
      rank,
    }
  }

  // 3. Check Halls of Residence (Hall 1 - Hall 8)
  if (combined.includes('hall') || combined.includes('pastor') || combined.includes('residence')) {
    const hallNumMatch = combined.match(/\b(?:hall|h)\s*([1-8])\b/i) || combined.match(/\b([1-8])\b/)
    const hallNum = hallNumMatch ? hallNumMatch[1] : null
    if (hallNum) {
      const h = halls.find((x) => x._id === `hall-residence-${hallNum}` || x.name.toLowerCase() === `hall ${hallNum}`)
      if (h) {
        return {
          kind: 'hall',
          hall: h.name,
          hallRef: h._id,
          rank,
        }
      }
    }
  }

  // 4. Check Ministry Teams (Comprehensive synonym mapping)
  const teamKeywords: Array<{ id?: string; nameMatch: string; keys: string[] }> = [
    { nameMatch: 'Bible Study', keys: ['bible study', 'sunday school', 'bs/ss', 'bsss'] },
    { nameMatch: 'Ushering', keys: ['usher', 'ushering', 'protocol', 'chief usher', 'head usher'] },
    { nameMatch: 'Welfare', keys: ['welfare', 'medical', 'first aid', 'health'] },
    { nameMatch: 'Media', keys: ['media', 'publicity', 'livestream', 'social media'] },
    { nameMatch: 'Technical', keys: ['technical', 'sound', 'audio', 'engineering'] },
    { nameMatch: 'Choir', keys: ['choir', 'music director', 'music', 'praise', 'worship'] },
    { nameMatch: 'Drama', keys: ['drama', 'thespian', 'thespians', 'creative media'] },
    { nameMatch: 'Financial', keys: ['finance', 'financial', 'treasury', 'treasurer', 'accountant'] },
    { nameMatch: 'Academic', keys: ['academic', 'academics', 'tutorial', 'tutorials'] },
    { nameMatch: 'Outreach', keys: ['outreach', 'evangelism', 'mission', 'missions'] },
    { nameMatch: 'Colporteur', keys: ['colporteur', 'library', 'librarian', 'bookstore', 'literature'] },
    { nameMatch: 'Decoration', keys: ['decoration', 'deco', 'sanctuary'] },
    { nameMatch: 'Prayer', keys: ['prayer team', 'intercessory', 'prayer unit'] },
  ]

  for (const tk of teamKeywords) {
    if (tk.keys.some((k) => combined.includes(k))) {
      const teamDoc = teams.find((t) => t.name.toLowerCase().includes(tk.nameMatch.toLowerCase()))
      if (teamDoc) {
        return {
          kind: 'team',
          teamName: teamDoc.name,
          teamRef: teamDoc._id,
          rank,
        }
      }
    }
  }

  // 5. Fallback check across all existing teams by exact token overlap
  for (const t of teams) {
    const tClean = t.name.toLowerCase().replace(/[^a-z0-9]/g, ' ')
    const tTokens = tClean.split(/\s+/).filter((w) => w.length > 2 && w !== 'team')
    if (tTokens.some((token) => combined.includes(token))) {
      return {
        kind: 'team',
        teamName: t.name,
        teamRef: t._id,
        rank,
      }
    }
  }

  return null
}

async function verifyAuth() {
  const session = await getSession()
  if (!session) {
    return { ok: false as const, error: 'Not authenticated.' }
  }

  const canManageExecutives = Boolean(
    session.access?.canApproveExecutives ||
      session.access?.isVP ||
      session.access?.isChaplain
  )

  if (!canManageExecutives) {
    return { ok: false as const, error: 'You do not have permission to import executive positions.' }
  }

  return { ok: true as const, session }
}

/**
 * Preview / Map rows from CSV/XLSX without writing anything to the database.
 * Accurately maps names to existing workers (without false positives) and
 * positions to official Sanity documents.
 */
export async function previewExecutiveSpreadsheet(
  formData: FormData
): Promise<PreviewSpreadsheetResult> {
  const auth = await verifyAuth()
  if (!auth.ok) {
    return {
      ok: false,
      rows: [],
      totalRows: 0,
      matchedCount: 0,
      newWorkerCount: 0,
      warningCount: 0,
      allWorkers: [],
      teams: [],
      csgbRoles: [],
      halls: [],
      error: auth.error,
    }
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return {
      ok: false,
      rows: [],
      totalRows: 0,
      matchedCount: 0,
      newWorkerCount: 0,
      warningCount: 0,
      allWorkers: [],
      teams: [],
      csgbRoles: [],
      halls: [],
      error: 'No file uploaded.',
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return {
        ok: false,
        rows: [],
        totalRows: 0,
        matchedCount: 0,
        newWorkerCount: 0,
        warningCount: 0,
        allWorkers: [],
        teams: [],
        csgbRoles: [],
        halls: [],
        error: 'Spreadsheet has no sheets.',
      }
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: '',
    }) as Record<string, unknown>[]

    if (!rows.length) {
      return {
        ok: false,
        rows: [],
        totalRows: 0,
        matchedCount: 0,
        newWorkerCount: 0,
        warningCount: 0,
        allWorkers: [],
        teams: [],
        csgbRoles: [],
        halls: [],
        error: 'The sheet is empty.',
      }
    }

    // Fetch existing lookup tables from Sanity
    const [workers, teams, csgbRoles, halls] = await Promise.all([
      sanityPrivateClient.fetch(
        `*[_type == "worker" && !(_id in path("drafts.**"))]{
          _id,
          fullName,
          email,
          firstName,
          lastName
        }`
      ) as Promise<WorkerLookupItem[]>,
      sanityPrivateClient.fetch(
        `*[_type == "teamUnit"]{ _id, name, key }`
      ) as Promise<TeamLookupItem[]>,
      sanityPrivateClient.fetch(
        `*[_type == "csgbRole"]{ _id, title }`
      ) as Promise<CsgbRoleLookupItem[]>,
      sanityPrivateClient.fetch(
        `*[_type == "hallResidence"]{ _id, name }`
      ) as Promise<HallLookupItem[]>,
    ])

    // Build lookup structures
    const byEmail = new Map<string, WorkerLookupItem>()
    const byFullName = new Map<string, WorkerLookupItem>()
    const bySortedTokens = new Map<string, WorkerLookupItem>()
    const workerTokenList: { worker: WorkerLookupItem; tokens: string[] }[] = []

    for (const w of workers) {
      if (w.email) {
        byEmail.set(w.email.toLowerCase().trim(), w)
      }
      if (w.fullName) {
        byFullName.set(w.fullName.toLowerCase().trim(), w)
        const tokens = extractNameTokens(w.fullName)
        if (tokens.length > 0) {
          bySortedTokens.set(normalizeTokensKey(tokens), w)
          workerTokenList.push({ worker: w, tokens })
        }
      }
    }

    const previewRows: ExecutivePreviewRow[] = []
    let matchedCount = 0
    let newWorkerCount = 0
    let warningCount = 0

    // Keep track of matched worker IDs in this spreadsheet to prevent
    // multiple different candidate rows from falsely locking onto the same person
    const alreadyMatchedWorkerIds = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowIndex = i + 1

      const rawFullName = getRowField(row, ['FullName', 'Full Name', 'Name', 'Worker Name', 'Worker'])
      const rawFirstName = getRowField(row, ['FirstName', 'First Name'])
      const rawLastName = getRowField(row, ['LastName', 'Last Name', 'Surname'])
      const rawPositionType = getRowField(row, ['PositionType', 'Position Type', 'Type', 'Category'])
      const rawPositionValue = getRowField(row, [
        'PositionValue',
        'Position Value',
        'Position',
        'Role',
        'Office',
        'Title',
        'Post',
      ])
      const rawRank = getRowField(row, ['Rank', 'Position Rank', 'Level', 'Status'])
      const rawEmail = getRowField(row, ['Email', 'Worker Email', 'Email Address'])
      const rawHall = getRowField(row, ['Hall', 'Residence', 'Hall of Residence'])

      let candidateName = rawFullName
      if (!candidateName && (rawFirstName || rawLastName)) {
        candidateName = `${rawFirstName} ${rawLastName}`.trim()
      }
      if (!candidateName) {
        candidateName = `Candidate #${rowIndex}`
      }

      const cleanDisplayName = capitalizeWords(cleanHonorifics(candidateName))

      // Strict worker matching
      let targetWorker: WorkerLookupItem | null = null

      // 1. By exact email
      if (rawEmail) {
        targetWorker = byEmail.get(rawEmail.toLowerCase().trim()) || null
      }

      // 2. By exact full name
      if (!targetWorker) {
        targetWorker = byFullName.get(cleanDisplayName.toLowerCase().trim()) || null
      }

      // 3. By sorted tokens (word order invariance)
      if (!targetWorker) {
        const inputTokens = extractNameTokens(candidateName)
        if (inputTokens.length >= 2) {
          const sortedKey = normalizeTokensKey(inputTokens)
          const potentialWorker = bySortedTokens.get(sortedKey) || null
          if (potentialWorker && !alreadyMatchedWorkerIds.has(potentialWorker._id)) {
            targetWorker = potentialWorker
          }

          // 4. Strict 2+ token subset match (all input tokens must be in worker tokens AND length >= 2)
          if (!targetWorker) {
            for (const item of workerTokenList) {
              if (alreadyMatchedWorkerIds.has(item.worker._id)) continue
              const matchesAll = inputTokens.every((tok) => item.tokens.includes(tok))
              if (matchesAll && inputTokens.length >= 2 && item.tokens.length >= 2) {
                targetWorker = item.worker
                break
              }
            }
          }
        }
      }

      const isNew = !targetWorker
      if (targetWorker) {
        matchedCount++
        alreadyMatchedWorkerIds.add(targetWorker._id)
      } else {
        newWorkerCount++
      }

      // Parse position details & link to canonical Sanity entities
      const posParsed = parsePositionDetails(
        rawPositionType,
        rawPositionValue || rawPositionType,
        rawRank,
        csgbRoles,
        halls,
        teams
      )

      let status: 'valid' | 'warning' | 'error' = 'valid'
      let statusMessage: string | undefined = undefined

      if (!posParsed) {
        status = 'warning'
        statusMessage = 'Could not auto-match position. Defaults to Ministry Team Lead.'
        warningCount++
      }

      previewRows.push({
        rowId: `row_${rowIndex}`,
        rowIndex,
        rawName: candidateName,
        rawPosition: rawPositionValue || rawPositionType || 'Executive Role',
        rawRank: rawRank || 'lead',
        rawEmail: rawEmail || undefined,
        rawHall: rawHall || undefined,

        matchedWorkerId: targetWorker?._id,
        matchedWorkerName: targetWorker?.fullName,
        isNewWorker: isNew,
        workerDisplayName: targetWorker?.fullName || cleanDisplayName,

        kind: posParsed?.kind || 'team',
        office: posParsed?.office,
        csgbRoleRef: posParsed?.csgbRoleRef,
        hall: posParsed?.hall,
        hallRef: posParsed?.hallRef,
        teamName: posParsed?.teamName,
        teamRef: posParsed?.teamRef,
        rank: posParsed?.rank || 'lead',

        status,
        statusMessage,
        // Warning rows (unmapped positions) start unselected so a generic
        // "Ministry Team Lead" is never imported by accident.
        selected: status === 'valid',
      })
    }

    return {
      ok: true,
      rows: previewRows,
      totalRows: previewRows.length,
      matchedCount,
      newWorkerCount,
      warningCount,
      allWorkers: workers.map((w) => ({ _id: w._id, fullName: w.fullName })),
      teams: teams.map((t) => ({ _id: t._id, name: t.name })),
      csgbRoles: csgbRoles.map((c) => ({ _id: c._id, title: c.title })),
      halls: halls.map((h) => ({ _id: h._id, name: h.name })),
    }
  } catch (err: unknown) {
    console.error('[previewExecutiveSpreadsheet] error:', err)
    return {
      ok: false,
      rows: [],
      totalRows: 0,
      matchedCount: 0,
      newWorkerCount: 0,
      warningCount: 0,
      allWorkers: [],
      teams: [],
      csgbRoles: [],
      halls: [],
      error: 'Failed to parse spreadsheet file.',
    }
  }
}

/**
 * Commit the reviewed executive positions to Sanity.
 * - Deduplicates positions: updates existing positions instead of endlessly appending.
 * - Links roles to registered workers and dispatches appointment guidance emails.
 * - Reserves roles for leaders who have not registered yet as `executiveAppointment`
 *   documents (status `pending_claim`) instead of creating placeholder workers.
 *   Registering on /register claims and activates the reserved appointment.
 */
export async function commitExecutiveImport(payload: {
  items: CommitImportItem[]
  /** Reserve appointments for names that are not registered workers yet. */
  includeUnregistered?: boolean
  /** @deprecated Use `includeUnregistered`. */
  createMissingWorkers?: boolean
}): Promise<CommitImportResult> {
  const auth = await verifyAuth()
  if (!auth.ok) {
    return {
      ok: false,
      imported: 0,
      matchedCount: 0,
      createdCount: 0,
      unregisteredCount: 0,
      emailsSent: 0,
      emailsSkipped: 0,
      skipped: [],
      error: auth.error,
    }
  }

  // The person who ran the import is the approver of record. We store their
  // full name (not their post) so the roster can show "Approved by <name>".
  const approverName =
    auth.session.name?.trim() ||
    (typeof auth.session.worker?.fullName === 'string' ? auth.session.worker.fullName : '') ||
    'Executive Council'
  const approverId = String(auth.session.worker?._id || auth.session.id || '')
  const approverRole = getLeaderPostTitle(auth.session)

  const { items } = payload
  const includeUnregistered = payload.includeUnregistered ?? payload.createMissingWorkers ?? false
  if (!items || !items.length) {
    return {
      ok: false,
      imported: 0,
      matchedCount: 0,
      createdCount: 0,
      unregisteredCount: 0,
      emailsSent: 0,
      emailsSkipped: 0,
      skipped: [],
      error: 'No items selected to import.',
    }
  }

  let imported = 0
  let matchedCount = 0
  const createdCount = 0
  let unregisteredCount = 0
  let emailsSent = 0
  let emailsSkipped = 0
  const skipped: string[] = []

  // Pre-fetch workers, existing appointments and prior guidance-email records.
  // The guidance records make appointment emails idempotent across re-imports.
  const [existingWorkers, existingAppointments, existingGuidanceEmails] = await Promise.all([
    sanityPrivateClient.fetch<Array<{
      _id: string
      fullName?: string
      email?: string
      positions?: Array<Record<string, unknown>>
    }>>(
      `*[_type == "worker" && !(_id in path("drafts.**"))]{
        _id,
        fullName,
        email,
        positions
      }`
    ),
    sanityPrivateClient.fetch<Array<{
      _id: string
      status?: string
      claimedBy?: { _ref?: string }
      fullName?: string
      email?: string
      normalizedName?: string
      guidanceEmailSentAt?: string
      invitationEmailSentAt?: string
      kind?: 'csgb' | 'hall' | 'team'
      office?: string
      csgbRole?: { _ref?: string }
      hall?: string
      hallRef?: { _ref?: string }
      teamName?: string
      teamRef?: { _ref?: string }
    }>>(
      `*[_type == "executiveAppointment"]{
        _id,
        status,
        claimedBy,
        fullName,
        email,
        normalizedName,
        guidanceEmailSentAt,
        invitationEmailSentAt,
        kind,
        office,
        csgbRole,
        hall,
        hallRef,
        teamName,
        teamRef
      }`
    ),
    sanityPrivateClient.fetch<Array<{
      _id: string
      fullName?: string
      email?: string
      normalizedName?: string
    }>>(
      `*[_type == "executiveGuidanceEmail"]{ _id, fullName, email, normalizedName }`
    ),
  ])

  // Existing appointments let us respect roles already claimed by a worker.
  const claimedAppointmentWorkerIds = new Map<string, string>()
  for (const appointment of existingAppointments) {
    if (appointment.status === 'claimed' && appointment.claimedBy?._ref) {
      claimedAppointmentWorkerIds.set(appointment._id, appointment.claimedBy._ref)
    }
  }

  // A profile is only ever emailed once, regardless of how many CSV imports it
  // appears in. It counts as notified when a guidance send was recorded, or when
  // it already had a claimed appointment before this run — both the previous
  // import flow and registration send guidance at claim time.
  const notifiedProfileKeys = new Set<string>()
  const addProfileKeys = (email?: string, normalizedName?: string, fullName?: string) => {
    const cleanEmail = email?.trim().toLowerCase()
    if (cleanEmail && cleanEmail.includes('@')) {
      notifiedProfileKeys.add(`email:${cleanEmail}`)
    }
    const key = normalizedName || normalizeTokensKey(extractNameTokens(fullName || ''))
    if (key) notifiedProfileKeys.add(`name:${key}`)
  }

  for (const appointment of existingAppointments) {
    if (appointment.status === 'claimed' || appointment.guidanceEmailSentAt) {
      addProfileKeys(appointment.email, appointment.normalizedName, appointment.fullName)
    }
  }

  // Invitations to unregistered appointees are tracked separately: an invited
  // leader still receives the full guidance email the day they register.
  const invitedProfileKeys = new Set<string>()
  const addInvitedKeys = (email?: string, normalizedName?: string, fullName?: string) => {
    const cleanEmail = email?.trim().toLowerCase()
    if (cleanEmail && cleanEmail.includes('@')) invitedProfileKeys.add(`email:${cleanEmail}`)
    const key = normalizedName || normalizeTokensKey(extractNameTokens(fullName || ''))
    if (key) invitedProfileKeys.add(`name:${key}`)
  }
  for (const appointment of existingAppointments) {
    if (appointment.invitationEmailSentAt) {
      addInvitedKeys(appointment.email, appointment.normalizedName, appointment.fullName)
    }
  }
  for (const record of existingGuidanceEmails) {
    addProfileKeys(record.email, record.normalizedName, record.fullName)
  }

  const workerMapByName = new Map<string, string>()
  const workerEmailsMap = new Map<string, string>()
  const workerPositionsMap = new Map<string, Array<Record<string, unknown>>>()
  const workerIds = new Set<string>()

  for (const w of existingWorkers) {
    workerIds.add(w._id)
    if (w.fullName) workerMapByName.set(w.fullName.toLowerCase().trim(), w._id)
    if (w.email) workerEmailsMap.set(w._id, w.email.toLowerCase().trim())
    workerPositionsMap.set(w._id, w.positions || [])
  }

  // ---------------------------------------------------------------------------
  // Role occupancy. A role can only be held by one person: importing a second
  // name for the same office is rejected instead of silently overwriting.
  // ---------------------------------------------------------------------------
  const occupiedRoles = new Map<string, { name: string; workerId?: string }>()

  const appointmentSignature = (appointment: {
    kind?: string
    office?: string
    csgbRole?: { _ref?: string }
    hall?: string
    hallRef?: { _ref?: string }
    teamName?: string
    teamRef?: { _ref?: string }
  }): string =>
    executivePositionSignature({
      kind: appointment.kind,
      office: appointment.office,
      csgbRole: appointment.csgbRole,
      hall: appointment.hall,
      hallRef: appointment.hallRef,
      teamName: appointment.teamName,
      team: appointment.teamRef,
    })

  for (const worker of existingWorkers) {
    for (const position of worker.positions || []) {
      if (position.status !== 'approved') continue
      occupiedRoles.set(executivePositionSignature(position), {
        name: worker.fullName || worker._id,
        workerId: worker._id,
      })
    }
  }
  for (const appointment of existingAppointments) {
    if (appointment.status !== 'pending_claim') continue
    occupiedRoles.set(appointmentSignature(appointment), {
      name: appointment.fullName || appointment._id,
    })
  }

  // Reuse an existing appointment document's ID for the same person + role, so
  // re-importing a corrected sheet never forks a duplicate reservation.
  const appointmentIdByRole = new Map<string, string>()
  for (const appointment of existingAppointments) {
    const nameKey =
      appointment.normalizedName ||
      normalizeTokensKey(extractNameTokens(appointment.fullName || ''))
    if (!nameKey) continue
    appointmentIdByRole.set(`${nameKey}|${appointmentSignature(appointment)}`, appointment._id)
  }

  // ---------------------------------------------------------------------------
  // Build every write in memory first so the import can be committed in a few
  // batched transactions instead of one network round-trip per row. Sequential
  // per-row writes were exceeding the serverless function budget and leaving
  // the tail of the spreadsheet (usually the unregistered leaders) unprocessed.
  // ---------------------------------------------------------------------------
  const WRITE_BATCH_SIZE = 50
  const EMAIL_BATCH_SIZE = 2
  const importedAt = new Date().toISOString()

  const workerPatches = new Map<
    string,
    { workerId: string; positions: Array<Record<string, unknown>> }
  >()
  const appointmentDocs = new Map<
    string,
    { _id: string; _type: string } & Record<string, unknown>
  >()
  const matchedImports: Array<{
    name: string
    workerId: string
    appointmentId: string
    email: string
    profileEmailKey?: string
    profileNameKey: string
    positionTitle: string
    kind: 'csgb' | 'hall' | 'team'
    rank: 'lead' | 'assistant'
    teamName?: string
    hallName?: string
  }> = []
  const unregisteredImports: Array<{
    name: string
    appointmentId: string
    email?: string
    profileEmailKey?: string
    profileNameKey: string
    positionTitle: string
    kind: 'csgb' | 'hall' | 'team'
    rank: 'lead' | 'assistant'
    teamName?: string
    hallName?: string
  }> = []

  for (const item of items) {
    const cleanDisplayName = item.workerDisplayName || capitalizeWords(cleanHonorifics(item.rawName))

    // Build the canonical new position object
    const newPos: Record<string, unknown> = {
      _key: `csv_pos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      _type: 'executivePosition',
      kind: item.kind,
      status: 'approved',
      rank: item.rank || 'lead',
      submittedAt: importedAt,
      decidedAt: importedAt,
      // Credit the person, not the office.
      decidedBy: approverName,
      decidedById: approverId,
      decidedByRole: approverRole,
    }

    if (item.kind === 'csgb') {
      newPos.office = item.office || 'CSGB Executive'
      if (item.csgbRoleRef) {
        newPos.csgbRole = { _type: 'reference', _ref: item.csgbRoleRef }
      }
    }
    if (item.kind === 'hall') {
      newPos.hall = item.hall || 'Hall 1'
      if (item.hallRef) {
        newPos.hallRef = { _type: 'reference', _ref: item.hallRef }
      }
    }
    if (item.kind === 'team') {
      newPos.teamName = item.teamName || 'Ministry Team'
      if (item.teamRef) {
        newPos.team = { _type: 'reference', _ref: item.teamRef }
      }
    }

    // Determine target worker ID
    let targetWorkerId = item.matchedWorkerId
    if (!targetWorkerId) {
      targetWorkerId = workerMapByName.get(cleanDisplayName.toLowerCase().trim())
    }

    const positionTitle =
      item.kind === 'csgb'
        ? item.office || 'CSGB Executive'
        : item.kind === 'hall'
        ? `Hall Pastor (${item.hall || 'Hall'})`
        : `${item.teamName || 'Ministry'} Lead`

    const targetEmail = (item.email || (targetWorkerId ? workerEmailsMap.get(targetWorkerId) : undefined) || '').trim().toLowerCase()

    // -------------------------------------------------------------------------
    // Role occupancy + appointment identity
    // -------------------------------------------------------------------------
    const roleSignature = executivePositionSignature(newPos)
    const occupant = occupiedRoles.get(roleSignature)
    const samePerson = Boolean(
      (targetWorkerId && occupant?.workerId === targetWorkerId) ||
        (occupant &&
          normalizeTokensKey(extractNameTokens(occupant.name)) ===
            normalizeTokensKey(extractNameTokens(cleanDisplayName)))
    )

    if (occupant && !samePerson) {
      skipped.push(
        `${cleanDisplayName}: ${positionTitle} is already held by ${occupant.name}. Relieve the current holder first, or correct the sheet.`
      )
      continue
    }

    const nameTokens = extractNameTokens(cleanDisplayName)
    const normalizedKey = normalizeTokensKey(nameTokens)
    const deterministicAppId =
      appointmentIdByRole.get(`${normalizedKey}|${roleSignature}`) ||
      `appointment_${item.kind}_${createHash('sha1')
        .update(`${cleanDisplayName.toLowerCase().trim()}|${roleSignature}`)
        .digest('hex')}`

    // Reserve the role for the rest of this import so two rows cannot claim it.
    occupiedRoles.set(roleSignature, {
      name: cleanDisplayName,
      workerId: targetWorkerId,
    })

    // A previously claimed appointment tells us which worker holds this role,
    // even if the row's name spelling no longer matches the worker document.
    if (!targetWorkerId) {
      const claimedWorkerId = claimedAppointmentWorkerIds.get(deterministicAppId)
      if (claimedWorkerId && workerIds.has(claimedWorkerId)) {
        targetWorkerId = claimedWorkerId
      }
    }

    const appointmentDoc: Record<string, unknown> = {
      _type: 'executiveAppointment',
      fullName: cleanDisplayName,
      normalizedName: normalizedKey,
      kind: item.kind,
      rank: item.rank || 'lead',
      importedAt,
      importedBy: approverName,
      importedById: approverId,
      importedByRole: approverRole,
      decidedBy: approverName,
      decidedById: approverId,
      decidedByRole: approverRole,
      decidedAt: importedAt,
      rawPosition: item.office || item.teamName || item.hall || 'Executive Position',
    }
    if (targetEmail) appointmentDoc.email = targetEmail
    if (item.kind === 'csgb') {
      appointmentDoc.office = item.office || 'CSGB Executive'
      if (item.csgbRoleRef) appointmentDoc.csgbRole = { _type: 'reference', _ref: item.csgbRoleRef }
    } else if (item.kind === 'hall') {
      appointmentDoc.hall = item.hall || 'Hall 1'
      if (item.hallRef) appointmentDoc.hallRef = { _type: 'reference', _ref: item.hallRef }
    } else if (item.kind === 'team') {
      appointmentDoc.teamName = item.teamName || 'Ministry Team'
      if (item.teamRef) appointmentDoc.teamRef = { _type: 'reference', _ref: item.teamRef }
    }

    if (targetWorkerId) {
      const currentPositions = workerPositionsMap.get(targetWorkerId) || []

      // Smart merge: replace only the *same* role, never other positions of the
      // same category (a leader may hold two CSGB offices).
      const filteredPositions = currentPositions.filter(
        (p) => executivePositionSignature(p) !== roleSignature
      )

      const updatedPositions = [...filteredPositions, newPos]
      workerPositionsMap.set(targetWorkerId, updatedPositions)
      workerPatches.set(targetWorkerId, { workerId: targetWorkerId, positions: updatedPositions })

      // Save appointment as claimed by the registered worker
      appointmentDoc.status = 'claimed'
      appointmentDoc.registrationStatus = 'registered'
      appointmentDoc.claimedBy = { _type: 'reference', _ref: targetWorkerId }
      appointmentDoc.claimedAt = importedAt
      appointmentDocs.set(deterministicAppId, {
        _id: deterministicAppId,
        ...appointmentDoc,
      } as { _id: string; _type: string } & Record<string, unknown>)

      matchedImports.push({
        name: cleanDisplayName,
        workerId: targetWorkerId,
        appointmentId: deterministicAppId,
        email: targetEmail,
        profileEmailKey:
          targetEmail && targetEmail.includes('@') ? `email:${targetEmail}` : undefined,
        profileNameKey: `name:${normalizedKey}`,
        positionTitle,
        kind: item.kind,
        rank: item.rank || 'lead',
        teamName: item.teamName,
        hallName: item.hall,
      })
    } else if (includeUnregistered) {
      // Reserve the role for a leader who has not registered on /register yet.
      // No placeholder worker document is created — the appointment activates
      // automatically when a matching registration claims it.
      appointmentDoc.status = 'pending_claim'
      appointmentDoc.registrationStatus = 'unregistered'
      appointmentDocs.set(deterministicAppId, {
        _id: deterministicAppId,
        ...appointmentDoc,
      } as { _id: string; _type: string } & Record<string, unknown>)
      unregisteredImports.push({
        name: cleanDisplayName,
        appointmentId: deterministicAppId,
        email: targetEmail,
        profileEmailKey:
          targetEmail && targetEmail.includes('@') ? `email:${targetEmail}` : undefined,
        profileNameKey: `name:${normalizedKey}`,
        positionTitle,
        kind: item.kind,
        rank: item.rank || 'lead',
        teamName: item.teamName,
        hallName: item.hall,
      })
    } else {
      skipped.push(
        `${cleanDisplayName}: Not registered on /register — skipped. Enable "Include unregistered EXCOs" to reserve the appointment.`
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Commit worker patches and appointment documents in batched transactions.
  // Each batch is atomic; if a batch fails we retry its documents one by one so
  // a single bad row cannot block the rest of the roster.
  // ---------------------------------------------------------------------------
  type WriteMutation =
    | { type: 'worker'; workerId: string; positions: Array<Record<string, unknown>> }
    | {
        type: 'appointment'
        documentId: string
        doc: { _id: string; _type: string } & Record<string, unknown>
      }

  const mutations: WriteMutation[] = [
    ...Array.from(workerPatches.values(), (patch) => ({
      type: 'worker' as const,
      workerId: patch.workerId,
      positions: patch.positions,
    })),
    ...Array.from(appointmentDocs.entries(), ([documentId, doc]) => ({
      type: 'appointment' as const,
      documentId,
      doc,
    })),
  ]

  const writtenWorkerIds = new Set<string>()
  const writtenAppointmentIds = new Set<string>()

  for (let start = 0; start < mutations.length; start += WRITE_BATCH_SIZE) {
    const chunk = mutations.slice(start, start + WRITE_BATCH_SIZE)

    try {
      const transaction = sanityWriteClient.transaction()
      for (const mutation of chunk) {
        if (mutation.type === 'worker') {
          transaction.patch(mutation.workerId, {
            set: { positions: mutation.positions, isExcoApproved: true },
          })
        } else {
          transaction.createOrReplace(mutation.doc)
        }
      }
      await transaction.commit()

      for (const mutation of chunk) {
        if (mutation.type === 'worker') writtenWorkerIds.add(mutation.workerId)
        else writtenAppointmentIds.add(mutation.documentId)
      }
    } catch (batchError) {
      console.error('[commitExecutiveImport] Batch write failed, retrying individually:', batchError)

      await Promise.allSettled(
        chunk.map(async (mutation) => {
          if (mutation.type === 'worker') {
            await sanityWriteClient
              .patch(mutation.workerId)
              .set({ positions: mutation.positions, isExcoApproved: true })
              .commit()
            writtenWorkerIds.add(mutation.workerId)
          } else {
            await sanityWriteClient.createOrReplace(mutation.doc)
            writtenAppointmentIds.add(mutation.documentId)
          }
        })
      )
    }
  }

  for (const entry of matchedImports) {
    if (!writtenWorkerIds.has(entry.workerId)) {
      skipped.push(`${entry.name}: Failed to update worker record.`)
      continue
    }

    imported++
    matchedCount++

    if (!writtenAppointmentIds.has(entry.appointmentId)) {
      skipped.push(`${entry.name}: Position saved, but the appointment record could not be linked.`)
    }
  }

  for (const entry of unregisteredImports) {
    if (writtenAppointmentIds.has(entry.appointmentId)) {
      imported++
      unregisteredCount++
    } else {
      skipped.push(`${entry.name}: Failed to reserve unregistered appointment.`)
    }
  }

  // ---------------------------------------------------------------------------
  // Dispatch appointment guidance emails only after the database writes have
  // succeeded, in small parallel batches. Each leader is notified at most once
  // across imports: re-importing the same CSV (or adding another role for an
  // existing leader) updates positions without sending a duplicate email.
  // ---------------------------------------------------------------------------
  const pendingEmails = new Map<string, (typeof matchedImports)[number]>()
  const queuedProfileKeys = new Set<string>()

  for (const entry of matchedImports) {
    if (!writtenWorkerIds.has(entry.workerId)) continue
    if (!entry.email || !entry.email.includes('@')) continue

    const profileKeys = [entry.profileNameKey, entry.profileEmailKey].filter(
      (key): key is string => Boolean(key)
    )

    if (profileKeys.some((key) => queuedProfileKeys.has(key))) continue

    const alreadyNotified = profileKeys.some((key) => notifiedProfileKeys.has(key))
    if (alreadyNotified) {
      emailsSkipped++
      continue
    }

    for (const key of profileKeys) queuedProfileKeys.add(key)
    pendingEmails.set(entry.profileEmailKey || entry.profileNameKey, entry)
  }

  const guidanceDocs = new Map<
    string,
    { _id: string; _type: string } & Record<string, unknown>
  >()
  const emailedAppointmentIds: string[] = []
  const emailTasks = Array.from(pendingEmails.values())

  for (let start = 0; start < emailTasks.length; start += EMAIL_BATCH_SIZE) {
    const batch = emailTasks.slice(start, start + EMAIL_BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map((task) =>
        sendExecutiveAppointmentEmail({
          recipientName: task.name,
          recipientEmail: task.email,
          positionTitle: task.positionTitle,
          category: task.kind,
          rank: task.rank,
          teamName: task.teamName,
          hallName: task.hallName,
        })
      )
    )

    results.forEach((result, index) => {
      const task = batch[index]

      if (result.status === 'fulfilled' && result.value.ok) {
        emailsSent++

        const profileKey = task.profileEmailKey || task.profileNameKey
        const guidanceId = `executiveGuidanceEmail_${createHash('sha1')
          .update(profileKey)
          .digest('hex')}`
        guidanceDocs.set(guidanceId, {
          _id: guidanceId,
          _type: 'executiveGuidanceEmail',
          fullName: task.name,
          ...(task.profileEmailKey ? { email: task.email } : {}),
          normalizedName: task.profileNameKey.replace(/^name:/, ''),
          sentAt: new Date().toISOString(),
          lastPositionTitle: task.positionTitle,
        })

        // Prevent a later batch in this same import from emailing this profile.
        if (task.profileEmailKey) notifiedProfileKeys.add(task.profileEmailKey)
        notifiedProfileKeys.add(task.profileNameKey)
        emailedAppointmentIds.push(task.appointmentId)
      } else {
        const reason = result.status === 'fulfilled' ? result.value.error : String(result.reason)
        console.error(
          `[commitExecutiveImport] Email dispatch error for ${task.email}:`,
          reason
        )
      }
    })
  }

  // Persist the send records so future imports never email these profiles again.
  const guidanceDocList = Array.from(guidanceDocs.values())
  for (let start = 0; start < guidanceDocList.length; start += WRITE_BATCH_SIZE) {
    const chunk = guidanceDocList.slice(start, start + WRITE_BATCH_SIZE)
    try {
      const transaction = sanityWriteClient.transaction()
      for (const doc of chunk) transaction.createOrReplace(doc)
      await transaction.commit()
    } catch (err) {
      console.error('[commitExecutiveImport] Failed to persist guidance email records:', err)
    }
  }

  // Stamp the claimed appointment so `guidanceEmailSentAt` is no longer a field
  // the code reads but never writes.
  if (emailedAppointmentIds.length > 0) {
    try {
      const transaction = sanityWriteClient.transaction()
      for (const appointmentId of Array.from(new Set(emailedAppointmentIds))) {
        transaction.patch(appointmentId, { set: { guidanceEmailSentAt: importedAt } })
      }
      await transaction.commit()
    } catch (err) {
      console.error('[commitExecutiveImport] Failed to stamp guidance email timestamps:', err)
    }
  }

  // ---------------------------------------------------------------------------
  // Invite unregistered appointees to register. Their office is already reserved,
  // so the email explains that registering with the same address activates it.
  // Each profile is invited at most once, even across repeated imports.
  // ---------------------------------------------------------------------------
  const invitationTasks = new Map<string, (typeof unregisteredImports)[number]>()
  for (const entry of unregisteredImports) {
    if (!writtenAppointmentIds.has(entry.appointmentId)) continue
    if (!entry.email || !entry.email.includes('@')) continue

    const profileKeys = [entry.profileNameKey, entry.profileEmailKey].filter(
      (key): key is string => Boolean(key)
    )
    if (profileKeys.some((key) => invitedProfileKeys.has(key))) {
      emailsSkipped++
      continue
    }
    for (const key of profileKeys) invitedProfileKeys.add(key)
    invitationTasks.set(entry.profileEmailKey || entry.profileNameKey, entry)
  }

  const invitedAppointmentIds: string[] = []
  const invitationList = Array.from(invitationTasks.values())

  for (let start = 0; start < invitationList.length; start += EMAIL_BATCH_SIZE) {
    const batch = invitationList.slice(start, start + EMAIL_BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map((task) =>
        sendExecutiveAppointmentEmail({
          recipientName: task.name,
          recipientEmail: task.email || '',
          positionTitle: task.positionTitle,
          category: task.kind,
          rank: task.rank,
          teamName: task.teamName,
          hallName: task.hallName,
          invitation: true,
        })
      )
    )

    results.forEach((result, index) => {
      const task = batch[index]
      if (result.status === 'fulfilled' && result.value.ok) {
        emailsSent++
        invitedAppointmentIds.push(task.appointmentId)
      } else {
        const reason = result.status === 'fulfilled' ? result.value.error : String(result.reason)
        console.error(
          `[commitExecutiveImport] Invitation email error for ${task.email}:`,
          reason
        )
      }
    })
  }

  if (invitedAppointmentIds.length > 0) {
    try {
      const transaction = sanityWriteClient.transaction()
      for (const appointmentId of Array.from(new Set(invitedAppointmentIds))) {
        transaction.patch(appointmentId, { set: { invitationEmailSentAt: importedAt } })
      }
      await transaction.commit()
    } catch (err) {
      console.error('[commitExecutiveImport] Failed to stamp invitation email timestamps:', err)
    }
  }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/executives')
  revalidatePath('/dashboard/workers')
  revalidatePath('/dashboard')

  return {
    ok: true,
    imported,
    matchedCount,
    createdCount,
    unregisteredCount,
    emailsSent,
    emailsSkipped,
    skipped,
  }
}

/**
 * Automatically claims pre-approved executive appointments for a registering or existing worker.
 * Matches by email or case-insensitive token-invariant full name.
 * Called automatically during worker registration (/register) and profile update.
 */
export async function claimPendingExecutiveAppointmentsForWorker(
  workerId: string,
  fullName: string,
  email?: string
): Promise<{
  claimed: number
  positions: Array<Record<string, unknown>>
  /** Appointment document IDs that were matched by this claim. */
  appointmentIds: string[]
}> {
  const cleanEmail = email?.trim().toLowerCase()
  const nameTokens = extractNameTokens(fullName)
  const normalizedKey = normalizeTokensKey(nameTokens)
  const appointmentIds: string[] = []

  try {
    // 1. Fetch pending executive appointments
    const pendingAppointments = await sanityPrivateClient.fetch<Array<{
      _id: string
      fullName: string
      normalizedName?: string
      email?: string
      kind: 'csgb' | 'hall' | 'team'
      rank?: 'lead' | 'assistant'
      office?: string
      csgbRole?: { _ref: string }
      hall?: string
      hallRef?: { _ref: string }
      teamName?: string
      teamRef?: { _ref: string }
      decidedBy?: string
      decidedById?: string
      decidedByRole?: string
      decidedAt?: string
    }>>(
      `*[_type == "executiveAppointment" && status == "pending_claim"]{
        _id,
        fullName,
        normalizedName,
        email,
        kind,
        rank,
        office,
        csgbRole,
        hall,
        hallRef,
        teamName,
        teamRef,
        decidedBy,
        decidedById,
        decidedByRole,
        decidedAt
      }`
    )

    const matchedAppointments: typeof pendingAppointments = []

    for (const app of pendingAppointments) {
      // Security: an appointment that carries an email may ONLY be claimed by
      // that exact email. Falling back to a name match here let a same-named
      // registrant hijack another leader's reserved office.
      if (app.email && app.email.trim()) {
        if (!cleanEmail || app.email.trim().toLowerCase() !== cleanEmail) continue
        matchedAppointments.push(app)
        continue
      }

      // Name-only reservations require an exact normalized-name match. Token
      // subsets are deliberately not accepted.
      if (app.normalizedName) {
        if (app.normalizedName === normalizedKey) matchedAppointments.push(app)
        continue
      }

      if (app.fullName && normalizeTokensKey(extractNameTokens(app.fullName)) === normalizedKey) {
        matchedAppointments.push(app)
      }
    }

    // 2. Check if there are placeholder worker documents created by spreadsheet import
    // that have approved positions but no phone/email, matching this name
    const placeholderMatches = await sanityPrivateClient.fetch<Array<{
      _id: string
      fullName: string
      positions?: Array<Record<string, unknown>>
    }>>(
      `*[_type == "worker" && _id != $workerId && !defined(phoneNumber) && defined(positions) && count(positions) > 0 && !(_id in path("drafts.**"))]{
        _id,
        fullName,
        positions
      }`,
      { workerId: workerId || 'none' }
    )

    const placeholderPositions: Array<Record<string, unknown>> = []
    const placeholdersToDelete: string[] = []

    for (const ph of placeholderMatches) {
      if (!ph.fullName) continue
      const phKey = normalizeTokensKey(extractNameTokens(ph.fullName))

      // Exact normalized name only — a partial token overlap must never merge
      // two different people's records.
      if (phKey === normalizedKey && Array.isArray(ph.positions)) {
        const approvedOnly = ph.positions.filter((p) => p.status === 'approved')
        placeholderPositions.push(...approvedOnly)
        placeholdersToDelete.push(ph._id)
      }
    }

    const claimedPositions: Array<Record<string, unknown>> = [...placeholderPositions]

    for (const app of matchedAppointments) {
      appointmentIds.push(app._id)

      const pos: Record<string, unknown> = {
        _key: `pos_claimed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        _type: 'executivePosition',
        kind: app.kind,
        rank: app.rank || 'lead',
        status: 'approved',
        submittedAt: new Date().toISOString(),
        decidedAt: app.decidedAt || new Date().toISOString(),
        ...(app.decidedBy ? { decidedBy: app.decidedBy } : {}),
        ...(app.decidedById ? { decidedById: app.decidedById } : {}),
        ...(app.decidedByRole ? { decidedByRole: app.decidedByRole } : {}),
      }

      if (app.kind === 'csgb') {
        pos.office = app.office || 'CSGB Executive'
        if (app.csgbRole?._ref) {
          pos.csgbRole = { _type: 'reference', _ref: app.csgbRole._ref }
        }
      } else if (app.kind === 'hall') {
        pos.hall = app.hall || 'Hall 1'
        if (app.hallRef?._ref) {
          pos.hallRef = { _type: 'reference', _ref: app.hallRef._ref }
        }
      } else if (app.kind === 'team') {
        pos.teamName = app.teamName || 'Ministry Team'
        if (app.teamRef?._ref) {
          pos.team = { _type: 'reference', _ref: app.teamRef._ref }
        }
      }

      claimedPositions.push(pos)

      // Update appointment status to claimed. For brand-new registrations the
      // worker document does not exist yet (`temp`), so the caller links these
      // appointment IDs to the new worker right after creation.
      if (workerId && workerId !== 'temp') {
        await patchPrivateDocument(app._id)
          .set({
            status: 'claimed',
            registrationStatus: 'registered',
            claimedBy: { _type: 'reference', _ref: workerId },
            claimedAt: new Date().toISOString(),
          })
          .commit()
      }

      // Dispatch appointment guidance email for an existing worker. Brand-new
      // registrations are only emailed after the worker document is created,
      // once the address has been verified.
      const targetEmail = cleanEmail || app.email
      if (workerId && workerId !== 'temp' && targetEmail && targetEmail.includes('@')) {
        const positionTitle =
          app.kind === 'csgb'
            ? app.office || 'CSGB Executive'
            : app.kind === 'hall'
            ? `${app.hall || 'Hall'} Pastor`
            : `${app.teamName || 'Ministry'} Lead`

        sendExecutiveAppointmentEmail({
          recipientName: fullName,
          recipientEmail: targetEmail,
          positionTitle,
          category: app.kind,
          rank: app.rank || 'lead',
          teamName: app.teamName,
          hallName: app.hall,
        }).catch((err) =>
          console.error('[claimPendingExecutiveAppointments] Email dispatch error:', err)
        )
      }
    }

    // Clean up duplicate placeholder documents if merged
    for (const phId of placeholdersToDelete) {
      try {
        await sanityPrivateClient.delete(phId)
      } catch (delErr) {
        console.error(`[claimPendingExecutiveAppointments] Failed to clean placeholder ${phId}:`, delErr)
      }
    }

    return {
      claimed: matchedAppointments.length + placeholderPositions.length,
      positions: mergeExecutivePositions([], claimedPositions),
      appointmentIds,
    }
  } catch (err) {
    console.error('[claimPendingExecutiveAppointmentsForWorker] error:', err)
    return { claimed: 0, positions: [], appointmentIds: [] }
  }
}

/**
 * Scans all registered workers and automatically links & activates any pending
 * leadership appointments that match their names or email addresses.
 */
export async function reconcileRegisteredExecutives(): Promise<{
  ok: boolean
  reconciledCount: number
  details: string[]
  error?: string
}> {
  const auth = await verifyAuth()
  if (!auth.ok) {
    return { ok: false, reconciledCount: 0, details: [], error: auth.error }
  }

  try {
    const workers = (await sanityPrivateClient.fetch(`
      *[_type == "worker" && !(_id in path("drafts.**"))]{
        _id,
        fullName,
        email,
        positions,
        isExcoApproved
      }
    `)) as Array<{
      _id: string
      fullName?: string
      email?: string
      positions?: Array<Record<string, unknown>>
      isExcoApproved?: boolean
    }>

    let reconciledCount = 0
    const details: string[] = []

    for (const w of workers) {
      if (!w.fullName) continue
      const res = await claimPendingExecutiveAppointmentsForWorker(w._id, w.fullName, w.email)
      if (res.claimed > 0 && res.positions.length > 0) {
        const existingPositions = Array.isArray(w.positions) ? w.positions : []
        const mergedPositions = mergeExecutivePositions(existingPositions, res.positions)

        await patchPrivateDocument(w._id)
          .set({
            positions: mergedPositions,
            isExcoApproved: true,
          })
          .append('updateLog', [`Automatically linked & activated executive appointment on ${new Date().toISOString().slice(0, 10)}`])
          .commit()

        reconciledCount++
        details.push(`${w.fullName}: Activated ${res.claimed} appointed role(s).`)
      }
    }

    if (reconciledCount > 0) {
      revalidatePath('/dashboard', 'layout')
      revalidatePath('/dashboard/executives')
      revalidatePath('/dashboard/workers')
      revalidatePath('/dashboard')
    }

    return { ok: true, reconciledCount, details }
  } catch (err) {
    console.error('[reconcileRegisteredExecutives] error:', err)
    return { ok: false, reconciledCount: 0, details: [], error: 'Failed to reconcile registered executives.' }
  }
}

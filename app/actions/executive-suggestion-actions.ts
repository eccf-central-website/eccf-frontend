'use server'

import * as XLSX from 'xlsx'
import { revalidatePath } from 'next/cache'
import { sanityPrivateClient, patchPrivateDocument } from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'

export interface CsvImportResult {
  ok: boolean
  imported: number
  matchedCount: number
  createdCount: number
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

function cleanHonorifics(s: string): string {
  return s
    .replace(/\b(bro|brother|sis|sister|pastor|pst|evang|evangelist|mr|mrs|miss|dr|engr)\b\.?/gi, ' ')
    .replace(/[,;:/\\()\[\]{}'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractNameTokens(nameStr: string): string[] {
  const cleaned = cleanHonorifics(nameStr)
  return cleaned
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter((t) => t.length >= 2)
}

function normalizeTokensKey(tokens: string[]): string {
  return tokens.slice().sort().join(' ')
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
    return { ok: false, error: 'Not authenticated.' }
  }

  const role = session.role as string
  const userRoles = (session as unknown as { roles?: string[] }).roles || []
  const isPresident = Boolean(session.access?.isPresident || role === 'president' || userRoles.includes('president'))
  const isVp = Boolean(session.access?.isVP || role === 'vice_president' || userRoles.includes('vice_president'))
  const isChaplain = Boolean(session.access?.isChaplain || role === 'chaplain' || userRoles.includes('chaplain'))
  const isAdmin = role === 'admin' || userRoles.includes('admin')

  if (!isPresident && !isVp && !isChaplain && !isAdmin) {
    return { ok: false, error: 'You do not have permission to import executive positions.' }
  }

  return { ok: true, session }
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
        // Default to selected so all rows are imported smoothly
        selected: true,
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
 * - Auto-creates worker profiles for new names with canonical position references.
 */
export async function commitExecutiveImport(payload: {
  items: CommitImportItem[]
  createMissingWorkers: boolean
}): Promise<CommitImportResult> {
  const auth = await verifyAuth()
  if (!auth.ok) {
    return { ok: false, imported: 0, matchedCount: 0, createdCount: 0, skipped: [], error: auth.error }
  }

  const { items, createMissingWorkers } = payload
  if (!items || !items.length) {
    return { ok: false, imported: 0, matchedCount: 0, createdCount: 0, skipped: [], error: 'No items selected to import.' }
  }

  let imported = 0
  let matchedCount = 0
  let createdCount = 0
  const skipped: string[] = []

  // Pre-fetch fresh workers and their existing positions
  const existingWorkers = (await sanityPrivateClient.fetch(
    `*[_type == "worker" && !(_id in path("drafts.**"))]{
      _id,
      fullName,
      email,
      positions
    }`
  )) as Array<{
    _id: string
    fullName?: string
    email?: string
    positions?: Array<Record<string, unknown>>
  }>

  const workerMapByName = new Map<string, string>()
  const workerPositionsMap = new Map<string, Array<Record<string, unknown>>>()

  for (const w of existingWorkers) {
    if (w.fullName) workerMapByName.set(w.fullName.toLowerCase().trim(), w._id)
    workerPositionsMap.set(w._id, w.positions || [])
  }

  for (const item of items) {
    const cleanDisplayName = item.workerDisplayName || capitalizeWords(cleanHonorifics(item.rawName))

    // Build the canonical new position object
    const newPos: Record<string, unknown> = {
      _key: `csv_pos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      _type: 'executivePosition',
      kind: item.kind,
      status: 'approved',
      rank: item.rank || 'lead',
      submittedAt: new Date().toISOString(),
      decidedAt: new Date().toISOString(),
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

    if (targetWorkerId) {
      try {
        const currentPositions = workerPositionsMap.get(targetWorkerId) || []

        // Smart merge: replace existing position of the same role/category instead of duplicating
        const filteredPositions = currentPositions.filter((p) => {
          // If incoming is CSGB, replace any prior CSGB position
          if (item.kind === 'csgb' && p.kind === 'csgb') return false

          // If incoming is for a specific team, replace any prior position for that same team
          if (item.kind === 'team' && p.kind === 'team') {
            const pTeamRef = (p.team as { _ref?: string })?._ref
            if (pTeamRef && item.teamRef && pTeamRef === item.teamRef) return false
            if (p.teamName && item.teamName && String(p.teamName).toLowerCase() === String(item.teamName).toLowerCase()) return false
          }

          // If incoming is for a specific hall, replace prior position for that hall
          if (item.kind === 'hall' && p.kind === 'hall') {
            const pHallRef = (p.hallRef as { _ref?: string })?._ref
            if (pHallRef && item.hallRef && pHallRef === item.hallRef) return false
            if (p.hall && item.hall && String(p.hall).toLowerCase() === String(item.hall).toLowerCase()) return false
          }

          return true
        })

        const updatedPositions = [...filteredPositions, newPos]

        await patchPrivateDocument(targetWorkerId)
          .set({
            positions: updatedPositions,
            isExcoApproved: true,
          })
          .commit()

        workerPositionsMap.set(targetWorkerId, updatedPositions)
        imported++
        matchedCount++
      } catch (err) {
        console.error('[commitExecutiveImport] patch error:', err)
        skipped.push(`${cleanDisplayName}: Failed to update worker record.`)
      }
    } else if (createMissingWorkers) {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const createdWorker = await sanityPrivateClient.create({
          _type: 'worker',
          fullName: cleanDisplayName,
          ...(item.email ? { email: item.email.toLowerCase() } : {}),
          ...(item.hall ? { hall: item.hall } : {}),
          isExcoApproved: true,
          positions: [newPos],
          memberships: item.kind === 'team' && item.teamRef ? [
            {
              _key: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              _type: 'teamMembership',
              team: { _type: 'reference', _ref: item.teamRef },
              status: 'verified',
              decidedAt: new Date().toISOString(),
            }
          ] : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updateLog: [`Created via executive leadership spreadsheet import on ${today}`],
        })

        const newId = createdWorker._id
        workerMapByName.set(cleanDisplayName.toLowerCase().trim(), newId)
        workerPositionsMap.set(newId, [newPos])
        imported++
        createdCount++
      } catch (err) {
        console.error('[commitExecutiveImport] create worker error:', err)
        skipped.push(`${cleanDisplayName}: Failed to create new worker profile.`)
      }
    } else {
      skipped.push(`${cleanDisplayName}: No matching worker found in database.`)
    }
  }

  try {
    revalidatePath('/dashboard/executives')
    revalidatePath('/dashboard/workers')
  } catch {}

  return {
    ok: true,
    imported,
    matchedCount,
    createdCount,
    skipped,
  }
}

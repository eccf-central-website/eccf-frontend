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
  if (
    combined.includes('president') &&
    !combined.includes('vice president') &&
    !combined.includes('vp')
  ) {
    const csgbMatch = csgbRoles.find((r) => r.title.toLowerCase().includes('president') && !r.title.toLowerCase().includes('vice'))
    return {
      kind: 'csgb',
      office: 'President',
      csgbRoleRef: csgbMatch?._id || 'csgb-role-president',
      rank: 'lead',
    }
  }
  if (
    combined.includes('vp admin') ||
    combined.includes('vice president admin') ||
    combined.includes('brothers coordinator') ||
    combined.includes("brother's coordinator") ||
    combined.includes("brothers' coordinator")
  ) {
    const csgbMatch = csgbRoles.find((r) => r.title.toLowerCase().includes('admin'))
    return {
      kind: 'csgb',
      office: 'Vice President - Admin',
      csgbRoleRef: csgbMatch?._id || 'csgb-role-vp-admin',
      rank: 'lead',
    }
  }
  if (
    combined.includes('vp evangelism') ||
    combined.includes('vice president evangelism') ||
    combined.includes('sisters coordinator') ||
    combined.includes("sister's coordinator") ||
    combined.includes("sisters' coordinator")
  ) {
    const csgbMatch = csgbRoles.find((r) => r.title.toLowerCase().includes('evangelism'))
    return {
      kind: 'csgb',
      office: 'Vice President - Evangelism',
      csgbRoleRef: csgbMatch?._id || 'csgb-role-vp-evangelism',
      rank: 'lead',
    }
  }
  if (
    combined.includes('general secretary') ||
    combined.includes('gen sec') ||
    (combined.includes('secretary') && !combined.includes('financial') && !combined.includes('bible study') && !combined.includes('organizing'))
  ) {
    const csgbMatch = csgbRoles.find((r) => r.title.toLowerCase().includes('general secretary'))
    return {
      kind: 'csgb',
      office: 'General Secretary',
      csgbRoleRef: csgbMatch?._id || 'csgb-role-general-secretary',
      rank,
    }
  }
  if (
    combined.includes('prayer coordinator') ||
    combined.includes('prayer coord')
  ) {
    const csgbMatch = csgbRoles.find((r) => r.title.toLowerCase().includes('prayer coordinator'))
    return {
      kind: 'csgb',
      office: 'Prayer Coordinator',
      csgbRoleRef: csgbMatch?._id || 'csgb-role-prayer-coordinator',
      rank,
    }
  }

  // Any other CSGB role matches by title
  for (const r of csgbRoles) {
    const rLower = r.title.toLowerCase()
    if (combined.includes(rLower) || rLower.includes(rawValue.toLowerCase())) {
      return {
        kind: 'csgb',
        office: r.title,
        csgbRoleRef: r._id,
        rank,
      }
    }
  }

  // 3. Check Halls of Residence
  const hallNumMatch = combined.match(/hall\s*([1-8])/i)
  if (hallNumMatch) {
    const hallName = `Hall ${hallNumMatch[1]}`
    const hallMatch = halls.find((h) => h.name.toLowerCase() === hallName.toLowerCase())
    return {
      kind: 'hall',
      hall: hallName,
      hallRef: hallMatch?._id,
      rank,
    }
  }
  if (combined.includes('hall pastor') || combined.includes('hall rep') || combined.includes('hall pastorate')) {
    const num = combined.match(/([1-8])/)
    const hallName = num ? `Hall ${num[1]}` : 'Hall 1'
    const hallMatch = halls.find((h) => h.name.toLowerCase() === hallName.toLowerCase())
    return {
      kind: 'hall',
      hall: hallName,
      hallRef: hallMatch?._id,
      rank,
    }
  }

  // 4. Check Ministry Teams
  for (const t of teams) {
    const tClean = t.name.toLowerCase().replace(/[^a-z0-9]/g, ' ')
    const tTokens = tClean.split(/\s+/).filter((w) => w.length > 2 && w !== 'team')
    const matchesTeam = tTokens.some((token) => combined.includes(token))
    if (matchesTeam) {
      return {
        kind: 'team',
        teamName: t.name,
        teamRef: t._id,
        rank,
      }
    }
  }

  // 5. Fallback if explicit type is provided
  const typeLower = (rawType || '').toLowerCase()
  if (typeLower.includes('csgb')) {
    const csgbMatch = csgbRoles.find((r) => r.title.toLowerCase().includes(rawValue.toLowerCase()))
    return {
      kind: 'csgb',
      office: rawValue || 'CSGB Officer',
      csgbRoleRef: csgbMatch?._id,
      rank,
    }
  }
  if (typeLower.includes('hall')) {
    const hallMatch = halls.find((h) => h.name.toLowerCase().includes(rawValue.toLowerCase()))
    return {
      kind: 'hall',
      hall: rawValue || 'Hall 1',
      hallRef: hallMatch?._id,
      rank,
    }
  }
  if (typeLower.includes('team')) {
    const teamMatch = teams.find((t) => t.name.toLowerCase().includes(rawValue.toLowerCase()))
    return {
      kind: 'team',
      teamName: teamMatch?.name || rawValue || 'Ministry Team',
      teamRef: teamMatch?._id,
      rank,
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
 * Allows the user to inspect and modify matches before committing.
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
        `*[_type == "teamUnit" && !(_id in path("drafts.**"))]{
          _id,
          name,
          "key": coalesce(key, teamKey)
        }`
      ) as Promise<TeamLookupItem[]>,
      sanityPrivateClient.fetch(
        `*[_type == "csgbRole" && !(_id in path("drafts.**"))]{
          _id,
          title
        }`
      ) as Promise<CsgbRoleLookupItem[]>,
      sanityPrivateClient.fetch(
        `*[_type == "hallResidence" && !(_id in path("drafts.**"))]{
          _id,
          name
        }`
      ) as Promise<HallLookupItem[]>,
    ])

    // Build lookup index structures
    const byEmail = new Map<string, WorkerLookupItem>()
    const bySortedTokens = new Map<string, WorkerLookupItem>()
    const byTokenList: { worker: WorkerLookupItem; tokens: string[] }[] = []
    const singleTokenCounts = new Map<string, WorkerLookupItem[]>()

    for (const w of workers) {
      if (w.email) {
        byEmail.set(w.email.toLowerCase().trim(), w)
      }
      const combinedName = `${w.fullName || ''} ${w.firstName || ''} ${w.lastName || ''}`
      const tokens = extractNameTokens(combinedName)
      if (tokens.length > 0) {
        const sortedKey = normalizeTokensKey(tokens)
        if (!bySortedTokens.has(sortedKey)) {
          bySortedTokens.set(sortedKey, w)
        }
        byTokenList.push({ worker: w, tokens })

        const uniqueSingleTokens = Array.from(new Set(tokens))
        for (const tok of uniqueSingleTokens) {
          const arr = singleTokenCounts.get(tok) || []
          arr.push(w)
          singleTokenCounts.set(tok, arr)
        }
      }
    }

    const previewRows: ExecutivePreviewRow[] = []
    let matchedCount = 0
    let newWorkerCount = 0
    let warningCount = 0

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

      // Match worker
      let targetWorker: WorkerLookupItem | null = null
      if (rawEmail) {
        targetWorker = byEmail.get(rawEmail.toLowerCase().trim()) || null
      }

      if (!targetWorker) {
        const inputTokens = extractNameTokens(candidateName)
        if (inputTokens.length > 0) {
          const sortedKey = normalizeTokensKey(inputTokens)
          targetWorker = bySortedTokens.get(sortedKey) || null

          if (!targetWorker && inputTokens.length >= 2) {
            for (const item of byTokenList) {
              const matchedTokens = inputTokens.filter((tok) => item.tokens.includes(tok))
              if (matchedTokens.length >= 2 && matchedTokens.length === Math.min(inputTokens.length, item.tokens.length)) {
                targetWorker = item.worker
                break
              }
            }
          }

          if (!targetWorker && inputTokens.length === 1) {
            const singleTok = inputTokens[0]
            const candidates = singleTokenCounts.get(singleTok) || []
            if (candidates.length === 1) {
              targetWorker = candidates[0]
            }
          }
        }
      }

      const isNew = !targetWorker
      if (targetWorker) {
        matchedCount++
      } else {
        newWorkerCount++
      }

      // Parse position
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
        statusMessage = 'Could not auto-detect position or office'
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

        kind: posParsed?.kind || 'unknown',
        office: posParsed?.office,
        csgbRoleRef: posParsed?.csgbRoleRef,
        hall: posParsed?.hall,
        hallRef: posParsed?.hallRef,
        teamName: posParsed?.teamName,
        teamRef: posParsed?.teamRef,
        rank: posParsed?.rank || 'lead',

        status,
        statusMessage,
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
      error: err instanceof Error ? err.message : 'Failed to parse spreadsheet.',
    }
  }
}

/**
 * Commit the reviewed executive positions to Sanity.
 * Notice: We intentionally do NOT call revalidatePath('/dashboard/workers') here
 * so that the open modal on the client is not destroyed by Next.js RSC re-render!
 * The client will trigger router.refresh() when the user closes the dialog or clicks Done.
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

  // Pre-fetch fresh workers to avoid creating duplicates if multiple rows refer to the same new worker
  const existingWorkers = (await sanityPrivateClient.fetch(
    `*[_type == "worker" && !(_id in path("drafts.**"))]{ _id, fullName, email }`
  )) as WorkerLookupItem[]
  const workerMapByName = new Map<string, string>()
  for (const w of existingWorkers) {
    if (w.fullName) workerMapByName.set(w.fullName.toLowerCase().trim(), w._id)
  }

  for (const item of items) {
    const cleanDisplayName = item.workerDisplayName || capitalizeWords(cleanHonorifics(item.rawName))

    const newPos: Record<string, unknown> = {
      _key: `csv_pos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      kind: item.kind,
      status: 'approved',
      rank: item.rank || 'lead',
      submittedAt: new Date().toISOString(),
      decidedAt: new Date().toISOString(),
    }

    if (item.kind === 'csgb') {
      newPos.office = item.office
      if (item.csgbRoleRef) {
        newPos.csgbRole = { _type: 'reference', _ref: item.csgbRoleRef }
      }
    }
    if (item.kind === 'hall') {
      newPos.hall = item.hall
      if (item.hallRef) {
        newPos.hallRef = { _type: 'reference', _ref: item.hallRef }
      }
    }
    if (item.kind === 'team') {
      newPos.teamName = item.teamName
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
        await patchPrivateDocument(targetWorkerId).set({ isExcoApproved: true }).append('positions', [newPos]).commit()
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
          memberships: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updateLog: [`Created via executive spreadsheet import on ${today}`],
        })
        workerMapByName.set(cleanDisplayName.toLowerCase().trim(), createdWorker._id)
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

  // Revalidate background paths only, avoiding active page unmount
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

/**
 * Backward compatibility wrapper for direct spreadsheet submission.
 */
export async function suggestPositionsFromCsv(
  formData: FormData
): Promise<CsvImportResult> {
  const preview = await previewExecutiveSpreadsheet(formData)
  if (!preview.ok) {
    return {
      ok: false,
      imported: 0,
      matchedCount: 0,
      createdCount: 0,
      skipped: [],
      error: preview.error,
    }
  }

  const validItems: CommitImportItem[] = preview.rows
    .filter((r) => r.kind !== 'unknown')
    .map((r) => ({
      rowId: r.rowId,
      rawName: r.rawName,
      workerDisplayName: r.workerDisplayName,
      matchedWorkerId: r.matchedWorkerId,
      isNewWorker: r.isNewWorker,
      kind: r.kind as 'csgb' | 'hall' | 'team',
      office: r.office,
      csgbRoleRef: r.csgbRoleRef,
      hall: r.hall,
      hallRef: r.hallRef,
      teamName: r.teamName,
      teamRef: r.teamRef,
      rank: r.rank,
      email: r.rawEmail,
    }))

  const createMissingWorkers = formData.get('createMissingWorkers') !== 'false'

  const commitResult = await commitExecutiveImport({
    items: validItems,
    createMissingWorkers,
  })

  return {
    ok: commitResult.ok,
    imported: commitResult.imported,
    matchedCount: commitResult.matchedCount,
    createdCount: commitResult.createdCount,
    skipped: [
      ...commitResult.skipped,
      ...preview.rows
        .filter((r) => r.kind === 'unknown')
        .map((r) => `Row ${r.rowIndex} (${r.rawName}): Could not auto-detect position`),
    ],
    error: commitResult.error,
  }
}

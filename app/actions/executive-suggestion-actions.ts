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
    (combined.includes('secretary') && !combined.includes('assistant'))
  ) {
    const csgbMatch = csgbRoles.find((r) => r.title.toLowerCase().includes('secretary'))
    return {
      kind: 'csgb',
      office: 'General Secretary',
      csgbRoleRef: csgbMatch?._id || 'csgb-role-general-secretary',
      rank: 'lead',
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
      rank: 'lead',
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
      teamName: rawValue || 'Ministry Team',
      teamRef: teamMatch?._id,
      rank,
    }
  }

  return null
}

function findMatchingWorker(
  rowFullName: string,
  rowEmail: string,
  workers: WorkerLookupItem[]
): { worker?: WorkerLookupItem; ambiguous?: boolean } {
  // 1. Match by Email if present
  if (rowEmail) {
    const byEmail = workers.find(
      (w) => w.email && w.email.trim().toLowerCase() === rowEmail.trim().toLowerCase()
    )
    if (byEmail) return { worker: byEmail }
  }

  const rowTokens = extractNameTokens(rowFullName)
  if (rowTokens.length === 0) return {}

  const rowKey = normalizeTokensKey(rowTokens)

  // 2. Exact sorted tokens match (Handles any word order e.g. First Last vs Last First vs Last, First)
  const exactTokenMatches = workers.filter((w) => {
    const wTokens = extractNameTokens(w.fullName || '')
    return normalizeTokensKey(wTokens) === rowKey
  })
  if (exactTokenMatches.length === 1) {
    return { worker: exactTokenMatches[0] }
  }
  if (exactTokenMatches.length > 1) {
    return { ambiguous: true }
  }

  // 3. Subset / Superset match (Handles missing or additional middle names)
  const subsetMatches = workers.filter((w) => {
    const wTokens = extractNameTokens(w.fullName || '')
    if (wTokens.length === 0) return false
    const isSubset = rowTokens.every((t) => wTokens.includes(t))
    const isSuperset = wTokens.every((t) => rowTokens.includes(t))
    return isSubset || isSuperset
  })
  if (subsetMatches.length === 1) {
    return { worker: subsetMatches[0] }
  }
  if (subsetMatches.length > 1) {
    return { ambiguous: true }
  }

  // 4. Single Name Match (user specifically requested single name support!)
  if (rowTokens.length === 1) {
    const singleToken = rowTokens[0]
    const singleMatches = workers.filter((w) => {
      const wTokens = extractNameTokens(w.fullName || '')
      return wTokens.includes(singleToken)
    })
    if (singleMatches.length === 1) {
      return { worker: singleMatches[0] }
    }
    if (singleMatches.length > 1) {
      return { ambiguous: true }
    }
  }

  return {}
}

export async function suggestPositionsFromCsv(
  formData: FormData
): Promise<CsvImportResult> {
  const session = await getSession()
  if (!session) {
    return { ok: false, imported: 0, matchedCount: 0, createdCount: 0, skipped: [], error: 'Your session has expired. Please sign in again.' }
  }

  const canApprove =
    session.access?.isPresident ||
    session.access?.isVP ||
    session.access?.isChaplain ||
    session.worker?.canApproveExecutives === true ||
    session.role === 'admin'

  if (!canApprove) {
    return { ok: false, imported: 0, matchedCount: 0, createdCount: 0, skipped: [], error: 'Permission denied.' }
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return { ok: false, imported: 0, matchedCount: 0, createdCount: 0, skipped: [], error: 'No file provided.' }
  }

  const createMissingWorkers = formData.get('createMissingWorkers') !== 'false'

  let rows: Array<Record<string, unknown>> = []
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  } catch (err) {
    console.error('[suggestPositionsFromCsv] parse error:', err)
    return { ok: false, imported: 0, matchedCount: 0, createdCount: 0, skipped: [], error: 'Failed to parse file. Ensure it is a valid CSV/XLSX.' }
  }

  if (!rows.length) {
    return { ok: false, imported: 0, matchedCount: 0, createdCount: 0, skipped: [], error: 'The file contains no data rows.' }
  }

  let workers: WorkerLookupItem[] = []
  let teams: TeamLookupItem[] = []
  let csgbRoles: CsgbRoleLookupItem[] = []
  let halls: HallLookupItem[] = []
  try {
    const [fetchedWorkers, fetchedTeams, fetchedCsgbRoles, fetchedHalls] = await Promise.all([
      sanityPrivateClient.fetch<WorkerLookupItem[]>(
        `*[_type == "worker"]{ _id, fullName, email, firstName, lastName }`
      ),
      sanityPrivateClient.fetch<TeamLookupItem[]>(
        `*[_type == "teamUnit"]{ _id, name, "key": coalesce(key, slug.current) }`
      ),
      sanityPrivateClient.fetch<CsgbRoleLookupItem[]>(
        `*[_type == "csgbRole"]{ _id, title }`
      ),
      sanityPrivateClient.fetch<HallLookupItem[]>(
        `*[_type == "hallResidence"]{ _id, name }`
      ),
    ])
    workers = fetchedWorkers
    teams = fetchedTeams
    csgbRoles = fetchedCsgbRoles
    halls = fetchedHalls
  } catch (err) {
    console.error('[suggestPositionsFromCsv] sanity fetch error:', err)
    return { ok: false, imported: 0, matchedCount: 0, createdCount: 0, skipped: [], error: 'Failed to load system records from Sanity.' }
  }

  let imported = 0
  let matchedCount = 0
  let createdCount = 0
  const skipped: string[] = []

  let rowIndex = 1
  for (const row of rows) {
    rowIndex++

    // 1. Resolve Name
    const explicitFullName = getRowField(row, [
      'FullName', 'Full Name', 'Name', 'NAME', 'Worker Name', 'Worker', 'Applicant', 'Member', 'Student Name', 'Member Name'
    ])
    const firstName = getRowField(row, ['FirstName', 'First Name', 'First', 'FName'])
    const lastName = getRowField(row, ['LastName', 'Last Name', 'Surname', 'Last', 'LName'])
    const email = getRowField(row, ['Email', 'E-mail', 'Email Address', 'EmailAddress'])
    const hall = getRowField(row, ['Hall', 'Hostel', 'Hall of Residence', 'Residence'])

    const rawFullName = explicitFullName || [firstName, lastName].filter(Boolean).join(' ').trim()
    const cleanDisplayName = rawFullName ? capitalizeWords(cleanHonorifics(rawFullName)) : ''

    if (!cleanDisplayName && !email) {
      skipped.push(`Row ${rowIndex}: Missing Name or Email`)
      continue
    }

    // 2. Resolve Position & Rank
    const positionType = getRowField(row, ['PositionType', 'Position Type', 'Type', 'Category', 'Kind'])
    const positionValue = getRowField(row, [
      'PositionValue', 'Position Value', 'Position', 'Office', 'Role', 'Post', 'Title', 'Designation', 'Appointment'
    ])
    const rankRaw = getRowField(row, ['Rank', 'PositionRank', 'Position Rank', 'Level'])

    const posParsed = parsePositionDetails(positionType, positionValue, rankRaw, csgbRoles, halls, teams)
    if (!posParsed) {
      skipped.push(`Row ${rowIndex} (${cleanDisplayName || email}): Could not identify position or ministry team from "${positionType} ${positionValue}".`)
      continue
    }

    // 3. Match against existing workers
    const matchResult = findMatchingWorker(cleanDisplayName, email, workers)
    if (matchResult.ambiguous) {
      skipped.push(`Row ${rowIndex} (${cleanDisplayName}): Single name matches multiple workers in the database. Provide full name or email to differentiate.`)
      continue
    }

    const targetWorker = matchResult.worker

    // Build the executive position object
    const newPos: Record<string, unknown> = {
      _key: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      _type: 'executivePosition',
      kind: posParsed.kind,
      status: 'pending',
      rank: posParsed.rank,
      submittedAt: new Date().toISOString(),
    }
    if (posParsed.kind === 'csgb') {
      newPos.office = posParsed.office
      if (posParsed.csgbRoleRef) {
        newPos.csgbRole = { _type: 'reference', _ref: posParsed.csgbRoleRef }
      }
    }
    if (posParsed.kind === 'hall') {
      newPos.hall = posParsed.hall
      if (posParsed.hallRef) {
        newPos.hallRef = { _type: 'reference', _ref: posParsed.hallRef }
      }
    }
    if (posParsed.kind === 'team') {
      newPos.teamName = posParsed.teamName
      if (posParsed.teamRef) {
        newPos.team = { _type: 'reference', _ref: posParsed.teamRef }
      }
    }

    if (targetWorker) {
      // Append position to existing worker
      try {
        await patchPrivateDocument(targetWorker._id).append('positions', [newPos]).commit()
        imported++
        matchedCount++
      } catch (err) {
        console.error('[suggestPositionsFromCsv] patch error:', err)
        skipped.push(`Row ${rowIndex} (${cleanDisplayName}): Failed to update worker record.`)
      }
    } else if (createMissingWorkers) {
      // Create new worker profile in Sanity with this pending executive position
      try {
        const today = new Date().toISOString().slice(0, 10)
        const createdWorker = await sanityPrivateClient.create({
          _type: 'worker',
          fullName: cleanDisplayName,
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
          ...(email ? { email: email.toLowerCase() } : {}),
          ...(hall ? { hall } : {}),
          positions: [newPos],
          memberships: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updateLog: [`Created via executive spreadsheet import on ${today}`],
        })
        workers.push({
          _id: createdWorker._id,
          fullName: cleanDisplayName,
          email: email || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        })
        imported++
        createdCount++
      } catch (err) {
        console.error('[suggestPositionsFromCsv] create worker error:', err)
        skipped.push(`Row ${rowIndex} (${cleanDisplayName}): Failed to create new worker profile.`)
      }
    } else {
      skipped.push(`Row ${rowIndex} (${cleanDisplayName}): No matching worker found in database.`)
    }
  }

  revalidatePath('/dashboard/executives')
  revalidatePath('/dashboard/workers')
  revalidatePath('/dashboard')

  return {
    ok: true,
    imported,
    matchedCount,
    createdCount,
    skipped,
  }
}

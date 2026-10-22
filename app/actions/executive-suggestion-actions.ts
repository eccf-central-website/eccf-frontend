'use server'

import * as XLSX from 'xlsx'
import { revalidatePath } from 'next/cache'
import { sanityPrivateClient, patchPrivateDocument } from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'

export interface CsvImportResult {
  ok: boolean
  imported: number
  skipped: string[]
  error?: string
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeKind(value: string): 'csgb' | 'hall' | 'team' | null {
  const v = value.trim().toLowerCase()
  if (v === 'csgb' || v.includes('csgb') || v.includes('office') || v.includes('governing')) return 'csgb'
  if (v === 'hall' || v.includes('hall') || v.includes('pastor')) return 'hall'
  if (v === 'team' || v.includes('team') || v.includes('lead')) return 'team'
  return null
}

export async function suggestPositionsFromCsv(
  formData: FormData
): Promise<CsvImportResult> {
  const session = await getSession()
  if (!session) {
    return { ok: false, imported: 0, skipped: [], error: 'Your session has expired. Please sign in again.' }
  }

  const canApprove =
    session.access?.isPresident ||
    session.access?.isVP ||
    session.access?.isChaplain ||
    session.worker?.canApproveExecutives === true ||
    session.role === 'admin' ||
    session.role === 'chaplain'

  if (!canApprove) {
    return { ok: false, imported: 0, skipped: [], error: 'Permission denied.' }
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return { ok: false, imported: 0, skipped: [], error: 'No file provided.' }
  }

  let rows: any[] = []
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  } catch (err) {
    console.error('[suggestPositionsFromCsv] parse error:', err)
    return { ok: false, imported: 0, skipped: [], error: 'Failed to parse file. Ensure it is a valid CSV/XLSX.' }
  }

  if (!rows.length) {
    return { ok: false, imported: 0, skipped: [], error: 'The file contains no data rows.' }
  }

  let workers: any[] = []
  let teams: any[] = []
  try {
    workers = await sanityPrivateClient.fetch<any[]>(
      `*[_type == "worker"]{ _id, fullName, email, firstName, lastName }`
    )
    teams = await sanityPrivateClient.fetch<any[]>(
      `*[_type == "teamUnit"]{ _id, name, "key": coalesce(key, slug.current) }`
    )
  } catch (err) {
    console.error('[suggestPositionsFromCsv] sanity fetch error:', err)
    return { ok: false, imported: 0, skipped: [], error: 'Failed to load workers.' }
  }

  const byName = new Map<string, any>()
  for (const w of workers) {
    if (w?.fullName) byName.set(normalizeName(w.fullName), w)
  }
  const teamByName = new Map<string, any>()
  for (const t of teams) {
    if (t?.name) teamByName.set(t.name.trim().toLowerCase(), t)
    if (t?.key) teamByName.set(String(t.key).trim().toLowerCase(), t)
  }

  let imported = 0
  const skipped: string[] = []

  for (const row of rows) {
    const firstName = String(
      row.FirstName || row.firstName || row['First Name'] || row['first name'] || ''
    ).trim()
    const lastName = String(
      row.LastName || row.lastName || row['Last Name'] || row['last name'] || ''
    ).trim()
    const fullNameRaw = String(
      row.FullName || row.fullName || row['Full Name'] || row['full name'] || ''
    ).trim()
    const fullName = fullNameRaw || [firstName, lastName].filter(Boolean).join(' ').trim()
    const positionType = String(
      row.PositionType || row.positionType || row['Position Type'] || row['position type'] || ''
    ).trim()
    const positionValue = String(
      row.PositionValue || row.positionValue || row['Position Value'] || row['position value'] || ''
    ).trim()
    const rankRaw = String(row.Rank || row.rank || '').trim().toLowerCase()
    const rank = rankRaw === 'assistant' ? 'assistant' : 'lead'

    if (!fullName) {
      skipped.push('Row missing FullName')
      continue
    }

    const worker = byName.get(normalizeName(fullName))
    if (!worker) {
      skipped.push(`${fullName} (no matching worker)`)
      continue
    }

    const kind = normalizeKind(positionType)
    if (!kind || !positionValue) {
      skipped.push(`${fullName} (invalid position type/value)`)
      continue
    }

    const newPos: Record<string, unknown> = {
      _key: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      _type: 'executivePosition',
      kind,
      status: 'pending',
      rank,
    }
    if (kind === 'csgb') newPos.office = positionValue
    if (kind === 'hall') newPos.hall = positionValue
    if (kind === 'team') {
      newPos.teamName = positionValue
      const t = teamByName.get(positionValue.trim().toLowerCase())
      if (t?._id) {
        newPos.team = { _type: 'reference', _ref: t._id }
      }
    }

    try {
      await patchPrivateDocument(worker._id).append('positions', [newPos]).commit()
      imported++
    } catch (err) {
      console.error('[suggestPositionsFromCsv] patch error:', err)
      skipped.push(`${fullName} (failed to save position)`)
    }
  }

  revalidatePath('/dashboard/executives')
  revalidatePath('/dashboard/workers')
  revalidatePath('/dashboard')

  return { ok: true, imported, skipped }
}
'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID, randomBytes, createHash } from 'crypto'
import { sanityWriteClient } from '@/lib/sanity'
import type {
  QAChecklistDoc,
  QADefect,
  QATestItemState,
  QATesterPublic,
} from '@/lib/qa/test-suites'

const QA_DOC_ID = 'qaMasterChecklist'
const PIN_SALT = process.env.QA_PIN_SALT || 'eccf_qa_pin_salt_v1'
const TOKEN_SALT = process.env.QA_TOKEN_SALT || 'eccf_qa_token_salt_v1'
const QA_LEAD_PIN = process.env.QA_LEAD_PIN || 'eccf2026'

export interface QATesterRecord {
  id: string
  name: string
  pinHash: string
  tokenHash: string
  createdAt: string
  lastActiveAt?: string
}

function hashPin(name: string, pin: string): string {
  return createHash('sha256')
    .update(`${name.trim().toLowerCase()}:${pin.trim()}:${PIN_SALT}`)
    .digest('hex')
}

function hashToken(token: string): string {
  return createHash('sha256')
    .update(`${token.trim()}:${TOKEN_SALT}`)
    .digest('hex')
}

interface SanityQADoc {
  _id: string
  _type?: string
  title?: string
  updatedAt?: string
  updatedBy?: string
  testItems?: Record<string, QATestItemState>
  defects?: QADefect[]
  testers?: QATesterRecord[]
}

export async function getQAChecklist(): Promise<QAChecklistDoc> {
  try {
    const doc = await sanityWriteClient.fetch<SanityQADoc | null>(
      `*[_id == $id][0]`,
      { id: QA_DOC_ID }
    )

    if (doc) {
      // Map both underscores and hyphens in testItems so any key lookup succeeds on client
      const rawItems = (doc.testItems as Record<string, QATestItemState>) || {}
      const normalizedItems: Record<string, QATestItemState> = {}
      for (const [key, val] of Object.entries(rawItems)) {
        normalizedItems[key] = val
        normalizedItems[key.replace(/_/g, '-')] = val
        normalizedItems[key.replace(/-/g, '_')] = val
      }

      // Sanitize testers to public interface (never leak pinHash or tokenHash)
      const rawTesters: QATesterRecord[] = Array.isArray(doc.testers) ? doc.testers : []
      const publicTesters: QATesterPublic[] = rawTesters.map((t) => ({
        id: t.id || 'unknown',
        name: t.name || 'Anonymous',
        createdAt: t.createdAt,
        lastActiveAt: t.lastActiveAt,
      }))

      return {
        _id: doc._id,
        _type: doc._type || 'qaChecklist',
        title: doc.title || 'ECCF V1.0 Production Candidate QA Run',
        testItems: normalizedItems,
        defects: Array.isArray(doc.defects) ? doc.defects : [],
        testers: publicTesters,
        updatedAt: doc.updatedAt,
        updatedBy: doc.updatedBy,
      }
    }

    // Initialize document if not yet created in Sanity
    const initialDoc: QAChecklistDoc = {
      _id: QA_DOC_ID,
      _type: 'qaChecklist',
      title: 'ECCF V1.0 Production Candidate QA Run',
      testItems: {},
      defects: [],
      testers: [],
      updatedAt: new Date().toISOString(),
      updatedBy: 'System',
    }

    await sanityWriteClient.createIfNotExists(initialDoc)
    return initialDoc
  } catch (error) {
    console.error('[getQAChecklist] Error retrieving QA checklist from Sanity:', error)
    // Fallback in-memory response so testing is never blocked
    return {
      _id: QA_DOC_ID,
      _type: 'qaChecklist',
      title: 'ECCF V1.0 Production Candidate QA Run',
      testItems: {},
      defects: [],
      testers: [],
    }
  }
}

/**
 * Register or verify a tester with a 4-digit PIN.
 * - If the name does not exist, registers the tester with the chosen PIN and issues a session token.
 * - If the name already exists, verifies the 4-digit PIN. If correct, returns a valid session token.
 */
export async function registerOrVerifyTester(input: {
  name: string
  pin: string
}): Promise<{
  success: boolean
  testerName?: string
  testerId?: string
  testerToken?: string
  isNew?: boolean
  error?: string
}> {
  try {
    const cleanName = input.name?.trim() || ''
    const cleanPin = input.pin?.trim() || ''

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Please enter a valid name (at least 2 characters).' }
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      return { success: false, error: 'Please enter a 4-digit numeric PIN (e.g. 1234).' }
    }

    const doc = await sanityWriteClient.fetch<{
      _id: string
      testers?: QATesterRecord[]
    }>(`*[_id == $id][0]{ _id, testers }`, { id: QA_DOC_ID })

    const testers: QATesterRecord[] = Array.isArray(doc?.testers) ? [...doc.testers] : []
    const lowerName = cleanName.toLowerCase()
    const existingIndex = testers.findIndex(
      (t) => t.name && t.name.trim().toLowerCase() === lowerName
    )

    const now = new Date().toISOString()
    const targetPinHash = hashPin(cleanName, cleanPin)
    const rawToken = randomBytes(24).toString('hex')
    const tokenHash = hashToken(rawToken)

    if (existingIndex !== -1) {
      // Name is already registered — verify PIN
      const existing = testers[existingIndex]
      if (existing.pinHash !== targetPinHash) {
        return {
          success: false,
          error: `The name "${cleanName}" is already registered with a different PIN. If this is you, please enter your correct 4-digit PIN. If you are a different tester, please use your surname initial (e.g. "${cleanName} A.").`,
        }
      }

      // Valid PIN! Update token and lastActiveAt
      testers[existingIndex] = {
        ...existing,
        tokenHash,
        lastActiveAt: now,
      }

      await sanityWriteClient
        .patch(QA_DOC_ID)
        .set({ testers, updatedAt: now, updatedBy: existing.name })
        .commit()

      return {
        success: true,
        isNew: false,
        testerName: existing.name,
        testerId: existing.id,
        testerToken: rawToken,
      }
    }

    // New tester registration
    const newTesterId = `tester_${randomBytes(6).toString('hex')}`
    const newTester: QATesterRecord = {
      id: newTesterId,
      name: cleanName,
      pinHash: targetPinHash,
      tokenHash,
      createdAt: now,
      lastActiveAt: now,
    }

    testers.push(newTester)

    await sanityWriteClient.createIfNotExists({
      _id: QA_DOC_ID,
      _type: 'qaChecklist',
      title: 'ECCF V1.0 Production Candidate QA Run',
      testItems: {},
      defects: [],
      testers: [],
    })

    await sanityWriteClient
      .patch(QA_DOC_ID)
      .setIfMissing({ testers: [], testItems: {}, defects: [] })
      .set({ testers, updatedAt: now, updatedBy: cleanName })
      .commit()

    return {
      success: true,
      isNew: true,
      testerName: cleanName,
      testerId: newTesterId,
      testerToken: rawToken,
    }
  } catch (err) {
    console.error('[registerOrVerifyTester] Error:', err)
    return { success: false, error: 'Registration failed. Please check network and retry.' }
  }
}

/**
 * Validates a cached tester session token from localStorage.
 */
export async function validateTesterSession(input: {
  testerName: string
  testerToken: string
}): Promise<{ valid: boolean; testerId?: string; testerName?: string }> {
  try {
    const cleanName = input.testerName?.trim() || ''
    const cleanToken = input.testerToken?.trim() || ''
    if (!cleanName || !cleanToken) return { valid: false }

    const doc = await sanityWriteClient.fetch<{
      testers?: QATesterRecord[]
    }>(`*[_id == $id][0]{ testers }`, { id: QA_DOC_ID })

    const testers: QATesterRecord[] = Array.isArray(doc?.testers) ? doc.testers : []
    const lower = cleanName.toLowerCase()
    const targetHash = hashToken(cleanToken)

    const tester = testers.find(
      (t) => t.name && t.name.trim().toLowerCase() === lower && t.tokenHash === targetHash
    )

    if (tester) {
      return { valid: true, testerId: tester.id, testerName: tester.name }
    }
    return { valid: false }
  } catch (err) {
    console.error('[validateTesterSession] Error:', err)
    return { valid: false }
  }
}

/**
 * Toggles a QA test item.
 * Strictly prevents unchecking or editing tests checked by another tester
 * unless the QA Lead Passcode is provided.
 */
export async function toggleQATestItem(input: {
  testId: string
  checked: boolean
  testerName: string
  testerToken?: string
  leadPin?: string
  notes?: string
}): Promise<{
  success: boolean
  item?: QATestItemState
  error?: string
  lockedBy?: string
}> {
  try {
    const { testId, checked, testerName, testerToken, leadPin, notes } = input
    const cleanTester = testerName?.trim() || ''
    const cleanKey = testId.trim().replace(/-/g, '_')
    const hyphenKey = testId.trim().replace(/_/g, '-')
    const now = new Date().toISOString()

    const isLeadOverride = Boolean(leadPin && leadPin.trim() === QA_LEAD_PIN)

    if (!cleanTester && !isLeadOverride) {
      return {
        success: false,
        error: 'Please register your tester name and 4-digit PIN before verifying tests.',
      }
    }

    // Fetch existing doc state to enforce ownership
    const doc = await sanityWriteClient.fetch<{
      testItems?: Record<string, QATestItemState>
      testers?: QATesterRecord[]
    }>(`*[_id == $id][0]{ testItems, testers }`, { id: QA_DOC_ID })

    const rawItems = doc?.testItems || {}
    const existingItem: QATestItemState | undefined = rawItems[cleanKey] || rawItems[hyphenKey]
    const testers: QATesterRecord[] = Array.isArray(doc?.testers) ? doc.testers : []

    let authorizedTester: QATesterRecord | undefined
    if (!isLeadOverride) {
      if (!testerToken) {
        return {
          success: false,
          error: 'Tester session missing. Please register your name and 4-digit PIN.',
        }
      }
      const tokenHash = hashToken(testerToken)
      authorizedTester = testers.find(
        (t) =>
          t.name &&
          t.name.trim().toLowerCase() === cleanTester.toLowerCase() &&
          t.tokenHash === tokenHash
      )

      if (!authorizedTester) {
        return {
          success: false,
          error: 'Tester session could not be verified. Please re-enter your 4-digit PIN.',
        }
      }
    }

    // ENFORCE OWNERSHIP:
    // If the test item was already checked by someone...
    if (existingItem?.checked) {
      const originalOwner = existingItem.testerName?.trim() || 'Another Tester'
      const isOwner =
        cleanTester && originalOwner.toLowerCase() === cleanTester.toLowerCase()

      // If caller is NOT the original owner and NOT a QA Lead...
      if (!isOwner && !isLeadOverride) {
        return {
          success: false,
          lockedBy: originalOwner,
          error: `Locked: This test was verified by ${originalOwner}. Only ${originalOwner} or a QA Lead can modify or uncheck this report.`,
        }
      }
    }

    const itemState: QATestItemState = {
      checked,
      testerName: isLeadOverride
        ? `Lead Override (${cleanTester || 'Lead'})`
        : (authorizedTester?.name || cleanTester),
      testerId: authorizedTester?.id || 'lead',
      testedAt: now,
      notes: notes?.trim() || existingItem?.notes || '',
    }

    // Exponential backoff retry logic for concurrent mutations
    let attempts = 0
    let lastError: unknown = null
    while (attempts < 4) {
      try {
        await sanityWriteClient
          .patch(QA_DOC_ID)
          .setIfMissing({ testItems: {}, defects: [], testers: [] })
          .set({
            [`testItems.${cleanKey}`]: itemState,
            updatedAt: now,
            updatedBy: itemState.testerName,
          })
          .commit({ autoGenerateArrayKeys: true })

        return { success: true, item: itemState }
      } catch (err) {
        lastError = err
        attempts++
        if (attempts >= 4) break
        // Random jittered backoff between 50ms and 250ms
        await new Promise((r) => setTimeout(r, 60 * attempts + Math.random() * 50))
      }
    }

    console.error('[toggleQATestItem] Error updating test item in Sanity after retries:', lastError)
    return { success: false, error: 'Database update failed. Please retry.' }
  } catch (error) {
    console.error('[toggleQATestItem] Unexpected error:', error)
    return { success: false, error: 'Failed to update test state in Sanity database.' }
  }
}

export async function addQADefect(input: {
  title: string
  module: string
  severity: 'Blocker' | 'High' | 'Med' | 'Low'
  reportedBy: string
  notes?: string
}): Promise<{ success: boolean; defect?: QADefect; error?: string }> {
  try {
    const { title, module, severity, reportedBy, notes } = input
    const cleanReporter = reportedBy?.trim() || 'Anonymous QA'
    const now = new Date().toISOString()

    const newDefect: QADefect = {
      _key: randomUUID(),
      title: title.trim(),
      module: module.trim(),
      severity,
      status: 'Open',
      reportedBy: cleanReporter,
      reportedAt: now,
      notes: notes?.trim() || '',
    }

    await sanityWriteClient.createIfNotExists({
      _id: QA_DOC_ID,
      _type: 'qaChecklist',
      title: 'ECCF V1.0 Production Candidate QA Run',
      testItems: {},
      defects: [],
      testers: [],
    })

    await sanityWriteClient
      .patch(QA_DOC_ID)
      .setIfMissing({ defects: [] })
      .append('defects', [newDefect])
      .set({
        updatedAt: now,
        updatedBy: cleanReporter,
      })
      .commit()

    revalidatePath('/qa')
    return { success: true, defect: newDefect }
  } catch (error) {
    console.error('[addQADefect] Error logging defect in Sanity:', error)
    return { success: false, error: 'Failed to save defect to Sanity.' }
  }
}

export async function updateQADefectStatus(input: {
  defectKey: string
  status: 'Open' | 'In Progress' | 'Resolved'
  updatedBy: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { defectKey, status, updatedBy } = input
    const now = new Date().toISOString()

    await sanityWriteClient
      .patch(QA_DOC_ID)
      .set({
        [`defects[_key=="${defectKey}"].status`]: status,
        updatedAt: now,
        updatedBy: updatedBy?.trim() || 'QA Team',
      })
      .commit()

    revalidatePath('/qa')
    return { success: true }
  } catch (error) {
    console.error('[updateQADefectStatus] Error updating defect status in Sanity:', error)
    return { success: false, error: 'Failed to update defect status.' }
  }
}

export async function verifyLeadPin(pin: string): Promise<{ success: boolean }> {
  return { success: Boolean(pin && pin.trim() === QA_LEAD_PIN) }
}

export async function resetAllQATests(input?: {
  testerName?: string
  leadPin?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const leadPin = input?.leadPin?.trim() || ''
    if (leadPin !== QA_LEAD_PIN) {
      return {
        success: false,
        error: 'Invalid QA Lead Passcode. Resetting the checklist requires the Lead Passcode.',
      }
    }

    const now = new Date().toISOString()
    await sanityWriteClient
      .patch(QA_DOC_ID)
      .setIfMissing({ testItems: {}, defects: [] })
      .set({
        testItems: {},
        updatedAt: now,
        updatedBy: input?.testerName?.trim()
          ? `Reset by ${input.testerName.trim()}`
          : 'QA Lead Reset',
      })
      .commit()

    revalidatePath('/qa')
    return { success: true }
  } catch (error) {
    console.error('[resetAllQATests] Error resetting QA checklist:', error)
    return { success: false, error: 'Failed to reset checklist.' }
  }
}

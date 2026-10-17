'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { sanityWriteClient } from '@/lib/sanity'
import type { QAChecklistDoc, QADefect, QATestItemState } from '@/lib/qa/test-suites'

const QA_DOC_ID = 'qaMasterChecklist'

export async function getQAChecklist(): Promise<QAChecklistDoc> {
  try {
    const doc = await sanityWriteClient.fetch<QAChecklistDoc | null>(
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

      return {
        _id: doc._id,
        _type: doc._type || 'qaChecklist',
        title: doc.title || 'ECCF V1.0 Production Candidate QA Run',
        testItems: normalizedItems,
        defects: Array.isArray(doc.defects) ? doc.defects : [],
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
    }
  }
}

export async function toggleQATestItem(input: {
  testId: string
  checked: boolean
  testerName: string
  notes?: string
}): Promise<{ success: boolean; item?: QATestItemState; error?: string }> {
  try {
    const { testId, checked, testerName, notes } = input
    const cleanTester = testerName?.trim() || 'Anonymous Tester'
    const cleanKey = testId.trim().replace(/-/g, '_')
    const now = new Date().toISOString()

    const itemState: QATestItemState = {
      checked,
      testerName: cleanTester,
      testedAt: now,
      notes: notes?.trim() || '',
    }

    // Ensure document exists first
    await sanityWriteClient.createIfNotExists({
      _id: QA_DOC_ID,
      _type: 'qaChecklist',
      title: 'ECCF V1.0 Production Candidate QA Run',
      testItems: {},
      defects: [],
    })

    await sanityWriteClient
      .patch(QA_DOC_ID)
      .setIfMissing({ testItems: {}, defects: [] })
      .set({
        [`testItems.${cleanKey}`]: itemState,
        updatedAt: now,
        updatedBy: cleanTester,
      })
      .commit()

    revalidatePath('/qa')
    return { success: true, item: itemState }
  } catch (error) {
    console.error('[toggleQATestItem] Error updating test item in Sanity:', error)
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

export async function resetAllQATests(testerName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString()
    await sanityWriteClient
      .patch(QA_DOC_ID)
      .setIfMissing({ testItems: {}, defects: [] })
      .set({
        testItems: {},
        updatedAt: now,
        updatedBy: testerName?.trim() || 'QA Lead',
      })
      .commit()

    revalidatePath('/qa')
    return { success: true }
  } catch (error) {
    console.error('[resetAllQATests] Error resetting QA checklist:', error)
    return { success: false, error: 'Failed to reset checklist.' }
  }
}

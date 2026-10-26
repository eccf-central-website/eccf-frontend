'use server'

import { revalidatePath } from 'next/cache'
import {
  createPrivateDocument,
  sanityWriteClient,
  sanityPrivateClient,
  privateDocumentId,
} from '@/lib/sanity'
import { requirePermission } from '@/lib/dashboard/rbac'
import { getSession } from '@/lib/dashboard/auth'
import type { WelfareLedgerCategory, WelfareLedgerType } from '@/types'

export interface RecordWelfareLedgerInput {
  date: string
  type: WelfareLedgerType
  amount: number
  bankCharge?: number
  description: string
  category?: WelfareLedgerCategory | string
  recipient?: string
  reference?: string
}

/**
 * Record a new Welfare Purse transaction in Sanity.
 *
 * RBAC: Strictly restricted to Welfare Team members, CSGB Executives, and Fellowship Chaplain.
 */
export async function recordWelfareLedgerEntry(formData: RecordWelfareLedgerInput) {
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }

  try {
    requirePermission(session.role, 'welfare:create', session)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  // Validation
  if (!formData.date || !formData.type || !formData.amount || !formData.description?.trim()) {
    return {
      success: false,
      error: 'Missing required fields: Date, Type, Amount, and Description are required.',
    }
  }

  if (formData.amount <= 0) {
    return { success: false, error: 'Amount must be greater than zero.' }
  }

  if (formData.bankCharge !== undefined && formData.bankCharge < 0) {
    return { success: false, error: 'Bank charge cannot be negative.' }
  }

  if (!['Credit', 'Debit'].includes(formData.type)) {
    return { success: false, error: 'Type must be Credit (Inflow) or Debit (Outflow).' }
  }

  // Extract author info
  const workerDoc = (session as { worker?: { _id?: string; fullName?: string } }).worker
  const workerId = workerDoc?._id || session.id
  const loggedByName =
    session.name ||
    workerDoc?.fullName ||
    session.excoPosition ||
    'Welfare Officer'

  const doc: Record<string, unknown> & { _type: string } = {
    _type: 'welfareLedger',
    date: formData.date,
    type: formData.type,
    amount: formData.amount,
    bankCharge: formData.bankCharge || 0,
    description: formData.description.trim(),
    category: formData.category?.trim() || 'Miscellaneous Care',
    recipient: formData.recipient?.trim() || undefined,
    reference: formData.reference?.trim() || undefined,
    loggedByName,
    createdAt: new Date().toISOString(),
  }

  if (workerId && typeof workerId === 'string') {
    doc.loggedBy = {
      _type: 'reference',
      _ref: workerId.replace(/^drafts\./, ''),
      _weak: true,
    }
  }

  try {
    const created = await createPrivateDocument(doc)
    revalidatePath('/dashboard/welfare')
    revalidatePath('/dashboard')
    return { success: true, id: created._id }
  } catch (err) {
    console.error('[recordWelfareLedgerEntry] Failed to record transaction:', err)
    return { success: false, error: 'Failed to record transaction in Welfare Purse ledger.' }
  }
}

/**
 * Delete a Welfare Purse ledger transaction.
 * Strictly verifies _type is 'welfareLedger'.
 */
export async function deleteWelfareLedgerEntry(entryId: string) {
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }

  try {
    requirePermission(session.role, 'welfare:create', session)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  try {
    const targetId = privateDocumentId(entryId)
    const existing = await sanityPrivateClient.fetch<{ _type: string } | null>(
      `*[_id == $id][0]{ _type }`,
      { id: targetId }
    )

    if (!existing || existing._type !== 'welfareLedger') {
      return {
        success: false,
        error: 'Invalid document: only welfareLedger records can be deleted.',
      }
    }

    await sanityWriteClient.delete(targetId)
    revalidatePath('/dashboard/welfare')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error('[deleteWelfareLedgerEntry] Failed to delete entry:', err)
    return { success: false, error: 'Failed to delete Welfare Purse record.' }
  }
}

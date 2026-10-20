'use server'

import { revalidatePath } from 'next/cache'
import { createPrivateDocument, sanityWriteClient, sanityPrivateClient, privateDocumentId } from '@/lib/sanity'
import { requirePermission } from '@/lib/dashboard/rbac'
import { getSession } from '@/lib/dashboard/auth'

export interface RecordFinanceInput {
  transactionDate: string
  type: 'Income' | 'Expense'
  amount: number
  category: string
  description?: string
  flutterwaveRef?: string
}

/**
 * Record a new finance ledger entry as a private draft.
 */
export async function recordFinanceEntry(formData: RecordFinanceInput) {
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }

  try {
    requirePermission(session.role, 'finance:create')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  // Basic validation
  if (!formData.transactionDate || !formData.type || !formData.amount || !formData.category) {
    return { success: false, error: 'Missing required fields: Date, Type, Amount, and Category are required.' }
  }
  if (formData.amount <= 0) {
    return { success: false, error: 'Amount must be greater than zero.' }
  }
  if (!['Income', 'Expense'].includes(formData.type)) {
    return { success: false, error: 'Type must be Income or Expense.' }
  }

  const doc = {
    _type: 'financeLedger',
    transactionDate: formData.transactionDate,
    type: formData.type,
    amount: formData.amount,
    category: formData.category.trim(),
    description: formData.description?.trim() ?? '',
    flutterwaveRef: formData.flutterwaveRef?.trim() ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  try {
    const created = await createPrivateDocument(doc)
    revalidatePath('/dashboard/finance')
    revalidatePath('/dashboard')
    return { success: true, id: created._id }
  } catch (err) {
    console.error('[recordFinanceEntry] Failed to record transaction:', err)
    return { success: false, error: 'Failed to record transaction in database.' }
  }
}

/**
 * Delete a finance ledger entry.
 * Enforces strict _type verification (Fix R5).
 */
export async function deleteFinanceEntry(entryId: string) {
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }

  try {
    requirePermission(session.role, 'finance:create')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  try {
    const targetId = privateDocumentId(entryId)
    const existing = await sanityPrivateClient.fetch<{ _type: string } | null>(
      `*[_id == $id][0]{ _type }`,
      { id: targetId }
    )
    if (!existing || existing._type !== 'financeLedger') {
      return { success: false, error: 'Invalid document: only financeLedger records can be deleted.' }
    }

    await sanityWriteClient.delete(targetId)
    revalidatePath('/dashboard/finance')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error('[deleteFinanceEntry] Failed to delete entry:', err)
    return { success: false, error: 'Failed to delete finance record.' }
  }
}

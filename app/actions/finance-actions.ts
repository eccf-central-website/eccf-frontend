'use server'

import { revalidatePath } from 'next/cache'
import { createPrivateDocument, sanityWriteClient, privateDocumentId } from '@/lib/sanity'
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
  // No session means refused, in every environment. Local testing uses the
  // DASHBOARD_MOCK_AUTH mock session instead of an implicit admin.
  if (!session) {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }
  const role = session.role

  try {
    requirePermission(role, 'finance:create')
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
 */
export async function deleteFinanceEntry(entryId: string) {
  const session = await getSession()
  // No session means refused, in every environment. Local testing uses the
  // DASHBOARD_MOCK_AUTH mock session instead of an implicit admin.
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }
  const role = session.role

  try {
    requirePermission(role, 'finance:create')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  try {
    const targetId = privateDocumentId(entryId)
    // Only ever delete a published financeLedger entry, never another document type.
    const target = typeof targetId === 'string' && targetId
      ? await sanityWriteClient.fetch<{ _type?: string } | null>(
          '*[_id == $id][0]{ _type }',
          { id: targetId },
          { perspective: 'published' }
        )
      : null
    if (target?._type !== 'financeLedger') {
      return { success: false, error: 'Entry not found.' }
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

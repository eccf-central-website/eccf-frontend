// Finance server actions for ECCF dashboard
'use server'

import { revalidatePath } from 'next/cache';
import { sanityWriteClient } from '@/lib/sanity';
import { requirePermission } from '@/lib/dashboard/rbac';

/**
 * Record a new finance ledger entry.
 */
export async function recordFinanceEntry(
  formData: {
    transactionDate: string;
    type: string;
    amount: number;
    category: string;
    description?: string;
    flutterwaveRef?: string;
  },
  session: { role: string; name: string }
) {
  // RBAC guard – allow admins and finance role
  requirePermission(session.role, 'finance');

  // Basic validation
  if (!formData.transactionDate || !formData.type || !formData.amount || !formData.category) {
    throw new Error('Missing required fields: transactionDate, type, amount, category');
  }
  if (formData.amount <= 0) {
    throw new Error('Amount must be positive');
  }
  if (!['Income', 'Expense'].includes(formData.type)) {
    throw new Error('Type must be Income or Expense');
  }

  const doc = {
    _type: 'financeLedger',
    transactionDate: formData.transactionDate,
    type: formData.type,
    amount: formData.amount,
    category: formData.category,
    description: formData.description ?? '',
    flutterwaveRef: formData.flutterwaveRef ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: session.name,
  };

  await sanityWriteClient.create(doc);

  // Revalidate finance dashboard pages
  revalidatePath('/dashboard/finance');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Delete a finance ledger entry. Only admins may delete, and only if no Flutterwave reference exists.
 */
export async function deleteFinanceEntry(
  entryId: string,
  session: { role: string; name: string }
) {
  // Only admins can delete entries
  requirePermission(session.role, 'finance');

  // Fetch the document to check flutterwaveRef
  const doc = await sanityWriteClient.getDocument<{ flutterwaveRef?: string }>(entryId);
  if (doc?.flutterwaveRef) {
    throw new Error('Cannot delete entry with a Flutterwave reference');
  }

  await sanityWriteClient.delete(entryId);

  // Revalidate finance pages
  revalidatePath('/dashboard/finance');
  revalidatePath('/dashboard');
  return { success: true };
}

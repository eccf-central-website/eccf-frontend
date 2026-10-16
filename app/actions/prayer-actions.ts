'use server'

import { revalidatePath } from 'next/cache';
import { sanityWriteClient } from '@/lib/sanity';
import { requirePermission } from '@/lib/dashboard/rbac';

export async function updatePrayerStatus(
  requestId: string,
  status: string,
  notes?: string,
  session?: { role: string; name: string }
) {
  if (!session && process.env.NODE_ENV === 'production') {
    throw new Error('Unauthorized: Authentication required');
  }
  const activeSession = session ?? { role: 'admin', name: 'Admin' };
  // RBAC guard
  requirePermission(activeSession.role, 'prayer');

  const patch = sanityWriteClient.patch(requestId).set({
    status,
    ...(notes !== undefined ? { prayerNotes: notes } : {}),
    updatedAt: new Date().toISOString(),
    updatedBy: activeSession.name,
  });

  await patch.commit();
  // Revalidate the prayer requests page
  revalidatePath('/dashboard/prayer-requests');
  return { success: true };
}

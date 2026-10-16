// Welfare server actions for ECCF dashboard
'use server'

import { revalidatePath } from 'next/cache';
import { sanityWriteClient } from '@/lib/sanity';
import { requirePermission } from '@/lib/dashboard/rbac';

/**
 * Resolve a welfare request — mark as resolved with notes.
 */
export async function resolveWelfareRequest(
  requestId: string,
  resolutionNotes: string,
  session: { role: string; name: string }
) {
  requirePermission(session.role, 'welfare');

  await sanityWriteClient
    .patch(requestId)
    .set({
      status: 'resolved',
      resolutionNotes,
      resolvedBy: session.name,
      resolvedAt: new Date().toISOString(),
    })
    .commit();

  revalidatePath('/dashboard/welfare');
  return { success: true };
}

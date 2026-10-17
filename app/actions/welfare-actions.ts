'use server'

import { revalidatePath } from 'next/cache'
import { patchPrivateDocument } from '@/lib/sanity'
import { requirePermission } from '@/lib/dashboard/rbac'
import { getSession } from '@/lib/dashboard/auth'

/**
 * Resolve a welfare request — mark as Resolved in private draft storage.
 */
export async function resolveWelfareRequest(requestId: string) {
  const session = await getSession()
  if (!session && process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Unauthorized' }
  }
  const role = session?.role ?? 'admin'

  try {
    requirePermission(role, 'welfare:resolve')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  try {
    await patchPrivateDocument(requestId)
      .set({
        status: 'Resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: session?.id ?? 'admin',
      })
      .commit()

    revalidatePath('/dashboard/welfare')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error('[resolveWelfareRequest] Failed to resolve welfare request:', err)
    return { success: false, error: 'Failed to update welfare request. Please try again.' }
  }
}

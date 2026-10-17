'use server'

import { revalidatePath } from 'next/cache'
import { patchPrivateDocument, sanityWriteClient } from '@/lib/sanity'
import { requirePermission } from '@/lib/dashboard/rbac'
import { getSession } from '@/lib/dashboard/auth'

/**
 * Resolve a welfare request — mark as Resolved in private draft storage.
 */
export async function resolveWelfareRequest(requestId: string) {
  const session = await getSession()
  // No session means refused, in every environment. Local testing uses the
  // DASHBOARD_MOCK_AUTH mock session instead of an implicit admin.
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }
  const role = session.role

  try {
    requirePermission(role, 'welfare:resolve')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  try {
    // Only ever patch a published welfareRequest, never another document type.
    const target = typeof requestId === 'string' && requestId
      ? await sanityWriteClient.fetch<{ _type?: string } | null>(
          '*[_id == $id][0]{ _type }',
          { id: requestId },
          { perspective: 'published' }
        )
      : null
    if (target?._type !== 'welfareRequest') {
      return { success: false, error: 'Request not found.' }
    }

    await patchPrivateDocument(requestId)
      .set({
        status: 'Resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: session.id,
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

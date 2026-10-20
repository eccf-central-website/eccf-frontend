'use server'

import { revalidatePath } from 'next/cache'
import { patchPrivateDocument, sanityPrivateClient, privateDocumentId } from '@/lib/sanity'
import { requirePermission } from '@/lib/dashboard/rbac'
import { getSession } from '@/lib/dashboard/auth'

/**
 * Resolve a welfare request — mark as Resolved in private draft storage.
 * Enforces authenticated session and strict _type verification (Fix R5).
 */
export async function resolveWelfareRequest(requestId: string) {
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }

  try {
    requirePermission(session.role, 'welfare:resolve')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  try {
    const targetId = privateDocumentId(requestId)
    const existing = await sanityPrivateClient.fetch<{ _type: string } | null>(
      `*[_id == $id][0]{ _type }`,
      { id: targetId }
    )

    if (!existing || existing._type !== 'welfareRequest') {
      return { success: false, error: 'Invalid document: only welfareRequest documents can be resolved.' }
    }

    await patchPrivateDocument(targetId)
      .set({
        status: 'Resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: session.name || session.id,
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

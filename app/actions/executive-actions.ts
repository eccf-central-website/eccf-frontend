'use server'

import { revalidatePath } from 'next/cache'
import { sanityPrivateClient, patchPrivateDocument } from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'

async function verifyAuth() {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Not authenticated.' }
  }

  const role = session.role as string
  const userRoles = (session as unknown as { roles?: string[] }).roles || []
  const isPresident = Boolean(session.access?.isPresident || role === 'president' || userRoles.includes('president'))
  const isVp = Boolean(session.access?.isVP || role === 'vice_president' || userRoles.includes('vice_president'))
  const isChaplain = Boolean(session.access?.isChaplain || role === 'chaplain' || userRoles.includes('chaplain'))
  const isAdmin = role === 'admin' || userRoles.includes('admin')

  if (!isPresident && !isVp && !isChaplain && !isAdmin) {
    return { ok: false, error: 'You do not have permission to manage executive appointments.' }
  }

  return { ok: true, session }
}

/**
 * Relieve a worker of an appointed executive position.
 * Removes the executive position from the worker's positions array in Sanity.
 */
export async function relieveExecutivePosition(
  workerId: string,
  positionKey: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await verifyAuth()
  if (!auth.ok) {
    return { ok: false, error: auth.error }
  }

  if (!workerId || !positionKey) {
    return { ok: false, error: 'Worker ID and Position Key are required.' }
  }

  try {
    const worker = await sanityPrivateClient.fetch<{
      _id: string
      fullName?: string
      positions?: Array<Record<string, unknown>>
    }>(
      `*[_type == "worker" && _id == $workerId && !(_id in path("drafts.**"))][0]{
        _id,
        fullName,
        positions
      }`,
      { workerId }
    )

    if (!worker) {
      return { ok: false, error: 'Worker record not found.' }
    }

    const currentPositions = worker.positions || []
    const updatedPositions = currentPositions.filter((pos) => (pos._key || pos.key) !== positionKey)
    const hasRemainingPositions = updatedPositions.some((p) => p.status === 'approved')

    const today = new Date().toISOString().slice(0, 10)
    await patchPrivateDocument(workerId)
      .set({
        positions: updatedPositions,
        isExcoApproved: hasRemainingPositions,
      })
      .append('updateLog', [`Relieved from executive role on ${today}`])
      .commit()

    revalidatePath('/dashboard/executives')
    revalidatePath('/dashboard/workers')

    return { ok: true }
  } catch (err) {
    console.error('[relieveExecutivePosition] error:', err)
    return { ok: false, error: 'Failed to relieve executive appointment. Please try again.' }
  }
}

/**
 * Update the rank (lead / assistant) of an executive position.
 */
export async function updateExecutiveRank(
  workerId: string,
  positionKey: string,
  newRank: 'lead' | 'assistant'
): Promise<{ ok: boolean; error?: string }> {
  const auth = await verifyAuth()
  if (!auth.ok) {
    return { ok: false, error: auth.error }
  }

  if (!workerId || !positionKey) {
    return { ok: false, error: 'Worker ID and Position Key are required.' }
  }

  try {
    const worker = await sanityPrivateClient.fetch<{
      _id: string
      positions?: Array<Record<string, unknown>>
    }>(
      `*[_type == "worker" && _id == $workerId && !(_id in path("drafts.**"))][0]{
        _id,
        positions
      }`,
      { workerId }
    )

    if (!worker || !worker.positions) {
      return { ok: false, error: 'Worker record not found.' }
    }

    const updatedPositions = worker.positions.map((pos) => {
      if ((pos._key || pos.key) === positionKey) {
        return { ...pos, rank: newRank }
      }
      return pos
    })

    await patchPrivateDocument(workerId)
      .set({ positions: updatedPositions })
      .commit()

    revalidatePath('/dashboard/executives')
    revalidatePath('/dashboard/workers')

    return { ok: true }
  } catch (err) {
    console.error('[updateExecutiveRank] error:', err)
    return { ok: false, error: 'Failed to update rank.' }
  }
}

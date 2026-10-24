'use server'

/**
 * Executive Position Approval Server Actions — app/actions/executive-approval-actions.ts
 *
 * Implements Phase 4 of Clerk Migration:
 * - Exclusively executable by the Fellowship President (`access.isPresident === true`).
 * - approveExecutivePosition: Approves pending positions, sets decidedBy and decidedAt.
 *   If Ministry Team position, automatically verifies membership in that team.
 * - rejectExecutivePosition: Declines pending positions, sets decidedBy and decidedAt.
 * - Revalidates `/dashboard/executives`, `/dashboard/workers`, `/dashboard`.
 */

import { revalidatePath } from 'next/cache'
import { patchPrivateDocument, sanityPrivateClient } from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'
import { MOCK_WORKERS } from '@/lib/dashboard/mock/data'
import type { ActionResult } from '@/lib/dashboard/action-result'

export async function approveExecutivePosition(
  workerId: string,
  positionKey: string
): Promise<ActionResult<{ workerId: string; positionKey: string; status: 'approved' }>> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' }
  }

  // Enforce access.isPresident
  if (!session.access?.isPresident) {
    return {
      ok: false,
      error: 'Permission denied: Only the Fellowship President has authority to approve executive applications.',
    }
  }

  const approverId: string = String(session.worker?._id || session.id)
  const now = new Date()
  const decidedAt = now.toISOString()
  const today = now.toLocaleDateString('en-CA')

  const isMock =
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && !process.env.DASHBOARD_DATA_SOURCE)

  if (isMock) {
    const worker = MOCK_WORKERS.find((w) => w._id === workerId)
    if (!worker) {
      return { ok: false, error: 'Worker record not found.' }
    }

    const positions = Array.isArray(worker.positions) ? worker.positions : []
    const position = positions.find(
      (p) =>
        p._key === positionKey ||
        `${worker._id}-${p.kind}-${p.office || p.hall || p.teamName || 'pos'}` === positionKey
    )
    if (!position) {
      return { ok: false, error: 'Executive position application not found.' }
    }

    position.status = 'approved'
    position.decidedBy = approverId
    position.decidedAt = decidedAt

    // If Ministry Team position, automatically verify membership in that team
    if (position.kind === 'team') {
      const memberships = Array.isArray(worker.memberships) ? worker.memberships : []
      const existingMem = memberships.find(
        (m) =>
          (position.teamId && m.teamId === position.teamId) ||
          (position.teamKey && m.teamKey === position.teamKey) ||
          (position.teamName && m.teamName === position.teamName)
      )

      if (existingMem) {
        existingMem.status = 'verified'
        existingMem.decidedBy = approverId
        existingMem.decidedAt = decidedAt
      } else {
        memberships.push({
          _key: `mem-${Date.now()}`,
          team: position.team || position.teamName || position.teamId,
          teamId: position.teamId,
          teamKey: position.teamKey,
          teamName: position.teamName,
          status: 'verified',
          decidedBy: approverId,
          decidedAt,
        })
      }
      worker.memberships = memberships
      worker.verificationStatus = 'verified'
      worker.verifiedAt = decidedAt
      worker.verifiedBy = 'Presidential Executive Approval'
    }

    const logMessage = `Executive position (${position.office || position.hall || position.teamName || position.kind}) approved by President on ${today}`
    worker.updatedAt = decidedAt
    worker.updateLog = [...(worker.updateLog || []), logMessage]

    revalidatePath('/dashboard/executives')
    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard')

    return {
      ok: true,
      data: { workerId, positionKey, status: 'approved' },
    }
  }

  // Live Sanity update
  try {
    interface ApprovalPositionItem {
      _key?: string
      kind?: string
      office?: string
      hall?: string
      rank?: string
      status?: string
      teamRef?: string
    }
    interface ApprovalMembershipItem {
      _key?: string
      status?: string
      teamRef?: string
    }
    const worker = await sanityPrivateClient.fetch<{
      _id: string
      fullName: string
      positions?: ApprovalPositionItem[]
      memberships?: ApprovalMembershipItem[]
    }>(
      `*[_type == "worker" && _id == $workerId][0]{
        _id,
        fullName,
        positions[]{
          _key,
          kind,
          office,
          hall,
          rank,
          status,
          "teamRef": team._ref
        },
        memberships[]{
          _key,
          status,
          "teamRef": team._ref
        }
      }`,
      { workerId }
    )

    if (!worker) {
      return { ok: false, error: 'Worker record not found in Sanity.' }
    }

    const targetPos = worker.positions?.find((p) => p._key === positionKey)
    if (!targetPos) {
      return { ok: false, error: 'Target executive position application not found.' }
    }

    let patch = patchPrivateDocument(workerId).set({
      [`positions[_key=="${positionKey}"].status`]: 'approved',
      [`positions[_key=="${positionKey}"].decidedBy`]: {
        _type: 'reference',
        _ref: approverId,
      },
      [`positions[_key=="${positionKey}"].decidedAt`]: decidedAt,
      updatedAt: decidedAt,
    })

    // If the approved position is a Ministry Team position, automatically also verify their membership in that team
    if (targetPos.kind === 'team' && targetPos.teamRef) {
      const existingMem = worker.memberships?.find((m) => m.teamRef === targetPos.teamRef)
      if (existingMem?._key) {
        patch = patch.set({
          [`memberships[_key=="${existingMem._key}"].status`]: 'verified',
          [`memberships[_key=="${existingMem._key}"].decidedBy`]: {
            _type: 'reference',
            _ref: approverId,
          },
          [`memberships[_key=="${existingMem._key}"].decidedAt`]: decidedAt,
        })
      } else {
        const memKey = `mem-${Math.random().toString(36).substring(2, 9)}`
        patch = patch.append('memberships', [
          {
            _key: memKey,
            _type: 'teamMembership',
            team: { _type: 'reference', _ref: targetPos.teamRef },
            status: 'verified',
            decidedBy: { _type: 'reference', _ref: approverId },
            decidedAt,
          },
        ])
      }
    }

    const logMessage = `Executive position (${targetPos.office || targetPos.hall || targetPos.kind}) approved by President on ${today}`
    patch = patch.append('updateLog', [logMessage])

    await patch.commit()

    revalidatePath('/dashboard/executives')
    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard')

    return {
      ok: true,
      data: { workerId, positionKey, status: 'approved' },
    }
  } catch (err) {
    console.error('[approveExecutivePosition] Error:', err)
    return { ok: false, error: 'Failed to approve executive position. Please try again.' }
  }
}

export async function rejectExecutivePosition(
  workerId: string,
  positionKey: string
): Promise<ActionResult<{ workerId: string; positionKey: string; status: 'rejected' }>> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' }
  }

  // Enforce access.isPresident
  if (!session.access?.isPresident) {
    return {
      ok: false,
      error: 'Permission denied: Only the Fellowship President has authority to decline executive applications.',
    }
  }

  const approverId: string = String(session.worker?._id || session.id)
  const now = new Date()
  const decidedAt = now.toISOString()
  const today = now.toLocaleDateString('en-CA')

  const isMock =
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && !process.env.DASHBOARD_DATA_SOURCE)

  if (isMock) {
    const worker = MOCK_WORKERS.find((w) => w._id === workerId)
    if (!worker) {
      return { ok: false, error: 'Worker record not found.' }
    }

    const positions = Array.isArray(worker.positions) ? worker.positions : []
    const position = positions.find(
      (p) =>
        p._key === positionKey ||
        `${worker._id}-${p.kind}-${p.office || p.hall || p.teamName || 'pos'}` === positionKey
    )
    if (!position) {
      return { ok: false, error: 'Executive position application not found.' }
    }

    position.status = 'rejected'
    position.decidedBy = approverId
    position.decidedAt = decidedAt

    const logMessage = `Executive position application declined by President on ${today}`
    worker.updatedAt = decidedAt
    worker.updateLog = [...(worker.updateLog || []), logMessage]

    revalidatePath('/dashboard/executives')
    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard')

    return {
      ok: true,
      data: { workerId, positionKey, status: 'rejected' },
    }
  }

  // Live Sanity update
  try {
    const logMessage = `Executive position application declined by President on ${today}`

    await patchPrivateDocument(workerId)
      .set({
        [`positions[_key=="${positionKey}"].status`]: 'rejected',
        [`positions[_key=="${positionKey}"].decidedBy`]: {
          _type: 'reference',
          _ref: approverId,
        },
        [`positions[_key=="${positionKey}"].decidedAt`]: decidedAt,
        updatedAt: decidedAt,
      })
      .append('updateLog', [logMessage])
      .commit()

    revalidatePath('/dashboard/executives')
    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard')

    return {
      ok: true,
      data: { workerId, positionKey, status: 'rejected' },
    }
  } catch (err) {
    console.error('[rejectExecutivePosition] Error:', err)
    return { ok: false, error: 'Failed to decline executive position. Please try again.' }
  }
}

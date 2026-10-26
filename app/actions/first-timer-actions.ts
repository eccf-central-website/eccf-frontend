'use server'

/**
 * First-Timer Follow-Up Server Actions — app/actions/first-timer-actions.ts
 *
 * Implements:
 * - Marking first-timers as followed up with leader attribution & timestamp.
 * - Recording pastoral follow-up notes / remarks.
 * - Revalidating first-timers roster and overview attention queue in real-time.
 */

import { revalidatePath } from 'next/cache'
import { patchPrivateDocument, sanityPrivateClient, privateDocumentId } from '@/lib/sanity'
import { canAccessSection } from '@/lib/dashboard/rbac'
import { getSession } from '@/lib/dashboard/auth'
import { MOCK_FIRST_TIMERS } from '@/lib/dashboard/mock/data'
import type { ActionResult } from '@/lib/dashboard/action-result'

export interface ToggleFirstTimerFollowUpInput {
  firstTimerId: string
  followedUp: boolean
  notes?: string
}

export async function toggleFirstTimerFollowUpAction(
  input: ToggleFirstTimerFollowUpInput
): Promise<
  ActionResult<{
    firstTimerId: string
    followedUp: boolean
    followedUpAt?: string
    followedUpBy?: string
    followUpNotes?: string
  }>
> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' }
  }

  if (!canAccessSection(session.role, 'firstTimers', session)) {
    return { ok: false, error: 'You do not have permission to manage first-timer follow-ups.' }
  }

  const isMock =
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && !process.env.DASHBOARD_DATA_SOURCE)

  const nowIso = new Date().toISOString()
  const leaderIdentifier = session.name
    ? `${session.name} (${session.excoPosition || session.role})`
    : session.excoPosition || session.role

  if (isMock) {
    const row = MOCK_FIRST_TIMERS.find((r) => r._id === input.firstTimerId)
    if (!row) {
      return { ok: false, error: 'First-timer record not found.' }
    }
    row.followedUp = input.followedUp
    row.followedUpAt = input.followedUp ? nowIso : undefined
    row.followedUpBy = input.followedUp ? leaderIdentifier : undefined
    if (input.notes !== undefined) {
      row.followUpNotes = input.notes.trim() || undefined
    }

    revalidatePath('/dashboard/first-timers')
    revalidatePath('/dashboard')
    return {
      ok: true,
      data: {
        firstTimerId: input.firstTimerId,
        followedUp: input.followedUp,
        followedUpAt: row.followedUpAt,
        followedUpBy: row.followedUpBy,
        followUpNotes: row.followUpNotes,
      },
    }
  }

  try {
    const targetId = privateDocumentId(input.firstTimerId)
    const existing = await sanityPrivateClient.fetch<{ _id: string; _type: string } | null>(
      `*[_id == $id][0]{ _id, _type }`,
      { id: targetId }
    )

    if (!existing || existing._type !== 'firstTimer') {
      return { ok: false, error: 'Invalid first-timer record.' }
    }

    const patchData: Record<string, unknown> = {
      followedUp: input.followedUp,
      followedUpAt: input.followedUp ? nowIso : null,
      followedUpBy: input.followedUp ? leaderIdentifier : null,
    }

    if (input.notes !== undefined) {
      patchData.followUpNotes = input.notes.trim() || null
    }

    await patchPrivateDocument(targetId)
      .set(patchData)
      .commit()

    revalidatePath('/dashboard/first-timers')
    revalidatePath('/dashboard')

    return {
      ok: true,
      data: {
        firstTimerId: input.firstTimerId,
        followedUp: input.followedUp,
        followedUpAt: input.followedUp ? nowIso : undefined,
        followedUpBy: input.followedUp ? leaderIdentifier : undefined,
        followUpNotes: input.notes?.trim() || undefined,
      },
    }
  } catch (err) {
    console.error('[toggleFirstTimerFollowUpAction] Error:', err)
    return { ok: false, error: 'Failed to update follow-up status. Please try again.' }
  }
}

/**
 * Attendance Server Actions — app/actions/attendance-actions.ts
 *
 * Implements meeting attendance creation & worker tick-off ledger records.
 * - RBAC Layer 2: re-checks 'attendance:create' permission on every invocation
 * - Automatically links loggedBy to the current authenticated Exco member
 * - Enforces team scoping: team leads can only log for their assigned team
 */

'use server'

import { revalidatePath } from 'next/cache'
import { sanityWriteClient } from '@/lib/sanity'
import { authorize } from '@/lib/dashboard/auth'
import type { ActionResult } from '@/lib/dashboard/action-result'
import { MOCK_ATTENDANCE } from '@/lib/dashboard/mock/data'

export interface RecordAttendanceInput {
  date: string // YYYY-MM-DD
  serviceType:
    | 'Sunday Service'
    | 'Wednesday Bible Study'
    | 'Team Meeting'
    | 'Exco Meeting'
    | 'Special Programme'
  meetingTitle?: string
  teamName?: string
  attendeeIds: string[]
  extraCount?: number
}

async function resolveTeamReference(
  teamName: string
): Promise<{ _type: 'reference'; _ref: string } | null> {
  const normalized = teamName.trim()
  if (!normalized || normalized === 'General' || normalized === 'Exco') return null

  const existingTeam = await sanityWriteClient.fetch<{ _id: string; name: string }>(
    `*[_type == "teamUnit" && (lower(name) == lower($name) || name match $name)][0]{ _id, name }`,
    { name: normalized }
  )

  if (existingTeam?._id) {
    return { _type: 'reference', _ref: existingTeam._id }
  }

  // Create teamUnit if missing
  const newTeam = await sanityWriteClient.create({
    _type: 'teamUnit',
    name: normalized,
    description: `${normalized} operational team of ECCF.`,
    order: 10,
  })

  return { _type: 'reference', _ref: newTeam._id }
}

export async function recordAttendanceAction(
  input: RecordAttendanceInput
): Promise<ActionResult<{ id: string }>> {
  // 1. Authorize user session & permissions (RBAC Layer 2)
  const auth = await authorize('attendance:create')
  if (!auth.ok) {
    return { ok: false, error: auth.error }
  }

  // 2. Validate input
  const { date, serviceType, meetingTitle, attendeeIds, extraCount = 0 } = input
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: 'Please provide a valid date (YYYY-MM-DD).' }
  }

  if (!serviceType) {
    return { ok: false, error: 'Please select a service or meeting type.' }
  }

  // Enforce team scoping: team leads always record for their own operational team
  const effectiveTeam =
    auth.session.role === 'team_lead'
      ? auth.session.team
      : input.teamName || (serviceType === 'Team Meeting' ? auth.session.team : undefined)

  const sanitizedExtra = Math.max(0, Number(extraCount) || 0)
  const totalCount = attendeeIds.length + sanitizedExtra

  if (totalCount === 0) {
    return {
      ok: false,
      error: 'Cannot record empty attendance. Please tick at least one attendee or add guest headcount.',
    }
  }

  // 3. Mock data path (for development without active Sanity write token)
  const isMock =
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && process.env.DASHBOARD_MOCK_AUTH === '1')

  if (isMock) {
    const mockId = `mock-att-${Date.now()}`
    MOCK_ATTENDANCE.unshift({
      _id: mockId,
      date,
      serviceType,
      meetingTitle: meetingTitle?.trim() || undefined,
      teamName: effectiveTeam,
      totalCount,
      attendeeCount: attendeeIds.length,
      loggedBy: {
        _id: auth.session.id,
        fullName: 'Logged Exco Coordinator',
      },
    })

    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard')
    return { ok: true, data: { id: mockId } }
  }

  // 4. Sanity database write
  try {
    let teamRef: { _type: 'reference'; _ref: string } | null = null
    if (effectiveTeam) {
      teamRef = await resolveTeamReference(effectiveTeam)
    }

    const doc = await sanityWriteClient.create({
      _type: 'attendanceLedger',
      date,
      serviceType,
      meetingTitle: meetingTitle?.trim() || undefined,
      team: teamRef ? { _type: 'reference', _ref: teamRef._ref } : undefined,
      totalCount,
      attendees: attendeeIds.map((id) => ({
        _type: 'reference',
        _ref: id,
        _key: id,
      })),
      loggedBy: {
        _type: 'reference',
        _ref: auth.session.id,
      },
    })

    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard')

    return { ok: true, data: { id: doc._id } }
  } catch (err) {
    console.error('Failed to create attendance ledger document:', err)
    return {
      ok: false,
      error: 'Failed to save attendance record. Please try again or contact the administrator.',
    }
  }
}

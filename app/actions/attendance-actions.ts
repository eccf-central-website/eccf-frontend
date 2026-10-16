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
import { createPrivateDocument, sanityClient, sanityPrivateClient } from '@/lib/sanity'
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

  const existingTeam = await sanityClient.fetch<{ _id: string; name: string } | null>(
    `*[_type == "teamUnit" && lower(name) == lower($name)][0]{ _id, name }`,
    { name: normalized }
  )

  if (existingTeam?._id) {
    return { _type: 'reference', _ref: existingTeam._id }
  }

  return null
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

  if (!Array.isArray(attendeeIds) || attendeeIds.length > 500 || attendeeIds.some((id) => typeof id !== 'string' || id.length > 128)) {
    return { ok: false, error: 'The attendee list is invalid.' }
  }
  const uniqueAttendeeIds = Array.from(new Set(attendeeIds))

  // Enforce team scoping: team leads always record for their own operational team
  const effectiveTeam =
    auth.session.role === 'team_lead'
      ? auth.session.team
      : input.teamName || (serviceType === 'Team Meeting' ? auth.session.team : undefined)

  const sanitizedExtra = Math.max(0, Number(extraCount) || 0)
  const totalCount = uniqueAttendeeIds.length + sanitizedExtra

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
      attendeeCount: uniqueAttendeeIds.length,
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
    const attendees = uniqueAttendeeIds.length
      ? await sanityPrivateClient.fetch<Array<{ _id: string; hall?: string; team?: string; teams?: string[] }>>(
          `*[_type == "worker" && _id in $ids]{
            _id,
            hall,
            "team": coalesce(team->name, team),
            "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)])
          }`,
          { ids: uniqueAttendeeIds }
        )
      : []

    if (attendees.length !== uniqueAttendeeIds.length) {
      return { ok: false, error: 'Some selected workers could not be verified. Refresh the roster and try again.' }
    }
    if (
      auth.session.role === 'team_lead' &&
      attendees.some((worker) => worker.team !== auth.session.team && !worker.teams?.includes(auth.session.team))
    ) {
      return { ok: false, error: 'You can record attendance only for workers in your assigned team.' }
    }
    if (auth.session.role === 'hall_rep' && attendees.some((worker) => worker.hall !== auth.session.hall)) {
      return { ok: false, error: 'You can record attendance only for workers in your assigned hall.' }
    }

    let teamRef: { _type: 'reference'; _ref: string } | null = null
    if (effectiveTeam) {
      teamRef = await resolveTeamReference(effectiveTeam)
      if (!teamRef) {
        return { ok: false, error: 'The selected team is not available. Refresh the page and try again.' }
      }
    }

    const doc = await createPrivateDocument({
      _type: 'attendanceLedger',
      date,
      serviceType,
      meetingTitle: meetingTitle?.trim() || undefined,
      team: teamRef ? { _type: 'reference', _ref: teamRef._ref } : undefined,
      totalCount,
      attendees: uniqueAttendeeIds.map((id) => ({
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

    return { ok: true, data: { id: doc._id.replace(/^drafts\./, '') } }
  } catch (err) {
    console.error('Failed to create attendance ledger document:', err)
    return {
      ok: false,
      error: 'Failed to save attendance record. Please try again or contact the administrator.',
    }
  }
}

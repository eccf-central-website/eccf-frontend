/**
 * Attendance Server Actions — app/actions/attendance-actions.ts
 *
 * Implements Dual Attendance System:
 * 1. Team Meeting Worker Attendance: For Team Leaders to track their workers at unit meetings/rehearsals.
 * 2. General Service Headcount: Fast, frictionless headcount logger strictly for Ushering Team & Admins.
 *
 * - RBAC Layer 2: re-checks 'attendance:create' permission on every invocation
 * - Enforces Ushering / Admin role restriction for General Service Headcounts
 * - Enforces team scoping: team leads can only log worker attendance for their assigned team
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createPrivateDocument, sanityClient, sanityPrivateClient } from '@/lib/sanity'
import { authorize } from '@/lib/dashboard/auth'
import { isUsheringTeam } from '@/lib/dashboard/rbac'
import type { ActionResult } from '@/lib/dashboard/action-result'
import { MOCK_ATTENDANCE } from '@/lib/dashboard/mock/data'
import { GENERAL_SERVICE_TYPES, type GeneralServiceType, type ServiceType } from '@/lib/dashboard/attendance-constants'

export interface RecordTeamAttendanceInput {
  date: string // YYYY-MM-DD
  meetingTitle?: string
  teamName?: string
  attendeeIds: string[]
  extraCount?: number
  notes?: string
}

export interface RecordGeneralHeadcountInput {
  date: string // YYYY-MM-DD
  serviceType: GeneralServiceType
  meetingTitle?: string
  totalCount: number
  menCount?: number
  womenCount?: number
  childrenCount?: number
  firstTimersCount?: number
  notes?: string
}

export interface RecordAttendanceInput {
  date: string // YYYY-MM-DD
  serviceType: ServiceType
  meetingTitle?: string
  teamName?: string
  attendeeIds?: string[]
  extraCount?: number
  totalCount?: number
  menCount?: number
  womenCount?: number
  childrenCount?: number
  firstTimersCount?: number
  notes?: string
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

function isMockEnvironment(): boolean {
  return (
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && process.env.DASHBOARD_MOCK_AUTH === '1')
  )
}

/**
 * 1. Record Team Meeting Worker Attendance
 * Used by Team Leaders (Choir, Drama, Outreach, Media, Welfare, Ushering, etc.)
 * Strictly tracks worker attendance at rehearsals, committee gatherings, and unit meetings.
 */
export async function recordTeamAttendanceAction(
  input: RecordTeamAttendanceInput
): Promise<ActionResult<{ id: string }>> {
  // 1. Authorize user session & permissions
  const auth = await authorize('attendance:create')
  if (!auth.ok) {
    return { ok: false, error: auth.error }
  }

  // 2. Validate input
  const { date, meetingTitle, attendeeIds, extraCount = 0, notes } = input
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: 'Please provide a valid meeting date (YYYY-MM-DD).' }
  }

  if (!Array.isArray(attendeeIds) || attendeeIds.length > 500 || attendeeIds.some((id) => typeof id !== 'string' || id.length > 128)) {
    return { ok: false, error: 'The worker attendee list is invalid.' }
  }
  const uniqueAttendeeIds = Array.from(new Set(attendeeIds))

  // Enforce team scoping: team leads always record for their own operational team
  const effectiveTeam =
    auth.session.role === 'team_lead'
      ? (auth.session.leadingTeam || auth.session.team)
      : input.teamName || auth.session.team

  const sanitizedExtra = Math.max(0, Number(extraCount) || 0)
  const totalCount = uniqueAttendeeIds.length + sanitizedExtra

  if (totalCount === 0) {
    return {
      ok: false,
      error: 'Cannot record empty meeting attendance. Please tick at least one worker or add guest headcount.',
    }
  }

  // 3. Mock data path
  if (isMockEnvironment()) {
    const mockId = `mock-att-team-${Date.now()}`
    MOCK_ATTENDANCE.unshift({
      _id: mockId,
      date,
      serviceType: 'Team Meeting',
      meetingTitle: meetingTitle?.trim() || undefined,
      teamName: effectiveTeam,
      totalCount,
      attendeeCount: uniqueAttendeeIds.length,
      notes: notes?.trim() || undefined,
      loggedBy: {
        _id: auth.session.id,
        fullName: auth.session.name || 'Team Leader',
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
      serviceType: 'Team Meeting',
      meetingTitle: meetingTitle?.trim() || undefined,
      team: teamRef ? { _type: 'reference', _ref: teamRef._ref } : undefined,
      totalCount,
      notes: notes?.trim() || undefined,
      attendees: uniqueAttendeeIds.map((id) => ({
        _type: 'reference',
        _ref: id,
        _key: id,
      })),
      loggedBy: {
        _type: 'reference',
        _ref: auth.session.id.replace(/^drafts\./, ''),
      },
      loggedByName: auth.session.name || 'Fellowship Admin',
    })

    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard')

    return { ok: true, data: { id: doc._id.replace(/^drafts\./, '') } }
  } catch (err) {
    console.error('Failed to create team attendance ledger document:', err)
    return {
      ok: false,
      error: 'Failed to save team attendance record. Please try again or contact the administrator.',
    }
  }
}

/**
 * 2. Record General Service Headcount
 * Strictly for the Ushering Team and Admins!
 * Logs aggregate attendance for Sunday Service, Wednesday Bible Study, Academic Service, etc.
 * No worker names or ticking required — fast, effortless numeric count with optional breakdown.
 */
export async function recordGeneralHeadcountAction(
  input: RecordGeneralHeadcountInput
): Promise<ActionResult<{ id: string }>> {
  // 1. Authorize user session & permissions
  const auth = await authorize('attendance:create')
  if (!auth.ok) {
    return { ok: false, error: auth.error }
  }

  // 2. Strict Role Context check: Ushering Team or CSGB Admin only
  const hasUsheringAccess = auth.session.role === 'admin' || isUsheringTeam(auth.session)
  if (!hasUsheringAccess) {
    return {
      ok: false,
      error: 'General service headcount logging is restricted to the Ushering Team and Admins.',
    }
  }

  // 3. Validate input
  const { date, serviceType, meetingTitle, totalCount, menCount, womenCount, childrenCount, firstTimersCount, notes } = input
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: 'Please choose a valid service date (YYYY-MM-DD).' }
  }

  if (!serviceType || !GENERAL_SERVICE_TYPES.includes(serviceType)) {
    return { ok: false, error: 'Please select a valid service type (e.g. Sunday Service, Wednesday Bible Study).' }
  }

  const sanitizedTotal = Number(totalCount)
  if (!sanitizedTotal || isNaN(sanitizedTotal) || sanitizedTotal <= 0) {
    return { ok: false, error: 'Please enter a valid headcount number greater than 0.' }
  }

  const sanitizedMen = menCount !== undefined && menCount !== null ? Math.max(0, Number(menCount)) : undefined
  const sanitizedWomen = womenCount !== undefined && womenCount !== null ? Math.max(0, Number(womenCount)) : undefined
  const sanitizedChildren = childrenCount !== undefined && childrenCount !== null ? Math.max(0, Number(childrenCount)) : undefined
  const sanitizedFirstTimers = firstTimersCount !== undefined && firstTimersCount !== null ? Math.max(0, Number(firstTimersCount)) : undefined

  // 4. Mock data path
  if (isMockEnvironment()) {
    const mockId = `mock-att-headcount-${Date.now()}`
    MOCK_ATTENDANCE.unshift({
      _id: mockId,
      date,
      serviceType,
      meetingTitle: meetingTitle?.trim() || undefined,
      totalCount: sanitizedTotal,
      attendeeCount: 0,
      menCount: sanitizedMen,
      womenCount: sanitizedWomen,
      childrenCount: sanitizedChildren,
      firstTimersCount: sanitizedFirstTimers,
      notes: notes?.trim() || undefined,
      loggedBy: {
        _id: auth.session.id,
        fullName: auth.session.name || 'Fellowship Admin',
      },
    })

    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard')
    return { ok: true, data: { id: mockId } }
  }

  // 5. Sanity database write
  try {
    const doc = await createPrivateDocument({
      _type: 'attendanceLedger',
      date,
      serviceType,
      meetingTitle: meetingTitle?.trim() || undefined,
      totalCount: sanitizedTotal,
      menCount: sanitizedMen,
      womenCount: sanitizedWomen,
      childrenCount: sanitizedChildren,
      firstTimersCount: sanitizedFirstTimers,
      notes: notes?.trim() || undefined,
      loggedBy: {
        _type: 'reference',
        _ref: auth.session.id.replace(/^drafts\./, ''),
      },
      loggedByName: auth.session.name || 'Fellowship Admin',
    })

    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard')

    return { ok: true, data: { id: doc._id.replace(/^drafts\./, '') } }
  } catch (err) {
    console.error('Failed to create general headcount ledger document:', err)
    return {
      ok: false,
      error: 'Failed to save general service headcount record. Please try again or contact the administrator.',
    }
  }
}

/**
 * Backward compatibility: legacy recordAttendanceAction
 */
export async function recordAttendanceAction(
  input: RecordAttendanceInput
): Promise<ActionResult<{ id: string }>> {
  if (input.serviceType === 'Team Meeting') {
    return recordTeamAttendanceAction({
      date: input.date,
      meetingTitle: input.meetingTitle,
      teamName: input.teamName,
      attendeeIds: input.attendeeIds || [],
      extraCount: input.extraCount,
      notes: input.notes,
    })
  }

  return recordGeneralHeadcountAction({
    date: input.date,
    serviceType: input.serviceType as GeneralServiceType,
    meetingTitle: input.meetingTitle,
    totalCount: input.totalCount || (input.attendeeIds?.length || 0) + (input.extraCount || 0),
    menCount: input.menCount,
    womenCount: input.womenCount,
    childrenCount: input.childrenCount,
    firstTimersCount: input.firstTimersCount,
    notes: input.notes,
  })
}

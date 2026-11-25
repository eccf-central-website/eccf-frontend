'use server'

/**
 * Meeting Minutes Server Actions — app/actions/meeting-minutes-actions.ts
 *
 * Implements the CSGB Secretariat & EXCO Meeting Minutes mutations:
 * - Strict RBAC: EVERY mutation requires an authenticated session AND `isCSGBMember(session)`.
 *   Non-CSGB EXCOs have strictly read-only access to minutes posted for their view.
 * - Supports both mock mode (`MOCK_MEETING_MINUTES`) and Sanity write client.
 * - Automatically revalidates `/dashboard/minutes` and `/dashboard` layout.
 */

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { getSession, type DashboardSession } from '@/lib/dashboard/auth'
import type { ActionResult } from '@/lib/dashboard/action-result'
import { lagosDate } from '@/lib/dashboard/dates'
import { MOCK_MEETING_MINUTES } from '@/lib/dashboard/mock/data'
import { isCSGBMember } from '@/lib/dashboard/rbac'
import { sanityPrivateClient, sanityWriteClient } from '@/lib/sanity'
import type {
  MeetingMinute,
  MeetingMinuteActionItem,
  MeetingMinuteType,
} from '@/types'

const ALLOWED_MEETING_TYPES: readonly MeetingMinuteType[] = [
  'CSGB',
  'General EXCO',
  'Emergency',
  'Retreat & Planning',
  'Committee',
]

export interface MeetingMinuteInput {
  title: string
  meetingDate: string
  meetingType: MeetingMinuteType | string
  folder?: string
  venue?: string
  startTime?: string
  endTime?: string
  chairperson?: string
  recorderName?: string
  attendees?: string[]
  absentees?: string[]
  agenda?: string[]
  summary?: string
  body?: string
  decisions?: string[]
  actionItems?: MeetingMinuteActionItem[]
  tags?: string[]
  isPinned?: boolean
  isPostedToExcos?: boolean
  archived?: boolean
}

export interface UpdateMeetingMinuteInput extends MeetingMinuteInput {
  _id: string
}

function isMockMode(): boolean {
  const configured = process.env.DASHBOARD_DATA_SOURCE
  if (configured === 'mock') return true
  if (configured === 'sanity') return false
  return process.env.NODE_ENV !== 'production'
}

function cleanId(id: string): string {
  return id.replace(/^drafts\./, '').trim()
}

function revalidateMinutesRoutes() {
  revalidatePath('/dashboard/minutes')
  revalidatePath('/dashboard', 'layout')
}

async function requireCSGBMutation(): Promise<
  | { ok: true; session: DashboardSession; actorName: string }
  | { ok: false; error: string }
> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Unauthorized: Authentication required.' }
  }
  if (!isCSGBMember(session)) {
    return { ok: false, error: 'Only CSGB members can manage meeting minutes.' }
  }

  const workerName =
    typeof session.worker?.fullName === 'string' ? session.worker.fullName.trim() : ''
  const actorName =
    session.name?.trim() ||
    workerName ||
    session.excoPosition?.trim() ||
    'CSGB Executive'

  return { ok: true, session, actorName }
}

function sanitizeStringArray(values?: string[]): string[] {
  if (!Array.isArray(values)) return []
  return values.map((v) => String(v || '').trim()).filter(Boolean)
}

function sanitizeActionItems(items?: MeetingMinuteActionItem[]): MeetingMinuteActionItem[] {
  if (!Array.isArray(items)) return []
  return items
    .filter((item) => Boolean(item && typeof item.task === 'string' && item.task.trim().length > 0))
    .map((item) => ({
      _key: item._key?.trim() || randomUUID().slice(0, 8),
      task: item.task.trim(),
      owner: item.owner?.trim() || undefined,
      dueDate:
        item.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate.trim())
          ? item.dueDate.trim()
          : undefined,
      status: item.status === 'done' ? 'done' : 'open',
    }))
}

function normalizeMeetingType(value?: string): MeetingMinuteType {
  const trimmed = (value || '').trim()
  const found = ALLOWED_MEETING_TYPES.find((t) => t.toLowerCase() === trimmed.toLowerCase())
  return found ?? 'CSGB'
}

function validateMeetingMinuteInput(
  input: MeetingMinuteInput
): { ok: true; date: string; meetingType: MeetingMinuteType } | { ok: false; error: string } {
  const title = input.title?.trim() || ''
  if (title.length < 3 || title.length > 180) {
    return {
      ok: false,
      error: 'Meeting title must be between 3 and 180 characters.',
    }
  }

  const rawDate = (input.meetingDate || '').trim() || lagosDate()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return {
      ok: false,
      error: 'Meeting date must be a valid YYYY-MM-DD date.',
    }
  }

  const meetingType = normalizeMeetingType(input.meetingType)
  return { ok: true, date: rawDate, meetingType }
}

function normalizeMinuteRecord(doc: MeetingMinute): MeetingMinute {
  return {
    ...doc,
    _type: 'meetingMinute',
    attendees: Array.isArray(doc.attendees) ? doc.attendees : [],
    absentees: Array.isArray(doc.absentees) ? doc.absentees : [],
    agenda: Array.isArray(doc.agenda) ? doc.agenda : [],
    decisions: Array.isArray(doc.decisions) ? doc.decisions : [],
    actionItems: Array.isArray(doc.actionItems) ? doc.actionItems : [],
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    isPinned: Boolean(doc.isPinned),
    isPostedToExcos: Boolean(doc.isPostedToExcos),
    archived: Boolean(doc.archived),
  }
}

async function fetchExistingSanityMinute(id: string): Promise<MeetingMinute | null> {
  const targetId = cleanId(id)
  if (!targetId) return null
  const existing = await sanityPrivateClient.fetch<MeetingMinute | null>(
    `*[_id == $id || _id == $draftId][0]`,
    { id: targetId, draftId: `drafts.${targetId}` }
  )
  if (!existing || existing._type !== 'meetingMinute') return null
  return existing
}

/**
 * Create a new meeting minute (CSGB draft by default, or posted for EXCO view).
 */
export async function createMeetingMinute(
  input: MeetingMinuteInput
): Promise<ActionResult<MeetingMinute>> {
  const auth = await requireCSGBMutation()
  if (!auth.ok) return auth

  const validation = validateMeetingMinuteInput(input)
  if (!validation.ok) return validation

  const now = new Date().toISOString()
  const isPosted = Boolean(input.isPostedToExcos)
  const isArchived = Boolean(input.archived)
  const isPinned = isArchived ? false : Boolean(input.isPinned)

  const docFields: Omit<MeetingMinute, '_id'> & { _type: 'meetingMinute' } = {
    _type: 'meetingMinute',
    title: input.title.trim(),
    meetingDate: validation.date,
    meetingType: validation.meetingType,
    folder: input.folder?.trim() || '2026/2027 Session',
    venue: input.venue?.trim() || undefined,
    startTime: input.startTime?.trim() || undefined,
    endTime: input.endTime?.trim() || undefined,
    chairperson: input.chairperson?.trim() || undefined,
    recorderName: input.recorderName?.trim() || auth.actorName,
    attendees: sanitizeStringArray(input.attendees),
    absentees: sanitizeStringArray(input.absentees),
    agenda: sanitizeStringArray(input.agenda),
    summary: input.summary?.trim() || undefined,
    body: input.body?.trim() || undefined,
    decisions: sanitizeStringArray(input.decisions),
    actionItems: sanitizeActionItems(input.actionItems),
    tags: sanitizeStringArray(input.tags),
    isPinned,
    isPostedToExcos: isPosted,
    ...(isPosted ? { postedAt: now, postedBy: auth.actorName } : {}),
    archived: isArchived,
    createdById: auth.session.id,
    createdByName: auth.actorName,
    createdAt: now,
    updatedByName: auth.actorName,
    updatedAt: now,
  }

  if (isMockMode()) {
    const created: MeetingMinute = normalizeMinuteRecord({
      _id: `mock-min-${randomUUID().slice(0, 8)}`,
      ...docFields,
    })
    MOCK_MEETING_MINUTES.unshift(created)
    revalidateMinutesRoutes()
    return { ok: true, data: structuredClone(created) }
  }

  try {
    const created = await sanityWriteClient.create(docFields)
    revalidateMinutesRoutes()
    return {
      ok: true,
      data: normalizeMinuteRecord(created as unknown as MeetingMinute),
    }
  } catch (err) {
    console.error('[createMeetingMinute] Sanity create error:', err)
    return {
      ok: false,
      error: 'Failed to save meeting minute. Please try again.',
    }
  }
}

/**
 * Update an existing meeting minute.
 */
export async function updateMeetingMinute(
  input: UpdateMeetingMinuteInput
): Promise<ActionResult<MeetingMinute>> {
  const auth = await requireCSGBMutation()
  if (!auth.ok) return auth

  if (!input._id?.trim()) {
    return { ok: false, error: 'Meeting minute ID is required.' }
  }

  const validation = validateMeetingMinuteInput(input)
  if (!validation.ok) return validation

  const targetId = cleanId(input._id)
  const now = new Date().toISOString()

  if (isMockMode()) {
    const idx = MOCK_MEETING_MINUTES.findIndex((m) => cleanId(m._id) === targetId)
    if (idx < 0) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }
    const existing = MOCK_MEETING_MINUTES[idx]
    const nextPosted = Boolean(input.isPostedToExcos)
    const nextArchived = input.archived !== undefined ? Boolean(input.archived) : Boolean(existing.archived)
    const nextPinned = nextArchived ? false : Boolean(input.isPinned)

    const updated: MeetingMinute = normalizeMinuteRecord({
      ...existing,
      title: input.title.trim(),
      meetingDate: validation.date,
      meetingType: validation.meetingType,
      folder: input.folder?.trim() || '2026/2027 Session',
      venue: input.venue?.trim() || undefined,
      startTime: input.startTime?.trim() || undefined,
      endTime: input.endTime?.trim() || undefined,
      chairperson: input.chairperson?.trim() || undefined,
      recorderName: input.recorderName?.trim() || existing.recorderName || auth.actorName,
      attendees: sanitizeStringArray(input.attendees),
      absentees: sanitizeStringArray(input.absentees),
      agenda: sanitizeStringArray(input.agenda),
      summary: input.summary?.trim() || undefined,
      body: input.body?.trim() || undefined,
      decisions: sanitizeStringArray(input.decisions),
      actionItems: sanitizeActionItems(input.actionItems),
      tags: sanitizeStringArray(input.tags),
      isPinned: nextPinned,
      isPostedToExcos: nextPosted,
      postedAt: nextPosted ? existing.postedAt || now : undefined,
      postedBy: nextPosted ? existing.postedBy || auth.actorName : undefined,
      archived: nextArchived,
      updatedByName: auth.actorName,
      updatedAt: now,
    })

    MOCK_MEETING_MINUTES[idx] = updated
    revalidateMinutesRoutes()
    return { ok: true, data: structuredClone(updated) }
  }

  try {
    const existing = await fetchExistingSanityMinute(targetId)
    if (!existing) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }

    const nextPosted = Boolean(input.isPostedToExcos)
    const nextArchived =
      input.archived !== undefined ? Boolean(input.archived) : Boolean(existing.archived)
    const nextPinned = nextArchived ? false : Boolean(input.isPinned)

    const setData: Record<string, unknown> = {
      title: input.title.trim(),
      meetingDate: validation.date,
      meetingType: validation.meetingType,
      folder: input.folder?.trim() || '2026/2027 Session',
      venue: input.venue?.trim() || '',
      startTime: input.startTime?.trim() || '',
      endTime: input.endTime?.trim() || '',
      chairperson: input.chairperson?.trim() || '',
      recorderName: input.recorderName?.trim() || existing.recorderName || auth.actorName,
      attendees: sanitizeStringArray(input.attendees),
      absentees: sanitizeStringArray(input.absentees),
      agenda: sanitizeStringArray(input.agenda),
      summary: input.summary?.trim() || '',
      body: input.body?.trim() || '',
      decisions: sanitizeStringArray(input.decisions),
      actionItems: sanitizeActionItems(input.actionItems),
      tags: sanitizeStringArray(input.tags),
      isPinned: nextPinned,
      isPostedToExcos: nextPosted,
      archived: nextArchived,
      updatedByName: auth.actorName,
      updatedAt: now,
    }

    let patch = sanityWriteClient.patch(cleanId(existing._id))
    if (nextPosted) {
      setData.postedAt = existing.postedAt || now
      setData.postedBy = existing.postedBy || auth.actorName
      patch = patch.set(setData)
    } else {
      patch = patch.set(setData).unset(['postedAt', 'postedBy'])
    }

    const committed = await patch.commit()
    revalidateMinutesRoutes()
    return {
      ok: true,
      data: normalizeMinuteRecord(committed as unknown as MeetingMinute),
    }
  } catch (err) {
    console.error('[updateMeetingMinute] Sanity update error:', err)
    return {
      ok: false,
      error: 'Failed to update meeting minute. Please try again.',
    }
  }
}

/**
 * Post a minute for read-only EXCO view, or return it to a CSGB-only draft.
 */
export async function toggleMeetingMinuteVisibility(
  minuteId: string,
  nextPosted?: boolean
): Promise<ActionResult<MeetingMinute>> {
  const auth = await requireCSGBMutation()
  if (!auth.ok) return auth

  const targetId = cleanId(minuteId || '')
  if (!targetId) {
    return { ok: false, error: 'Meeting minute ID is required.' }
  }

  const now = new Date().toISOString()

  if (isMockMode()) {
    const idx = MOCK_MEETING_MINUTES.findIndex((m) => cleanId(m._id) === targetId)
    if (idx < 0) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }
    const existing = MOCK_MEETING_MINUTES[idx]
    const shouldPost =
      typeof nextPosted === 'boolean' ? nextPosted : !Boolean(existing.isPostedToExcos)

    const updated: MeetingMinute = normalizeMinuteRecord({
      ...existing,
      isPostedToExcos: shouldPost,
      postedAt: shouldPost ? now : undefined,
      postedBy: shouldPost ? auth.actorName : undefined,
      updatedByName: auth.actorName,
      updatedAt: now,
    })
    MOCK_MEETING_MINUTES[idx] = updated
    revalidateMinutesRoutes()
    return { ok: true, data: structuredClone(updated) }
  }

  try {
    const existing = await fetchExistingSanityMinute(targetId)
    if (!existing) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }
    const shouldPost =
      typeof nextPosted === 'boolean' ? nextPosted : !Boolean(existing.isPostedToExcos)

    const patch = shouldPost
      ? sanityWriteClient.patch(cleanId(existing._id)).set({
          isPostedToExcos: true,
          postedAt: now,
          postedBy: auth.actorName,
          updatedByName: auth.actorName,
          updatedAt: now,
        })
      : sanityWriteClient
          .patch(cleanId(existing._id))
          .set({
            isPostedToExcos: false,
            updatedByName: auth.actorName,
            updatedAt: now,
          })
          .unset(['postedAt', 'postedBy'])

    const committed = await patch.commit()
    revalidateMinutesRoutes()
    return {
      ok: true,
      data: normalizeMinuteRecord(committed as unknown as MeetingMinute),
    }
  } catch (err) {
    console.error('[toggleMeetingMinuteVisibility] Sanity update error:', err)
    return {
      ok: false,
      error: 'Failed to update visibility state. Please try again.',
    }
  }
}

/**
 * Pin or unpin a meeting minute to the top of the list.
 */
export async function toggleMeetingMinutePin(
  minuteId: string,
  nextPinned?: boolean
): Promise<ActionResult<MeetingMinute>> {
  const auth = await requireCSGBMutation()
  if (!auth.ok) return auth

  const targetId = cleanId(minuteId || '')
  if (!targetId) {
    return { ok: false, error: 'Meeting minute ID is required.' }
  }

  const now = new Date().toISOString()

  if (isMockMode()) {
    const idx = MOCK_MEETING_MINUTES.findIndex((m) => cleanId(m._id) === targetId)
    if (idx < 0) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }
    const existing = MOCK_MEETING_MINUTES[idx]
    const shouldPin =
      typeof nextPinned === 'boolean' ? nextPinned : !Boolean(existing.isPinned)

    const updated = normalizeMinuteRecord({
      ...existing,
      isPinned: shouldPin,
      updatedByName: auth.actorName,
      updatedAt: now,
    })
    MOCK_MEETING_MINUTES[idx] = updated
    revalidateMinutesRoutes()
    return { ok: true, data: structuredClone(updated) }
  }

  try {
    const existing = await fetchExistingSanityMinute(targetId)
    if (!existing) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }
    const shouldPin =
      typeof nextPinned === 'boolean' ? nextPinned : !Boolean(existing.isPinned)

    const committed = await sanityWriteClient
      .patch(cleanId(existing._id))
      .set({
        isPinned: shouldPin,
        updatedByName: auth.actorName,
        updatedAt: now,
      })
      .commit()

    revalidateMinutesRoutes()
    return {
      ok: true,
      data: normalizeMinuteRecord(committed as unknown as MeetingMinute),
    }
  } catch (err) {
    console.error('[toggleMeetingMinutePin] Sanity update error:', err)
    return {
      ok: false,
      error: 'Failed to update pin status. Please try again.',
    }
  }
}

/**
 * Archive or restore a meeting minute.
 */
export async function toggleMeetingMinuteArchive(
  minuteId: string,
  nextArchived?: boolean
): Promise<ActionResult<MeetingMinute>> {
  const auth = await requireCSGBMutation()
  if (!auth.ok) return auth

  const targetId = cleanId(minuteId || '')
  if (!targetId) {
    return { ok: false, error: 'Meeting minute ID is required.' }
  }

  const now = new Date().toISOString()

  if (isMockMode()) {
    const idx = MOCK_MEETING_MINUTES.findIndex((m) => cleanId(m._id) === targetId)
    if (idx < 0) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }
    const existing = MOCK_MEETING_MINUTES[idx]
    const shouldArchive =
      typeof nextArchived === 'boolean' ? nextArchived : !Boolean(existing.archived)

    const updated = normalizeMinuteRecord({
      ...existing,
      archived: shouldArchive,
      isPinned: shouldArchive ? false : Boolean(existing.isPinned),
      updatedByName: auth.actorName,
      updatedAt: now,
    })
    MOCK_MEETING_MINUTES[idx] = updated
    revalidateMinutesRoutes()
    return { ok: true, data: structuredClone(updated) }
  }

  try {
    const existing = await fetchExistingSanityMinute(targetId)
    if (!existing) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }
    const shouldArchive =
      typeof nextArchived === 'boolean' ? nextArchived : !Boolean(existing.archived)

    const committed = await sanityWriteClient
      .patch(cleanId(existing._id))
      .set({
        archived: shouldArchive,
        isPinned: shouldArchive ? false : Boolean(existing.isPinned),
        updatedByName: auth.actorName,
        updatedAt: now,
      })
      .commit()

    revalidateMinutesRoutes()
    return {
      ok: true,
      data: normalizeMinuteRecord(committed as unknown as MeetingMinute),
    }
  } catch (err) {
    console.error('[toggleMeetingMinuteArchive] Sanity update error:', err)
    return {
      ok: false,
      error: 'Failed to update archive status. Please try again.',
    }
  }
}

/**
 * Toggle an action item's completion status (`open` <-> `done`). CSGB only.
 */
export async function toggleMeetingMinuteActionItem(
  minuteId: string,
  itemKeyOrIndex: string | number,
  nextStatus?: 'open' | 'done'
): Promise<ActionResult<MeetingMinute>> {
  const auth = await requireCSGBMutation()
  if (!auth.ok) return auth

  const targetId = cleanId(minuteId || '')
  if (!targetId) {
    return { ok: false, error: 'Meeting minute ID is required.' }
  }

  const now = new Date().toISOString()

  const applyToggle = (items: MeetingMinuteActionItem[]): MeetingMinuteActionItem[] | null => {
    let matched = false
    const nextItems = items.map((item, idx) => {
      const isMatch =
        typeof itemKeyOrIndex === 'number'
          ? idx === itemKeyOrIndex
          : item._key === itemKeyOrIndex || String(idx) === itemKeyOrIndex
      if (!isMatch) return item
      matched = true
      const resolvedStatus: 'open' | 'done' =
        nextStatus ?? (item.status === 'done' ? 'open' : 'done')
      return {
        ...item,
        _key: item._key || randomUUID().slice(0, 8),
        status: resolvedStatus,
      }
    })
    return matched ? nextItems : null
  }

  if (isMockMode()) {
    const idx = MOCK_MEETING_MINUTES.findIndex((m) => cleanId(m._id) === targetId)
    if (idx < 0) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }
    const existing = MOCK_MEETING_MINUTES[idx]
    const updatedItems = applyToggle(existing.actionItems || [])
    if (!updatedItems) {
      return { ok: false, error: 'Action item not found.' }
    }
    const updated = normalizeMinuteRecord({
      ...existing,
      actionItems: updatedItems,
      updatedByName: auth.actorName,
      updatedAt: now,
    })
    MOCK_MEETING_MINUTES[idx] = updated
    revalidateMinutesRoutes()
    return { ok: true, data: structuredClone(updated) }
  }

  try {
    const existing = await fetchExistingSanityMinute(targetId)
    if (!existing) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }
    const updatedItems = applyToggle(existing.actionItems || [])
    if (!updatedItems) {
      return { ok: false, error: 'Action item not found.' }
    }

    const committed = await sanityWriteClient
      .patch(cleanId(existing._id))
      .set({
        actionItems: sanitizeActionItems(updatedItems),
        updatedByName: auth.actorName,
        updatedAt: now,
      })
      .commit()

    revalidateMinutesRoutes()
    return {
      ok: true,
      data: normalizeMinuteRecord(committed as unknown as MeetingMinute),
    }
  } catch (err) {
    console.error('[toggleMeetingMinuteActionItem] Sanity update error:', err)
    return {
      ok: false,
      error: 'Failed to update action item status. Please try again.',
    }
  }
}

/**
 * Permanently delete a meeting minute record. CSGB only.
 */
export async function deleteMeetingMinute(
  minuteId: string
): Promise<ActionResult<{ _id: string }>> {
  const auth = await requireCSGBMutation()
  if (!auth.ok) return auth

  const targetId = cleanId(minuteId || '')
  if (!targetId) {
    return { ok: false, error: 'Meeting minute ID is required.' }
  }

  if (isMockMode()) {
    const idx = MOCK_MEETING_MINUTES.findIndex((m) => cleanId(m._id) === targetId)
    if (idx < 0) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }
    MOCK_MEETING_MINUTES.splice(idx, 1)
    revalidateMinutesRoutes()
    return { ok: true, data: { _id: targetId } }
  }

  try {
    const existing = await fetchExistingSanityMinute(targetId)
    if (!existing) {
      return { ok: false, error: 'Meeting minute record not found.' }
    }

    const baseId = cleanId(existing._id)
    await sanityWriteClient.delete(baseId)
    try {
      await sanityWriteClient.delete(`drafts.${baseId}`)
    } catch {
      // Ignore if no separate draft document exists
    }

    revalidateMinutesRoutes()
    return { ok: true, data: { _id: baseId } }
  } catch (err) {
    console.error('[deleteMeetingMinute] Sanity delete error:', err)
    return {
      ok: false,
      error: 'Failed to delete meeting minute. Please try again.',
    }
  }
}

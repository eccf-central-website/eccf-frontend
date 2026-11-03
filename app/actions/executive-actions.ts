'use server'

import { revalidatePath } from 'next/cache'
import {
  sanityPrivateClient,
  sanityWriteClient,
  patchPrivateDocument,
} from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'
import { getLeaderPostTitle } from '@/lib/dashboard/rbac'
import { executivePositionSignature } from '@/lib/executive-positions'
import { extractNameTokens, normalizeTokensKey } from '@/lib/executive-matching'
import { MOCK_WORKERS } from '@/lib/dashboard/mock/data'
import type { DashboardSession } from '@/lib/dashboard/auth'

/** Why the approver's *name* is stored (not their post): the post changes,
 *  the person who made the decision does not. The post is kept separately in
 *  `decidedByRole` purely for context. */
function decisionActor(session: DashboardSession) {
  const workerFullName =
    typeof session.worker?.fullName === 'string' ? session.worker.fullName : ''
  const name =
    session.name?.trim() ||
    workerFullName.trim() ||
    'Executive Council'
  const id = String(session.worker?._id || session.id || '')
  const role = getLeaderPostTitle(session)
  return { name, id, role }
}

async function verifyAuth() {
  const session = await getSession()
  if (!session) {
    return { ok: false as const, error: 'Not authenticated.' }
  }

  const canManageExecutives = Boolean(
    session.access?.canApproveExecutives ||
      session.access?.isVP ||
      session.access?.isChaplain
  )

  if (!canManageExecutives) {
    return { ok: false as const, error: 'You do not have permission to manage executive appointments.' }
  }

  return { ok: true as const, session }
}

function revalidateExecutiveSurfaces() {
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/executives')
  revalidatePath('/dashboard/workers')
  revalidatePath('/dashboard')
}

function positionLabel(position: Record<string, unknown>): string {
  const kind = String(position.kind || '')
  if (kind === 'csgb') return String(position.office || 'CSGB Office')
  if (kind === 'hall') return `Hall Pastor (${String(position.hall || position.hallName || 'Hall')})`
  return String(position.teamName || position.teamTitle || 'Ministry')
}

interface ExecutiveWorkerRecord {
  _id: string
  fullName?: string
  email?: string
  positions?: Array<Record<string, unknown>>
}

interface ExecutiveAppointmentRecord {
  _id: string
  fullName?: string
  normalizedName?: string
  email?: string
  status?: string
  claimedBy?: { _ref?: string }
  kind?: 'csgb' | 'hall' | 'team'
  office?: string
  csgbRole?: { _ref?: string }
  hall?: string
  hallRef?: { _ref?: string }
  teamName?: string
  teamRef?: { _ref?: string }
}

/** Map an appointment document onto the same shape used by worker positions. */
function appointmentPosition(
  appointment: ExecutiveAppointmentRecord
): Record<string, unknown> {
  return {
    kind: appointment.kind,
    office: appointment.office,
    csgbRole: appointment.csgbRole,
    hall: appointment.hall,
    hallRef: appointment.hallRef,
    teamName: appointment.teamName,
    team: appointment.teamRef,
  }
}

/**
 * Compare two executive roles even when one record stores a Sanity reference
 * and the other only keeps the human-readable office/team/hall label.
 */
function sameExecutiveRole(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  if (executivePositionSignature(a) === executivePositionSignature(b)) return true

  const label = (position: Record<string, unknown>) => {
    const kind = String(position.kind || '').toLowerCase()
    if (kind === 'csgb') {
      return String(position.office || position.csgbRoleTitle || '').trim().toLowerCase()
    }
    if (kind === 'hall') {
      return String(position.hall || position.hallName || '').trim().toLowerCase()
    }
    if (kind === 'team') {
      return String(position.teamName || position.teamTitle || '').trim().toLowerCase()
    }
    return ''
  }

  const labelA = label(a)
  return Boolean(labelA && labelA === label(b))
}

function personNameKey(fullName?: string, normalizedName?: string): string | undefined {
  if (normalizedName?.trim()) return normalizedName.trim()
  if (!fullName?.trim()) return undefined
  const tokens = extractNameTokens(fullName)
  return tokens.length > 0 ? normalizeTokensKey(tokens) : undefined
}

function isMockDataSource(): boolean {
  return (
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && !process.env.DASHBOARD_DATA_SOURCE)
  )
}

const EXECUTIVE_APPOINTMENT_FIELDS = `
  _id,
  fullName,
  normalizedName,
  email,
  status,
  claimedBy,
  kind,
  office,
  csgbRole,
  hall,
  hallRef,
  teamName,
  teamRef
`

/**
 * Approve or decline a pending executive application.
 *
 * The decision records the approver's full name (not their post) so the roster
 * can show “Approved by <name>”, with the post kept alongside for context.
 */
export async function decideExecutivePosition(
  workerId: string,
  positionKey: string,
  decision: 'approved' | 'rejected',
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await verifyAuth()
  if (!auth.ok) return { ok: false, error: auth.error }

  if (!workerId || !positionKey) {
    return { ok: false, error: 'Worker ID and position key are required.' }
  }
  if (decision !== 'approved' && decision !== 'rejected') {
    return { ok: false, error: 'Invalid decision.' }
  }

  const actor = decisionActor(auth.session)
  const today = new Date().toISOString().slice(0, 10)
  const nowIso = new Date().toISOString()

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

    if (!worker) return { ok: false, error: 'Worker record not found.' }

    const positions = Array.isArray(worker.positions) ? worker.positions : []
    const index = positions.findIndex((pos) => String(pos._key || pos.key || '') === positionKey)
    if (index === -1) {
      return { ok: false, error: 'That executive application no longer exists.' }
    }

    const target = positions[index]
    const updatedPositions = positions.map((position, i) =>
      i === index
        ? {
            ...position,
            status: decision,
            decidedBy: actor.name,
            decidedById: actor.id,
            decidedByRole: actor.role,
            decidedAt: nowIso,
          }
        : position
    )

    const hasApprovedPositions = updatedPositions.some((p) => p.status === 'approved')
    const label = positionLabel(target)
    const reason = note?.trim() ? ` — ${note.trim()}` : ''
    const logMessage = `${
      decision === 'approved' ? 'Approved' : 'Declined'
    } executive appointment “${label}” by ${actor.name} (${actor.role}) on ${today}${reason}`

    await patchPrivateDocument(workerId)
      .set({
        positions: updatedPositions,
        isExcoApproved: hasApprovedPositions,
      })
      .append('updateLog', [logMessage])
      .commit()

    revalidateExecutiveSurfaces()
    return { ok: true }
  } catch (err) {
    console.error('[decideExecutivePosition] error:', err)
    return { ok: false, error: 'Failed to record the executive decision. Please try again.' }
  }
}

export interface DeleteExecutivePositionResult {
  ok: boolean
  error?: string
  /** Number of `executiveAppointment` placeholder documents removed from Sanity. */
  deletedPlaceholders?: number
}

/**
 * Delete an executive role and every Sanity placeholder that could auto-link
 * it back to the leader.
 *
 * - Reserved (unregistered) roles are `executiveAppointment` documents with
 *   `status: "pending_claim"`. They are deleted so registration can never
 *   auto-claim the role again.
 * - Registered roles are removed from the worker's `positions` array. Any
 *   claimed or still-pending appointment document for the same person + role is
 *   deleted in the same transaction, so a later profile refresh or
 *   reconciliation cannot resurrect it.
 */
export async function deleteExecutivePosition(
  workerId: string,
  positionKey: string,
  options: { fromAppointment?: boolean; reason?: string } = {}
): Promise<DeleteExecutivePositionResult> {
  const auth = await verifyAuth()
  if (!auth.ok) return { ok: false, error: auth.error }

  if (!positionKey) {
    return { ok: false, error: 'Position key is required.' }
  }

  const actor = decisionActor(auth.session)
  const today = new Date().toISOString().slice(0, 10)
  const reasonText = options.reason?.trim() ? ` — ${options.reason.trim()}` : ''
  const logMessage = (label: string) =>
    `Deleted executive appointment “${label}” by ${actor.name} (${actor.role}) on ${today}${reasonText}`

  // Dev/mock mode: mutate the shared fixture store so the roster updates.
  if (isMockDataSource()) {
    const worker = MOCK_WORKERS.find((candidate) => candidate._id === workerId)
    if (!worker) return { ok: false, error: 'Worker record not found.' }

    const positions = Array.isArray(worker.positions) ? worker.positions : []
    const target = positions.find(
      (position) => String(position._key || '') === positionKey
    )
    if (!target) return { ok: false, error: 'That executive role no longer exists.' }

    const label = positionLabel(target as unknown as Record<string, unknown>)
    const updatedPositions = positions.filter(
      (position) => String(position._key || '') !== positionKey
    )

    worker.positions = updatedPositions
    worker.isExcoApproved = updatedPositions.some((position) => position.status === 'approved')
    worker.updatedAt = new Date().toISOString()
    worker.updateLog = [...(worker.updateLog || []), logMessage(label)]

    revalidateExecutiveSurfaces()
    return { ok: true, deletedPlaceholders: 0 }
  }

  try {
    // -----------------------------------------------------------------------
    // Reserved placeholder row: the position key is the appointment document.
    // -----------------------------------------------------------------------
    if (options.fromAppointment) {
      const appointment = await sanityPrivateClient.fetch<ExecutiveAppointmentRecord | null>(
        `*[_type == "executiveAppointment" && _id == $id][0]{${EXECUTIVE_APPOINTMENT_FIELDS}}`,
        { id: positionKey }
      )

      if (!appointment) {
        return { ok: false, error: 'That reserved appointment no longer exists.' }
      }

      const label = positionLabel(appointment as unknown as Record<string, unknown>)
      const claimedById = appointment.claimedBy?._ref

      // A claimed appointment should have a matching worker position. Remove
      // both in one transaction so the roster and Sanity stay consistent.
      if (claimedById) {
        const worker = await sanityPrivateClient.fetch<ExecutiveWorkerRecord | null>(
          `*[_type == "worker" && _id == $workerId && !(_id in path("drafts.**"))][0]{
            _id,
            fullName,
            positions
          }`,
          { workerId: claimedById }
        )

        const appointmentRole = appointmentPosition(appointment)
        const currentPositions = Array.isArray(worker?.positions) ? worker.positions : []
        const updatedPositions = currentPositions.filter(
          (position) => !sameExecutiveRole(position, appointmentRole)
        )

        const transaction = sanityWriteClient.transaction().delete(positionKey)

        if (worker && updatedPositions.length !== currentPositions.length) {
          transaction.patch(worker._id, (patch) =>
            patch
              .set({
                positions: updatedPositions,
                isExcoApproved: updatedPositions.some(
                  (position) => position.status === 'approved'
                ),
              })
              .append('updateLog', [logMessage(label)])
          )
        }

        await transaction.commit()
        revalidateExecutiveSurfaces()
        return { ok: true, deletedPlaceholders: 1 }
      }

      await sanityWriteClient.delete(positionKey)
      revalidateExecutiveSurfaces()
      return { ok: true, deletedPlaceholders: 1 }
    }

    // -----------------------------------------------------------------------
    // Registered worker role: remove the position and any linked placeholders.
    // -----------------------------------------------------------------------
    const worker = await sanityPrivateClient.fetch<ExecutiveWorkerRecord | null>(
      `*[_type == "worker" && _id == $workerId && !(_id in path("drafts.**"))][0]{
        _id,
        fullName,
        email,
        positions
      }`,
      { workerId }
    )

    if (!worker) {
      return { ok: false, error: 'Worker record not found.' }
    }

    const currentPositions = Array.isArray(worker.positions) ? worker.positions : []
    const target = currentPositions.find(
      (position) => String(position._key || position.key || '') === positionKey
    )

    if (!target) {
      return { ok: false, error: 'That executive role no longer exists.' }
    }

    const label = positionLabel(target)
    const updatedPositions = currentPositions.filter(
      (position) => String(position._key || position.key || '') !== positionKey
    )

    const workerEmail = worker.email?.trim().toLowerCase()
    const workerNameKey = personNameKey(worker.fullName)

    const appointments = await sanityPrivateClient.fetch<ExecutiveAppointmentRecord[]>(
      `*[_type == "executiveAppointment" && !(_id in path("drafts.**"))]{${EXECUTIVE_APPOINTMENT_FIELDS}}`
    )

    // Match the exact role, and prove the placeholder belongs to this person.
    // Deleting pending_claim docs is what stops registration auto-linking the
    // role again; deleting claimed docs cleans up the old reservation.
    const relatedAppointmentIds = Array.from(
      new Set(
        (appointments || [])
          .filter((appointment) => {
            if (!sameExecutiveRole(target, appointmentPosition(appointment))) return false
            if (appointment.claimedBy?._ref === workerId) return true

            const appointmentEmail = appointment.email?.trim().toLowerCase()
            if (workerEmail && appointmentEmail === workerEmail) return true

            const appointmentNameKey = personNameKey(
              appointment.fullName,
              appointment.normalizedName
            )
            return Boolean(workerNameKey && appointmentNameKey === workerNameKey)
          })
          .map((appointment) => appointment._id)
      )
    )

    const transaction = sanityWriteClient.transaction().patch(workerId, (patch) =>
      patch
        .set({
          positions: updatedPositions,
          isExcoApproved: updatedPositions.some(
            (position) => position.status === 'approved'
          ),
        })
        .append('updateLog', [logMessage(label)])
    )

    for (const appointmentId of relatedAppointmentIds) {
      transaction.delete(appointmentId)
    }

    await transaction.commit()

    revalidateExecutiveSurfaces()
    return { ok: true, deletedPlaceholders: relatedAppointmentIds.length }
  } catch (err) {
    console.error('[deleteExecutivePosition] error:', err)
    return { ok: false, error: 'Failed to delete the executive role. Please try again.' }
  }
}

/**
 * @deprecated Use {@link deleteExecutivePosition}. Kept for callers that still
 * use the old "relieve" wording; the implementation now also removes the
 * matching Sanity placeholder documents.
 */
export async function relieveExecutivePosition(
  workerId: string,
  positionKey: string,
  reason?: string
): Promise<DeleteExecutivePositionResult> {
  return deleteExecutivePosition(workerId, positionKey, { reason })
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
  if (newRank !== 'lead' && newRank !== 'assistant') {
    return { ok: false, error: 'Invalid rank.' }
  }

  const actor = decisionActor(auth.session)
  const today = new Date().toISOString().slice(0, 10)

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

    const target = worker.positions.find((pos) => String(pos._key || pos.key) === positionKey)
    const updatedPositions = worker.positions.map((pos) => {
      if (String(pos._key || pos.key) === positionKey) {
        return { ...pos, rank: newRank }
      }
      return pos
    })

    await patchPrivateDocument(workerId)
      .set({ positions: updatedPositions })
      .append('updateLog', [
        `Changed rank of “${target ? positionLabel(target) : 'executive role'}” to ${
          newRank === 'assistant' ? 'Assistant' : 'Lead'
        } by ${actor.name} (${actor.role}) on ${today}`,
      ])
      .commit()

    revalidateExecutiveSurfaces()

    return { ok: true }
  } catch (err) {
    console.error('[updateExecutiveRank] error:', err)
    return { ok: false, error: 'Failed to update rank.' }
  }
}

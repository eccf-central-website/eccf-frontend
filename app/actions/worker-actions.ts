'use server'

/**
 * Worker CRM Server Actions — app/actions/worker-actions.ts
 *
 * Implements:
 * - Decentralized Team Lead Verification: Team Leads can approve/reject
 *   workers who registered for their specific operational team.
 * - CSGB Admin Global Verification & Exco Approval.
 * - Audit logging into worker `updateLog` array.
 */

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import {
  createPrivateDocument,
  patchPrivateDocument,
  sanityPrivateClient,
  sanityWriteClient,
} from '@/lib/sanity'
import { createBlindIndex, encrypt } from '@/lib/encryption'
import { getSession } from '@/lib/dashboard/auth'
import { MOCK_WORKERS } from '@/lib/dashboard/mock/data'
import { auditMemberDirectory, matchesTeam } from '@/lib/dashboard/data'
import { hasPermission } from '@/lib/dashboard/rbac'
import { clerkClient } from '@clerk/nextjs/server'
import type { ActionResult } from '@/lib/dashboard/action-result'
import type { WorkerRole, ExcoPosition } from '@/types'
import { uploadWorkerPhotoDirectAction, sendWorkerWelcomeEmail } from './worker-registration'

export interface VerifyWorkerInput {
  workerId: string
  decision: 'approve' | 'reject'
  membershipKey?: string
  teamId?: string
  reason?: string
}

export interface ToggleExcoApprovalInput {
  workerId: string
  approved: boolean
  role?: WorkerRole
  excoPosition?: ExcoPosition
}

export async function verifyWorkerMembership(
  input: VerifyWorkerInput
): Promise<ActionResult<{ workerId: string; status: 'verified' | 'rejected' }>> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' }
  }

  const access = session.access
  const isPresident = Boolean(access?.isPresident)
  const leadsTeamIds = access?.leadsTeamIds || []
  const leadsTeamKeys = access?.leadsTeamKeys || []
  const isLeadOrAssistant =
    leadsTeamIds.length > 0 ||
    leadsTeamKeys.length > 0 ||
    session.role === 'team_lead' ||
    session.role === 'admin' ||
    Boolean(access?.isCSGB)

  // Only President, CSGB admins, and Team Leads / Assistant Leads can verify members
  if (!isPresident && !isLeadOrAssistant) {
    return { ok: false, error: 'You do not have permission to verify workers.' }
  }

  const now = new Date()
  const today = now.toLocaleDateString('en-CA')
  const newStatus = input.decision === 'approve' ? 'verified' : 'rejected'
  const actionLabel = input.decision === 'approve' ? 'Membership verified' : 'Membership declined'
  const approverRole = isPresident
    ? 'Fellowship President'
    : access?.titles?.[0] ||
      (session.role === 'admin'
        ? 'CSGB Admin'
        : `${session.leadingTeam || session.team} Team Lead`)
  const approverId: string = String(session.worker?._id || session.id)
  const logMessage = `${actionLabel} by ${approverRole} on ${today}${input.reason ? ` (${input.reason})` : ''}`

  // Allowed team scopes for non-presidents
  const allowedTeamNames = [session.leadingTeam || session.team].filter(Boolean) as string[]

  // Check data source: if mock mode, update in-memory mock workers
  const isMock =
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && !process.env.DASHBOARD_DATA_SOURCE)

  if (isMock) {
    const worker = MOCK_WORKERS.find((w) => w._id === input.workerId)
    if (!worker) {
      return { ok: false, error: 'Worker record not found.' }
    }

    // Role & Team scoping check: President can verify for ANY team as fallback!
    if (!isPresident && session.role !== 'admin') {
      const workerMemberships = Array.isArray(worker.memberships) ? worker.memberships : []
      const hasMatchingMembership = workerMemberships.some(
        (m) =>
          (m.teamId && leadsTeamIds.includes(m.teamId)) ||
          (m.teamKey && leadsTeamKeys.includes(m.teamKey)) ||
          (m.teamName && matchesTeam(m.teamName, [], allowedTeamNames))
      )
      const belongsToLegacyTeam = matchesTeam(worker.team, worker.teams, allowedTeamNames)

      if (!hasMatchingMembership && !belongsToLegacyTeam) {
        return {
          ok: false,
          error: `You can only verify workers belonging to your scoped operational team (${session.leadingTeam || session.team}).`,
        }
      }
    }

    // Update structured memberships if present
    if (Array.isArray(worker.memberships) && worker.memberships.length > 0) {
      worker.memberships.forEach((m) => {
        const matchesTarget =
          input.membershipKey
            ? m._key === input.membershipKey
            : isPresident ||
              (m.teamId && leadsTeamIds.includes(m.teamId)) ||
              (m.teamKey && leadsTeamKeys.includes(m.teamKey)) ||
              (m.teamName && matchesTeam(m.teamName, [], allowedTeamNames))

        if (matchesTarget && (m.status === 'pending' || input.membershipKey)) {
          m.status = newStatus
          m.decidedBy = approverId
          m.decidedAt = now.toISOString()
        }
      })
    }

    worker.verificationStatus = newStatus
    worker.verifiedAt = now.toISOString()
    worker.verifiedBy = approverRole
    worker.updatedAt = now.toISOString()
    worker.updateLog = [...(worker.updateLog || []), logMessage]
    if (input.decision === 'approve') {
      worker.welcomeEmailSent = true
    }

    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard')

    return {
      ok: true,
      data: { workerId: input.workerId, status: newStatus },
    }
  }

  // Live Sanity update
  try {
    const existing = await sanityPrivateClient.fetch<{
      _id: string
      fullName: string
      firstName?: string
      email?: string
      phoneNumber?: string
      hall?: string
      roomNumber?: string
      isExco?: boolean
      welcomeEmailSent?: boolean
      team?: string
      teams?: string[]
      verificationStatus?: string
      memberships?: Array<{
        _key?: string
        status?: string
        teamId?: string
        teamKey?: string
        teamName?: string
      }>
    }>(
      `*[_type == "worker" && _id == $id][0]{
        _id,
        fullName,
        firstName,
        email,
        phoneNumber,
        hall,
        roomNumber,
        isExco,
        welcomeEmailSent,
        "team": coalesce(team->name, team),
        "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
        verificationStatus,
        memberships[]{
          _key,
          status,
          "teamId": coalesce(team._ref, team->_id),
          "teamKey": coalesce(team->key, team->slug.current),
          "teamName": team->name
        }
      }`,
      { id: input.workerId }
    )

    if (!existing) {
      return { ok: false, error: 'Worker document not found in Sanity.' }
    }

    // RBAC Scope Check: President can verify for ANY team as fallback!
    if (!isPresident && session.role !== 'admin') {
      const existingMemberships = Array.isArray(existing.memberships) ? existing.memberships : []
      const hasMatchingMembership = existingMemberships.some(
        (m) =>
          (m.teamId && leadsTeamIds.includes(m.teamId)) ||
          (m.teamKey && leadsTeamKeys.includes(m.teamKey)) ||
          (m.teamName && matchesTeam(m.teamName, [], allowedTeamNames))
      )
      const belongsToLegacyTeam = matchesTeam(existing.team, existing.teams, allowedTeamNames)

      if (!hasMatchingMembership && !belongsToLegacyTeam) {
        return {
          ok: false,
          error: `Permission denied: You can only verify workers belonging to your scoped operational team (${session.leadingTeam || session.team}).`,
        }
      }
    }

    let patch = patchPrivateDocument(input.workerId).set({
      verifiedAt: now.toISOString(),
      verifiedBy: approverRole,
      updatedAt: now.toISOString(),
    })

    // Update structured memberships in Sanity
    if (Array.isArray(existing.memberships) && existing.memberships.length > 0) {
      existing.memberships.forEach((m) => {
        if (!m._key) return
        const matchesTarget =
          input.membershipKey
            ? m._key === input.membershipKey
            : isPresident ||
              (m.teamId && leadsTeamIds.includes(m.teamId)) ||
              (m.teamKey && leadsTeamKeys.includes(m.teamKey)) ||
              (m.teamName && matchesTeam(m.teamName, [], allowedTeamNames))

        if (matchesTarget && (m.status === 'pending' || input.membershipKey)) {
          patch = patch.set({
            [`memberships[_key=="${m._key}"].status`]: newStatus,
            [`memberships[_key=="${m._key}"].decidedBy`]: {
              _type: 'reference',
              _ref: approverId,
            },
            [`memberships[_key=="${m._key}"].decidedAt`]: now.toISOString(),
          })
        }
      })
    }

    // If the membership is approved and the worker has not received their official welcome email yet, dispatch it now!
    if (input.decision === 'approve' && existing.email && !existing.welcomeEmailSent) {
      sendWorkerWelcomeEmail({
        fullName: existing.fullName,
        firstName: existing.firstName,
        email: existing.email,
        phoneNumber: existing.phoneNumber || '',
        hall: existing.hall || '',
        roomNumber: existing.roomNumber || '',
        teams: existing.teams || [],
        isExco: Boolean(existing.isExco),
      }).catch((welcomeErr) => {
        console.error('[verifyWorkerMembership] Worker welcome email error:', welcomeErr)
      })

      patch = patch.set({ welcomeEmailSent: true })
    }

    await patch.append('updateLog', [logMessage]).commit()

    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard')

    return {
      ok: true,
      data: { workerId: input.workerId, status: newStatus },
    }
  } catch (err) {
    console.error('[verifyWorkerMembership] Error:', err)
    return { ok: false, error: 'Failed to update worker verification status. Please try again.' }
  }
}

export async function toggleExcoApproval(
  input: ToggleExcoApprovalInput
): Promise<ActionResult<{ workerId: string; approved: boolean }>> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Your session has expired.' }
  }

  // Only CSGB admin can approve exco privileges
  if (session.role !== 'admin') {
    return { ok: false, error: 'Only CSGB administrators can approve or revoke Exco privileges.' }
  }

  const now = new Date()
  const today = now.toLocaleDateString('en-CA')
  const actionLabel = input.approved ? 'Exco access approved' : 'Exco access revoked'
  const logMessage = `${actionLabel} by CSGB Admin on ${today}`

  const isMock =
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && !process.env.DASHBOARD_DATA_SOURCE)

  if (isMock) {
    const worker = MOCK_WORKERS.find((w) => w._id === input.workerId)
    if (!worker) return { ok: false, error: 'Worker record not found.' }

    worker.isExcoApproved = input.approved
    if (input.role) worker.role = input.role
    if (input.excoPosition) worker.excoPosition = input.excoPosition
    if (!input.approved && Array.isArray(worker.positions)) {
      worker.positions = worker.positions.map((position) => ({
        ...position,
        status: 'rejected' as const,
        decidedAt: now.toISOString(),
        decidedBy: String(session.worker?._id || session.id),
      }))
    }
    worker.updatedAt = now.toISOString()
    worker.updateLog = [...(worker.updateLog || []), logMessage]

    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard/executives')
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return { ok: true, data: { workerId: input.workerId, approved: input.approved } }
  }

  try {
    const existing = await sanityPrivateClient.fetch<{
      positions?: Array<Record<string, unknown> & { status?: string }>
    } | null>(
      `*[_type == "worker" && _id == $id][0]{ positions }`,
      { id: input.workerId }
    )

    const patchData: Record<string, unknown> = {
      isExcoApproved: input.approved,
      updatedAt: now.toISOString(),
    }
    if (input.approved && input.role) {
      patchData.role = input.role
    }
    if (input.excoPosition) {
      patchData.excoPosition = input.excoPosition
    }
    if (!input.approved && existing?.positions) {
      patchData.positions = existing.positions.map((position) => ({
        ...position,
        status: 'rejected',
        decidedAt: now.toISOString(),
        decidedBy: String(session.worker?._id || session.id),
      }))
    }

    await patchPrivateDocument(input.workerId)
      .set(patchData)
      .append('updateLog', [logMessage])
      .commit()

    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard/executives')
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return { ok: true, data: { workerId: input.workerId, approved: input.approved } }
  } catch (err) {
    console.error('[toggleExcoApproval] Error:', err)
    return { ok: false, error: 'Failed to update Exco approval status.' }
  }
}

/**
 * Update Dashboard Profile Photo Server Action:
 * Authenticates the signed-in exco, verifies their worker record,
 * uploads the image to Sanity asset storage (with Google Drive backup),
 * updates worker.profileImageUrl and worker.headshot, and revalidates all dashboard layouts.
 */
export async function updateDashboardProfilePhotoAction(input: {
  base64Image: string
}): Promise<ActionResult<{ profileImageUrl: string }>> {
  const session = await getSession()
  if (!session || !session.id) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' }
  }

  const isMock =
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && !process.env.DASHBOARD_DATA_SOURCE)

  if (isMock) {
    const dataUrl = input.base64Image.startsWith('data:')
      ? input.base64Image
      : `data:image/jpeg;base64,${input.base64Image}`
    return { ok: true, data: { profileImageUrl: dataUrl } }
  }

  const uploadRes = await uploadWorkerPhotoDirectAction({
    workerId: session.id,
    base64Image: input.base64Image,
  })

  if (!uploadRes.ok || !uploadRes.fileUrl) {
    return { ok: false, error: uploadRes.error || 'Failed to upload photo.' }
  }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/workers')

  return {
    ok: true,
    data: {
      profileImageUrl: uploadRes.fileUrl,
    },
  }
}


export interface DeleteWorkerInput {
  workerId: string
  confirmedName: string
  policy: 'archive' | 'permanent'
  reason: string
}

interface OffboardingTarget {
  _id: string
  fullName: string
  email?: string
  clerkUserId?: string
  isExcoApproved?: boolean
  status?: string
  positions?: Array<Record<string, unknown> & { status?: string }>
  memberships?: Array<Record<string, unknown> & { status?: string }>
}

function isMockDataSource(): boolean {
  return (
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && !process.env.DASHBOARD_DATA_SOURCE)
  )
}

function actorLabel(session: NonNullable<Awaited<ReturnType<typeof getSession>>>): string {
  if (session.access?.isPresident) return 'Fellowship President'
  if (session.access?.isVPAdmin) return 'Vice President - Admin'
  if (session.access?.isChaplain) return 'Fellowship Chaplain'
  return session.access?.titles?.[0] || session.excoPosition || 'CSGB Executive'
}

function clerkErrorStatus(error: unknown): number | undefined {
  const candidate = error as { status?: number; statusCode?: number }
  return candidate?.status ?? candidate?.statusCode
}

function isClerkNotFound(error: unknown): boolean {
  if (clerkErrorStatus(error) === 404) return true
  const candidate = error as { errors?: Array<{ code?: string }> }
  return Boolean(candidate?.errors?.some((item) => item.code === 'resource_not_found'))
}

async function revokeClerkSessions(clerkUserId: string): Promise<string | null> {
  try {
    const client = await clerkClient()
    const sessions = await client.sessions.getSessionList({ userId: clerkUserId })
    await Promise.all(
      sessions.data.map((session) => client.sessions.revokeSession(session.id))
    )
    return null
  } catch (error) {
    console.error('[offboarding] Clerk session revocation failed:', error)
    return 'The worker was offboarded, but their existing sign-in sessions could not be revoked.'
  }
}

async function deleteClerkUser(clerkUserId: string): Promise<void> {
  const client = await clerkClient()
  try {
    await client.users.deleteUser(clerkUserId)
  } catch (error) {
    if (isClerkNotFound(error)) return
    throw error
  }
}

/**
 * Delete or Archive an Approved Worker — Privileged Action.
 *
 * - Permanent deletion requires an approved target (or an already archived one).
 * - Archiving revokes every approved position and membership, sets the worker
 *   to archived/rejected, and revokes any live Clerk sessions.
 * - Both paths write a durable audit document. Permanent deletion commits the
 *   audit record and the document delete in the same Sanity transaction.
 */
export async function deleteApprovedWorkerAction(
  input: DeleteWorkerInput
): Promise<ActionResult<{ workerId: string; status: 'archived' | 'deleted'; warning?: string }>> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' }
  }

  if (!hasPermission(session.role, 'workers:delete', session)) {
    return {
      ok: false,
      error: 'Permission denied. Only the President or VP Admin can offboard worker profiles.',
    }
  }

  const now = new Date()
  const nowIso = now.toISOString()
  const reason = input.reason.trim() || 'Administrative offboarding'
  const actorRole = actorLabel(session)
  const actorId = String(session.worker?._id || session.id)
  const actorName = session.name || actorId
  const logMsg = `Worker record ${
    input.policy === 'archive' ? 'archived' : 'permanently deleted'
  } by ${actorRole} (${actorName}): ${reason}`

  if (isMockDataSource()) {
    const idx = MOCK_WORKERS.findIndex((w) => w._id === input.workerId)
    if (idx === -1) {
      return { ok: false, error: 'Worker record not found.' }
    }
    const worker = MOCK_WORKERS[idx]
    if (worker.fullName.trim().toLowerCase() !== input.confirmedName.trim().toLowerCase()) {
      return { ok: false, error: 'Confirmation name does not match the worker name.' }
    }

    const mockPositions = Array.isArray(worker.positions) ? worker.positions : []
    const approvedPositionCount = mockPositions.filter((p) => p.status === 'approved').length
    if (
      input.policy === 'permanent' &&
      worker.status !== 'archived' &&
      !worker.isExcoApproved &&
      approvedPositionCount === 0
    ) {
      return {
        ok: false,
        error: 'Only an approved worker can be permanently deleted. Archive the record instead.',
      }
    }

    if (input.policy === 'permanent') {
      MOCK_WORKERS.splice(idx, 1)
    } else {
      const rec = worker as Record<string, unknown>
      rec.status = 'archived'
      rec.verificationStatus = 'rejected'
      rec.isExcoApproved = false
      rec.archivedAt = nowIso
      rec.archivedBy = actorName
      rec.archiveReason = reason
      rec.positions = mockPositions.map((position) => ({
        ...position,
        status: 'rejected',
        decidedAt: nowIso,
        decidedBy: actorId,
      }))
      rec.memberships = (worker.memberships || []).map((membership) => ({
        ...membership,
        status: 'rejected',
        decidedAt: nowIso,
        decidedBy: actorId,
      }))
      const logs = Array.isArray(rec.updateLog) ? (rec.updateLog as string[]) : []
      logs.push(logMsg)
      rec.updateLog = logs
    }

    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard/executives')
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return {
      ok: true,
      data: {
        workerId: input.workerId,
        status: input.policy === 'archive' ? 'archived' : 'deleted',
      },
    }
  }

  try {
    const existing = await sanityPrivateClient.fetch<OffboardingTarget | null>(
      `*[_type == "worker" && _id == $id][0]{
        _id,
        fullName,
        email,
        clerkUserId,
        isExcoApproved,
        status,
        positions,
        memberships
      }`,
      { id: input.workerId }
    )

    if (!existing) {
      return { ok: false, error: 'Worker record not found in database.' }
    }

    if (existing.fullName.trim().toLowerCase() !== input.confirmedName.trim().toLowerCase()) {
      return { ok: false, error: 'Confirmation name does not match the worker name.' }
    }

    const positions = Array.isArray(existing.positions) ? existing.positions : []
    const memberships = Array.isArray(existing.memberships) ? existing.memberships : []
    const approvedPositionCount = positions.filter((p) => p.status === 'approved').length

    if (
      input.policy === 'permanent' &&
      existing.status !== 'archived' &&
      !existing.isExcoApproved &&
      approvedPositionCount === 0
    ) {
      return {
        ok: false,
        error: 'Only an approved worker can be permanently deleted. Archive the record instead.',
      }
    }

    if (input.policy === 'permanent') {
      // Fail closed: if the linked Clerk account cannot be removed, keep the
      // Sanity record intact so the administrator can retry safely.
      if (existing.clerkUserId) {
        try {
          await deleteClerkUser(existing.clerkUserId)
        } catch (clerkErr) {
          console.error('[deleteApprovedWorkerAction] Clerk deleteUser failed:', clerkErr)
          return {
            ok: false,
            error:
              'The linked Clerk sign-in account could not be deleted. No worker record was removed. Please retry or archive the worker instead.',
          }
        }
      }

      const auditDoc = {
        _type: 'workerOffboardingAudit',
        policy: 'permanent',
        workerId: existing._id,
        workerName: existing.fullName,
        workerEmail: existing.email,
        actorId,
        actorName,
        actorRole,
        reason,
        approvedPositionCount,
        membershipCount: memberships.length,
        clerkUserId: existing.clerkUserId,
        deletedAt: nowIso,
        createdAt: nowIso,
      }

      // The audit record and the delete commit together, or not at all.
      await sanityWriteClient.transaction().create(auditDoc).delete(existing._id).commit()
    } else {
      const revokedPositions = positions.map((position) => ({
        ...position,
        status: 'rejected',
        decidedAt: nowIso,
        decidedBy: actorId,
      }))
      const revokedMemberships = memberships.map((membership) => ({
        ...membership,
        status: 'rejected',
        decidedAt: nowIso,
        decidedBy: actorId,
      }))

      const auditDoc = {
        _type: 'workerOffboardingAudit',
        policy: 'archive',
        workerId: existing._id,
        workerName: existing.fullName,
        workerEmail: existing.email,
        actorId,
        actorName,
        actorRole,
        reason,
        approvedPositionCount,
        membershipCount: memberships.length,
        clerkUserId: existing.clerkUserId,
        archivedAt: nowIso,
        createdAt: nowIso,
      }

      await sanityWriteClient
        .transaction()
        .patch(existing._id, (patch) =>
          patch
            .set({
              status: 'archived',
              verificationStatus: 'rejected',
              isExcoApproved: false,
              archivedAt: nowIso,
              archivedBy: actorName,
              archiveReason: reason,
              positions: revokedPositions,
              memberships: revokedMemberships,
              updatedAt: nowIso,
            })
            .append('updateLog', [logMsg])
        )
        .create(auditDoc)
        .commit()

      if (existing.clerkUserId) {
        const warning = await revokeClerkSessions(existing.clerkUserId)
        if (warning) {
          revalidatePath('/dashboard/workers')
          revalidatePath('/dashboard/executives')
          revalidatePath('/dashboard/settings')
          revalidatePath('/dashboard')
          return {
            ok: true,
            data: {
              workerId: input.workerId,
              status: 'archived',
              warning,
            },
          }
        }
      }
    }

    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard/executives')
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return {
      ok: true,
      data: {
        workerId: input.workerId,
        status: input.policy === 'archive' ? 'archived' : 'deleted',
      },
    }
  } catch (err) {
    console.error('[deleteApprovedWorkerAction] Error:', err)
    return { ok: false, error: 'Failed to process worker deletion. Please check server logs.' }
  }
}

export interface WorkerRosterCsvRow {
  fullName: string
  email: string
  phone?: string
  team?: string
  hall?: string
}

export interface WorkerRosterImportResult {
  importedCount: number
  updatedCount: number
  skippedCount: number
  errors: string[]
}

interface TeamUnitLookup {
  _id: string
  name: string
  key?: string
}

function normalizeTeamToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bteam\b/g, '')
    .replace(/[/&,._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchTeamUnit(
  requested: string,
  units: TeamUnitLookup[]
): TeamUnitLookup | undefined {
  const exact = units.find((unit) => unit.name.toLowerCase() === requested.toLowerCase())
  if (exact) return exact

  const slug = requested
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const keyMatch = units.find((unit) => unit.key?.toLowerCase() === slug)
  if (keyMatch) return keyMatch

  const requestedToken = normalizeTeamToken(requested)
  return units.find((unit) => {
    const unitToken = normalizeTeamToken(unit.name)
    return (
      unitToken === requestedToken ||
      unitToken.includes(requestedToken) ||
      requestedToken.includes(unitToken)
    )
  })
}

/**
 * Import Worker Roster CSV — Privileged Admin Action.
 *
 * Persists real worker records: new emails create worker documents, existing
 * emails are updated, and optional team names are resolved to `teamUnit`
 * references. Every write is logged on the worker's updateLog.
 */
export async function importWorkerRosterCsvAction(
  rows: WorkerRosterCsvRow[]
): Promise<ActionResult<WorkerRosterImportResult>> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' }
  }

  if (!hasPermission(session.role, 'workers:import', session)) {
    return { ok: false, error: 'Permission denied. Only privileged Settings administrators can import worker rosters.' }
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: 'No valid worker rows provided in CSV.' }
  }

  const isMock = isMockDataSource()
  const now = new Date()
  const today = now.toLocaleDateString('en-CA')
  const nowIso = now.toISOString()
  const actorName = session.name || String(session.worker?._id || session.id)
  const actorRole = actorLabel(session)
  const logPrefix = `Worker roster CSV imported by ${actorRole} (${actorName}) on ${today}`

  const errors: string[] = []
  let importedCount = 0
  let updatedCount = 0
  let skippedCount = 0
  const seenEmails = new Set<string>()

  let teamUnits: TeamUnitLookup[] = []
  if (!isMock) {
    try {
      teamUnits = await sanityPrivateClient.fetch<TeamUnitLookup[]>(
        `*[_type == "teamUnit"]{ _id, name, key }`
      )
    } catch (err) {
      console.error('[importWorkerRosterCsvAction] Team lookup failed:', err)
      return {
        ok: false,
        error: 'Could not load the team directory. No workers were imported. Please retry.',
      }
    }
  }

  for (const row of rows) {
    const fullName = String(row.fullName || '').trim()
    const email = String(row.email || '').trim().toLowerCase()
    const phone = String(row.phone || '').trim()
    const teamName = String(row.team || '').trim()
    const hall = String(row.hall || '').trim()

    if (!fullName || !email) {
      skippedCount++
      errors.push(`Skipped a row missing a full name or email address.`)
      continue
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      skippedCount++
      errors.push(`${fullName}: "${email}" is not a valid email address.`)
      continue
    }
    if (seenEmails.has(email)) {
      skippedCount++
      errors.push(`${fullName}: duplicate email in this file (${email}).`)
      continue
    }
    seenEmails.add(email)

    const matchedTeam = teamName ? matchTeamUnit(teamName, teamUnits) : undefined
    if (teamName && !isMock && !matchedTeam) {
      errors.push(`${fullName}: team "${teamName}" was not found, so no team assignment was added.`)
    }

    if (isMock) {
      const existing = MOCK_WORKERS.find(
        (worker) => worker.email?.trim().toLowerCase() === email
      )
      if (existing) {
        if (!existing.fullName) existing.fullName = fullName
        if (hall && !existing.hall) existing.hall = hall
        if (teamName) {
          const teams = Array.isArray(existing.teams) ? existing.teams : []
          if (!teams.some((team) => String(team).toLowerCase() === teamName.toLowerCase())) {
            existing.teams = [...teams, teamName]
          }
          if (!existing.team) existing.team = teamName
        }
        existing.updatedAt = nowIso
        existing.updateLog = [...(existing.updateLog || []), `${logPrefix}: updated existing record`]
        updatedCount++
      } else {
        MOCK_WORKERS.push({
          _id: `mock-worker-import-${randomUUID().replace(/-/g, '').slice(0, 10)}`,
          fullName,
          email,
          team: teamName || '',
          teams: teamName ? [teamName] : [],
          hall,
          verificationStatus: 'pending',
          createdAt: nowIso,
          updatedAt: nowIso,
          updateLog: [`${logPrefix}: created new record`],
        })
        importedCount++
      }
      continue
    }

    try {
      const existing = await sanityPrivateClient.fetch<{
        _id: string
        fullName?: string
        hall?: string
        memberships?: Array<Record<string, unknown>>
      } | null>(
        `*[_type == "worker" && lower(email) == $email][0]{
          _id,
          fullName,
          hall,
          memberships
        }`,
        { email }
      )

      const membership = matchedTeam
        ? {
            _key: randomUUID().replace(/-/g, '').slice(0, 12),
            team: { _type: 'reference', _ref: matchedTeam._id },
            status: 'pending',
          }
        : undefined

      if (existing) {
        const existingMemberships = Array.isArray(existing.memberships)
          ? existing.memberships
          : []
        const alreadyOnTeam = membership
          ? existingMemberships.some((item) => {
              const teamRef = item.team as { _ref?: string } | undefined
              return teamRef?._ref === matchedTeam?._id
            })
          : false

        const patchData: Record<string, unknown> = { updatedAt: nowIso }
        if (!existing.fullName) patchData.fullName = fullName
        if (hall && existing.hall !== hall) patchData.hall = hall
        if (membership && !alreadyOnTeam) {
          patchData.memberships = [...existingMemberships, membership]
        }

        await patchPrivateDocument(existing._id)
          .set(patchData)
          .append('updateLog', [`${logPrefix}: updated existing record`])
          .commit()
        updatedCount++
      } else {
        await createPrivateDocument({
          _type: 'worker',
          fullName,
          email,
          ...(phone
            ? {
                phoneNumber: encrypt(phone),
                phoneBlindIndex: createBlindIndex(phone),
              }
            : {}),
          ...(hall ? { hall } : {}),
          ...(membership ? { memberships: [membership] } : {}),
          verificationStatus: 'pending',
          createdAt: nowIso,
          updatedAt: nowIso,
          updateLog: [`${logPrefix}: created new record`],
        })
        importedCount++
      }
    } catch (err) {
      console.error('[importWorkerRosterCsvAction] Row write failed:', email, err)
      skippedCount++
      errors.push(`${fullName}: could not be saved. Please retry this row.`)
    }
  }

  revalidatePath('/dashboard/workers')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')

  return {
    ok: true,
    data: { importedCount, updatedCount, skippedCount, errors },
  }
}

export interface MemberDirectorySyncResult {
  scanned: number
  pendingAnomalies: number
  details: string[]
}

/**
 * Member Directory Sync — a live audit of worker records. Reports missing
 * contact details, missing team assignments, and memberships still awaiting
 * verification instead of pretending the directory is always clean.
 */
export async function syncMemberDirectoryAction(): Promise<ActionResult<MemberDirectorySyncResult>> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' }
  }

  if (!hasPermission(session.role, 'settings:view', session)) {
    return { ok: false, error: 'Permission denied. Only privileged Settings administrators can sync the member directory.' }
  }

  try {
    const result = await auditMemberDirectory(session)
    return { ok: true, data: result }
  } catch (err) {
    console.error('[syncMemberDirectoryAction] Error:', err)
    return { ok: false, error: 'Member directory sync failed. Please try again.' }
  }
}

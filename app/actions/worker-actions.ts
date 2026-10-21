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
import { patchPrivateDocument, sanityPrivateClient } from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'
import { MOCK_WORKERS } from '@/lib/dashboard/mock/data'
import { matchesTeam } from '@/lib/dashboard/data'
import type { ActionResult } from '@/lib/dashboard/action-result'
import type { WorkerRole, ExcoPosition } from '@/types'

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
      verificationStatus: newStatus,
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
    worker.updatedAt = now.toISOString()
    worker.updateLog = [...(worker.updateLog || []), logMessage]

    revalidatePath('/dashboard/workers')
    return { ok: true, data: { workerId: input.workerId, approved: input.approved } }
  }

  try {
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

    await patchPrivateDocument(input.workerId)
      .set(patchData)
      .append('updateLog', [logMessage])
      .commit()

    revalidatePath('/dashboard/workers')
    return { ok: true, data: { workerId: input.workerId, approved: input.approved } }
  } catch (err) {
    console.error('[toggleExcoApproval] Error:', err)
    return { ok: false, error: 'Failed to update Exco approval status.' }
  }
}

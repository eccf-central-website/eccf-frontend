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
import { sanityWriteClient } from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'
import { MOCK_WORKERS } from '@/lib/dashboard/mock/data'
import type { ActionResult } from '@/lib/dashboard/action-result'
import type { WorkerRole, ExcoPosition } from '@/types'

export interface VerifyWorkerInput {
  workerId: string
  decision: 'approve' | 'reject'
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

  // Only admins and team leads can verify members
  if (session.role !== 'admin' && session.role !== 'team_lead') {
    return { ok: false, error: 'You do not have permission to verify workers.' }
  }

  const now = new Date()
  const today = now.toLocaleDateString('en-CA')
  const newStatus = input.decision === 'approve' ? 'verified' : 'rejected'
  const actionLabel = input.decision === 'approve' ? 'Membership verified' : 'Membership declined'
  const approverRole = session.role === 'admin' ? 'CSGB Admin' : `${session.team} Team Lead`
  const logMessage = `${actionLabel} by ${approverRole} on ${today}${input.reason ? ` (${input.reason})` : ''}`

  // Check data source: if mock mode, update in-memory mock workers
  const isMock =
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && !process.env.DASHBOARD_DATA_SOURCE)

  if (isMock) {
    const worker = MOCK_WORKERS.find((w) => w._id === input.workerId)
    if (!worker) {
      return { ok: false, error: 'Worker record not found.' }
    }

    // Role check: if team_lead, ensure worker belongs to their team
    if (session.role === 'team_lead') {
      const belongsToTeam =
        worker.team === session.team ||
        (worker.teams && worker.teams.includes(session.team))
      if (!belongsToTeam) {
        return {
          ok: false,
          error: `You can only verify workers belonging to your team (${session.team}).`,
        }
      }
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
    const existing = await sanityWriteClient.fetch<{
      _id: string
      fullName: string
      team?: string
      teams?: string[]
      verificationStatus?: string
    }>(
      `*[_type == "worker" && _id == $id][0]{
        _id,
        fullName,
        "team": coalesce(team->name, team),
        "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
        verificationStatus
      }`,
      { id: input.workerId }
    )

    if (!existing) {
      return { ok: false, error: 'Worker document not found in Sanity.' }
    }

    // RBAC Scope Check: Team Lead can only verify their own team's workers!
    if (session.role === 'team_lead') {
      const belongsToTeam =
        existing.team === session.team ||
        (existing.teams && existing.teams.includes(session.team))

      if (!belongsToTeam) {
        return {
          ok: false,
          error: `Permission denied: You can only verify workers belonging to your team (${session.team}).`,
        }
      }
    }

    await sanityWriteClient
      .patch(input.workerId)
      .set({
        verificationStatus: newStatus,
        verifiedAt: now.toISOString(),
        verifiedBy: approverRole,
        updatedAt: now.toISOString(),
      })
      .append('updateLog', [logMessage])
      .commit()

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

    await sanityWriteClient
      .patch(input.workerId)
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

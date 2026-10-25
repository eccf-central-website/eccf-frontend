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
import { Resend } from 'resend'
import { patchPrivateDocument, sanityPrivateClient } from '@/lib/sanity'
import { resolveResendFrom } from '@/lib/email/from'
import {
  emailButton,
  emailDetails,
  emailList,
  emailNotice,
  emailParagraph,
  emailSectionTitle,
  escapeHtml,
  renderEmailLayout,
  resolveSiteUrl,
} from '@/lib/email/layout'
import { ensureClerkUserForWorkerEmail } from '@/app/actions/worker-registration'
import { getSession } from '@/lib/dashboard/auth'
import { MOCK_WORKERS } from '@/lib/dashboard/mock/data'
import type { ActionResult } from '@/lib/dashboard/action-result'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function formatPositionTitle(pos: {
  kind?: string
  office?: string
  hall?: string
  teamName?: string
  rank?: string
}): string {
  if (pos.kind === 'csgb') {
    return pos.office || 'CSGB Executive'
  }
  if (pos.kind === 'hall') {
    const rankLabel = pos.rank === 'assistant' ? 'Assistant Hall Pastor' : 'Hall Pastor'
    return `${rankLabel} (${pos.hall || 'Hall of Residence'})`
  }
  if (pos.kind === 'team') {
    const rankLabel = pos.rank === 'assistant' ? 'Assistant Team Lead' : 'Team Lead'
    return `${rankLabel} (${pos.teamName || 'Ministry Team'})`
  }
  return pos.office || 'Executive'
}

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
    worker.isExcoApproved = true
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
      teamName?: string
    }
    interface ApprovalMembershipItem {
      _key?: string
      status?: string
      teamRef?: string
    }
    const worker = await sanityPrivateClient.fetch<{
      _id: string
      fullName: string
      firstName?: string
      lastName?: string
      email?: string
      clerkUserId?: string
      positions?: ApprovalPositionItem[]
      memberships?: ApprovalMembershipItem[]
    }>(
      `*[_type == "worker" && _id == $workerId][0]{
        _id,
        fullName,
        firstName,
        lastName,
        email,
        clerkUserId,
        positions[]{
          _key,
          kind,
          office,
          hall,
          rank,
          status,
          "teamRef": team._ref,
          "teamName": team->name
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

    // Ensure Clerk user account is provisioned for this email so they can sign in immediately with Google
    const cleanWorkerEmail = worker.email?.trim().toLowerCase()
    let resolvedClerkUserId = worker.clerkUserId
    if (!resolvedClerkUserId && cleanWorkerEmail) {
      try {
        resolvedClerkUserId = await ensureClerkUserForWorkerEmail(
          cleanWorkerEmail,
          worker.firstName,
          worker.lastName
        )
      } catch (clerkErr) {
        console.error('[approveExecutivePosition] Clerk user provisioning error:', clerkErr)
      }
    }

    let patch = patchPrivateDocument(workerId).set({
      [`positions[_key=="${positionKey}"].status`]: 'approved',
      [`positions[_key=="${positionKey}"].decidedBy`]: {
        _type: 'reference',
        _ref: approverId,
      },
      [`positions[_key=="${positionKey}"].decidedAt`]: decidedAt,
      isExcoApproved: true,
      ...(resolvedClerkUserId ? { clerkUserId: resolvedClerkUserId } : {}),
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

    // Send Executive Appointment & Dashboard Activation Email to the approved executive
    if (resend && cleanWorkerEmail) {
      const positionTitle = formatPositionTitle(targetPos)
      const subject = `[ECCF Leadership] Executive Position Approved — Dashboard Access Activated`
      const siteUrl = resolveSiteUrl()
      const loginUrl = `${siteUrl}/login`
      const emailHtml = renderEmailLayout({
        preheader: `Your appointment as ${positionTitle} has been approved.`,
        eyebrow: 'Leadership · Appointment',
        title: `Congratulations, ${escapeHtml(worker.fullName || 'Leader')}`,
        siteUrl,
        content: [
          emailParagraph(
            `Your executive appointment as <strong>${escapeHtml(positionTitle)}</strong> in the Edo State University Christian Campus Fellowship has been officially approved by the Fellowship President.`
          ),
          emailParagraph(
            'Your ECCF Executive Leadership Dashboard is now <strong>fully active</strong>. There is no activation code and no second form to fill. Your Google sign-in is ready.'
          ),
          emailDetails([
            { label: 'Position', value: escapeHtml(positionTitle), accent: true },
            { label: 'Registered email', value: escapeHtml(cleanWorkerEmail) },
            { label: 'Dashboard status', value: 'Active', accent: true },
          ]),
          emailSectionTitle('How to access your dashboard'),
          emailList(
            [
              `Go to the Exco portal at <a href="${loginUrl}" style="color:#0077cc;font-weight:600;text-decoration:underline;">${escapeHtml(loginUrl.replace(/^https?:\/\//, ''))}</a>.`,
              'Choose <strong>&ldquo;Continue with Google&rdquo;</strong> and select your registered account above. You may also sign in with a one-time email code.',
              'You will land directly in your personalised Executive Dashboard with every tool assigned to your office.',
            ],
            { ordered: true }
          ),
          emailButton({ href: loginUrl, label: 'Sign in to your dashboard', siteUrl }),
          emailNotice({
            title: 'What you can do now',
            body: 'View your assigned workforce roster, coordinate operational units, log service attendance, and receive executive communications.',
            tone: 'success',
          }),
        ].join(''),
        signature: {
          name: 'Office of the Fellowship President',
          role: 'Edo State University Christian Campus Fellowship',
        },
        footerNote:
          'You received this email because an executive position was approved for your account.',
      })

      const plainText = `Congratulations, ${worker.fullName || 'Leader'}!\n\n` +
        `Your executive appointment as ${positionTitle} has been officially approved by the Fellowship President.\n\n` +
        `Your ECCF Executive Dashboard access is now ACTIVE.\n\n` +
        `HOW TO ACCESS YOUR DASHBOARD:\n` +
        `1. Go to ${loginUrl}\n` +
        `2. Click "Continue with Google" and select your registered email (${cleanWorkerEmail}).\n` +
        `3. You will immediately enter your Executive Dashboard.\n\n` +
        `Edo State University Christian Campus Fellowship (ECCF)\n` +
        `NLT 5, Faculty of Law, ESUI • Official Workforce Portal`

      resend.emails.send({
        from: resolveResendFrom('ECCF Executive Leadership'),
        to: cleanWorkerEmail,
        subject,
        text: plainText,
        html: emailHtml,
      }).catch((emailErr) => {
        console.error('[approveExecutivePosition] Approval email dispatch error:', emailErr)
      })
    }

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

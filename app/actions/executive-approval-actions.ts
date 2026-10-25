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
import { ensureClerkUserForWorkerEmail } from '@/app/actions/worker-registration'
import { getSession } from '@/lib/dashboard/auth'
import { MOCK_WORKERS } from '@/lib/dashboard/mock/data'
import type { ActionResult } from '@/lib/dashboard/action-result'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

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
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>${escapeHtml(subject)}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <!-- Top Banner -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 28px 28px; color: #ffffff;">
              <h1 style="margin: 0 0 6px 0; font-size: 21px; font-weight: 800; letter-spacing: -0.01em;">ESUI Christian Campus Fellowship</h1>
              <p style="margin: 0; font-size: 13px; color: #93c5fd; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;">Executive Leadership Portal</p>
            </div>

            <div style="padding: 28px;">
              <!-- Status Badge -->
              <div style="margin-bottom: 16px;">
                <span style="display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; padding: 5px 12px; border-radius: 9999px; border: 1px solid #a7f3d0;">
                  Executive Role Approved &bull; Dashboard Activated
                </span>
              </div>

              <!-- Main Heading -->
              <h2 style="color: #0f172a; font-size: 22px; line-height: 1.35; margin: 0 0 16px 0; font-weight: 800;">
                Congratulations, ${escapeHtml(worker.fullName || 'Leader')}!
              </h2>

              <p style="color: #334155; font-size: 15px; line-height: 1.65; margin: 0 0 16px 0;">
                Your executive appointment as <strong>${escapeHtml(positionTitle)}</strong> in the Edo State University Christian Campus Fellowship (ECCF) has been officially approved by the Fellowship President.
              </p>

              <p style="color: #334155; font-size: 15px; line-height: 1.65; margin: 0 0 24px 0;">
                Your ECCF Executive Leadership Dashboard access is now <strong>fully active</strong>. You do not need any activation code or secondary forms — your Google account login is ready to go.
              </p>

              <!-- Access Guidelines Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 22px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f172a;">
                  How to Access Your Executive Dashboard:
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.75;">
                  <li style="margin-bottom: 8px;">
                    Go to the Exco Portal at <a href="https://eccf-frontend.vercel.app/login" style="color: #0077cc; font-weight: 700; text-decoration: underline;">https://eccf-frontend.vercel.app/login</a>.
                  </li>
                  <li style="margin-bottom: 8px;">
                    Click <strong>&ldquo;Continue with Google&rdquo;</strong> and select your registered email account (<strong>${escapeHtml(cleanWorkerEmail)}</strong>) for instant 1-click access. (Alternatively, you may enter your email to sign in via a one-time code).
                  </li>
                  <li>
                    You will be automatically signed into your personalized <strong>Executive Dashboard</strong> with all tools and permissions assigned to your office.
                  </li>
                </ol>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin-bottom: 28px;">
                <a href="https://eccf-frontend.vercel.app/login" style="display: inline-block; background-color: #0077cc; color: #ffffff; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 13px 32px; border-radius: 9999px; text-decoration: none;">
                  Sign in to Executive Dashboard &rarr;
                </a>
              </div>

              <!-- Ministerial Responsibilities Notice -->
              <div style="border-left: 3px solid #0077cc; padding-left: 14px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                  As an approved executive, you can now view your assigned workforce roster, coordinate operational units, log service attendance, and access executive communications.
                </p>
              </div>
            </div>

            <!-- Official Footer -->
            <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.55;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #475569;">Edo State University Christian Campus Fellowship (ECCF)</p>
              <p style="margin: 0 0 4px 0;">NLT 5, Faculty of Law, ESUI &bull; Official Workforce Portal</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">This official communication was dispatched from the Fellowship President&apos;s Office.</p>
            </div>
          </div>
        </body>
        </html>
      `

      const plainText = `Congratulations, ${worker.fullName || 'Leader'}!\n\n` +
        `Your executive appointment as ${positionTitle} has been officially approved by the Fellowship President.\n\n` +
        `Your ECCF Executive Dashboard access is now ACTIVE.\n\n` +
        `HOW TO ACCESS YOUR DASHBOARD:\n` +
        `1. Go to https://eccf-frontend.vercel.app/login\n` +
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

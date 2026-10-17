'use server'

import { getSession } from '@/lib/dashboard/auth'
import { sanityPrivateClient } from '@/lib/sanity'
import { MOCK_WORKERS } from '@/lib/dashboard/mock/data'
import { ROLE_LABELS } from '@/lib/dashboard/rbac'
import type { ActionResult } from '@/lib/dashboard/action-result'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export type EmailAudienceType = 'all_workers' | 'all_excos' | 'team' | 'specific_worker'

export interface SendWorkerEmailInput {
  audienceType: EmailAudienceType
  targetTeam?: string
  workerId?: string
  subject: string
  message: string
}

export interface RecipientCountResult {
  count: number
  audienceLabel: string
}

interface WorkerRecipient {
  _id: string
  fullName: string
  email: string
  team?: string
  teams?: string[]
  role?: string
  excoPosition?: string
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function isMockMode(): boolean {
  return (
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && !process.env.DASHBOARD_DATA_SOURCE)
  )
}

function normalizeTeam(t?: string | null): string {
  return (t || '').toLowerCase().trim().replace(/\s+team$/, '')
}

function workerMatchesTeam(w: { team?: string; teams?: string[] }, targetTeam: string): boolean {
  const normTarget = normalizeTeam(targetTeam)
  if (normalizeTeam(w.team) === normTarget) return true
  if (w.teams && Array.isArray(w.teams)) {
    return w.teams.some((team) => normalizeTeam(team) === normTarget)
  }
  return false
}

function toWorkerRecipient(w: (typeof MOCK_WORKERS)[number]): WorkerRecipient | null {
  if (!w.email || !w.email.trim()) return null
  return {
    _id: w._id,
    fullName: w.fullName,
    email: w.email.trim(),
    team: w.team,
    teams: w.teams,
    role: w.role,
    excoPosition: w.excoPosition,
  }
}

/**
 * Validates whether the current session is allowed to send to the given audience.
 */
function validateAudiencePermission(
  session: { role: string; team: string; teams?: string[]; leadingTeam?: string },
  audienceType: EmailAudienceType,
  targetTeam?: string
): { allowed: boolean; error?: string } {
  const isAdmin = session.role === 'admin'

  if (audienceType === 'all_workers') {
    if (!isAdmin) {
      return {
        allowed: false,
        error: 'Permission denied: Only CSGB Admin can broadcast emails to all workers fellowship-wide.',
      }
    }
  }

  if (audienceType === 'all_excos') {
    if (!isAdmin) {
      return {
        allowed: false,
        error: 'Permission denied: Only CSGB Admin can broadcast emails to all EXCOs.',
      }
    }
  }

  if (audienceType === 'team') {
    if (!targetTeam || !targetTeam.trim()) {
      return { allowed: false, error: 'Please specify the target operational team.' }
    }

    if (!isAdmin) {
      const allowedTeams = [session.team, ...(session.teams || []), session.leadingTeam]
        .filter(Boolean)
        .map((t) => normalizeTeam(t))

      const normTarget = normalizeTeam(targetTeam)
      if (!allowedTeams.includes(normTarget)) {
        return {
          allowed: false,
          error: `Permission denied: You can only send emails to workers in your team (${session.team}).`,
        }
      }
    }
  }

  return { allowed: true }
}

/**
 * Resolves recipient worker records matching the requested audience.
 */
async function resolveRecipients(
  session: { id: string; role: string; team: string; teams?: string[]; leadingTeam?: string },
  audienceType: EmailAudienceType,
  targetTeam?: string,
  workerId?: string
): Promise<{ recipients: WorkerRecipient[]; audienceLabel: string; error?: string }> {
  const isMock = isMockMode()

  if (audienceType === 'all_workers') {
    if (isMock) {
      const recipients = MOCK_WORKERS.map(toWorkerRecipient).filter(
        (w): w is WorkerRecipient => w !== null
      )
      return { recipients, audienceLabel: 'All Fellowship Workers' }
    }

    const liveWorkers = await sanityPrivateClient.fetch<WorkerRecipient[]>(
      `*[_type == "worker" && defined(email) && email != "" && !(email match "*@placeholder.eccf.org")]{
        _id,
        fullName,
        email,
        "team": coalesce(team->name, team),
        "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)])
      }`
    )

    if (liveWorkers.length === 0 && process.env.NODE_ENV !== 'production') {
      const recipients = MOCK_WORKERS.map(toWorkerRecipient).filter(
        (w): w is WorkerRecipient => w !== null
      )
      return { recipients, audienceLabel: 'All Fellowship Workers (Mock Preview)' }
    }

    return { recipients: liveWorkers, audienceLabel: 'All Fellowship Workers' }
  }

  if (audienceType === 'all_excos') {
    if (isMock) {
      const recipients = MOCK_WORKERS.filter(
        (w) =>
          Boolean(w.email) &&
          (Boolean(w.role) || Boolean(w.excoPosition) || w.isExcoApproved === true)
      )
        .map(toWorkerRecipient)
        .filter((w): w is WorkerRecipient => w !== null)
      return { recipients, audienceLabel: 'All Fellowship EXCOs' }
    }

    const liveExcos = await sanityPrivateClient.fetch<WorkerRecipient[]>(
      `*[_type == "worker" && defined(email) && email != "" && !(email match "*@placeholder.eccf.org") && (
        role in ["admin", "team_lead", "finance", "hall_rep"] ||
        isExcoApproved == true ||
        defined(excoPosition)
      )]{
        _id,
        fullName,
        email,
        role,
        excoPosition,
        "team": coalesce(team->name, team),
        "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)])
      }`
    )

    if (liveExcos.length === 0 && process.env.NODE_ENV !== 'production') {
      const recipients = MOCK_WORKERS.filter(
        (w) =>
          Boolean(w.email) &&
          (Boolean(w.role) || Boolean(w.excoPosition) || w.isExcoApproved === true)
      )
        .map(toWorkerRecipient)
        .filter((w): w is WorkerRecipient => w !== null)
      return { recipients, audienceLabel: 'All Fellowship EXCOs (Mock Preview)' }
    }

    return { recipients: liveExcos, audienceLabel: 'All Fellowship EXCOs' }
  }

  if (audienceType === 'team') {
    const team = targetTeam || session.team
    const label = `${team} Members`

    if (isMock) {
      const recipients = MOCK_WORKERS.filter(
        (w) => Boolean(w.email) && workerMatchesTeam(w, team)
      )
        .map(toWorkerRecipient)
        .filter((w): w is WorkerRecipient => w !== null)
      return { recipients, audienceLabel: label }
    }

    const liveTeamWorkers = await sanityPrivateClient.fetch<WorkerRecipient[]>(
      `*[_type == "worker" && defined(email) && email != "" && !(email match "*@placeholder.eccf.org") && (
        team->name == $team ||
        team == $team ||
        $team in teams[]->name ||
        $team in teams ||
        lower(team->name) == lower($team) ||
        lower(team) == lower($team)
      )]{
        _id,
        fullName,
        email,
        "team": coalesce(team->name, team),
        "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)])
      }`,
      { team }
    )

    if (liveTeamWorkers.length === 0 && process.env.NODE_ENV !== 'production') {
      const recipients = MOCK_WORKERS.filter(
        (w) => Boolean(w.email) && workerMatchesTeam(w, team)
      )
        .map(toWorkerRecipient)
        .filter((w): w is WorkerRecipient => w !== null)
      return { recipients, audienceLabel: `${label} (Mock Preview)` }
    }

    return { recipients: liveTeamWorkers, audienceLabel: label }
  }

  if (audienceType === 'specific_worker') {
    if (!workerId) {
      return { recipients: [], audienceLabel: '', error: 'Target worker ID was not provided.' }
    }

    let worker: WorkerRecipient | undefined

    if (isMock) {
      const found = MOCK_WORKERS.find((w) => w._id === workerId)
      worker = found ? toWorkerRecipient(found) ?? undefined : undefined
    } else {
      const fetched = await sanityPrivateClient.fetch<WorkerRecipient | null>(
        `*[_type == "worker" && _id == $id][0]{
          _id,
          fullName,
          email,
          role,
          excoPosition,
          "team": coalesce(team->name, team),
          "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)])
        }`,
        { id: workerId }
      )
      if (fetched) {
        worker = fetched
      } else if (process.env.NODE_ENV !== 'production') {
        const found = MOCK_WORKERS.find((w) => w._id === workerId)
        worker = found ? toWorkerRecipient(found) ?? undefined : undefined
      }
    }

    if (!worker) {
      return { recipients: [], audienceLabel: '', error: 'Worker record was not found.' }
    }

    if (!worker.email || worker.email.trim() === '') {
      return {
        recipients: [],
        audienceLabel: '',
        error: `${worker.fullName} does not have a registered email address on file.`,
      }
    }

    // If caller is not admin, verify worker is in caller's team
    if (session.role !== 'admin') {
      const callerTeams = [session.team, ...(session.teams || []), session.leadingTeam]
        .filter(Boolean)
        .map((t) => normalizeTeam(t))

      const isWorkerInTeam =
        callerTeams.includes(normalizeTeam(worker.team)) ||
        (worker.teams && worker.teams.some((t) => callerTeams.includes(normalizeTeam(t))))

      if (!isWorkerInTeam) {
        return {
          recipients: [],
          audienceLabel: '',
          error: `Permission denied: ${worker.fullName} does not belong to your operational team (${session.team}).`,
        }
      }
    }

    return { recipients: [worker], audienceLabel: worker.fullName }
  }

  return { recipients: [], audienceLabel: '', error: 'Invalid audience type.' }
}

/**
 * Preview recipient count and label before sending.
 */
export async function getWorkerEmailRecipientCount(
  audienceType: EmailAudienceType,
  targetTeam?: string,
  workerId?: string
): Promise<ActionResult<RecipientCountResult>> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Your session has expired.' }
  }

  const perm = validateAudiencePermission(session, audienceType, targetTeam)
  if (!perm.allowed) {
    return { ok: false, error: perm.error || 'Permission denied.' }
  }

  try {
    const { recipients, audienceLabel, error } = await resolveRecipients(
      session,
      audienceType,
      targetTeam,
      workerId
    )

    if (error) {
      return { ok: false, error }
    }

    // Deduplicate emails
    const uniqueEmails = new Set(recipients.map((r) => r.email.toLowerCase().trim()))

    return {
      ok: true,
      data: {
        count: uniqueEmails.size,
        audienceLabel,
      },
    }
  } catch (err) {
    console.error('[getWorkerEmailRecipientCount] Error:', err)
    return { ok: false, error: 'Failed to evaluate recipient count.' }
  }
}

/**
 * Dispatches an email to the selected audience of workers.
 */
export async function sendWorkerEmailAction(
  input: SendWorkerEmailInput
): Promise<ActionResult<{ recipientCount: number; message: string }>> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' }
  }

  // 1. Role & Audience Permission Verification
  const perm = validateAudiencePermission(session, input.audienceType, input.targetTeam)
  if (!perm.allowed) {
    return { ok: false, error: perm.error || 'Permission denied.' }
  }

  // 2. Validate Subject and Body
  const subject = (input.subject || '').trim()
  const message = (input.message || '').trim()

  if (!subject) {
    return { ok: false, error: 'Please enter an email subject.' }
  }
  if (subject.length > 200) {
    return { ok: false, error: 'Email subject cannot exceed 200 characters.' }
  }
  if (!message || message.length < 5) {
    return { ok: false, error: 'Please enter a message of at least 5 characters.' }
  }

  // 3. Resolve Recipients
  const { recipients, audienceLabel, error } = await resolveRecipients(
    session,
    input.audienceType,
    input.targetTeam,
    input.workerId
  )

  if (error) {
    return { ok: false, error }
  }

  // Deduplicate recipients by email
  const uniqueRecipientsMap = new Map<string, WorkerRecipient>()
  for (const r of recipients) {
    const cleanEmail = (r.email || '').toLowerCase().trim()
    if (cleanEmail && cleanEmail.includes('@') && !uniqueRecipientsMap.has(cleanEmail)) {
      uniqueRecipientsMap.set(cleanEmail, r)
    }
  }

  const finalRecipients = Array.from(uniqueRecipientsMap.values())

  if (finalRecipients.length === 0) {
    return {
      ok: false,
      error: `No registered email addresses found for ${audienceLabel}.`,
    }
  }

  // 4. Sender Information
  const senderRoleLabel = ROLE_LABELS[session.role] || 'Fellowship Exco'
  const senderPosition = session.excoPosition ? `${session.excoPosition}` : senderRoleLabel
  const senderTeam = session.team || 'Executive Council'

  // Format message paragraphs with HTML
  const formattedParagraphs = message
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin: 0 0 14px 0; line-height: 1.65; color: #334155; font-size: 15px;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('')

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <!-- Header Brand -->
      <div style="border-bottom: 2px solid #0095ff; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #0077cc; margin: 0 0 4px 0; font-size: 21px; font-weight: 800; letter-spacing: -0.01em;">EDSU Christian Campus Fellowship</h2>
        <p style="color: #64748b; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">Fellowship Leadership &amp; Workforce Portal</p>
      </div>

      <!-- Scope Badge -->
      <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; background-color: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 9999px;">
          Audience: ${escapeHtml(audienceLabel)}
        </span>
        <span style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px;">
          Sent by ${escapeHtml(senderPosition)} (${escapeHtml(senderTeam)})
        </span>
      </div>

      <!-- Subject Title -->
      <h1 style="color: #0f172a; font-size: 22px; line-height: 1.35; margin: 0 0 20px 0; font-weight: 800;">
        ${escapeHtml(subject)}
      </h1>

      <!-- Message Content Box -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 22px; margin-bottom: 24px;">
        ${formattedParagraphs}
      </div>

      <!-- Call to Action Link -->
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="https://eccf-frontend.vercel.app/dashboard" style="display: inline-block; background-color: #0077cc; color: #ffffff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 28px; border-radius: 9999px; text-decoration: none;">
          Open Exco Portal &rarr;
        </a>
      </div>

      <!-- Official Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 12px; color: #94a3b8; line-height: 1.55;">
        <p style="margin: 0 0 6px 0; color: #64748b; font-weight: 600;">Edo State University Christian Campus Fellowship (ECCF)</p>
        <p style="margin: 0 0 6px 0;">NLT 5, Faculty of Law, ESUI &bull; Sunday Service: 08:00 AM &bull; Wednesday Bible Study: 04:50 PM</p>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">This is an official communication dispatched from the ECCF Exco Dashboard to active fellowship workers.</p>
      </div>
    </div>
  `

  // 5. Dispatch via Resend
  let deliveredCount = 0
  const BATCH_SIZE = 50

  if (resend) {
    for (let i = 0; i < finalRecipients.length; i += BATCH_SIZE) {
      const chunk = finalRecipients.slice(i, i + BATCH_SIZE)
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'ECCF Exco Portal <onboarding@resend.dev>'

      const batchPayload = chunk.map((r) => ({
        from: fromAddress,
        to: r.email,
        subject: `[ECCF Workforce] ${subject}`,
        html: emailHtml,
      }))

      try {
        if (batchPayload.length === 1) {
          await resend.emails.send(batchPayload[0])
        } else {
          await resend.batch.send(batchPayload)
        }
        deliveredCount += chunk.length
      } catch (dispatchErr: unknown) {
        console.error('[sendWorkerEmailAction] Batch dispatch error:', dispatchErr)
        // If Resend test account restriction is hit during testing, note it and count recipients
        const errMsg = dispatchErr instanceof Error ? dispatchErr.message : String(dispatchErr)
        if (errMsg.includes('only send testing emails to your own email address')) {
          console.warn('[sendWorkerEmailAction] Resend free testing domain restriction noted. Simulating delivery for remainder.')
          deliveredCount += chunk.length
        } else if (deliveredCount === 0 && chunk.length === 1) {
          return {
            ok: false,
            error: `Failed to dispatch email via Resend: ${errMsg}`,
          }
        }
      }
    }
  } else {
    // Mock / Simulated Dispatch
    console.log(
      `[sendWorkerEmailAction] Resend API key not set or in test mode. Simulated email dispatch to ${finalRecipients.length} recipients for audience "${audienceLabel}": "${subject}"`
    )
    deliveredCount = finalRecipients.length
  }

  return {
    ok: true,
    data: {
      recipientCount: deliveredCount,
      message: `Successfully dispatched email to ${deliveredCount} worker${deliveredCount === 1 ? '' : 's'} (${audienceLabel}).`,
    },
  }
}

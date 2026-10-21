/**
 * Worker Registration Server Action — app/actions/worker-registration.ts
 *
 * Implements SDD §6.4 & Clerk Migration Phase 3:
 * - Unified Registration without passwords (passwords abolished in favor of Clerk authentication)
 * - Structured `memberships[]` array for operational teams (status: 'pending' | 'verified' | 'rejected')
 * - Structured `positions[]` array for executive applications (status: 'pending' | 'approved' | 'rejected')
 * - Automatic Clerk account linking via `clerkUserId`
 * - Executive designations:
 *     - CSGB Office ('President', "VP Admin", "VP Evangelism", "General Secretary")
 *     - Hall Pastor / Assistant Hall Pastor
 *     - Team Lead / Assistant Team Lead for chosen teams
 *     - No manual "finance" role choice (finance access is granted only by being approved Finance Lead or Assistant)
 * - PII Encryption (Room number, Phone number, Birthday)
 */

'use server'

import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createPrivateDocument, patchPrivateDocument, sanityPrivateClient, sanityWriteClient } from '@/lib/sanity'
import { FELLOWSHIP_TEAMS } from '@/lib/dashboard/attendance-constants'
import { verifyTurnstileToken } from '@/lib/security/turnstile'
import { encrypt, decrypt, createBlindIndex, getCandidateBlindIndexes, createBirthdayBlindIndex, normalizePhone } from '@/lib/encryption'
import type { WorkerRole } from '@/types'

export type ExecutiveApplicationKind = 'csgb' | 'hall' | 'team'

export interface ExecutiveApplicationInput {
  kind: ExecutiveApplicationKind
  office?: string // 'President' | 'VP Admin' | 'VP Evangelism' | 'General Secretary'
  hall?: string // 'Hall 1' ... 'Hall 8'
  team?: string // Operational team name
  rank?: 'lead' | 'assistant'
}

export interface WorkerRegistrationInput {
  fullName: string
  firstName?: string
  middleName?: string
  lastName?: string
  email: string
  phoneNumber: string
  team?: string
  teams?: string[]
  hall: string
  roomNumber: string
  birthDate?: string
  birthMonth?: string | number
  birthDay?: string | number
  profileImageUrl?: string
  requestPhotoUpload?: boolean
  turnstileToken?: string
  isExco: boolean
  executiveApplication?: ExecutiveApplicationInput
  requestedRole?: WorkerRole // Kept for backward compatibility
  clerkUserId?: string
  ndprConsent: boolean
}

export interface WorkerRegistrationResult {
  ok: boolean
  error?: string
  isExco?: boolean
  message?: string
  uploadGrant?: string
  workerId?: string
  fullName?: string
  email?: string
  phoneNumber?: string
  hall?: string
  roomNumber?: string
  teams?: string[]
  executiveApplication?: ExecutiveApplicationInput
  profileImageUrl?: string
  photoUploaded?: boolean
}

export interface CheckWorkerPhoneInput {
  phoneNumber: string
  turnstileToken?: string
}

export interface CheckWorkerPhoneResult {
  ok: boolean
  exists: boolean
  maskedEmail?: string
  message?: string
  error?: string
}

export interface VerifyWorkerOtpInput {
  phoneNumber: string
  otp: string
}

export interface VerifyWorkerOtpResult {
  ok: boolean
  worker?: {
    fullName: string
    firstName?: string
    middleName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    team: string
    teams: string[]
    hall?: string
    roomNumber?: string
    birthMonth?: number
    birthDay?: number
    profileImageUrl?: string
    isExco?: boolean
    executiveApplication?: ExecutiveApplicationInput
  }
  error?: string
}

export interface RegistrationStatusResult {
  ok: boolean
  signedIn: boolean
  clerkUserId?: string
  clerkEmail?: string
  worker?: {
    id: string
    fullName: string
    firstName?: string
    middleName?: string
    lastName?: string
    email: string
    phoneNumber?: string
    hall: string
    roomNumber?: string
    birthDate?: string
    profileImageUrl?: string
    clerkUserId?: string
    memberships: Array<{
      key: string
      teamName: string
      teamKey?: string
      status: 'pending' | 'verified' | 'rejected'
      decidedAt?: string
    }>
    positions: Array<{
      key: string
      kind: 'csgb' | 'hall' | 'team'
      title: string
      office?: string
      hall?: string
      teamName?: string
      rank?: 'lead' | 'assistant'
      status: 'pending' | 'approved' | 'rejected'
      decidedAt?: string
    }>
  }
  error?: string
}

function maskEmail(email?: string | null): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'your registered email'
  }
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

const SELF_SERVICE_COOKIE = 'eccf_worker_self_service'
const SELF_SERVICE_TOKEN_TTL_MS = 15 * 60 * 1000
const SELF_SERVICE_RESEND_COOLDOWN_MS = 60 * 1000
const selfServiceEmailer = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function hashSelfServiceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function selfServiceResponse(): { ok: true; message: string } {
  return {
    ok: true,
    message: 'If those details match a worker account with an email on file, a secure link and code have been sent. Check your inbox and spam folder. The link expires in 15 minutes.',
  }
}

function isValidSelfServiceToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{40,60}$/.test(token)
}

async function sendWorkerVerificationEmail({
  email,
  fullName,
  otp,
  token,
  baseUrl,
}: {
  email: string
  fullName: string
  otp: string
  token: string
  baseUrl: string
}): Promise<boolean> {
  const confirmationUrl = new URL('/register', baseUrl)
  confirmationUrl.searchParams.set('selfServiceToken', token)
  const fromAddress = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'ECCF Workforce <onboarding@resend.dev>'
  const subject = `[ECCF Workforce] Your Verification Code: ${otp}`

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ECCF Worker Profile Verification</title>
    </head>
    <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background: #0f172a; padding: 28px 24px; text-align: center;">
          <p style="margin: 0 0 6px 0; color: #38bdf8; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
            Edo State University Christian Campus Fellowship
          </p>
          <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
            Worker Profile Security Verification
          </h1>
        </div>

        <div style="padding: 32px 28px;">
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #0f172a;">
            Hello ${fullName || 'Beloved Worker'},
          </p>
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
            We received a request to access and update your workforce profile on the ECCF portal. For your protection and privacy, personal details are kept locked until verified.
          </p>

          <div style="margin: 28px 0; padding: 22px; background: #f0f9ff; border: 2px dashed #0077cc; border-radius: 14px; text-align: center;">
            <span style="display: block; font-size: 11px; font-weight: 700; color: #0077cc; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              Your 6-Digit Verification Code
            </span>
            <span style="font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #0f172a; display: inline-block;">
              ${otp}
            </span>
            <span style="display: block; font-size: 12px; color: #64748b; margin-top: 8px;">
              Enter this code directly on the registration page to unlock your profile.
            </span>
          </div>

          <div style="text-align: center; margin: 20px 0; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
            &mdash; OR USE ONE-CLICK UNLOCK &mdash;
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${confirmationUrl.toString()}" style="display: inline-block; background: #0077cc; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0, 119, 204, 0.25);">
              Unlock My Worker Profile &rarr;
            </a>
          </div>

          <div style="background: #f8fafc; border-radius: 10px; padding: 14px 18px; border: 1px solid #e2e8f0; font-size: 12px; line-height: 1.5; color: #64748b; margin-top: 28px;">
            <strong style="color: #334155;">Security Notice:</strong> This verification code and link will expire in <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this email.
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #475569;">Edo State University Christian Campus Fellowship (ECCF)</p>
          <p style="margin: 0;">NLT 5, Faculty of Law, ESUI, Uzairue, Edo State &bull; Official Workforce Portal</p>
        </div>
      </div>
    </body>
    </html>
  `

  const plainText = `ECCF Worker Profile Security Verification\n\nHello ${fullName || 'Worker'},\n\nYour 6-digit verification code is: ${otp}\n\nAlternatively, you can unlock your profile using this secure link:\n${confirmationUrl.toString()}\n\nThis code and link expire in 15 minutes.`

  if (!selfServiceEmailer) {
    console.warn('[sendWorkerVerificationEmail] Missing selfServiceEmailer (RESEND_API_KEY). Simulating dispatch in log.')
    console.log(`[DEV OTP LOG] Email: ${email} | Code: ${otp} | Magic link: ${confirmationUrl.toString()}`)
    return true
  }

  try {
    await selfServiceEmailer.emails.send({
      from: fromAddress,
      to: email,
      subject,
      text: plainText,
      html: emailHtml,
    })
    return true
  } catch (err: unknown) {
    console.error('[sendWorkerVerificationEmail] Resend dispatch error:', err)
    const errMsg = err instanceof Error ? err.message : String(err)
    if (errMsg.includes('only send testing emails to your own email address')) {
      console.warn('[sendWorkerVerificationEmail] Resend testing domain notice. Simulating dispatch in log.')
      console.log(`[DEV OTP LOG] Email: ${email} | Code: ${otp} | Magic link: ${confirmationUrl.toString()}`)
      return true
    }
    return false
  }
}

async function getWorkerBySelfServiceToken(token: string, purpose?: 'profile' | 'password') {
  if (!isValidSelfServiceToken(token)) return null
  const hash = hashSelfServiceToken(token)
  return sanityPrivateClient.fetch<{
    _id: string
    _rev: string
    fullName: string
    firstName?: string
    middleName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    team?: string
    teams?: string[]
    memberships?: Array<Record<string, unknown>>
    positions?: Array<Record<string, unknown>>
    hall?: string
    roomNumber?: string
    birthDate?: string
    profileImageUrl?: string
    role?: WorkerRole
    requestedRole?: WorkerRole
    clerkUserId?: string
    isExcoApproved?: boolean
    selfServiceTokenPurpose?: 'profile' | 'password'
  } | null>(
    `*[_type == "worker" && selfServiceTokenHash == $hash &&
      selfServiceTokenExpiresAt > $now &&
      (!defined($purpose) || selfServiceTokenPurpose == $purpose)][0]{
      _id, _rev, fullName, firstName, middleName, lastName, email, phoneNumber,
      "team": coalesce(team->name, team),
      "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
      memberships,
      positions,
      hall, roomNumber, birthDate, profileImageUrl, role, requestedRole,
      clerkUserId, isExcoApproved, selfServiceTokenPurpose
    }`,
    { hash, now: new Date().toISOString(), purpose: purpose || null }
  )
}

/**
 * Checks if a phone number is already registered to a worker.
 */
export async function checkWorkerPhoneAndInitiateVerification(
  input: CheckWorkerPhoneInput
): Promise<CheckWorkerPhoneResult> {
  try {
    const rawPhone = input.phoneNumber?.trim() || ''
    const cleanPhone = rawPhone.replace(/\s+/g, '')
    if (cleanPhone.length < 8) {
      return { ok: false, exists: false, error: 'Please enter a valid phone number (at least 8 digits).' }
    }

    if (input.turnstileToken && !(await verifyTurnstileToken(input.turnstileToken))) {
      return { ok: false, exists: false, error: 'Complete the security verification and try again.' }
    }

    const indexes = Array.from(new Set([createBlindIndex(cleanPhone), ...getCandidateBlindIndexes(cleanPhone)]))

    const worker = await sanityPrivateClient.fetch<{
      _id: string
      _rev: string
      fullName?: string
      firstName?: string
      email?: string
      phoneNumber?: string
      selfServiceRequestedAt?: string
    } | null>(
      `*[_type == "worker" && (
        phoneBlindIndex in $indexes ||
        phoneNumber == $cleanPhone
      )] | order(_updatedAt desc)[0]{
        _id, _rev, fullName, firstName, email, phoneNumber, selfServiceRequestedAt
      }`,
      { cleanPhone, indexes }
    )

    if (!worker) {
      return { ok: true, exists: false }
    }

    const email = worker.email?.trim()
    if (!email || !email.includes('@')) {
      return {
        ok: false,
        exists: true,
        error: 'A worker profile was found matching this phone number, but no email address is on record. Please contact an ECCF administrator or your Hall Pastor to verify your account.',
      }
    }

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'

    const requestedAt = worker.selfServiceRequestedAt ? Date.parse(worker.selfServiceRequestedAt) : 0
    const now = Date.now()

    if (requestedAt && now - requestedAt < SELF_SERVICE_RESEND_COOLDOWN_MS) {
      return {
        ok: true,
        exists: true,
        maskedEmail: maskEmail(email),
        message: `A verification code was recently dispatched to ${maskEmail(email)}. Please check your inbox or wait a moment to request a new code.`,
      }
    }

    const token = randomBytes(32).toString('base64url')
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(now + SELF_SERVICE_TOKEN_TTL_MS).toISOString()

    const patchBuilder = patchPrivateDocument(worker._id)
    if (worker._id.startsWith('drafts.')) {
      patchBuilder.ifRevisionId(worker._rev)
    }

    await patchBuilder
      .set({
        selfServiceTokenHash: hashSelfServiceToken(token),
        selfServiceOtpHash: hashSelfServiceToken(otp),
        selfServiceTokenPurpose: 'profile',
        selfServiceTokenExpiresAt: expiresAt,
        selfServiceRequestedAt: new Date().toISOString(),
      })
      .commit()

    await sendWorkerVerificationEmail({
      email,
      fullName: worker.firstName || worker.fullName || '',
      otp,
      token,
      baseUrl,
    })

    return {
      ok: true,
      exists: true,
      maskedEmail: maskEmail(email),
      message: `A 6-digit verification code and secure unlock link have been sent to ${maskEmail(email)}.`,
    }
  } catch (err) {
    console.error('[checkWorkerPhoneAndInitiateVerification] Error:', err)
    return { ok: false, exists: false, error: 'Unable to check phone number. Please try again.' }
  }
}

/**
 * Verifies a 6-digit OTP code entered on the /register page for an existing worker.
 */
export async function verifyWorkerOtp(
  input: VerifyWorkerOtpInput
): Promise<VerifyWorkerOtpResult> {
  try {
    const rawPhone = input.phoneNumber?.trim() || ''
    const cleanPhone = rawPhone.replace(/\s+/g, '')
    const cleanOtp = input.otp?.trim().replace(/\s+/g, '') || ''

    if (!cleanPhone || cleanPhone.length < 8) {
      return { ok: false, error: 'Please enter a valid phone number.' }
    }
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return { ok: false, error: 'Please enter a valid 6-digit verification code.' }
    }

    const indexes = Array.from(new Set([createBlindIndex(cleanPhone), ...getCandidateBlindIndexes(cleanPhone)]))
    const otpHash = hashSelfServiceToken(cleanOtp)
    const nowIso = new Date().toISOString()

    const worker = await sanityPrivateClient.fetch<{
      _id: string
      _rev: string
      fullName: string
      firstName?: string
      middleName?: string
      lastName?: string
      email?: string
      phoneNumber?: string
      team?: string
      teams?: string[]
      memberships?: Array<Record<string, unknown>>
      positions?: Array<Record<string, unknown>>
      hall?: string
      roomNumber?: string
      birthDate?: string
      profileImageUrl?: string
      role?: WorkerRole
      requestedRole?: WorkerRole
      isExcoApproved?: boolean
      selfServiceTokenHash?: string
    } | null>(
      `*[_type == "worker" && (
        phoneBlindIndex in $indexes ||
        phoneNumber == $cleanPhone
      ) && selfServiceOtpHash == $otpHash &&
        selfServiceTokenExpiresAt > $nowIso &&
        selfServiceTokenPurpose == 'profile'][0]{
        _id, _rev, fullName, firstName, middleName, lastName, email, phoneNumber,
        "team": coalesce(team->name, team),
        "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
        memberships,
        positions,
        hall, roomNumber, birthDate, profileImageUrl, role, requestedRole,
        isExcoApproved, selfServiceTokenHash
      }`,
      { cleanPhone, indexes, otpHash, nowIso }
    )

    if (!worker) {
      return { ok: false, error: 'Invalid or expired verification code. Please check your email or request a new code.' }
    }

    const sessionToken = randomBytes(32).toString('base64url')
    const sessionTokenHash = hashSelfServiceToken(sessionToken)
    const expiresAt = new Date(Date.now() + SELF_SERVICE_TOKEN_TTL_MS).toISOString()

    const patchBuilder = patchPrivateDocument(worker._id)
    if (worker._id.startsWith('drafts.')) {
      patchBuilder.ifRevisionId(worker._rev)
    }
    await patchBuilder
      .set({
        selfServiceTokenHash: sessionTokenHash,
        selfServiceTokenExpiresAt: expiresAt,
      })
      .unset(['selfServiceOtpHash'])
      .commit()

    const cookieStore = cookies()
    cookieStore.set(SELF_SERVICE_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    })

    const birthday = decrypt(worker.birthDate)
    let birthMonth: number | undefined
    let birthDay: number | undefined
    if (birthday && birthday !== '[Encrypted Data]') {
      const parts = birthday.split('-')
      if (parts.length === 3) {
        birthMonth = Number(parts[1])
        birthDay = Number(parts[2])
      } else if (parts.length === 2) {
        birthMonth = Number(parts[0])
        birthDay = Number(parts[1])
      }
    }

    const roomNumber = decrypt(worker.roomNumber)
    const primaryPos = worker.positions?.[0] as any
    let executiveApplication: ExecutiveApplicationInput | undefined
    if (primaryPos) {
      executiveApplication = {
        kind: primaryPos.kind,
        office: primaryPos.office,
        hall: primaryPos.hall,
        team: primaryPos.team?.name || undefined,
        rank: primaryPos.rank,
      }
    }

    return {
      ok: true,
      worker: {
        fullName: worker.fullName,
        firstName: worker.firstName,
        middleName: worker.middleName,
        lastName: worker.lastName,
        email: worker.email,
        phoneNumber: decrypt(worker.phoneNumber) || cleanPhone,
        team: worker.team || worker.teams?.[0] || 'General',
        teams: worker.teams?.filter(Boolean) || [],
        hall: worker.hall,
        roomNumber: roomNumber === '[Encrypted Data]' ? '' : roomNumber,
        birthMonth,
        birthDay,
        profileImageUrl: worker.profileImageUrl,
        isExco: Boolean(worker.role || worker.requestedRole || worker.positions?.length),
        executiveApplication,
      },
    }
  } catch (err) {
    console.error('[verifyWorkerOtp] Error:', err)
    return { ok: false, error: 'Verification failed. Please try again.' }
  }
}

export async function requestWorkerSelfServiceLink(input: {
  identifier: string
  purpose: 'profile' | 'password'
  turnstileToken?: string
}): Promise<{ ok: true; message: string; maskedEmail?: string; phoneNumber?: string }> {
  const genericResponse = selfServiceResponse()
  try {
    const identifier = input.identifier?.trim() || ''
    if (!identifier || !['profile', 'password'].includes(input.purpose)) return genericResponse
    if (!(await verifyTurnstileToken(input.turnstileToken))) return genericResponse
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
    if (!selfServiceEmailer || !baseUrl) {
      console.warn('[requestWorkerSelfServiceLink] Missing selfServiceEmailer (RESEND_API_KEY) or baseUrl')
      return genericResponse
    }

    const cleanEmail = identifier.toLowerCase()
    const cleanPhone = identifier.replace(/\s+/g, '')
    const indexes = Array.from(new Set([createBlindIndex(cleanPhone), ...getCandidateBlindIndexes(cleanPhone)]))
    const worker = await sanityPrivateClient.fetch<{
      _id: string
      _rev: string
      fullName?: string
      firstName?: string
      email?: string
      phoneNumber?: string
      role?: string
      requestedRole?: string
      selfServiceRequestedAt?: string
    } | null>(
      `*[_type == "worker" && (
        lower(email) == $cleanEmail ||
        phoneNumber == $cleanPhone ||
        phoneBlindIndex in $indexes
      )] | order(_updatedAt desc)[0]{
        _id, _rev, fullName, firstName, email, phoneNumber, role, requestedRole, selfServiceRequestedAt
      }`,
      { cleanEmail, cleanPhone, indexes }
    )

    const email = worker?.email?.trim()
    if (!worker || !email) return genericResponse

    const requestedAt = worker.selfServiceRequestedAt ? Date.parse(worker.selfServiceRequestedAt) : 0
    if (requestedAt && Date.now() - requestedAt < SELF_SERVICE_RESEND_COOLDOWN_MS) {
      return {
        ok: true,
        message: `A verification message was recently sent to ${maskEmail(email)}. Please check your inbox or wait a minute to request a new code.`,
        maskedEmail: maskEmail(email),
        phoneNumber: decrypt(worker.phoneNumber) || (identifier.match(/\d{8,}/) ? cleanPhone : undefined),
      }
    }

    const token = randomBytes(32).toString('base64url')
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + SELF_SERVICE_TOKEN_TTL_MS).toISOString()
    const patchBuilder = patchPrivateDocument(worker._id)
    if (worker._id.startsWith('drafts.')) {
      patchBuilder.ifRevisionId(worker._rev)
    }
    await patchBuilder
      .set({
        selfServiceTokenHash: hashSelfServiceToken(token),
        selfServiceOtpHash: hashSelfServiceToken(otp),
        selfServiceTokenPurpose: input.purpose,
        selfServiceTokenExpiresAt: expiresAt,
        selfServiceRequestedAt: new Date().toISOString(),
      })
      .commit()

    await sendWorkerVerificationEmail({
      email,
      fullName: worker.firstName || worker.fullName || '',
      otp,
      token,
      baseUrl,
    })

    return {
      ok: true,
      message: `A 6-digit verification code and secure unlock link have been dispatched to ${maskEmail(email)}.`,
      maskedEmail: maskEmail(email),
      phoneNumber: decrypt(worker.phoneNumber) || (identifier.match(/\d{8,}/) ? cleanPhone : undefined),
    }
  } catch (err) {
    console.error('[requestWorkerSelfServiceLink] Request could not be completed:', err)
    return genericResponse
  }
}

export async function confirmWorkerSelfServiceLink(token: string): Promise<{
  ok: boolean
  purpose?: 'profile' | 'password'
  worker?: {
    fullName: string
    firstName?: string
    middleName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    team: string
    teams: string[]
    hall?: string
    roomNumber?: string
    birthMonth?: number
    birthDay?: number
    profileImageUrl?: string
    isExco?: boolean
    executiveApplication?: ExecutiveApplicationInput
  }
  error?: string
}> {
  try {
    const worker = await getWorkerBySelfServiceToken(token)
    if (!worker || !worker.selfServiceTokenPurpose) {
      return { ok: false, error: 'This link is invalid or has expired. Request a new one.' }
    }

    patchPrivateDocument(worker._id).unset(['selfServiceOtpHash']).commit().catch(() => null)

    const cookieStore = cookies()
    cookieStore.set(SELF_SERVICE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    })

    const birthday = decrypt(worker.birthDate)
    let birthMonth: number | undefined
    let birthDay: number | undefined
    if (birthday && birthday !== '[Encrypted Data]') {
      const parts = birthday.split('-')
      if (parts.length === 3) {
        birthMonth = Number(parts[1])
        birthDay = Number(parts[2])
      } else if (parts.length === 2) {
        birthMonth = Number(parts[0])
        birthDay = Number(parts[1])
      }
    }

    const roomNumber = decrypt(worker.roomNumber)
    const primaryPos = worker.positions?.[0] as any
    let executiveApplication: ExecutiveApplicationInput | undefined
    if (primaryPos) {
      executiveApplication = {
        kind: primaryPos.kind,
        office: primaryPos.office,
        hall: primaryPos.hall,
        team: primaryPos.team?.name || undefined,
        rank: primaryPos.rank,
      }
    }

    return {
      ok: true,
      purpose: 'profile',
      worker: {
        fullName: worker.fullName,
        firstName: worker.firstName,
        middleName: worker.middleName,
        lastName: worker.lastName,
        email: worker.email,
        phoneNumber: decrypt(worker.phoneNumber),
        team: worker.team || worker.teams?.[0] || 'General',
        teams: worker.teams?.filter(Boolean) || [],
        hall: worker.hall,
        roomNumber: roomNumber === '[Encrypted Data]' ? '' : roomNumber,
        birthMonth,
        birthDay,
        profileImageUrl: worker.profileImageUrl,
        isExco: Boolean(worker.role || worker.requestedRole || worker.positions?.length),
        executiveApplication,
      },
    }
  } catch {
    return { ok: false, error: 'This link is invalid or has expired. Request a new one.' }
  }
}

export async function getVerifiedWorkerProfile() {
  const token = cookies().get(SELF_SERVICE_COOKIE)?.value
  if (!token) return { ok: false as const }
  const worker = await getWorkerBySelfServiceToken(token, 'profile').catch(() => null)
  if (!worker) return { ok: false as const }
  return confirmWorkerSelfServiceLink(token)
}

function normalizeTeamComparisonString(str: string): string {
  return str
    .toLowerCase()
    .replace(/\bteam\b/g, '')
    .replace(/[/&,._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Resolves an operational team name to a Sanity `teamUnit` reference.
 * Supports exact match, canonical aliases, and robust normalization (& vs / vs -).
 */
async function resolveTeamReference(
  teamName: string
): Promise<{ _type: 'reference'; _ref: string } | null> {
  const normalized = teamName.trim()
  if (!normalized) return null

  // Fetch all team units once from Sanity
  const allTeams = await sanityPrivateClient.fetch<Array<{ _id: string; name: string; key?: string }>>(
    `*[_type == "teamUnit"]{ _id, name, key }`
  )

  if (!allTeams || allTeams.length === 0) {
    return null
  }

  // 1. Exact case-insensitive match on name
  let matched = allTeams.find((t) => t.name.toLowerCase() === normalized.toLowerCase())
  if (matched?._id) return { _type: 'reference', _ref: matched._id }

  // 2. Exact match on slug key
  const requestedSlug = normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  matched = allTeams.find((t) => t.key && t.key.toLowerCase() === requestedSlug)
  if (matched?._id) return { _type: 'reference', _ref: matched._id }

  // 3. Normalized string match (stripping 'team', treating '&' and '/' as equivalents)
  const normReq = normalizeTeamComparisonString(normalized)
  matched = allTeams.find((t) => {
    const normName = normalizeTeamComparisonString(t.name)
    return normName === normReq || normName.includes(normReq) || normReq.includes(normName)
  })
  if (matched?._id) return { _type: 'reference', _ref: matched._id }

  // 4. Known fellowship aliases
  if (normReq.includes('ushering') || normReq.includes('protocol')) {
    matched = allTeams.find((t) => {
      const n = t.name.toLowerCase()
      return n.includes('ushering') || n.includes('protocol')
    })
    if (matched?._id) return { _type: 'reference', _ref: matched._id }
  }

  if (normReq.includes('media') || normReq.includes('technical')) {
    matched = allTeams.find((t) => {
      const n = t.name.toLowerCase()
      return n.includes('media') || n.includes('technical')
    })
    if (matched?._id) return { _type: 'reference', _ref: matched._id }
  }

  if (normReq.includes('drama') || normReq.includes('thespian')) {
    matched = allTeams.find((t) => t.name.toLowerCase().includes('drama'))
    if (matched?._id) return { _type: 'reference', _ref: matched._id }
  }

  if (normReq.includes('bible study') || normReq.includes('sunday school')) {
    matched = allTeams.find((t) => t.name.toLowerCase().includes('bible study'))
    if (matched?._id) return { _type: 'reference', _ref: matched._id }
  }

  // 5. If this is a canonical fellowship team that doesn't exist yet, auto-create it safely
  const isCanonical = FELLOWSHIP_TEAMS.some(
    (ft) => normalizeTeamComparisonString(ft) === normReq || ft.toLowerCase() === normalized.toLowerCase()
  )
  if (isCanonical) {
    const teamId = `team-${requestedSlug}`
    await sanityWriteClient.createIfNotExists({
      _id: teamId,
      _type: 'teamUnit',
      name: normalized,
      key: requestedSlug,
    })
    return { _type: 'reference', _ref: teamId }
  }

  return null
}

/**
 * Normalizes CSGB executive office name to canonical schema titles.
 */
function normalizeCsgbOffice(officeRaw?: string): string {
  const lower = (officeRaw || '').toLowerCase().trim()
  if (lower.includes('president') && !lower.includes('vice') && !lower.includes('vp')) {
    return 'President'
  }
  if (lower.includes('admin') || lower.includes("brothers' coordinator")) {
    return 'Vice President - Admin'
  }
  if (lower.includes('evangelism') || lower.includes("sisters' coordinator")) {
    return 'Vice President - Evangelism'
  }
  if (lower.includes('secretary')) {
    return 'General Secretary'
  }
  return officeRaw?.trim() || 'President'
}

/**
 * Primary Worker Registration & Upsert Action — Phase 3 Unified Flow
 */
export async function registerWorker(
  input: WorkerRegistrationInput
): Promise<WorkerRegistrationResult> {
  try {
    // 1. Validation
    const cleanFirstName = input.firstName?.trim()
    const cleanMiddleName = input.middleName?.trim()
    const cleanLastName = input.lastName?.trim()

    let cleanFullName = input.fullName?.trim() || ''
    if (cleanFirstName || cleanLastName) {
      if (!cleanFirstName || cleanFirstName.length < 2 || !cleanLastName || cleanLastName.length < 2) {
        return { ok: false, error: 'Both First Name and Last Name are required (minimum 2 characters each).' }
      }
      cleanFullName = [cleanFirstName, cleanMiddleName, cleanLastName].filter(Boolean).join(' ')
    } else {
      if (!cleanFullName || cleanFullName.length < 2) {
        return { ok: false, error: 'Please enter your full legal name.' }
      }
    }

    if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      return { ok: false, error: 'Please enter a valid email address.' }
    }
    if (!input.phoneNumber || input.phoneNumber.trim().length < 8) {
      return { ok: false, error: 'Please enter a valid phone number.' }
    }

    const selectedTeams: string[] = (
      input.teams && input.teams.length > 0
        ? input.teams
        : input.team
          ? [input.team]
          : []
    )
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    if (selectedTeams.length === 0) {
      return { ok: false, error: 'Please select at least one operational team.' }
    }
    if (!input.hall || input.hall.trim().length === 0) {
      return { ok: false, error: 'Please select your hall of residence.' }
    }
    if (!input.roomNumber || input.roomNumber.trim().length === 0) {
      return { ok: false, error: 'Please enter your room number.' }
    }

    let cleanBirthDate = input.birthDate?.trim() || ''
    const cleanBirthMonth: number | undefined = input.birthMonth ? Number(input.birthMonth) : undefined
    const cleanBirthDay: number | undefined = input.birthDay ? Number(input.birthDay) : undefined

    if (cleanBirthMonth && cleanBirthDay) {
      const m = String(cleanBirthMonth).padStart(2, '0')
      const d = String(cleanBirthDay).padStart(2, '0')
      cleanBirthDate = `${m}-${d}`
    } else if (cleanBirthDate) {
      const bParts = cleanBirthDate.split('-')
      if (bParts.length === 3) {
        cleanBirthDate = `${bParts[1].padStart(2, '0')}-${bParts[2].padStart(2, '0')}`
      } else if (bParts.length === 2) {
        cleanBirthDate = `${bParts[0].padStart(2, '0')}-${bParts[1].padStart(2, '0')}`
      }
    }

    if (!cleanBirthDate) {
      return { ok: false, error: 'Please enter your birthday (month and day).' }
    }
    if (!input.ndprConsent) {
      return { ok: false, error: 'You must consent to data processing per NDPR guidelines.' }
    }
    if (!(await verifyTurnstileToken(input.turnstileToken))) {
      return { ok: false, error: 'Complete the security check and try again.' }
    }

    // 2. Clerk Session & User ID Resolution
    let resolvedClerkUserId = input.clerkUserId?.trim() || undefined
    try {
      const authState = await auth()
      if (authState?.userId) {
        resolvedClerkUserId = authState.userId
      }
    } catch {
      // Clerk auth not available in background or unconfigured context
    }

    const cleanPhone = input.phoneNumber.trim().replace(/\s+/g, '')
    const candidateBlindIndexes = getCandidateBlindIndexes(cleanPhone)
    const phoneBlindIndex = createBlindIndex(cleanPhone)
    const allBlindIndexes = Array.from(new Set([phoneBlindIndex, ...candidateBlindIndexes]))
    const cleanEmail = input.email.trim().toLowerCase()
    const cleanTeams = Array.from(new Set(selectedTeams))
    const today = new Date().toISOString().split('T')[0]

    // 3. Deduplication and Existing Profile Matching
    const identityMatches = await sanityPrivateClient.fetch<Array<{
      _id: string
      _rev: string
      fullName?: string
      phoneNumber?: string
      team?: string
      teams?: string[]
      memberships?: Array<Record<string, unknown>>
      positions?: Array<Record<string, unknown>>
      hall?: string
      roomNumber?: string
      email?: string
      birthDate?: string
      role?: WorkerRole
      requestedRole?: WorkerRole
      clerkUserId?: string
      isExcoApproved?: boolean
      passwordHash?: string
      updateLog?: string[]
    }>>(
      `*[_type == "worker" && (
        (defined($resolvedClerkUserId) && clerkUserId == $resolvedClerkUserId) ||
        phoneBlindIndex in $allBlindIndexes ||
        phoneNumber == $phoneNumber ||
        lower(email) == $cleanEmail
      )] | order(defined(clerkUserId) desc, _updatedAt desc)[0...10]{
        _id,
        _rev,
        fullName,
        phoneNumber,
        "team": coalesce(team->name, team),
        "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
        memberships,
        positions,
        hall,
        roomNumber,
        email,
        birthDate,
        role,
        requestedRole,
        clerkUserId,
        isExcoApproved,
        passwordHash,
        updateLog
      }`,
      { phoneNumber: cleanPhone, allBlindIndexes, cleanEmail, resolvedClerkUserId: resolvedClerkUserId || null }
    )

    const selfServiceToken = cookies().get(SELF_SERVICE_COOKIE)?.value
    const verifiedWorker = selfServiceToken
      ? await getWorkerBySelfServiceToken(selfServiceToken, 'profile').catch(() => null)
      : null

    // If signed in via Clerk, worker can be verified directly by clerkUserId match
    const clerkVerifiedWorker = resolvedClerkUserId
      ? identityMatches.find((w) => w.clerkUserId === resolvedClerkUserId) || null
      : null

    const existing = clerkVerifiedWorker || verifiedWorker

    if (existing) {
      const belongsToVerifiedWorker = identityMatches.some((worker) => worker._id === existing._id)
      const conflictsWithAnotherWorker = identityMatches.some((worker) => worker._id !== existing._id)
      const storedPhone = decrypt(existing.phoneNumber)
      if (
        !belongsToVerifiedWorker ||
        conflictsWithAnotherWorker ||
        (!clerkVerifiedWorker && existing.email?.trim().toLowerCase() !== cleanEmail) ||
        (!clerkVerifiedWorker && (!storedPhone || storedPhone === '[Encrypted Data]' || normalizePhone(storedPhone) !== normalizePhone(cleanPhone)))
      ) {
        return { ok: false, error: 'For account safety, phone or email changes must be handled by an ECCF administrator.' }
      }
    } else if (identityMatches.length > 0) {
      return {
        ok: false,
        error: 'A worker record was found matching those contact details. Sign in with your account or request a verification code to update your profile.',
      }
    }

    // 4. Resolve Operational Team References
    const resolvedTeamReferences = await Promise.all(cleanTeams.map((t) => resolveTeamReference(t)))
    if (resolvedTeamReferences.some((team) => !team)) {
      return { ok: false, error: 'One or more selected teams could not be found. Please refresh and select again.' }
    }
    const cleanTeamRefs = resolvedTeamReferences.filter(
      (team): team is { _type: 'reference'; _ref: string } => Boolean(team)
    )
    const primaryTeamReference = {
      _type: 'reference' as const,
      _ref: cleanTeamRefs[0]._ref,
    }
    // Each reference in an array must have a unique _key for Sanity Studio validation
    const teamReferences = cleanTeamRefs.map((ref) => ({
      _key: `team_${ref._ref.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}_${Math.random().toString(36).substring(2, 7)}`,
      _type: 'reference' as const,
      _ref: ref._ref,
    }))

    // 5. Structure Operational Team Memberships
    // Maps selected teams into memberships[] with status: 'pending' (preserving existing verification if updating)
    const existingMembershipsMap = new Map<string, Record<string, unknown>>()
    if (existing?.memberships && Array.isArray(existing.memberships)) {
      for (const m of existing.memberships) {
        const teamObj = m.team as { _ref?: string; _id?: string } | undefined
        const ref = teamObj?._ref || teamObj?._id || (typeof m.team === 'string' ? m.team : null)
        if (ref) existingMembershipsMap.set(ref, m)
      }
    }

    const memberships = cleanTeamRefs.map((ref) => {
      const existingMem = existingMembershipsMap.get(ref._ref)
      if (existingMem) {
        return {
          _key: (existingMem._key as string) || `mem_${ref._ref.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}_${Math.random().toString(36).substring(2, 7)}`,
          _type: 'teamMembership',
          team: { _type: 'reference', _ref: ref._ref },
          status: (existingMem.status as string) || 'pending',
          ...(existingMem.decidedBy ? { decidedBy: existingMem.decidedBy } : {}),
          ...(existingMem.decidedAt ? { decidedAt: existingMem.decidedAt } : {}),
        }
      }
      return {
        _key: `mem_${ref._ref.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}_${Math.random().toString(36).substring(2, 7)}`,
        _type: 'teamMembership',
        team: { _type: 'reference', _ref: ref._ref },
        status: 'pending',
      }
    })

    // 6. Structure Executive Positions (Appointments / Applications)
    let positionsToSave: Array<Record<string, unknown>> | undefined = undefined
    if (input.isExco) {
      const app = input.executiveApplication
      const kind: ExecutiveApplicationKind = app?.kind || (input.requestedRole === 'admin' ? 'csgb' : input.requestedRole === 'hall_rep' ? 'hall' : 'team')

      const newPosition: Record<string, unknown> = {
        _key: `pos_${kind}_${Math.random().toString(36).substring(2, 7)}`,
        _type: 'executivePosition',
        kind,
        status: 'pending',
      }

      if (kind === 'csgb') {
        newPosition.office = normalizeCsgbOffice(app?.office)
      } else if (kind === 'hall') {
        newPosition.hall = app?.hall?.trim() || input.hall
        newPosition.rank = app?.rank || 'lead'
      } else if (kind === 'team') {
        const targetTeamName = app?.team?.trim() || selectedTeams[0]
        const execTeamRef = await resolveTeamReference(targetTeamName)
        if (execTeamRef) {
          newPosition.team = execTeamRef
        } else {
          newPosition.team = primaryTeamReference
        }
        newPosition.rank = app?.rank || 'lead'
      }

      // Preserve existing positions if any were already approved
      const existingPositions: Array<Record<string, unknown>> = Array.isArray(existing?.positions) ? existing.positions : []
      const approvedPositions = existingPositions.filter((p) => p.status === 'approved')

      positionsToSave = [...approvedPositions, newPosition]
    } else if (existing?.positions && Array.isArray(existing.positions)) {
      // Keep approved positions if worker didn't re-apply
      positionsToSave = existing.positions.filter((p) => p.status === 'approved')
    }

    const profileImageUrl = input.profileImageUrl?.trim() || undefined
    if (profileImageUrl) {
      try {
        const photoUrl = new URL(profileImageUrl)
        const trustedPhotoHost = ['lh3.googleusercontent.com', 'drive.google.com'].includes(photoUrl.hostname)
        if (photoUrl.protocol !== 'https:' || !trustedPhotoHost) {
          return { ok: false, error: 'Please upload a profile image using the provided upload control.' }
        }
      } catch {
        return { ok: false, error: 'Please upload a valid profile image.' }
      }
    }

    const encryptedBirthDate = encrypt(cleanBirthDate)
    const birthdayBlindIndex = createBirthdayBlindIndex(cleanBirthDate)

    // 7. Execute Mutation (Upsert)
    if (existing) {
      const deltaLogs: string[] = []
      const currentRoom = decrypt(existing.roomNumber)
      const currentBirthDate = decrypt(existing.birthDate)

      const prevTeams = (existing.teams && existing.teams.length > 0 ? existing.teams : [existing.team || 'General'])
        .filter(Boolean)
        .sort()
        .join(', ')
      const newTeamsStr = cleanTeams.slice().sort().join(', ')
      if (prevTeams !== newTeamsStr) {
        deltaLogs.push(`Updated Teams from [${prevTeams}] to [${newTeamsStr}] on ${today}`)
      }
      if (existing.hall && existing.hall !== input.hall) {
        deltaLogs.push(`Changed Hall from ${existing.hall} to ${input.hall} on ${today}`)
      }
      if (currentRoom && currentRoom !== input.roomNumber.trim()) {
        deltaLogs.push(`Updated room number on ${today}`)
      }
      if (cleanFullName !== existing.fullName) {
        deltaLogs.push(`Updated profile name on ${today}`)
      }
      if (currentBirthDate && currentBirthDate !== cleanBirthDate) {
        deltaLogs.push(`Updated Birthday on ${today}`)
      }
      if (profileImageUrl) {
        deltaLogs.push(`Updated Birthday Picture on ${today}`)
      }
      if (input.isExco) {
        deltaLogs.push(`Submitted executive application on ${today} (pending Presidential approval)`)
      }
      if (deltaLogs.length === 0) {
        deltaLogs.push(`Profile updated on ${today}`)
      }

      const patchData: Record<string, unknown> = {
        fullName: cleanFullName,
        ...(cleanFirstName ? { firstName: cleanFirstName } : {}),
        ...(cleanMiddleName !== undefined ? { middleName: cleanMiddleName } : {}),
        ...(cleanLastName ? { lastName: cleanLastName } : {}),
        memberships,
        ...(positionsToSave ? { positions: positionsToSave } : {}),
        ...(resolvedClerkUserId ? { clerkUserId: resolvedClerkUserId } : {}),
        hall: input.hall,
        roomNumber: encrypt(input.roomNumber.trim()),
        birthDate: encryptedBirthDate,
        birthdayBlindIndex,
        updatedAt: new Date().toISOString(),
      }

      const uploadGrant = input.requestPhotoUpload ? randomBytes(32).toString('base64url') : undefined
      if (uploadGrant) {
        patchData.uploadGrantHash = hashSelfServiceToken(uploadGrant)
        patchData.uploadGrantExpiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString()
      }

      if (profileImageUrl) {
        patchData.profileImageUrl = profileImageUrl
      }

      await patchPrivateDocument(existing._id)
        .set(patchData)
        .unset([
          'passwordHash',
          'birthMonth',
          'birthDay',
          'team',
          'teams',
          'role',
          'excoPosition',
          'isExcoApproved',
          'verificationStatus',
          'selfServiceTokenHash',
          'selfServiceTokenPurpose',
          'selfServiceTokenExpiresAt',
          'selfServiceRequestedAt',
          ...(!uploadGrant ? ['uploadGrantHash', 'uploadGrantExpiresAt'] : []),
        ])
        .append('updateLog', deltaLogs)
        .commit()

      cookies().delete(SELF_SERVICE_COOKIE)
      revalidatePath('/dashboard/workers')
      revalidatePath('/register/status')

      return {
        ok: true,
        isExco: Boolean(input.isExco),
        workerId: existing._id,
        fullName: cleanFullName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        hall: input.hall,
        roomNumber: input.roomNumber,
        teams: selectedTeams,
        executiveApplication: input.executiveApplication,
        message: input.isExco
          ? 'Your profile updates and executive application have been successfully submitted.'
          : 'Your worker profile has been updated.',
        ...(uploadGrant ? { uploadGrant } : {}),
      }
    } else {
      // Create Brand New Worker Document
      const initialLogs = [`Initial worker registration on ${today}`]
      if (input.isExco) {
        initialLogs.push(`Submitted executive application on ${today} (pending Presidential approval)`)
      }

      const newDoc: { _type: 'worker'; [key: string]: unknown } = {
        _type: 'worker',
        fullName: cleanFullName,
        ...(cleanFirstName ? { firstName: cleanFirstName } : {}),
        ...(cleanMiddleName ? { middleName: cleanMiddleName } : {}),
        ...(cleanLastName ? { lastName: cleanLastName } : {}),
        email: input.email.trim().toLowerCase(),
        phoneNumber: encrypt(cleanPhone),
        phoneBlindIndex,
        memberships,
        ...(positionsToSave ? { positions: positionsToSave } : {}),
        ...(resolvedClerkUserId ? { clerkUserId: resolvedClerkUserId } : {}),
        hall: input.hall,
        roomNumber: encrypt(input.roomNumber.trim()),
        birthDate: encryptedBirthDate,
        birthdayBlindIndex,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updateLog: initialLogs,
      }

      const uploadGrant = input.requestPhotoUpload ? randomBytes(32).toString('base64url') : undefined
      if (uploadGrant) {
        newDoc.uploadGrantHash = hashSelfServiceToken(uploadGrant)
        newDoc.uploadGrantExpiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString()
      }

      if (profileImageUrl) {
        newDoc.profileImageUrl = profileImageUrl
      }

      const createdWorker = await createPrivateDocument(newDoc)

      revalidatePath('/dashboard/workers')
      revalidatePath('/register/status')

      return {
        ok: true,
        isExco: Boolean(input.isExco),
        workerId: createdWorker._id,
        fullName: cleanFullName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        hall: input.hall,
        roomNumber: input.roomNumber,
        teams: selectedTeams,
        executiveApplication: input.executiveApplication,
        message: input.isExco
          ? `Welcome to ECCF, ${cleanFullName}! Your workforce registration and executive application have been successfully submitted.`
          : `Welcome to the Workforce, ${cleanFullName}! Your registration has been submitted to your Team Lead(s) for verification.`,
        ...(uploadGrant ? { uploadGrant } : {}),
      }
    }
  } catch (err) {
    console.error('[registerWorker] Error:', err)
    return {
      ok: false,
      error: 'An unexpected error occurred while saving your registration. Please try again.',
    }
  }
}

/**
 * Direct worker portrait upload action.
 * Securely uploads a portrait photo directly to Sanity Assets and attaches it to the worker profile.
 */
export async function uploadWorkerPhotoDirectAction({
  workerId,
  base64Image,
}: {
  workerId: string
  base64Image: string
}): Promise<{ ok: boolean; fileUrl?: string; error?: string }> {
  try {
    if (!workerId || !base64Image) {
      return { ok: false, error: 'Worker ID and image data are required.' }
    }

    const imageBytes = Buffer.from(base64Image, 'base64')
    if (imageBytes.length === 0 || imageBytes.length > 2 * 1024 * 1024) {
      return { ok: false, error: 'Photo must be 2MB or smaller.' }
    }

    let mimeType = 'image/jpeg'
    if (imageBytes.length >= 8 && imageBytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      mimeType = 'image/png'
    } else if (imageBytes.length >= 12 && imageBytes.toString('ascii', 0, 4) === 'RIFF' && imageBytes.toString('ascii', 8, 12) === 'WEBP') {
      mimeType = 'image/webp'
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const sanityAsset = await sanityWriteClient.assets.upload('image', imageBytes, {
      filename: `headshot_${workerId.replace(/[^a-zA-Z0-9]/g, '')}.${ext}`,
      contentType: mimeType,
    })

    if (!sanityAsset?.url) {
      return { ok: false, error: 'Could not store image asset.' }
    }

    await patchPrivateDocument(workerId)
      .set({
        profileImageUrl: sanityAsset.url,
        headshot: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: sanityAsset._id,
          },
        },
        updatedAt: new Date().toISOString(),
      })
      .append('updateLog', [`Uploaded official headshot on ${new Date().toISOString().slice(0, 10)}`])
      .commit()

    revalidatePath('/register/status')
    revalidatePath('/dashboard/workers')

    return { ok: true, fileUrl: sanityAsset.url }
  } catch (err) {
    console.error('[uploadWorkerPhotoDirectAction] Error:', err)
    return { ok: false, error: 'Failed to upload photo. Please try again.' }
  }
}

/**
 * Retrieves the signed-in user context from Clerk or active session.
 * Used to prefill verified email and profile info during registration.
 */
export async function getSignedInUserContext(): Promise<{
  isSignedIn: boolean
  clerkUserId?: string
  email?: string
  firstName?: string
  lastName?: string
  fullName?: string
}> {
  try {
    const authState = await auth()
    if (authState?.userId) {
      const user = await currentUser()
      if (user) {
        const primaryEmail =
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
          user.emailAddresses[0]?.emailAddress
        return {
          isSignedIn: true,
          clerkUserId: user.id,
          email: primaryEmail,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
        }
      }
      return {
        isSignedIn: true,
        clerkUserId: authState.userId,
      }
    }
  } catch {
    // Clerk not configured or session absent
  }

  return { isSignedIn: false }
}

/**
 * Retrieves registration status for the /register/status page.
 */
export async function getRegistrationStatus(): Promise<RegistrationStatusResult> {
  try {
    let signedInClerkUserId: string | undefined = undefined
    let clerkEmail: string | undefined = undefined

    try {
      const authState = await auth()
      if (authState?.userId) {
        signedInClerkUserId = authState.userId
        const user = await currentUser()
        if (user) {
          clerkEmail =
            user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
            user.emailAddresses[0]?.emailAddress
        }
      }
    } catch {
      // Clerk auth context unavailable
    }

    const selfServiceToken = cookies().get(SELF_SERVICE_COOKIE)?.value
    let verifiedTokenWorkerId: string | undefined = undefined
    if (selfServiceToken) {
      const tokenWorker = await getWorkerBySelfServiceToken(selfServiceToken, 'profile').catch(() => null)
      if (tokenWorker?._id) {
        verifiedTokenWorkerId = tokenWorker._id
      }
    }

    // Security Gate: Disallow unauthenticated public searching to prevent PII harvesting
    if (!signedInClerkUserId && !clerkEmail && !verifiedTokenWorkerId) {
      return {
        ok: false,
        signedIn: false,
        error: 'Please sign in with your account to view your registration status.',
      }
    }

    const worker = await sanityPrivateClient.fetch<Record<string, unknown> | null>(
      `*[_type == "worker" && (
        (defined($signedInClerkUserId) && clerkUserId == $signedInClerkUserId) ||
        (defined($clerkEmail) && lower(email) == lower($clerkEmail)) ||
        (defined($verifiedTokenWorkerId) && _id == $verifiedTokenWorkerId)
      )] | order(defined(clerkUserId) desc, _updatedAt desc)[0]{
        _id,
        fullName,
        firstName,
        middleName,
        lastName,
        email,
        phoneNumber,
        hall,
        roomNumber,
        birthDate,
        profileImageUrl,
        clerkUserId,
        canApproveExecutives,
        "memberships": memberships[]{
          _key,
          status,
          decidedAt,
          "teamName": team->name,
          "teamKey": team->key
        },
        "positions": positions[]{
          _key,
          kind,
          office,
          hall,
          rank,
          status,
          decidedAt,
          "teamName": team->name,
          "teamKey": team->key
        },
        "legacyTeam": team->name,
        "legacyTeams": teams[]->name,
        role,
        requestedRole,
        isExcoApproved
      }`,
      {
        signedInClerkUserId: signedInClerkUserId || null,
        clerkEmail: clerkEmail || null,
        verifiedTokenWorkerId: verifiedTokenWorkerId || null,
      }
    )

    if (!worker) {
      return {
        ok: false,
        signedIn: Boolean(signedInClerkUserId),
        clerkUserId: signedInClerkUserId,
        clerkEmail,
        error: 'No workforce registration record found.',
      }
    }

    const rawPhone = (worker.phoneNumber as string) || ''
    const rawRoom = (worker.roomNumber as string) || ''
    const rawBirthDate = (worker.birthDate as string) || ''
    const decryptedPhone = decrypt(rawPhone) || rawPhone
    const decryptedRoom = decrypt(rawRoom) || rawRoom
    const decryptedBirthDate = decrypt(rawBirthDate) || rawBirthDate

    const rawMemberships = (worker.memberships as Array<Record<string, unknown>>) || []
    let formattedMemberships = rawMemberships.map((m, idx: number) => ({
      key: (m._key as string) || `mem_${idx}`,
      teamName: (m.teamName as string) || 'Operational Team',
      teamKey: (m.teamKey as string) || '',
      status: ((m.status as string) || 'pending') as 'pending' | 'verified' | 'rejected',
      decidedAt: m.decidedAt as string | undefined,
    }))

    const legacyTeams = worker.legacyTeams as string[] | undefined
    const legacyTeam = worker.legacyTeam as string | undefined
    if (formattedMemberships.length === 0 && (legacyTeams?.length || legacyTeam)) {
      const legacyList: string[] = (legacyTeams && legacyTeams.length > 0) ? legacyTeams : [legacyTeam || '']
      formattedMemberships = legacyList.filter(Boolean).map((t, idx) => ({
        key: `legacy_${idx}`,
        teamName: t,
        teamKey: '',
        status: (worker.isExcoApproved ? 'verified' : 'pending') as 'pending' | 'verified' | 'rejected',
        decidedAt: undefined,
      }))
    }

    const rawPositions = (worker.positions as Array<Record<string, unknown>>) || []
    const formattedPositions = rawPositions.map((p, idx: number) => {
      const rank = p.rank as 'lead' | 'assistant' | undefined
      const rankStr = rank === 'assistant' ? 'Assistant ' : ''
      const kind = p.kind as 'csgb' | 'hall' | 'team'
      let title = 'Executive Designation'
      if (kind === 'csgb') {
        title = `CSGB — ${(p.office as string) || 'Executive Office'}`
      } else if (kind === 'hall') {
        title = `${rankStr}Hall Pastor (${(p.hall as string) || 'Hostel'})`
      } else if (kind === 'team') {
        title = `${rankStr}Team Lead (${(p.teamName as string) || 'Ministry Team'})`
      }
      return {
        key: (p._key as string) || `pos_${idx}`,
        kind,
        title,
        office: p.office as string | undefined,
        hall: p.hall as string | undefined,
        teamName: p.teamName as string | undefined,
        rank,
        status: ((p.status as string) || 'pending') as 'pending' | 'approved' | 'rejected',
        decidedAt: p.decidedAt as string | undefined,
      }
    })

    return {
      ok: true,
      signedIn: Boolean(signedInClerkUserId),
      clerkUserId: signedInClerkUserId,
      clerkEmail,
      worker: {
        id: worker._id as string,
        fullName: worker.fullName as string,
        firstName: worker.firstName as string | undefined,
        middleName: worker.middleName as string | undefined,
        lastName: worker.lastName as string | undefined,
        email: worker.email as string,
        phoneNumber: decryptedPhone === '[Encrypted Data]' ? undefined : decryptedPhone,
        hall: worker.hall as string,
        roomNumber: decryptedRoom === '[Encrypted Data]' ? undefined : decryptedRoom,
        birthDate: decryptedBirthDate === '[Encrypted Data]' ? undefined : decryptedBirthDate,
        profileImageUrl: worker.profileImageUrl as string | undefined,
        clerkUserId: worker.clerkUserId as string | undefined,
        memberships: formattedMemberships,
        positions: formattedPositions,
      },
    }
  } catch (err) {
    console.error('[getRegistrationStatus] Error:', err)
    return {
      ok: false,
      signedIn: false,
      error: 'Unable to retrieve registration status at this time. Please try again.',
    }
  }
}

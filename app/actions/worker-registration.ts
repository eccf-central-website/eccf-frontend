/**
 * Worker Registration Server Action — app/actions/worker-registration.ts
 *
 * Implements SDD §6.4: Profile Registration & Upsert Data Flow.
 * - Deduplicates on `phoneNumber` (unique identifier)
 * - Computes automated delta logs into `updateLog` array
 * - Handles client Base64 image bridge to Google Drive (via Apps Script)
 * - Implements Admin Approval Gate for Exco designations (SDD §7.3)
 * - Hashes Exco passwords with bcryptjs for NextAuth credentials verification
 */

'use server'

import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createPrivateDocument, patchPrivateDocument, sanityPrivateClient, sanityWriteClient } from '@/lib/sanity'
import { verifyTurnstileToken } from '@/lib/security/turnstile'
import { encrypt, decrypt, createBlindIndex, getCandidateBlindIndexes, createBirthdayBlindIndex, normalizePhone } from '@/lib/encryption'
import type { WorkerRole } from '@/types'

export interface WorkerRegistrationInput {
  fullName: string
  firstName?: string
  middleName?: string
  lastName?: string
  email: string
  phoneNumber: string
  /** Published teamUnit _ids (from the options rendered on /register). */
  teamIds: string[]
  hall: string
  roomNumber: string
  birthDate?: string
  birthMonth?: string | number
  birthDay?: string | number
  profileImageUrl?: string
  requestPhotoUpload?: boolean
  turnstileToken?: string
  isExco: boolean
  requestedRole?: WorkerRole
  password?: string
  ndprConsent: boolean
}

export interface WorkerRegistrationResult {
  ok: boolean
  error?: string
  isExco?: boolean
  message?: string
  uploadGrant?: string
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
        <!-- Top Brand Header -->
        <div style="background: #0f172a; padding: 28px 24px; text-align: center;">
          <p style="margin: 0 0 6px 0; color: #38bdf8; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
            Edo State University Christian Campus Fellowship
          </p>
          <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
            Worker Profile Security Verification
          </h1>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px 28px;">
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #0f172a;">
            Hello ${fullName || 'Beloved Worker'},
          </p>
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
            We received a request to access and update your workforce profile on the ECCF portal. For your protection and privacy, personal details (hostel room, phone number, and teams) are kept locked until verified.
          </p>

          <!-- OTP Box -->
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

          <!-- Magic Link Button -->
          <div style="text-align: center; margin: 24px 0;">
            <a href="${confirmationUrl.toString()}" style="display: inline-block; background: #0077cc; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0, 119, 204, 0.25);">
              Unlock My Worker Profile &rarr;
            </a>
          </div>

          <div style="background: #f8fafc; border-radius: 10px; padding: 14px 18px; border: 1px solid #e2e8f0; font-size: 12px; line-height: 1.5; color: #64748b; margin-top: 28px;">
            <strong style="color: #334155;">Security Notice:</strong> This verification code and link will expire in <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this email &mdash; your information remains encrypted and protected.
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #475569;">Edo State University Christian Campus Fellowship (ECCF)</p>
          <p style="margin: 0;">NLT 5, Faculty of Law, ESUI, Uzairue, Edo State &bull; Official Workforce Portal</p>
        </div>
      </div>
    </body>
    </html>
  `

  const plainText = `ECCF Worker Profile Security Verification\n\nHello ${fullName || 'Worker'},\n\nYour 6-digit verification code is: ${otp}\n\nAlternatively, you can unlock your profile using this secure link:\n${confirmationUrl.toString()}\n\nThis code and link expire in 15 minutes. If you did not request this, no action is needed.`

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
    hall?: string
    roomNumber?: string
    birthDate?: string
    profileImageUrl?: string
    role?: WorkerRole
    requestedRole?: WorkerRole
    isExcoApproved?: boolean
    passwordHash?: string
    selfServiceTokenPurpose?: 'profile' | 'password'
  } | null>(
    `*[_type == "worker" && selfServiceTokenHash == $hash &&
      selfServiceTokenExpiresAt > $now &&
      (!defined($purpose) || selfServiceTokenPurpose == $purpose)][0]{
      _id, _rev, fullName, firstName, middleName, lastName, email, phoneNumber,
      "team": coalesce(team->name, team),
      "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
      hall, roomNumber, birthDate, profileImageUrl, role, requestedRole,
      isExcoApproved, passwordHash, selfServiceTokenPurpose
    }`,
    { hash, now: new Date().toISOString(), purpose: purpose || null }
  )
}

/**
 * Checks if a phone number is already registered to a worker.
 * If found, DOES NOT reveal personal details, but immediately generates a 6-digit OTP
 * and secure unlock link, emailing them to the worker's address on file.
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

    // Query for existing worker by blind indexes or raw phone
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

    // CASE A: Worker not found -> brand new registration allowed to proceed
    if (!worker) {
      return { ok: true, exists: false }
    }

    // CASE B: Worker found! Protect details and send verification
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

    // Rate-limit check (60s cooldown)
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

    // Generate Token & 6-digit OTP
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
 * Unlocks the profile, sets the secure self-service cookie, and returns decrypted details.
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
      hall?: string
      roomNumber?: string
      birthDate?: string
      profileImageUrl?: string
      role?: WorkerRole
      requestedRole?: WorkerRole
      isExcoApproved?: boolean
      passwordHash?: string
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
        hall, roomNumber, birthDate, profileImageUrl, role, requestedRole,
        isExcoApproved, passwordHash, selfServiceTokenHash
      }`,
      { cleanPhone, indexes, otpHash, nowIso }
    )

    if (!worker) {
      return { ok: false, error: 'Invalid or expired verification code. Please check your email or request a new code.' }
    }

    // Generate a fresh session token for the cookie so registerWorker can authenticate the update
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
        isExco: Boolean(worker.role || worker.requestedRole),
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

    const canResetPassword = Boolean(worker?.role || worker?.requestedRole)
    const email = worker?.email?.trim()
    if (!worker || !email || (input.purpose === 'password' && !canResetPassword)) return genericResponse

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

    if (input.purpose === 'profile') {
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
    }

    // Password reset email
    const confirmationUrl = new URL('/login', baseUrl)
    confirmationUrl.searchParams.set('selfServiceToken', token)
    await selfServiceEmailer.emails.send({
      from: process.env.EMAIL_FROM || 'ECCF <onboarding@resend.dev>',
      to: email,
      subject: 'Confirm your ECCF dashboard password setup',
      text: `Use the secure link below to set or reset your Exco dashboard password:\n\n${confirmationUrl.toString()}\n\nThis link expires in 15 minutes. If you did not request this, ignore this message.`,
    })
    return genericResponse
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
  }
  error?: string
}> {
  try {
    const worker = await getWorkerBySelfServiceToken(token)
    if (!worker || !worker.selfServiceTokenPurpose) {
      return { ok: false, error: 'This link is invalid or has expired. Request a new one.' }
    }

    // Clear any pending OTP hash so it cannot be reused
    patchPrivateDocument(worker._id).unset(['selfServiceOtpHash']).commit().catch(() => null)

    const cookieStore = cookies()
    cookieStore.set(SELF_SERVICE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    })

    if (worker.selfServiceTokenPurpose === 'password') {
      return { ok: true, purpose: 'password' }
    }

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
        isExco: Boolean(worker.role || worker.requestedRole),
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

type TeamReference = { _type: 'reference'; _ref: string }

/**
 * Resolve selected teamUnit _ids to references, checking each is an EXISTING
 * published teamUnit (S7). Registrations never create teamUnit docs and never
 * match teams by name. Returns null if any id is unknown.
 */
async function resolveTeamReferences(
  teamIds: string[]
): Promise<{ references: TeamReference[]; names: string[] } | null> {
  const found = await sanityWriteClient.fetch<{ _id: string; name?: string }[]>(
    `*[_type == "teamUnit" && _id in $ids && !(_id in path("drafts.**"))]{ _id, name }`,
    { ids: teamIds }
  )
  const byId = new Map(found.map((t) => [t._id, t]))
  if (!teamIds.every((id) => byId.has(id))) return null
  return {
    references: teamIds.map((id) => ({ _type: 'reference', _ref: id })),
    names: teamIds.map((id) => byId.get(id)?.name || ''),
  }
}

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
    const selectedTeamIds: string[] = (Array.isArray(input.teamIds) ? input.teamIds : [])
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    if (selectedTeamIds.length === 0) {
      return { ok: false, error: 'Please select at least one operational team.' }
    }
    if (selectedTeamIds.length > 20 || selectedTeamIds.some((id) => !/^[A-Za-z0-9._-]{1,128}$/.test(id) || id.startsWith('drafts.'))) {
      return { ok: false, error: 'Please choose your teams from the listed options.' }
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

    const cleanPhone = input.phoneNumber.trim().replace(/\s+/g, '')
    const candidateBlindIndexes = getCandidateBlindIndexes(cleanPhone)
    const phoneBlindIndex = createBlindIndex(cleanPhone)
    const allBlindIndexes = Array.from(new Set([phoneBlindIndex, ...candidateBlindIndexes]))
    const cleanEmail = input.email.trim().toLowerCase()
    const cleanTeamIds = Array.from(new Set(selectedTeamIds))
    const today = new Date().toISOString().split('T')[0]

    // 2. Check if worker already exists (Deduplication / Upsert check)
    // Matches by candidate blind indexes, phone number, or email
    const identityMatches = await sanityPrivateClient.fetch<Array<{
      _id: string
      _rev: string
      fullName?: string
      phoneNumber?: string
      team?: string
      teams?: string[]
      hall?: string
      roomNumber?: string
      email?: string
      birthDate?: string
      role?: WorkerRole
      requestedRole?: WorkerRole
      isExcoApproved?: boolean
      passwordHash?: string
      updateLog?: string[]
    }>>(
      `*[_type == "worker" && (
        phoneBlindIndex in $allBlindIndexes ||
        phoneNumber == $phoneNumber ||
        lower(email) == $cleanEmail
      )] | order(defined(passwordHash) desc, _updatedAt desc)[0...10]{
        _id,
        _rev,
        fullName,
        phoneNumber,
        "team": coalesce(team->name, team),
        "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
        hall,
        roomNumber,
        email,
        birthDate,
        role,
        requestedRole,
        isExcoApproved,
        passwordHash,
        updateLog
      }`,
      { phoneNumber: cleanPhone, allBlindIndexes, cleanEmail }
    )

    const selfServiceToken = cookies().get(SELF_SERVICE_COOKIE)?.value
    const verifiedWorker = selfServiceToken
      ? await getWorkerBySelfServiceToken(selfServiceToken, 'profile').catch(() => null)
      : null

    const existing = verifiedWorker
    if (verifiedWorker) {
      const belongsToVerifiedWorker = identityMatches.some((worker) => worker._id === verifiedWorker._id)
      const conflictsWithAnotherWorker = identityMatches.some((worker) => worker._id !== verifiedWorker._id)
      const storedPhone = decrypt(verifiedWorker.phoneNumber)
      if (
        !belongsToVerifiedWorker ||
        conflictsWithAnotherWorker ||
        verifiedWorker.email?.trim().toLowerCase() !== cleanEmail ||
        !storedPhone ||
        storedPhone === '[Encrypted Data]' ||
        normalizePhone(storedPhone) !== normalizePhone(cleanPhone)
      ) {
        return { ok: false, error: 'For account safety, phone or email changes must be handled by an ECCF administrator.' }
      }
    } else if (identityMatches.length > 0) {
      return {
        ok: false,
        error: 'A worker record may already use those details. If this is your profile, choose “Update an existing profile” and use the secure email link.',
      }
    }

    // Password validation logic:
    if (!existing) {
      // For a brand-new worker requesting an Exco role, password is required
      if (input.isExco) {
        if (!input.requestedRole || !['admin', 'team_lead', 'hall_rep', 'finance'].includes(input.requestedRole)) {
          return { ok: false, error: 'Please select your Exco designation.' }
        }
        if (!input.password || input.password.length < 8) {
          return { ok: false, error: 'Exco accounts require a secure password of at least 8 characters.' }
        }
      }
    }

    // Check the selected teams against published teamUnit docs (S7)
    const resolvedTeams = await resolveTeamReferences(cleanTeamIds)
    if (!resolvedTeams) {
      return { ok: false, error: 'One or more selected teams are no longer available. Refresh the form and try again.' }
    }
    const teamReferences = resolvedTeams.references
    const cleanTeams = resolvedTeams.names
    const primaryTeamReference = teamReferences[0]

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

    let passwordHash: string | undefined = undefined
    if (input.password && input.password.length >= 8) {
      const rawHash = await bcrypt.hash(input.password, 10)
      // Double layer protection: Encrypt the bcrypt hash with AES-256-GCM before storing in Sanity
      passwordHash = encrypt(rawHash)
    }

    const encryptedBirthDate = encrypt(cleanBirthDate)
    const birthdayBlindIndex = createBirthdayBlindIndex(cleanBirthDate)

    if (existing) {
      // 4a. Worker Exists -> Compute Delta Log and Patch
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
      if (deltaLogs.length === 0) {
        deltaLogs.push(`Profile re-verified on ${today}`)
      }

      const patchData: Record<string, unknown> = {
        fullName: cleanFullName,
        ...(cleanFirstName ? { firstName: cleanFirstName } : {}),
        ...(cleanMiddleName !== undefined ? { middleName: cleanMiddleName } : {}),
        ...(cleanLastName ? { lastName: cleanLastName } : {}),
        team: primaryTeamReference,
        teams: teamReferences,
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
          'birthMonth',
          'birthDay',
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

      return {
        ok: true,
        isExco: Boolean(existing.role || existing.requestedRole),
        message: 'Your worker profile has been updated.',
        ...(uploadGrant ? { uploadGrant } : {}),
      }
    } else {
      // 4b. New Worker -> Create document with initial updateLog
      const initialLogs = [`Initial worker registration on ${today}`]
      if (input.isExco && input.requestedRole) {
        initialLogs.push(`Requested Exco role (${input.requestedRole}) on ${today} (pending approval)`)
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
        team: primaryTeamReference,
        teams: teamReferences,
        hall: input.hall,
        roomNumber: encrypt(input.roomNumber.trim()),
        birthDate: encryptedBirthDate,
        birthdayBlindIndex,
        verificationStatus: 'pending',
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

      if (input.isExco && passwordHash && input.requestedRole) {
        newDoc.passwordHash = passwordHash
        newDoc.requestedRole = input.requestedRole
        newDoc.isExcoApproved = false
      }

      await createPrivateDocument(newDoc)

      revalidatePath('/dashboard/workers')

      return {
        ok: true,
        isExco: Boolean(input.isExco),
        message: input.isExco
          ? `Welcome to ECCF, ${cleanFullName}! Your registration has been submitted to your Team Leader for verification, and your Exco dashboard request is pending CSGB approval.`
          : `Welcome to the Workforce, ${cleanFullName}! Your registration has been submitted to your Team Leader for membership approval.`,
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
 * Set or reset a dashboard password only after the worker's registered email link was verified.
 */
export async function setupExcoPassword(input: {
  newPassword: string
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const password = input.newPassword?.trim() || ''
    if (password.length < 12) {
      return { ok: false, error: 'Choose a password with at least 12 characters.' }
    }

    const token = cookies().get(SELF_SERVICE_COOKIE)?.value
    const worker = token ? await getWorkerBySelfServiceToken(token, 'password') : null
    if (!worker || (!worker.role && !worker.requestedRole)) {
      return { ok: false, error: 'Your secure link is invalid or expired. Request a new password setup link.' }
    }

    const rawHash = await bcrypt.hash(password, 10)
    const encryptedHash = encrypt(rawHash)

    const today = new Date().toISOString().split('T')[0]
    await patchPrivateDocument(worker._id)
      .set({
        passwordHash: encryptedHash,
        updatedAt: new Date().toISOString(),
      })
      .unset([
        'selfServiceTokenHash',
        'selfServiceTokenPurpose',
        'selfServiceTokenExpiresAt',
        'selfServiceRequestedAt',
      ])
      .append('updateLog', [`Dashboard password configured on ${today}`])
      .commit()

    cookies().delete(SELF_SERVICE_COOKIE)

    revalidatePath('/dashboard')
    revalidatePath('/login')

    return {
      ok: true,
      message: 'Password updated. You can now sign in.',
    }
  } catch (err) {
    console.error('[setupExcoPassword] Error:', err)
    return { ok: false, error: 'Failed to update password. Please try again.' }
  }
}


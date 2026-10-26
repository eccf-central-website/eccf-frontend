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

import { createHash, createHmac, randomInt, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { createPrivateDocument, patchPrivateDocument, sanityPrivateClient, sanityWriteClient } from '@/lib/sanity'
import { FELLOWSHIP_TEAMS } from '@/lib/dashboard/attendance-constants'
import { resolveResendFrom } from '@/lib/email/from'
import {
  ECCF_EMAIL,
  emailButton,
  emailCodeBlock,
  emailDetails,
  emailDivider,
  emailList,
  emailNotice,
  emailParagraph,
  emailSectionTitle,
  escapeHtml,
  renderEmailLayout,
  resolveSiteUrl,
} from '@/lib/email/layout'
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
  isExco?: boolean
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
  requiresVerification?: boolean
  /** A first-time registrant must confirm ownership of the email address first. */
  requiresEmailVerification?: boolean
  maskedEmail?: string
}

export interface CheckWorkerPhoneInput {
  phoneNumber: string
  turnstileToken?: string
}

export interface CheckWorkerPhoneResult {
  ok: boolean
  exists: boolean
  maskedEmail?: string
  firstName?: string
  message?: string
  error?: string
  /** True only when the email provider accepted the message. */
  emailSent?: boolean
  /** Seconds the caller must wait before requesting another code. */
  retryAfterSeconds?: number
}

export interface SignedInWorkerSnapshot {
  id: string
  fullName: string
  firstName?: string
  middleName?: string
  lastName?: string
  email: string
  phoneNumber?: string
  hall?: string
  roomNumber?: string
  birthMonth?: number
  birthDay?: number
  profileImageUrl?: string
  teams: string[]
  isExco?: boolean
  linkedBy: 'clerk' | 'verified-email'
}

export interface SignedInUserContext {
  isSignedIn: boolean
  clerkUserId?: string
  email?: string
  emailVerified?: boolean
  firstName?: string
  lastName?: string
  fullName?: string
  /** Present only when the signed-in Clerk account is trusted to edit the worker record. */
  worker?: SignedInWorkerSnapshot
  /** A profile exists but is linked to a different sign-in method; require an email code. */
  needsVerification?: boolean
}

export interface RequestRegistrationEmailOtpInput {
  email: string
  firstName?: string
  turnstileToken?: string
}

export interface RequestRegistrationEmailOtpResult {
  ok: boolean
  maskedEmail?: string
  /** Seconds the caller must wait before requesting another code. */
  retryAfterSeconds?: number
  message?: string
  error?: string
}

export interface VerifyRegistrationEmailOtpInput {
  email: string
  otp: string
}

export interface VerifyRegistrationEmailOtpResult {
  ok: boolean
  verifiedEmail?: string
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

/** Parses either MM-DD or YYYY-MM-DD into numeric month/day without a year. */
function parseBirthdayParts(birthday?: string | null): { birthMonth?: number; birthDay?: number } {
  if (!birthday || typeof birthday !== 'string') return {}
  const parts = birthday.split('-')
  if (parts.length === 3) {
    const birthMonth = Number(parts[1])
    const birthDay = Number(parts[2])
    return Number.isFinite(birthMonth) && Number.isFinite(birthDay) ? { birthMonth, birthDay } : {}
  }
  if (parts.length === 2) {
    const birthMonth = Number(parts[0])
    const birthDay = Number(parts[1])
    return Number.isFinite(birthMonth) && Number.isFinite(birthDay) ? { birthMonth, birthDay } : {}
  }
  return {}
}

/**
 * Resolves the authenticated Clerk identity and whether the primary email is verified.
 * Never trusts a client-supplied Clerk user id.
 */
async function getClerkSessionIdentity(): Promise<{
  userId?: string
  email?: string
  emailVerified: boolean
  firstName?: string
  lastName?: string
}> {
  try {
    const authState = await auth()
    if (!authState?.userId) return { emailVerified: false }
    const user = await currentUser().catch(() => null)
    if (!user) return { userId: authState.userId, emailVerified: false }
    const primary =
      user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId) ||
      user.emailAddresses[0]
    return {
      userId: user.id,
      email: primary?.emailAddress,
      emailVerified: primary?.verification?.status === 'verified',
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    }
  } catch {
    return { emailVerified: false }
  }
}

const SELF_SERVICE_COOKIE = 'eccf_worker_self_service'
const SELF_SERVICE_TOKEN_TTL_MS = 15 * 60 * 1000
const SELF_SERVICE_RESEND_COOLDOWN_MS = 60 * 1000
const selfServiceEmailer = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// First-time registration requires proof that the applicant can read the email
// inbox before the rest of the form can be completed.
const REGISTRATION_OTP_COOKIE = 'eccf_registration_email_otp'
const REGISTRATION_PROOF_COOKIE = 'eccf_registration_email_proof'
const REGISTRATION_OTP_TTL_MS = 10 * 60 * 1000
const REGISTRATION_PROOF_TTL_MS = 30 * 60 * 1000
const REGISTRATION_RESEND_COOLDOWN_MS = 60 * 1000
const REGISTRATION_MAX_OTP_ATTEMPTS = 5

// Returning-worker OTP challenge. Kept in an encrypted, HTTP-only cookie so it
// does not depend on deprecated worker token fields in Sanity.
const WORKER_OTP_COOKIE = 'eccf_worker_login_otp'

interface RegistrationOtpCookie {
  email: string
  otpHash: string
  expiresAt: number
  sentAt: number
  attempts: number
}

interface RegistrationProofCookie {
  email: string
  verifiedAt: number
  expiresAt: number
}

interface WorkerOtpCookie {
  workerId: string
  email: string
  purpose: 'profile' | 'password'
  phone?: string
  firstName?: string
  otpHash: string
  expiresAt: number
  sentAt: number
}

interface SelfServiceTokenPayload {
  workerId: string
  email?: string
  purpose: 'profile' | 'password'
  expiresAt: number
}

function hashSelfServiceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function safeHashEquals(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  } catch {
    return false
  }
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

function writeEncryptedCookie(name: string, payload: unknown, maxAgeSeconds: number): boolean {
  try {
    cookies().set(name, encrypt(JSON.stringify(payload)), cookieOptions(maxAgeSeconds))
    return true
  } catch {
    console.error(`[worker-registration] Could not write secure cookie ${name}`)
    return false
  }
}

function readEncryptedCookie<T>(name: string): T | null {
  try {
    const raw = cookies().get(name)?.value
    if (!raw) return null
    const decrypted = decrypt(raw)
    if (!decrypted) return null
    return JSON.parse(decrypted) as T
  } catch {
    return null
  }
}

function deleteCookie(name: string) {
  try {
    cookies().delete(name)
  } catch {
    // Cookie mutation is only available inside a server action.
  }
}

function selfServiceResponse(): { ok: true; message: string } {
  return {
    ok: true,
    message: 'If those details match a worker account with an email on file, a secure link and code have been sent. Check your inbox and spam folder. The link expires in 15 minutes.',
  }
}

function createSelfServiceToken(payload: SelfServiceTokenPayload): string {
  return Buffer.from(encrypt(JSON.stringify(payload)), 'utf8').toString('base64url')
}

function readSelfServiceToken(token: string): SelfServiceTokenPayload | null {
  if (!token || token.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(token)) return null
  try {
    const decrypted = decrypt(Buffer.from(token, 'base64url').toString('utf8'))
    if (!decrypted) return null
    const payload = JSON.parse(decrypted) as SelfServiceTokenPayload
    if (!payload?.workerId || !payload.purpose || !payload.expiresAt) return null
    if (payload.expiresAt <= Date.now()) return null
    return payload
  } catch {
    return null
  }
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
}): Promise<{ sent: boolean; simulated: boolean; error?: string }> {
  const siteUrl = resolveSiteUrl(baseUrl)
  const confirmationUrl = new URL('/register', siteUrl)
  confirmationUrl.searchParams.set('selfServiceToken', token)
  const fromAddress = resolveResendFrom('ECCF Workforce')
  const subject = `[ECCF Workforce] Your Verification Code: ${otp}`

  const emailHtml = renderEmailLayout({
    preheader: `Your ECCF verification code is ${otp}. It expires in 15 minutes.`,
    eyebrow: 'Workforce · Security check',
    title: 'Verify your worker profile',
    siteUrl,
    content: [
      emailParagraph(`Hello ${escapeHtml(fullName || 'Beloved Worker')},`),
      emailParagraph(
        'We received a request to open and update your workforce profile on the ECCF portal. For your protection and privacy, your details stay locked until this check is complete.'
      ),
      emailCodeBlock({
        code: otp,
        caption: 'Your 6-digit verification code',
        note: 'Enter this code on the registration page to unlock your profile.',
      }),
      emailParagraph('Prefer one click? Use the button below instead of typing the code.'),
      emailButton({
        href: confirmationUrl.toString(),
        label: 'Unlock my worker profile',
        siteUrl,
      }),
      emailNotice({
        title: 'This code expires in 15 minutes',
        body: 'If you did not ask to update your profile, you can safely ignore this email. Nothing will change until the code is used.',
        tone: 'neutral',
      }),
    ].join(''),
    footerNote:
      'You received this email because someone requested access to a worker profile linked to this address.',
  })

  const plainText = `ECCF Worker Profile Security Verification\n\nHello ${fullName || 'Worker'},\n\nYour 6-digit verification code is: ${otp}\n\nAlternatively, you can unlock your profile using this secure link:\n${confirmationUrl.toString()}\n\nThis code and link expire in 15 minutes.`

  if (!selfServiceEmailer) {
    console.warn('[sendWorkerVerificationEmail] Missing selfServiceEmailer (RESEND_API_KEY).')
    if (process.env.NODE_ENV === 'production') {
      return { sent: false, simulated: false, error: 'Email service is not configured.' }
    }
    return { sent: true, simulated: true }
  }

  try {
    // Resend v6 returns { data, error } and does NOT throw on API errors.
    const { error } = await selfServiceEmailer.emails.send({
      from: fromAddress,
      to: email,
      subject,
      text: plainText,
      html: emailHtml,
    })

    if (error) {
      const message = error.message || 'Email provider rejected the message.'
      const isTestingRestriction = /only send testing emails|not verified|domain/i.test(message)
      console.error('[sendWorkerVerificationEmail] Resend rejected the message:', {
        name: error.name,
        hint: isTestingRestriction
          ? 'Verify a sending domain in Resend and set RESEND_FROM_EMAIL to an address on that domain.'
          : undefined,
      })
      if (process.env.NODE_ENV !== 'production') {
        return { sent: true, simulated: true }
      }
      return { sent: false, simulated: false, error: message }
    }

    return { sent: true, simulated: false }
  } catch (err: unknown) {
    console.error('[sendWorkerVerificationEmail] Resend dispatch error:', err instanceof Error ? err.message : 'Unknown dispatch error')
    return {
      sent: false,
      simulated: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function sendRegistrationOtpEmail({
  email,
  firstName,
  otp,
}: {
  email: string
  firstName?: string
  otp: string
}): Promise<{ sent: boolean; simulated: boolean; error?: string }> {
  const fromAddress = resolveResendFrom('ECCF Workforce')
  const subject = `[ECCF Workforce] Confirm your email: ${otp}`
  const greeting = firstName?.trim() || 'Beloved Worker'
  const siteUrl = resolveSiteUrl()

  const emailHtml = renderEmailLayout({
    preheader: `Your ECCF confirmation code is ${otp}. It expires in 10 minutes.`,
    eyebrow: 'Workforce · Email confirmation',
    title: 'Confirm your email address',
    siteUrl,
    content: [
      emailParagraph(`Hello ${escapeHtml(greeting)},`),
      emailParagraph(
        'You started a worker registration on the ECCF portal. Enter the code below on the registration page to confirm that this email address belongs to you.'
      ),
      emailCodeBlock({
        code: otp,
        caption: 'Your 6-digit confirmation code',
        note: 'The code expires in 10 minutes.',
      }),
      emailNotice({
        title: 'Keep this code to yourself',
        body: 'ECCF will never ask you to share this code with anyone. If you did not start a worker registration, you can ignore this email.',
        tone: 'neutral',
      }),
    ].join(''),
    footerNote:
      'You received this email because a worker registration was started with this address.',
  })

  const plainText = `ECCF Worker Registration\n\nHello ${greeting},\n\nYour 6-digit email confirmation code is: ${otp}\n\nEnter it on the registration page to continue. This code expires in 10 minutes.\n\nIf you did not start a worker registration, you can ignore this email.`

  if (!selfServiceEmailer) {
    console.warn('[sendRegistrationOtpEmail] Missing selfServiceEmailer (RESEND_API_KEY).')
    if (process.env.NODE_ENV === 'production') {
      return { sent: false, simulated: false, error: 'Email service is not configured.' }
    }
    return { sent: true, simulated: true }
  }

  try {
    const { error } = await selfServiceEmailer.emails.send({
      from: fromAddress,
      to: email,
      subject,
      text: plainText,
      html: emailHtml,
    })

    if (error) {
      const message = error.message || 'Email provider rejected the message.'
      const isTestingRestriction = /only send testing emails|not verified|domain/i.test(message)
      console.error('[sendRegistrationOtpEmail] Resend rejected the message:', {
        name: error.name,
        hint: isTestingRestriction
          ? 'Verify a sending domain in Resend and set RESEND_FROM_EMAIL to an address on that domain.'
          : undefined,
      })
      if (process.env.NODE_ENV !== 'production') {
        return { sent: true, simulated: true }
      }
      return { sent: false, simulated: false, error: message }
    }

    return { sent: true, simulated: false }
  } catch (err: unknown) {
    console.error('[sendRegistrationOtpEmail] Resend dispatch error:', err instanceof Error ? err.message : 'Unknown dispatch error')
    return {
      sent: false,
      simulated: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

function formatExecutiveAppSummary(app?: ExecutiveApplicationInput, isExco?: boolean): string {
  if (!isExco || !app) return 'None (General Worker)'
  if (app.kind === 'csgb') {
    return `CSGB Office: ${app.office || 'Presidential Appointee'}`
  }
  if (app.kind === 'hall') {
    const rank = app.rank === 'assistant' ? 'Assistant Hall Pastor' : 'Hall Pastor'
    return `${rank} (${app.hall || 'Hall of Residence'})`
  }
  if (app.kind === 'team') {
    const rank = app.rank === 'assistant' ? 'Assistant Team Lead' : 'Team Lead'
    return `${rank} (${app.team || 'Operational Team'})`
  }
  return 'Executive Applicant'
}

interface FellowshipNewWorkerNotificationInput {
  fullName: string
  email: string
  phoneNumber: string
  hall: string
  roomNumber: string
  teams: string[]
  isExco: boolean
  executiveApplication?: ExecutiveApplicationInput
}

async function sendFellowshipNewWorkerNotificationEmail(
  input: FellowshipNewWorkerNotificationInput
): Promise<void> {
  const notifyEmail = process.env.NOTIFY_EMAIL || 'edsuchristiancampusfellowship@gmail.com'
  if (!selfServiceEmailer) {
    console.warn('[sendFellowshipNewWorkerNotificationEmail] Missing selfServiceEmailer (RESEND_API_KEY).')
    return
  }

  const executiveSummary = formatExecutiveAppSummary(input.executiveApplication, input.isExco)
  const teamsList = input.teams.length > 0 ? input.teams.join(', ') : 'None'
  const siteUrl = resolveSiteUrl()

  const subject = `[ECCF Workforce] New Worker Registered: ${input.fullName}`
  const emailHtml = renderEmailLayout({
    preheader: `${input.fullName} has just completed worker registration.`,
    eyebrow: 'Workforce intake',
    title: 'A new worker has registered',
    siteUrl,
    content: [
      emailParagraph(
        `<strong>${escapeHtml(input.fullName)}</strong> has just completed registration on the ECCF workforce platform. Here is the summary on record.`
      ),
      emailDetails([
        { label: 'Full name', value: escapeHtml(input.fullName) },
        { label: 'Email address', value: escapeHtml(input.email) },
        { label: 'Phone number', value: escapeHtml(input.phoneNumber) },
        {
          label: 'Hall & room',
          value: `${escapeHtml(input.hall)}, Room ${escapeHtml(input.roomNumber)}`,
        },
        { label: 'Operational teams', value: escapeHtml(teamsList), accent: true },
        {
          label: 'Executive application',
          value: escapeHtml(executiveSummary),
          muted: !input.isExco,
        },
      ]),
      emailButton({
        href: `${siteUrl}/dashboard/workers`,
        label: 'Review in the Exco dashboard',
        siteUrl,
      }),
    ].join(''),
    footerNote:
      'You received this notification because you manage worker intake for the fellowship.',
  })

  const plainText = `ECCF Workforce — New Worker Registration\n\n` +
    `A new worker has completed registration:\n\n` +
    `Full Name: ${input.fullName}\n` +
    `Email: ${input.email}\n` +
    `Phone: ${input.phoneNumber}\n` +
    `Hall & Room: ${input.hall}, Room ${input.roomNumber}\n` +
    `Operational Teams: ${teamsList}\n` +
    `Executive Application: ${executiveSummary}\n\n` +
    `Review worker records on the Exco Portal: ${siteUrl}/dashboard/workers`

  await selfServiceEmailer.emails.send({
    from: resolveResendFrom('ECCF Workforce Intake'),
    to: notifyEmail,
    subject,
    text: plainText,
    html: emailHtml,
  })
}

export interface WorkerRegistrationReceivedEmailInput {
  fullName: string
  firstName?: string
  email: string
  phoneNumber: string
  hall: string
  roomNumber: string
  teams: string[]
  isExco: boolean
  executiveApplication?: ExecutiveApplicationInput
}

export async function sendWorkerRegistrationReceivedEmail(
  input: WorkerRegistrationReceivedEmailInput
): Promise<void> {
  if (!selfServiceEmailer) {
    console.warn('[sendWorkerRegistrationReceivedEmail] Missing selfServiceEmailer (RESEND_API_KEY).')
    return
  }

  const displayName = input.firstName?.trim() || input.fullName.split(' ')[0] || input.fullName
  const teamsList = input.teams.length > 0 ? input.teams.join(', ') : 'Assigned Unit'
  const executiveSummary = formatExecutiveAppSummary(input.executiveApplication, input.isExco)
  const siteUrl = resolveSiteUrl()

  const subject = `Workforce Registration Received — ${displayName}`
  const emailHtml = renderEmailLayout({
    preheader: `We received your workforce registration, ${displayName}. Your Team Leader(s) will review your request.`,
    eyebrow: 'Workforce · Application Received',
    title: `Registration Received, ${escapeHtml(displayName)}!`,
    siteUrl,
    content: [
      emailParagraph(
        'Thank you for submitting your workforce registration with the <strong>Edo State University Christian Campus Fellowship</strong>. Your registration details have been received and forwarded to your Team Leader(s) for review.'
      ),
      emailSectionTitle('Your registration summary'),
      emailDetails([
        { label: 'Operational teams', value: escapeHtml(teamsList), accent: true },
        {
          label: 'Campus residence',
          value: `${escapeHtml(input.hall)}, Room ${escapeHtml(input.roomNumber)}`,
        },
        { label: 'Registered email', value: escapeHtml(input.email) },
        { label: 'Phone number', value: escapeHtml(input.phoneNumber) },
        ...(input.isExco
          ? [
              {
                label: 'Executive application',
                value: `${escapeHtml(executiveSummary)} <span style="font-weight:500;color:#8a5a12;">(pending approval)</span>`,
              },
            ]
          : []),
      ]),
      emailSectionTitle('What happens next?'),
      emailList([
        '<strong>Team Lead Review:</strong> Your Team Leader(s) have received your request and will review your membership on their leadership portal.',
        '<strong>No Sign-in Required:</strong> You do not need to sign in or take any extra action right now.',
        '<strong>Official Welcome:</strong> Once verified by your Team Lead(s), you will receive an official welcome email confirming your active workforce membership.',
      ]),
      emailDivider(),
      emailParagraph(
        'If you need to update your contact details or campus residence in the future, you can do so anytime using the self-service update on the registration portal.'
      ),
    ].join(''),
    signature: {
      name: 'ECCF Workforce Office',
      role: 'Edo State University Christian Campus Fellowship',
    },
    footerNote:
      'You received this email because you submitted a worker registration with the fellowship.',
  })

  const plainText = `Workforce Registration Received — ${displayName}\n\n` +
    `Thank you for submitting your workforce registration with the Edo State University Christian Campus Fellowship (ECCF).\n\n` +
    `Your request has been received and forwarded to your Team Leader(s) for review.\n\n` +
    `YOUR REGISTRATION DETAILS:\n` +
    `- Operational Teams: ${teamsList}\n` +
    `- Campus Residence: ${input.hall}, Room ${input.roomNumber}\n` +
    `- Registered Email: ${input.email}\n` +
    `- Registered Phone: ${input.phoneNumber}\n\n` +
    `WHAT HAPPENS NEXT:\n` +
    `1. Your Team Leader(s) will review your membership on their leadership portal.\n` +
    `2. You do not need to sign in or take any extra action right now.\n` +
    `3. Once verified, you will receive an official welcome email confirming your active workforce membership.\n\n` +
    `Edo State University Christian Campus Fellowship (ECCF)\n` +
    `${ECCF_EMAIL.address}\n` +
    `${ECCF_EMAIL.venue}`

  await selfServiceEmailer.emails.send({
    from: resolveResendFrom('ECCF Workforce Intake'),
    to: input.email,
    subject,
    text: plainText,
    html: emailHtml,
  })
}

export interface WorkerWelcomeEmailInput {
  fullName: string
  firstName?: string
  email: string
  phoneNumber: string
  hall: string
  roomNumber: string
  teams: string[]
  birthDate?: string
  isExco: boolean
  executiveApplication?: ExecutiveApplicationInput
}

export async function sendWorkerWelcomeEmail(
  input: WorkerWelcomeEmailInput
): Promise<void> {
  if (!selfServiceEmailer) {
    console.warn('[sendWorkerWelcomeEmail] Missing selfServiceEmailer (RESEND_API_KEY).')
    return
  }

  const displayName = input.firstName?.trim() || input.fullName.split(' ')[0] || input.fullName
  const teamsList = input.teams.length > 0 ? input.teams.join(', ') : 'Assigned Unit'
  const executiveSummary = formatExecutiveAppSummary(input.executiveApplication, input.isExco)
  const siteUrl = resolveSiteUrl()
  const registerUrl = `${siteUrl}/register`

  const subject = `Welcome to the ECCF Workforce Platform, ${displayName}!`
  const emailHtml = renderEmailLayout({
    preheader: `Your worker profile is active. Here is what you can do next, ${displayName}.`,
    eyebrow: 'Workforce · Welcome',
    title: `Welcome to the workforce family, ${escapeHtml(displayName)}!`,
    siteUrl,
    content: [
      emailParagraph(
        'It is a joy to welcome you into the workforce family of the <strong>Edo State University Christian Campus Fellowship</strong>! Your membership has been reviewed and verified by your Team Leader(s). Thank you for making yourself available for service in God&rsquo;s house.'
      ),
      emailSectionTitle('Your registered details'),
      emailDetails([
        { label: 'Operational teams', value: escapeHtml(teamsList), accent: true },
        {
          label: 'Campus residence',
          value: `${escapeHtml(input.hall)}, Room ${escapeHtml(input.roomNumber)}`,
        },
        { label: 'Registered email', value: escapeHtml(input.email) },
        { label: 'Phone number', value: escapeHtml(input.phoneNumber) },
        ...(input.isExco
          ? [
              {
                label: 'Executive application',
                value: `${escapeHtml(executiveSummary)} <span style="font-weight:500;color:#8a5a12;">(pending approval)</span>`,
              },
            ]
          : []),
      ]),
      emailSectionTitle('What you can do on the platform'),
      emailList([
        '<strong>Keep Your Info Current:</strong> Moved to a new room or changed your phone number? Update your details anytime so the fellowship stays connected with you.',
        '<strong>Update your assigned Team(s) for each session.</strong>',
        '<strong>Upload and Update a decent and clear picture of yourself.</strong> This enables us to design a birthday flyer and celebrate with you on your Birthday.',
        '<strong>Membership Verification:</strong> Your team leader(s) will verify your active membership on the leadership portal.',
      ]),
      emailDivider(),
      emailSectionTitle('How to update your information anytime'),
      emailParagraph(
        'You do not need to register from scratch when your details change. Follow these quick steps:'
      ),
      emailList(
        [
          `Go to the registration portal at <a href="${registerUrl}" style="color:#0077cc;font-weight:600;text-decoration:underline;">${escapeHtml(registerUrl.replace(/^https?:\/\//, ''))}</a>.`,
          `Enter your registered phone number (<strong>${escapeHtml(input.phoneNumber)}</strong>) or email address in Step 1.`,
          'The platform will recognise your profile and send a secure 6-digit confirmation code to this email address.',
          'Enter the code to unlock self-service editing. You can then update your photo, assigned teams, or room number in seconds.',
        ],
        { ordered: true }
      ),
      ...(input.isExco
        ? [
            emailNotice({
              title: 'A note for executive applicants',
              body: `Your application for <strong>${escapeHtml(executiveSummary)}</strong> has been submitted to the Fellowship President. Once approved, your executive dashboard access will be activated automatically and you will receive a separate approval email with access guidelines.`,
              tone: 'warning',
            }),
          ]
        : []),
      emailButton({ href: registerUrl, label: 'Open the workforce portal', siteUrl }),
    ].join(''),
    signature: {
      name: 'ECCF Workforce Office',
      role: 'Edo State University Christian Campus Fellowship',
    },
    footerNote:
      'You received this email because you completed worker registration with the fellowship.',
  })

  const plainText = `Welcome to ECCF Workforce, ${displayName}!\n\n` +
    `We are overjoyed to welcome you into the workforce family of the Edo State University Christian Campus Fellowship (ECCF).\n\n` +
    `YOUR REGISTERED DETAILS:\n` +
    `- Operational Teams: ${teamsList}\n` +
    `- Campus Residence: ${input.hall}, Room ${input.roomNumber}\n` +
    `- Registered Email: ${input.email}\n` +
    `- Registered Phone: ${input.phoneNumber}\n` +
    (input.isExco ? `- Executive Application: ${executiveSummary} (Pending Presidential Approval)\n` : '') +
    `\nHOW TO UPDATE YOUR INFORMATION ANYTIME:\n` +
    `1. Visit ${registerUrl}\n` +
    `2. Enter your phone number (${input.phoneNumber}) or email in Step 1\n` +
    `3. Receive a 6-digit confirmation code on this email address\n` +
    `4. Enter the code to unlock self-service profile and photo editing.\n\n` +
    `Edo State University Christian Campus Fellowship (ECCF)\n` +
    `${ECCF_EMAIL.address}\n` +
    `${ECCF_EMAIL.venue}`

  await selfServiceEmailer.emails.send({
    from: resolveResendFrom('ECCF Workforce'),
    to: input.email,
    subject,
    text: plainText,
    html: emailHtml,
  })
}

/**
 * Sends a 6-digit code to the email address a first-time worker wants to use.
 * The code hash is stored in an encrypted, HTTP-only cookie so registration can
 * prove inbox ownership without creating a temporary Sanity record.
 */
export async function requestRegistrationEmailOtp(
  input: RequestRegistrationEmailOtpInput
): Promise<RequestRegistrationEmailOtpResult> {
  try {
    const cleanEmail = input.email?.trim().toLowerCase() || ''
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { ok: false, error: 'Please enter a valid email address.' }
    }

    if (input.turnstileToken && !(await verifyTurnstileToken(input.turnstileToken))) {
      return { ok: false, error: 'Complete the security verification and try again.' }
    }

    const existing = readEncryptedCookie<RegistrationOtpCookie>(REGISTRATION_OTP_COOKIE)
    if (
      existing &&
      existing.email === cleanEmail &&
      existing.expiresAt > Date.now() &&
      Date.now() - existing.sentAt < REGISTRATION_RESEND_COOLDOWN_MS
    ) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((REGISTRATION_RESEND_COOLDOWN_MS - (Date.now() - existing.sentAt)) / 1000)
      )
      return {
        ok: true,
        maskedEmail: maskEmail(cleanEmail),
        retryAfterSeconds,
        message: `A confirmation code was recently sent to ${maskEmail(cleanEmail)}. Check your inbox and spam folder, or wait ${retryAfterSeconds}s before requesting another one.`,
      }
    }

    const otp = String(randomInt(100000, 1000000))
    const now = Date.now()
    const expiresAt = now + REGISTRATION_OTP_TTL_MS

    const delivery = await sendRegistrationOtpEmail({
      email: cleanEmail,
      firstName: input.firstName,
      otp,
    })

    if (!delivery.sent) {
      return {
        ok: false,
        maskedEmail: maskEmail(cleanEmail),
        error:
          'The confirmation email could not be delivered right now. Please try again shortly, or contact an ECCF administrator for help.',
      }
    }

    const stored = writeEncryptedCookie(
      REGISTRATION_OTP_COOKIE,
      {
        email: cleanEmail,
        otpHash: hashSelfServiceToken(otp),
        expiresAt,
        sentAt: now,
        attempts: 0,
      } satisfies RegistrationOtpCookie,
      Math.ceil(REGISTRATION_OTP_TTL_MS / 1000)
    )

    if (!stored) {
      return {
        ok: false,
        error: 'The confirmation code could not be saved securely. Please enable cookies and try again.',
      }
    }

    return {
      ok: true,
      maskedEmail: maskEmail(cleanEmail),
      retryAfterSeconds: 60,
      message: delivery.simulated
        ? `Development mode: the confirmation code for ${maskEmail(cleanEmail)} was written to the server log instead of being emailed.`
        : `A 6-digit confirmation code has been sent to ${maskEmail(cleanEmail)}. Check your inbox and spam folder.`,
    }
  } catch (err) {
    console.error('[requestRegistrationEmailOtp] Error:', err)
    return { ok: false, error: 'Unable to send the confirmation code. Please try again.' }
  }
}

/**
 * Verifies the code sent by `requestRegistrationEmailOtp` and, on success,
 * issues a short-lived proof cookie that `registerWorker` requires before it
 * creates a brand-new worker document.
 */
export async function verifyRegistrationEmailOtp(
  input: VerifyRegistrationEmailOtpInput
): Promise<VerifyRegistrationEmailOtpResult> {
  try {
    const cleanEmail = input.email?.trim().toLowerCase() || ''
    const cleanOtp = input.otp?.trim().replace(/\s+/g, '') || ''
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { ok: false, error: 'Please enter a valid email address.' }
    }
    if (!/^\d{6}$/.test(cleanOtp)) {
      return { ok: false, error: 'Please enter the 6-digit confirmation code.' }
    }

    const challenge = readEncryptedCookie<RegistrationOtpCookie>(REGISTRATION_OTP_COOKIE)
    if (!challenge) {
      return { ok: false, error: 'Request a confirmation code for this email before continuing.' }
    }
    if (challenge.expiresAt <= Date.now()) {
      deleteCookie(REGISTRATION_OTP_COOKIE)
      return { ok: false, error: 'That confirmation code has expired. Request a new one.' }
    }
    if (challenge.email !== cleanEmail) {
      return {
        ok: false,
        error: 'That confirmation code was sent to a different email address. Request a new code for this address.',
      }
    }
    if (challenge.attempts >= REGISTRATION_MAX_OTP_ATTEMPTS) {
      deleteCookie(REGISTRATION_OTP_COOKIE)
      return { ok: false, error: 'Too many incorrect attempts. Request a new confirmation code.' }
    }

    if (!safeHashEquals(challenge.otpHash, hashSelfServiceToken(cleanOtp))) {
      const attempts = challenge.attempts + 1
      if (attempts >= REGISTRATION_MAX_OTP_ATTEMPTS) {
        deleteCookie(REGISTRATION_OTP_COOKIE)
        return { ok: false, error: 'Too many incorrect attempts. Request a new confirmation code.' }
      }
      writeEncryptedCookie(
        REGISTRATION_OTP_COOKIE,
        { ...challenge, attempts } satisfies RegistrationOtpCookie,
        Math.max(1, Math.ceil((challenge.expiresAt - Date.now()) / 1000))
      )
      const remaining = REGISTRATION_MAX_OTP_ATTEMPTS - attempts
      return {
        ok: false,
        error: `That code is not correct. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      }
    }

    const now = Date.now()
    const proofExpiresAt = now + REGISTRATION_PROOF_TTL_MS
    const stored = writeEncryptedCookie(
      REGISTRATION_PROOF_COOKIE,
      {
        email: cleanEmail,
        verifiedAt: now,
        expiresAt: proofExpiresAt,
      } satisfies RegistrationProofCookie,
      Math.ceil(REGISTRATION_PROOF_TTL_MS / 1000)
    )

    if (!stored) {
      return {
        ok: false,
        error: 'Email verification succeeded, but the session could not be saved. Please enable cookies and try again.',
      }
    }

    deleteCookie(REGISTRATION_OTP_COOKIE)
    return { ok: true, verifiedEmail: cleanEmail }
  } catch (err) {
    console.error('[verifyRegistrationEmailOtp] Error:', err)
    return { ok: false, error: 'Unable to verify the confirmation code. Please try again.' }
  }
}

function isRegistrationEmailVerified(email: string): boolean {
  const proof = readEncryptedCookie<RegistrationProofCookie>(REGISTRATION_PROOF_COOKIE)
  if (!proof) return false
  if (proof.expiresAt <= Date.now()) {
    deleteCookie(REGISTRATION_PROOF_COOKIE)
    return false
  }
  return proof.email === email.trim().toLowerCase()
}

export interface WorkerSelfServiceDoc {
  _id: string
  _rev?: string
  fullName: string
  firstName?: string
  middleName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  team?: string
  teams?: string[]
  membershipTeamNames?: string[]
  dereferencedTeamNames?: string[]
  memberships?: Array<Record<string, unknown>>
  positions?: Array<{
    kind?: 'csgb' | 'hall' | 'team'
    office?: string
    hall?: string
    team?: { name?: string }
    rank?: 'lead' | 'assistant'
    status?: string
  }>
  hall?: string
  roomNumber?: string
  birthDate?: string
  profileImageUrl?: string
  role?: WorkerRole
  requestedRole?: WorkerRole
  clerkUserId?: string
  isExcoApproved?: boolean
  passwordHash?: string
  updateLog?: string[]
}

async function getWorkerBySelfServiceToken(token: string, purpose?: 'profile' | 'password'): Promise<WorkerSelfServiceDoc | null> {
  const payload = readSelfServiceToken(token)
  if (!payload) return null
  if (purpose && payload.purpose !== purpose) return null

  try {
    return await sanityPrivateClient.fetch<{
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
      membershipTeamNames?: string[]
      dereferencedTeamNames?: string[]
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
      passwordHash?: string
      updateLog?: string[]
    } | null>(
      `*[_type == "worker" && _id == $id][0]{
        _id, _rev, fullName, firstName, middleName, lastName, email, phoneNumber,
        "team": coalesce(memberships[].team->name, memberships[].teamName, teams[]->name, teams, [coalesce(team->name, team)])[0],
        "teams": coalesce(memberships[].team->name, memberships[].teamName, teams[]->name, teams, [coalesce(team->name, team)]),
        "membershipTeamNames": memberships[].teamName,
        "dereferencedTeamNames": memberships[].team->name,
        memberships,
        positions,
        hall, roomNumber, birthDate, profileImageUrl, role, requestedRole,
        clerkUserId, isExcoApproved, passwordHash, updateLog
      }`,
      { id: payload.workerId }
    )
  } catch (err) {
    console.error('[getWorkerBySelfServiceToken] Lookup failed:', err)
    return null
  }
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

    const clerkIdentity = await getClerkSessionIdentity()
    const isAuthed = Boolean(clerkIdentity.userId)
    const existingChallenge = readEncryptedCookie<WorkerOtpCookie>(WORKER_OTP_COOKIE)
    const hasValidExistingChallenge = Boolean(existingChallenge && existingChallenge.expiresAt > Date.now())

    if (!isAuthed && !hasValidExistingChallenge && !(await verifyTurnstileToken(input.turnstileToken))) {
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
    } | null>(
      `*[_type == "worker" && (
        phoneBlindIndex in $indexes ||
        phoneNumber == $cleanPhone
      )] | order(_updatedAt desc)[0]{
        _id, _rev, fullName, firstName, email, phoneNumber
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
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'http://localhost:3000'

    const requestedAt = (existingChallenge && existingChallenge.workerId === worker._id) ? (existingChallenge.sentAt || 0) : 0
    const now = Date.now()

    if (requestedAt && now - requestedAt < SELF_SERVICE_RESEND_COOLDOWN_MS) {
      return {
        ok: true,
        exists: true,
        maskedEmail: maskEmail(email),
        firstName: worker.firstName || worker.fullName?.split(/\s+/)[0],
        emailSent: false,
        retryAfterSeconds: Math.max(1, Math.ceil((SELF_SERVICE_RESEND_COOLDOWN_MS - (now - requestedAt)) / 1000)),
        message: `A verification code was recently sent to ${maskEmail(email)}. Please check your inbox and spam folder, or wait a moment before requesting another one.`,
      }
    }

    const otp = String(randomInt(100000, 1000000))
    const expiresAt = now + SELF_SERVICE_TOKEN_TTL_MS
    const token = createSelfServiceToken({
      workerId: worker._id,
      email,
      purpose: 'profile',
      expiresAt,
    })

    const delivery = await sendWorkerVerificationEmail({
      email,
      fullName: worker.firstName || worker.fullName || '',
      otp,
      token,
      baseUrl,
    })

    if (!delivery.sent) {
      // Do not leave the user stuck behind the resend cooldown when nothing was delivered.
      deleteCookie(WORKER_OTP_COOKIE)
      return {
        ok: false,
        exists: true,
        maskedEmail: maskEmail(email),
        firstName: worker.firstName || worker.fullName?.split(/\s+/)[0],
        emailSent: false,
        error:
          'We found your profile, but the verification email could not be delivered right now. Please try again shortly, or contact an ECCF administrator for help.',
      }
    }

    const challengeStored = writeEncryptedCookie(
      WORKER_OTP_COOKIE,
      {
        workerId: worker._id,
        email,
        purpose: 'profile',
        phone: decrypt(worker.phoneNumber) || cleanPhone,
        firstName: worker.firstName || worker.fullName?.split(/\s+/)[0],
        otpHash: hashSelfServiceToken(otp),
        expiresAt,
        sentAt: now,
      } satisfies WorkerOtpCookie,
      Math.ceil(SELF_SERVICE_TOKEN_TTL_MS / 1000)
    )

    if (!challengeStored) {
      return {
        ok: false,
        exists: true,
        maskedEmail: maskEmail(email),
        firstName: worker.firstName || worker.fullName?.split(/\s+/)[0],
        emailSent: true,
        error:
          'The verification code was sent, but this browser could not store the challenge. Enable cookies and request a new code.',
      }
    }

    return {
      ok: true,
      exists: true,
      maskedEmail: maskEmail(email),
      firstName: worker.firstName || worker.fullName?.split(/\s+/)[0],
      emailSent: true,
      retryAfterSeconds: 60,
      message: delivery.simulated
        ? `Development mode: the verification code was written to the server log instead of being emailed to ${maskEmail(email)}.`
        : `A 6-digit verification code and secure unlock link have been sent to ${maskEmail(email)}. Check your inbox and spam folder.`,
    }
  } catch (err) {
    console.error('[checkWorkerPhoneAndInitiateVerification] Error:', err)
    return { ok: false, exists: false, error: 'Unable to check phone number. Please try again.' }
  }
}

export interface PendingWorkerOtpChallenge {
  hasChallenge: boolean
  maskedEmail?: string
  firstName?: string
  phone?: string
  expiresAt?: number
}

/**
 * Checks if this browser session holds an active, unexpired returning-worker OTP challenge cookie.
 * Used during server rendering to prevent UI flash or Turnstile re-prompt if the route revalidates.
 */
export async function getPendingWorkerOtpChallenge(): Promise<PendingWorkerOtpChallenge> {
  try {
    const challenge = readEncryptedCookie<WorkerOtpCookie>(WORKER_OTP_COOKIE)
    if (challenge && challenge.expiresAt > Date.now()) {
      return {
        hasChallenge: true,
        maskedEmail: maskEmail(challenge.email),
        firstName: challenge.firstName,
        phone: challenge.phone,
        expiresAt: challenge.expiresAt,
      }
    }
  } catch (err) {
    console.error('[getPendingWorkerOtpChallenge] Failed to read challenge cookie:', err)
  }
  return { hasChallenge: false }
}

/**
 * Explicitly clears any pending returning-worker OTP challenge cookie.
 */
export async function clearPendingWorkerChallenge(): Promise<{ ok: boolean }> {
  try {
    deleteCookie(WORKER_OTP_COOKIE)
    return { ok: true }
  } catch (err) {
    console.error('[clearPendingWorkerChallenge] Failed to clear challenge cookie:', err)
    return { ok: false }
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

    const challenge = readEncryptedCookie<WorkerOtpCookie>(WORKER_OTP_COOKIE)
    if (!challenge) {
      return { ok: false, error: 'Request a verification code before continuing.' }
    }
    if (challenge.expiresAt <= Date.now()) {
      deleteCookie(WORKER_OTP_COOKIE)
      return { ok: false, error: 'That verification code has expired. Request a new one.' }
    }
    if (challenge.purpose !== 'profile') {
      return { ok: false, error: 'Invalid or expired verification code. Request a new one.' }
    }
    if (!safeHashEquals(challenge.otpHash, hashSelfServiceToken(cleanOtp))) {
      return { ok: false, error: 'That verification code is not correct. Check your email or request a new code.' }
    }
    if (
      challenge.phone &&
      normalizePhone(challenge.phone) !== normalizePhone(cleanPhone)
    ) {
      return { ok: false, error: 'That verification code was sent for a different profile. Start again.' }
    }

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
      membershipTeamNames?: string[]
      dereferencedTeamNames?: string[]
      memberships?: Array<Record<string, unknown>>
      positions?: Array<Record<string, unknown>>
      hall?: string
      roomNumber?: string
      birthDate?: string
      profileImageUrl?: string
      role?: WorkerRole
      requestedRole?: WorkerRole
      isExcoApproved?: boolean
    } | null>(
      `*[_type == "worker" && _id == $id][0]{
        _id, _rev, fullName, firstName, middleName, lastName, email, phoneNumber,
        "team": coalesce(memberships[].team->name, memberships[].teamName, teams[]->name, teams, [coalesce(team->name, team)])[0],
        "teams": coalesce(memberships[].team->name, memberships[].teamName, teams[]->name, teams, [coalesce(team->name, team)]),
        "membershipTeamNames": memberships[].teamName,
        "dereferencedTeamNames": memberships[].team->name,
        memberships,
        positions,
        hall, roomNumber, birthDate, profileImageUrl, role, requestedRole,
        isExcoApproved
      }`,
      { id: challenge.workerId }
    )

    if (!worker) {
      deleteCookie(WORKER_OTP_COOKIE)
      return { ok: false, error: 'Invalid or expired verification code. Please check your email or request a new code.' }
    }

    const sessionExpiresAt = Date.now() + SELF_SERVICE_TOKEN_TTL_MS
    const sessionToken = createSelfServiceToken({
      workerId: worker._id,
      email: worker.email || challenge.email,
      purpose: 'profile',
      expiresAt: sessionExpiresAt,
    })

    deleteCookie(WORKER_OTP_COOKIE)

    const cookieStore = cookies()
    cookieStore.set(SELF_SERVICE_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.ceil(SELF_SERVICE_TOKEN_TTL_MS / 1000),
    })

    const birthday = decrypt(worker.birthDate)
    const { birthMonth, birthDay } = parseBirthdayParts(birthday)

    const roomNumber = decrypt(worker.roomNumber)
    const primaryPos = worker.positions?.[0] as
      | {
          kind?: 'csgb' | 'hall' | 'team'
          office?: string
          hall?: string
          team?: { name?: string }
          rank?: 'lead' | 'assistant'
        }
      | undefined
    let executiveApplication: ExecutiveApplicationInput | undefined
    if (primaryPos && primaryPos.kind) {
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
        team: (() => {
          const list = (worker.dereferencedTeamNames || worker.membershipTeamNames || worker.teams || [])
            .concat(worker.team ? [worker.team] : [])
            .filter((t: unknown): t is string => Boolean(t && typeof t === 'string'));
          return list[0] || 'General';
        })(),
        teams: (() => {
          const list: string[] = [];
          if (Array.isArray(worker.dereferencedTeamNames)) list.push(...worker.dereferencedTeamNames.filter(Boolean));
          if (list.length === 0 && Array.isArray(worker.membershipTeamNames)) list.push(...worker.membershipTeamNames.filter(Boolean));
          if (list.length === 0 && Array.isArray(worker.teams)) list.push(...worker.teams.filter(Boolean));
          if (list.length === 0 && worker.team) list.push(worker.team);
          if (list.length === 0 && Array.isArray(worker.memberships)) {
            for (const m of worker.memberships) {
              const tName = (m as { teamName?: string; team?: { name?: string } })?.teamName || (m as { teamName?: string; team?: { name?: string } })?.team?.name;
              if (tName) list.push(tName);
            }
          }
          return sanitizeTeamNames(list);
        })(),
        hall: worker.hall,
        roomNumber: roomNumber || '',
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
}): Promise<{ ok: true; message: string; maskedEmail?: string; firstName?: string; phoneNumber?: string }> {
  const genericResponse = selfServiceResponse()
  try {
    const identifier = input.identifier?.trim() || ''
    if (!identifier || !['profile', 'password'].includes(input.purpose)) return genericResponse
    if (input.turnstileToken && !(await verifyTurnstileToken(input.turnstileToken))) return genericResponse
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
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
    } | null>(
      `*[_type == "worker" && (
        lower(email) == $cleanEmail ||
        phoneNumber == $cleanPhone ||
        phoneBlindIndex in $indexes
      )] | order(_updatedAt desc)[0]{
        _id, _rev, fullName, firstName, email, phoneNumber, role, requestedRole
      }`,
      { cleanEmail, cleanPhone, indexes }
    )

    const email = worker?.email?.trim()
    if (!worker || !email) return genericResponse

    const existingChallenge = readEncryptedCookie<WorkerOtpCookie>(WORKER_OTP_COOKIE)
    const requestedAt = (existingChallenge && existingChallenge.workerId === worker._id) ? (existingChallenge.sentAt || 0) : 0
    if (requestedAt && Date.now() - requestedAt < SELF_SERVICE_RESEND_COOLDOWN_MS) {
      return {
        ok: true,
        message: `A verification message was recently sent to ${maskEmail(email)}. Please check your inbox and spam folder, or wait a minute before requesting another one.`,
        maskedEmail: maskEmail(email),
        firstName: worker.firstName || worker.fullName?.split(/\s+/)[0],
        phoneNumber: decrypt(worker.phoneNumber) || (identifier.match(/\d{8,}/) ? cleanPhone : undefined),
      }
    }

    const sentAt = Date.now()
    const expiresAt = sentAt + SELF_SERVICE_TOKEN_TTL_MS
    const otp = String(randomInt(100000, 1000000))
    const token = createSelfServiceToken({
      workerId: worker._id,
      email,
      purpose: input.purpose,
      expiresAt,
    })

    const delivery = await sendWorkerVerificationEmail({
      email,
      fullName: worker.firstName || worker.fullName || '',
      otp,
      token,
      baseUrl,
    })

    if (!delivery.sent) {
      // Keep the public response generic so it cannot be used to enumerate worker accounts.
      deleteCookie(WORKER_OTP_COOKIE)
      return genericResponse
    }

    const challengeStored = writeEncryptedCookie(
      WORKER_OTP_COOKIE,
      {
        workerId: worker._id,
        email,
        purpose: input.purpose,
        phone: decrypt(worker.phoneNumber) || (identifier.match(/\d{8,}/) ? cleanPhone : undefined),
        firstName: worker.firstName || worker.fullName?.split(/\s+/)[0],
        otpHash: hashSelfServiceToken(otp),
        expiresAt,
        sentAt,
      } satisfies WorkerOtpCookie,
      Math.ceil(SELF_SERVICE_TOKEN_TTL_MS / 1000)
    )

    if (!challengeStored) return genericResponse

    return {
      ok: true,
      message: delivery.simulated
        ? `Development mode: the verification code for ${maskEmail(email)} was written to the server log instead of being emailed.`
        : `A 6-digit verification code and secure unlock link have been sent to ${maskEmail(email)}. Check your inbox and spam folder.`,
      maskedEmail: maskEmail(email),
      firstName: worker.firstName || worker.fullName?.split(/\s+/)[0],
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
    if (!worker) {
      return { ok: false, error: 'This link is invalid or has expired. Request a new one.' }
    }

    const cookieStore = cookies()
    cookieStore.set(SELF_SERVICE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    })

    const birthday = decrypt(worker.birthDate)
    const { birthMonth, birthDay } = parseBirthdayParts(birthday)

    const roomNumber = decrypt(worker.roomNumber)
    const primaryPos = worker.positions?.[0] as
      | {
          kind?: 'csgb' | 'hall' | 'team'
          office?: string
          hall?: string
          team?: { name?: string }
          rank?: 'lead' | 'assistant'
        }
      | undefined
    let executiveApplication: ExecutiveApplicationInput | undefined
    if (primaryPos && primaryPos.kind) {
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
        team: (() => {
          const list = (worker.dereferencedTeamNames || worker.membershipTeamNames || worker.teams || [])
            .concat(worker.team ? [worker.team] : [])
            .filter((t) => Boolean(t && typeof t === 'string'));
          return list[0] || 'General';
        })(),
        teams: (() => {
          const list: string[] = [];
          if (Array.isArray(worker.dereferencedTeamNames)) list.push(...worker.dereferencedTeamNames.filter(Boolean));
          if (list.length === 0 && Array.isArray(worker.membershipTeamNames)) list.push(...worker.membershipTeamNames.filter(Boolean));
          if (list.length === 0 && Array.isArray(worker.teams)) list.push(...worker.teams.filter(Boolean));
          if (list.length === 0 && worker.team) list.push(worker.team);
          if (list.length === 0 && Array.isArray(worker.memberships)) {
            for (const m of worker.memberships) {
              const tName = (m as { teamName?: string; team?: { name?: string } })?.teamName || (m as { teamName?: string; team?: { name?: string } })?.team?.name;
              if (tName) list.push(tName);
            }
          }
          return sanitizeTeamNames(list);
        })(),
        hall: worker.hall,
        roomNumber: roomNumber || '',
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

/**
 * Legacy worker records store "General" (or "Exco") when no specific team was
 * recorded. Those are sentinels, not `teamUnit` documents, so they must never be
 * offered as selectable teams or resolved into references.
 */
const PLACEHOLDER_TEAM_NAMES = new Set([
  'general',
  'exco',
  'all',
  'general fellowship',
  'all fellowship',
])

function isConcreteTeamName(name: string): boolean {
  return name.trim().length > 0 && !PLACEHOLDER_TEAM_NAMES.has(name.trim().toLowerCase())
}

/** Trims, de-duplicates, and drops blank/placeholder team names. */
function sanitizeTeamNames(teams?: Array<string | null | undefined> | null): string[] {
  return Array.from(
    new Set(
      (teams || [])
        .map((team) => (typeof team === 'string' ? team.trim() : ''))
        .filter(isConcreteTeamName)
    )
  )
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
/**
 * Ensures a Clerk user exists for the given email so the worker can sign in later.
 * Reuses an existing Clerk user when one already exists for the email.
 */
export async function ensureClerkUserForWorkerEmail(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<string | undefined> {
  try {
    const client = clerkClient()
    const existing = await client.users.getUserList({ emailAddress: [email] })
    if (existing.data && existing.data.length > 0) {
      return existing.data[0].id
    }
    const created = await client.users.createUser({
      emailAddress: [email],
      firstName: firstName?.trim() || undefined,
      lastName: lastName?.trim() || undefined,
      skipPasswordRequirement: true,
    })
    return created.id
  } catch (err) {
    console.error('[ensureClerkUserForWorkerEmail] Failed to ensure Clerk user:', err)
    return undefined
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

    // Resolve Clerk before phone validation. A linked account may refresh a
    // record even when the stored phone number cannot be decrypted yet.
    const clerkIdentity = await getClerkSessionIdentity()
    const requestedPhone = input.phoneNumber?.trim() || ''
    if (!requestedPhone && !clerkIdentity.userId) {
      return { ok: false, error: 'Please enter a valid phone number.' }
    }
    if (requestedPhone && requestedPhone.length < 8) {
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

    // Drop legacy "General"/"Exco" sentinels before resolving references.
    const cleanTeams = sanitizeTeamNames(selectedTeams)

    if (cleanTeams.length === 0) {
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
    if (input.turnstileToken && !(await verifyTurnstileToken(input.turnstileToken))) {
      return { ok: false, error: 'Complete the security check and try again.' }
    }
    // No token is expected at submit time: the form's security checks happen
    // once at the start (phone/e-mail OTP steps), and first-time registration
    // here is still gated by the encrypted email-proof cookie below.

    // 2. Clerk Session & User ID Resolution (never trust input.clerkUserId)
    let resolvedClerkUserId = clerkIdentity.userId
    const cleanPhone = requestedPhone.replace(/\s+/g, '')
    const candidateBlindIndexes = cleanPhone ? getCandidateBlindIndexes(cleanPhone) : []
    const phoneBlindIndex = cleanPhone ? createBlindIndex(cleanPhone) : ''
    const allBlindIndexes = cleanPhone
      ? Array.from(new Set([phoneBlindIndex, ...candidateBlindIndexes]))
      : []
    const cleanEmail = input.email.trim().toLowerCase()
    if (!resolvedClerkUserId) {
      resolvedClerkUserId = await ensureClerkUserForWorkerEmail(
        cleanEmail,
        input.firstName,
        input.lastName
      )
    }
    const today = new Date().toISOString().split('T')[0]

    // 3. Deduplication and Existing Profile Matching
    const identityMatches = await sanityPrivateClient.fetch<Array<{
      _id: string
      _rev: string
      fullName?: string
      phoneNumber?: string
      team?: string
      teams?: string[]
      membershipTeamNames?: string[]
      dereferencedTeamNames?: string[]
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
        "team": coalesce(memberships[].team->name, memberships[].teamName, teams[]->name, teams, [coalesce(team->name, team)])[0],
        "teams": coalesce(memberships[].team->name, memberships[].teamName, teams[]->name, teams, [coalesce(team->name, team)]),
        "membershipTeamNames": memberships[].teamName,
        "dereferencedTeamNames": memberships[].team->name,
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

    // Trust a Clerk account only when it is already attached to the record, or
    // when Clerk has verified the same email and the record is not linked to a
    // different Clerk user. Contact changes still require a self-service link.
    const clerkLinkedWorker = resolvedClerkUserId
      ? identityMatches.find((worker) => worker.clerkUserId === resolvedClerkUserId)
      : undefined
    const clerkEmailMatch =
      clerkIdentity.emailVerified && clerkIdentity.email?.trim().toLowerCase() === cleanEmail
        ? identityMatches.find(
            (worker) => !worker.clerkUserId && worker.email?.trim().toLowerCase() === cleanEmail
          )
        : undefined
    const clerkTrustedWorker = clerkLinkedWorker || clerkEmailMatch
    const existing = verifiedWorker || clerkTrustedWorker
    const isClerkTrusted = Boolean(clerkTrustedWorker && existing?._id === clerkTrustedWorker._id)

    if (existing) {
      const belongsToVerifiedWorker = identityMatches.some((worker) => worker._id === existing._id)
      const conflictsWithAnotherWorker = identityMatches.some((worker) => worker._id !== existing._id)
      const storedPhone = decrypt(existing.phoneNumber)
      const contactFieldsUnchanged = existing.email?.trim().toLowerCase() === cleanEmail
      const phoneUnchanged =
        isClerkTrusted ||
        !cleanPhone ||
        (Boolean(storedPhone) && normalizePhone(storedPhone) === normalizePhone(cleanPhone))
      if (
        !belongsToVerifiedWorker ||
        conflictsWithAnotherWorker ||
        !contactFieldsUnchanged ||
        !phoneUnchanged
      ) {
        return { ok: false, error: 'For account safety, phone or email changes must be handled by an ECCF administrator.' }
      }
    } else if (identityMatches.length > 0) {
      const matched = identityMatches[0]
      return {
        ok: false,
        requiresVerification: true,
        maskedEmail: maskEmail(matched.email || ''),
        error: 'A worker record was found matching those contact details. Verify your email to update your profile.',
      }
    }

    if (!existing && cleanPhone.length < 8) {
      return { ok: false, error: 'Please enter a valid phone number.' }
    }

    // 4. Resolve Operational Team References
    const resolvedTeamReferences = await Promise.all(cleanTeams.map((t) => resolveTeamReference(t)))
    const unresolvedTeams = cleanTeams.filter((_, index) => !resolvedTeamReferences[index])
    if (unresolvedTeams.length > 0) {
      return {
        ok: false,
        error: `These teams could not be matched: ${unresolvedTeams.join(', ')}. Please refresh and select again.`,
      }
    }
    const cleanTeamRefs = resolvedTeamReferences.filter(
      (team): team is { _type: 'reference'; _ref: string } => Boolean(team)
    )
    const primaryTeamReference = {
      _type: 'reference' as const,
      _ref: cleanTeamRefs[0]._ref,
    }

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
      positionsToSave = existing.positions.filter((p: Record<string, unknown>) => p.status === 'approved')
    }

    const profileImageUrl = input.profileImageUrl?.trim() || undefined
    if (profileImageUrl) {
      try {
        const photoUrl = new URL(profileImageUrl)
        // Photos uploaded through the app are stored as Sanity assets
        // (cdn.sanity.io). Google avatars and Drive backups are also trusted.
        // Anything else must go through the in-app uploader.
        const trustedPhotoHost = [
          'lh3.googleusercontent.com',
          'drive.google.com',
          'cdn.sanity.io',
        ].includes(photoUrl.hostname)
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

      const prevTeams =
        sanitizeTeamNames(
          existing.teams && existing.teams.length > 0 ? existing.teams : [existing.team]
        )
          .sort()
          .join(', ') || 'none'
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
        teams: cleanTeams,
        team: cleanTeams[0] || 'General',
        ...(positionsToSave ? { positions: positionsToSave } : {}),
        ...(resolvedClerkUserId ? { clerkUserId: resolvedClerkUserId } : {}),
        hall: input.hall,
        roomNumber: encrypt(input.roomNumber.trim()),
        birthDate: encryptedBirthDate,
        birthdayBlindIndex,
        updatedAt: new Date().toISOString(),
      }

      // Upload grants are deprecated and no longer persisted to Sanity.

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
        ])
        .append('updateLog', deltaLogs)
        .commit()

      if (verifiedWorker) {
        cookies().delete(SELF_SERVICE_COOKIE)
      }
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
      }
    } else {
      // First-time registration must prove ownership of the entered email
      // before a new worker document is created.
      if (!isRegistrationEmailVerified(cleanEmail)) {
        return {
          ok: false,
          requiresEmailVerification: true,
          maskedEmail: maskEmail(cleanEmail),
          error: 'Verify your email address before completing registration.',
        }
      }

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
        teams: cleanTeams,
        team: cleanTeams[0] || 'General',
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

      // Upload grants are deprecated and no longer persisted to Sanity.

      if (profileImageUrl) {
        newDoc.profileImageUrl = profileImageUrl
      }

      const createdWorker = await createPrivateDocument(newDoc)
      deleteCookie(REGISTRATION_PROOF_COOKIE)

      // Send Fellowship Admin Notification Email (to edsuchristiancampusfellowship@gmail.com)
      sendFellowshipNewWorkerNotificationEmail({
        fullName: cleanFullName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        hall: input.hall,
        roomNumber: input.roomNumber.trim(),
        teams: selectedTeams,
        isExco: Boolean(input.isExco),
        executiveApplication: input.executiveApplication,
      }).catch((notifyErr) => {
        console.error('[registerWorker] Fellowship notification email error:', notifyErr)
      })

      // Send Registration Received Email to newly registered worker (acknowledgement & review guidelines)
      sendWorkerRegistrationReceivedEmail({
        fullName: cleanFullName,
        firstName: cleanFirstName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        hall: input.hall,
        roomNumber: input.roomNumber.trim(),
        teams: selectedTeams,
        isExco: Boolean(input.isExco),
        executiveApplication: input.executiveApplication,
      }).catch((ackErr) => {
        console.error('[registerWorker] Worker registration received email error:', ackErr)
      })

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
          ? 'Your registration and executive application have been submitted for verification.'
          : 'Your registration has been submitted to your Team Lead(s) for verification.',
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
/**
 * Prepares login for a worker who registered before Clerk account creation.
 * Ensures a Clerk user exists and links it to the Sanity worker document.
 */
export async function activateRegisteredWorkerLogin(
  email: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const cleanEmail = email?.trim().toLowerCase()
  if (!cleanEmail) {
    return { ok: false, error: 'Enter your email address.' }
  }

  try {
    const worker = await sanityPrivateClient.fetch<{
      _id: string
      fullName?: string
      firstName?: string
      lastName?: string
      clerkUserId?: string
      email?: string
    } | null>(
      `*[_type == "worker" && lower(email) == $email][0]{_id, fullName, firstName, lastName, clerkUserId, email}`,
      { email: cleanEmail }
    )

    if (!worker) {
      return { ok: false, error: 'No registered worker found for that email address.' }
    }

    let clerkUserId = worker.clerkUserId
    if (!clerkUserId) {
      clerkUserId = await ensureClerkUserForWorkerEmail(cleanEmail, worker.firstName, worker.lastName)
    }

    if (!clerkUserId) {
      return { ok: false, error: 'Unable to prepare your login. Please try again.' }
    }

    if (!worker.clerkUserId) {
      await patchPrivateDocument(worker._id).set({ clerkUserId }).commit()
    }

    return {
      ok: true,
      message: 'Your account is ready. Please sign in above using the same email address.',
    }
  } catch (err) {
    console.error('[activateRegisteredWorkerLogin] Failed:', err)
    return { ok: false, error: 'Unable to prepare your login. Please try again.' }
  }
}

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

    // Clients may send either a raw Base64 payload or a full data URL
    // ("data:image/jpeg;base64,..."). Buffer.from would happily decode the
    // prefix into corrupt leading bytes, so strip it before decoding.
    const cleanBase64 = base64Image.includes('base64,')
      ? base64Image.slice(base64Image.indexOf('base64,') + 7).replace(/\s/g, '')
      : base64Image
    const imageBytes = Buffer.from(cleanBase64, 'base64')
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

    // Query worker document to build a descriptive filename representing the worker's name and all their teams
    const workerDoc = await sanityPrivateClient.fetch<{
      fullName?: string
      team?: string
      teams?: string[]
      membershipTeams?: Array<string | null>
    } | null>(
      `*[_type == "worker" && _id == $id][0]{
        fullName,
        "team": coalesce(team->name, team),
        "teams": coalesce(teams[]->name, teams),
        "membershipTeams": memberships[]{ "name": coalesce(team->name, teamName) }.name
      }`,
      { id: workerId }
    )

    const cleanName = String(workerDoc?.fullName || 'Worker')
      .normalize('NFKD')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]+/g, '')
      .replace(/^_+|_+$/g, '') || 'Worker'

    const cleanTeam = (val: string) =>
      val
        .normalize('NFKD')
        .trim()
        .replace(/[/\\|]+/g, '-') // Replace slashes with hyphens so team names like "Bible Study/Sunday School" don't break file paths
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]+/g, '')
        .replace(/^_+|_+$/g, '')

    const allTeams: string[] = []
    const addUniqueTeam = (name?: string | null) => {
      if (!name || typeof name !== 'string') return
      const cleaned = cleanTeam(name)
      if (cleaned && !allTeams.includes(cleaned)) {
        allTeams.push(cleaned)
      }
    }

    if (Array.isArray(workerDoc?.membershipTeams)) {
      for (const m of workerDoc.membershipTeams) addUniqueTeam(m)
    }
    if (Array.isArray(workerDoc?.teams)) {
      for (const t of workerDoc.teams) addUniqueTeam(t)
    }
    if (workerDoc?.team) {
      addUniqueTeam(workerDoc.team)
    }

    const teamsPart = allTeams.length > 0 ? allTeams.join('_and_') : 'Workforce'
    // Build descriptive base filename (name + teams, no 'General', no 'Headshot')
    const cleanFileName = `${cleanName}_${teamsPart}`.slice(0, 105).replace(/^_+|_+$/g, '')
    const signedFileName = `${cleanFileName}.${ext}`

    const sanityAsset = await sanityWriteClient.assets.upload('image', imageBytes, {
      filename: signedFileName,
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
      .append('updateLog', [`Uploaded official photo on ${new Date().toISOString().slice(0, 10)}`])
      .commit()

    // Secondary Storage: Google Drive backup (if configured)
    const appScriptUrl = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL
    const signingSecret = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET
    if (appScriptUrl && signingSecret && Buffer.byteLength(signingSecret, 'utf8') >= 32) {
      try {
        const timestamp = Date.now().toString()
        // Sign exactly what the body sends — the Apps Script hashes the
        // payload's fields verbatim, so the filename must be consistent
        // (including the extension) in both places.
        const signaturePayload = `${timestamp}\n${signedFileName}\n${mimeType}\n${cleanBase64}`
        const signature = createHmac('sha256', signingSecret).update(signaturePayload).digest('hex')
        const gasPayload = JSON.stringify({
          base64: cleanBase64,
          cleanFileName: signedFileName,
          mimeType,
          timestamp,
          signature,
        })
        const gasResponse = await fetch(appScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: gasPayload,
          redirect: 'follow',
          cache: 'no-store',
        })
        if (!gasResponse.ok) {
          console.warn(`[uploadWorkerPhotoDirectAction] Google Drive webhook returned HTTP ${gasResponse.status}`)
        } else {
          const gasData = (await gasResponse.json().catch(() => null)) as {
            ok?: boolean
            fileUrl?: string
          } | null
          if (gasData?.ok && gasData.fileUrl) {
            console.info(`[uploadWorkerPhotoDirectAction] Google Drive backup stored: ${gasData.fileUrl}`)
          } else {
            console.warn(
              '[uploadWorkerPhotoDirectAction] Google Drive webhook did not save the file:',
              JSON.stringify(gasData ?? 'non-JSON response (check Apps Script deployment access)')
            )
          }
        }
      } catch (gasErr) {
        console.warn('[uploadWorkerPhotoDirectAction] Optional Google Drive backup skipped:', gasErr)
      }
    } else {
      console.info('[uploadWorkerPhotoDirectAction] Google Drive backup not configured (missing GOOGLE_APPS_SCRIPT_WEBHOOK_URL or a <32-byte GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET)')
    }

    revalidatePath('/register/status')
    revalidatePath('/dashboard/workers')

    return { ok: true, fileUrl: sanityAsset.url }
  } catch (err) {
    console.error('[uploadWorkerPhotoDirectAction] Error:', err)
    return { ok: false, error: 'Failed to upload photo. Please try again.' }
  }
}

/**
 * Retrieves the signed-in user context from Clerk and, when the account is
 * trusted, the worker profile it is allowed to refresh.
 *
 * Trust rules:
 * - clerkUserId already attached to the worker record, or
 * - Clerk-verified primary email matches a record that is not linked to a
 *   different Clerk user (the record is linked on the next save).
 *
 * Anything else returns `needsVerification` so the UI can require an email code.
 */
export async function getSignedInUserContext(): Promise<SignedInUserContext> {
  try {
    const identity = await getClerkSessionIdentity()
    if (!identity.userId) return { isSignedIn: false }

    const fullName = [identity.firstName, identity.lastName].filter(Boolean).join(' ') || undefined
    const base: SignedInUserContext = {
      isSignedIn: true,
      clerkUserId: identity.userId,
      email: identity.email,
      emailVerified: identity.emailVerified,
      firstName: identity.firstName,
      lastName: identity.lastName,
      fullName,
    }

    const email = identity.email?.trim()
    if (!email || !email.includes('@')) return base

    const worker = await sanityPrivateClient.fetch<{
      _id: string
      fullName?: string
      firstName?: string
      middleName?: string
      lastName?: string
      email?: string
      phoneNumber?: string
      hall?: string
      roomNumber?: string
      birthDate?: string
      profileImageUrl?: string
      clerkUserId?: string
      "team": string[] | string | null
      role?: WorkerRole
      requestedRole?: WorkerRole
      positions?: Array<Record<string, unknown>>
    } | null>(
      `*[_type == "worker" && (
        clerkUserId == $clerkUserId ||
        lower(email) == lower($email)
      )] | order(defined(clerkUserId) desc, _updatedAt desc)[0]{
        _id, fullName, firstName, middleName, lastName, email, phoneNumber,
        hall, roomNumber, birthDate, profileImageUrl, clerkUserId,
        "team": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
        role, requestedRole, positions
      }`,
      { clerkUserId: identity.userId, email }
    )

    if (!worker) return base

    const linkedByClerkId = worker.clerkUserId === identity.userId
    const linkedByVerifiedEmail =
      !worker.clerkUserId &&
      identity.emailVerified &&
      worker.email?.trim().toLowerCase() === email.toLowerCase()

    if (!linkedByClerkId && !linkedByVerifiedEmail) {
      return { ...base, needsVerification: true }
    }

    const phoneNumber = decrypt(worker.phoneNumber) || undefined
    const roomNumber = decrypt(worker.roomNumber) || undefined
    const birthday = parseBirthdayParts(decrypt(worker.birthDate))
    const teams = sanitizeTeamNames(
      Array.isArray(worker.team) ? worker.team : worker.team ? [worker.team] : []
    )

    return {
      ...base,
      worker: {
        id: worker._id,
        fullName: worker.fullName || fullName || email,
        firstName: worker.firstName || identity.firstName,
        middleName: worker.middleName,
        lastName: worker.lastName || identity.lastName,
        email: worker.email || email,
        phoneNumber,
        hall: worker.hall,
        roomNumber,
        birthMonth: birthday.birthMonth,
        birthDay: birthday.birthDay,
        profileImageUrl: worker.profileImageUrl,
        teams,
        isExco: Boolean(worker.role || worker.requestedRole || worker.positions?.length),
        linkedBy: linkedByClerkId ? 'clerk' : 'verified-email',
      },
    }
  } catch (err) {
    console.error('[getSignedInUserContext] Error:', err)
    return { isSignedIn: false }
  }
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
        phoneNumber: decryptedPhone || undefined,
        hall: worker.hall as string,
        roomNumber: decryptedRoom || undefined,
        birthDate: decryptedBirthDate || undefined,
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

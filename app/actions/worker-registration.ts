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
import { createPrivateDocument, patchPrivateDocument, sanityClient, sanityPrivateClient } from '@/lib/sanity'
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

const SELF_SERVICE_COOKIE = 'eccf_worker_self_service'
const SELF_SERVICE_TOKEN_TTL_MS = 15 * 60 * 1000
const SELF_SERVICE_RESEND_COOLDOWN_MS = 2 * 60 * 1000
const selfServiceEmailer = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function hashSelfServiceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function selfServiceResponse(): { ok: true; message: string } {
  return {
    ok: true,
    message: 'If those details match a worker account with an email on file, a secure link has been sent. Check your inbox and spam folder. The link expires in 15 minutes.',
  }
}

function isValidSelfServiceToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{40,60}$/.test(token)
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

export async function requestWorkerSelfServiceLink(input: {
  identifier: string
  purpose: 'profile' | 'password'
  turnstileToken?: string
}): Promise<{ ok: true; message: string }> {
  const genericResponse = selfServiceResponse()
  try {
    const identifier = input.identifier?.trim() || ''
    if (!identifier || !['profile', 'password'].includes(input.purpose)) return genericResponse
    if (!(await verifyTurnstileToken(input.turnstileToken))) return genericResponse
    if (!selfServiceEmailer || !process.env.NEXTAUTH_URL) return genericResponse

    const cleanEmail = identifier.toLowerCase()
    const cleanPhone = identifier.replace(/\s+/g, '')
    const indexes = Array.from(new Set([createBlindIndex(cleanPhone), ...getCandidateBlindIndexes(cleanPhone)]))
    const worker = await sanityPrivateClient.fetch<{
      _id: string
      _rev: string
      email?: string
      role?: string
      requestedRole?: string
      selfServiceRequestedAt?: string
    } | null>(
      `*[_type == "worker" && (
        lower(email) == $cleanEmail ||
        phoneNumber == $cleanPhone ||
        phoneBlindIndex in $indexes
      )] | order(_updatedAt desc)[0]{
        _id, _rev, email, role, requestedRole, selfServiceRequestedAt
      }`,
      { cleanEmail, cleanPhone, indexes }
    )

    const canResetPassword = Boolean(worker?.role || worker?.requestedRole)
    const email = worker?.email?.trim()
    if (!worker || !email || (input.purpose === 'password' && !canResetPassword)) return genericResponse

    const requestedAt = worker.selfServiceRequestedAt ? Date.parse(worker.selfServiceRequestedAt) : 0
    if (requestedAt && Date.now() - requestedAt < SELF_SERVICE_RESEND_COOLDOWN_MS) return genericResponse

    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + SELF_SERVICE_TOKEN_TTL_MS).toISOString()
    await patchPrivateDocument(worker._id)
      .ifRevisionId(worker._rev)
      .set({
        selfServiceTokenHash: hashSelfServiceToken(token),
        selfServiceTokenPurpose: input.purpose,
        selfServiceTokenExpiresAt: expiresAt,
        selfServiceRequestedAt: new Date().toISOString(),
      })
      .commit()

    const confirmationUrl = new URL(input.purpose === 'profile' ? '/register' : '/login', process.env.NEXTAUTH_URL)
    confirmationUrl.searchParams.set('selfServiceToken', token)
    const subject = input.purpose === 'profile' ? 'Confirm your ECCF worker profile update' : 'Confirm your ECCF dashboard password setup'
    const explanation = input.purpose === 'profile'
      ? 'Use the secure link below to review and update your worker profile.'
      : 'Use the secure link below to set or reset your Exco dashboard password.'

    await selfServiceEmailer.emails.send({
      from: process.env.EMAIL_FROM || 'ECCF <onboarding@resend.dev>',
      to: email,
      subject,
      text: `${explanation}\n\n${confirmationUrl.toString()}\n\nThis link expires in 15 minutes. If you did not request this, ignore this message.`,
    })
    return genericResponse
  } catch {
    // Keep responses generic so account existence and delivery state are not exposed.
    console.error('[requestWorkerSelfServiceLink] Request could not be completed.')
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

async function resolveTeamReference(
  teamName: string
): Promise<{ _type: 'reference'; _ref: string } | null> {
  const normalized = teamName.trim()
  if (!normalized) return null
  const existingTeam = await sanityClient.fetch<{ _id: string; name: string } | null>(
    `*[_type == "teamUnit" && lower(name) == lower($name)][0]{ _id, name }`,
    { name: normalized }
  )

  if (existingTeam?._id) {
    return { _type: 'reference', _ref: existingTeam._id }
  }
  return null
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

    const cleanPhone = input.phoneNumber.trim().replace(/\s+/g, '')
    const candidateBlindIndexes = getCandidateBlindIndexes(cleanPhone)
    const phoneBlindIndex = createBlindIndex(cleanPhone)
    const allBlindIndexes = Array.from(new Set([phoneBlindIndex, ...candidateBlindIndexes]))
    const cleanEmail = input.email.trim().toLowerCase()
    const cleanTeams = Array.from(new Set(selectedTeams))
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

    // Resolve team references to match Sanity schema
    const resolvedTeamReferences = await Promise.all(cleanTeams.map((t) => resolveTeamReference(t)))
    if (resolvedTeamReferences.some((team) => !team)) {
      return { ok: false, error: 'One or more selected teams are no longer available. Refresh the form and try again.' }
    }
    const teamReferences = resolvedTeamReferences.filter(
      (team): team is { _type: 'reference'; _ref: string } => Boolean(team)
    )
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

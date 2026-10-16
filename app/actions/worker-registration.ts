/**
 * Worker Registration Server Action — app/actions/worker-registration.ts
 *
 * Implements SDD §6.4: Profile Registration & Upsert Data Flow.
 * - Deduplicates on `phoneNumber` / `phoneBlindIndex`. Existing records are
 *   NEVER modified here (unauthenticated); see ALREADY_REGISTERED_MESSAGE.
 * - Handles client Base64 image bridge to Google Drive (via Apps Script)
 * - Implements Admin Approval Gate for Exco designations (SDD §7.3)
 * - Hashes Exco passwords with bcryptjs for NextAuth credentials verification
 */

'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { sanityWriteClient } from '@/lib/sanity'
import { encrypt, createBlindIndex } from '@/lib/encryption'
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
  birthdayPictureBase64?: string
  isExco: boolean
  requestedRole?: WorkerRole
  password?: string
  ndprConsent: boolean
}

// Neutral on purpose: must not reveal anything stored on the existing record.
const ALREADY_REGISTERED_MESSAGE =
  "You're already registered. Profile updates will open once sign-in is added; contact your team lead for urgent changes."

export interface WorkerRegistrationResult {
  ok: boolean
  error?: string
  isExco?: boolean
  message?: string
}

/**
 * Resolve a team name to an EXISTING published teamUnit (case-insensitive
 * exact name). Returns null for unknown teams — anonymous registrations must
 * never create teamUnit documents, and `match` is too loose (S7).
 */
async function resolveTeamReference(
  teamName: string
): Promise<{ _type: 'reference'; _ref: string } | null> {
  const existingTeam = await sanityWriteClient.fetch<{ _id: string } | null>(
    `*[_type == "teamUnit" && !(_id in path("drafts.**")) && lower(name) == lower($name)][0]{ _id }`,
    { name: teamName.trim() }
  )
  return existingTeam?._id ? { _type: 'reference', _ref: existingTeam._id } : null
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
      cleanBirthDate = `2000-${m}-${d}`
    } else if (cleanBirthDate) {
      const bParts = cleanBirthDate.split('-')
      if (bParts.length === 3) {
        cleanBirthDate = `2000-${bParts[1]}-${bParts[2]}`
      }
    }

    if (!cleanBirthDate) {
      return { ok: false, error: 'Please enter your birthday (month and day).' }
    }
    if (!input.ndprConsent) {
      return { ok: false, error: 'You must consent to data processing per NDPR guidelines.' }
    }

    const cleanPhone = input.phoneNumber.trim().replace(/\s+/g, '')
    const phoneBlindIndex = createBlindIndex(cleanPhone)
    const cleanTeams = Array.from(new Set(selectedTeams))
    const cleanTeam = cleanTeams[0] || 'General'
    const today = new Date().toISOString().split('T')[0]

    // 2. Existing record? This action is unauthenticated, so it must NEVER
    // modify an existing worker (S3: anyone knowing a phone number could
    // overwrite the record or replace an exco's passwordHash). Write nothing
    // and return a neutral message that reveals no stored data. Profile
    // updates return in Phase 3, with identity taken from the session.
    const existing = await sanityWriteClient.fetch<{ _id: string } | null>(
      `*[_type == "worker" && (phoneBlindIndex == $phoneBlindIndex || phoneNumber == $phoneNumber)][0]{ _id }`,
      { phoneNumber: cleanPhone, phoneBlindIndex }
    )
    if (existing) {
      return { ok: false, error: ALREADY_REGISTERED_MESSAGE }
    }

    // For a brand-new worker requesting an Exco role, password is required
    if (input.isExco) {
      if (!input.requestedRole || !['admin', 'team_lead', 'hall_rep', 'finance'].includes(input.requestedRole)) {
        return { ok: false, error: 'Please select your Exco designation.' }
      }
      if (!input.password || input.password.length < 8) {
        return { ok: false, error: 'Exco accounts require a secure password of at least 8 characters.' }
      }
    }

    // Resolve team references to match Sanity schema
    const resolvedTeams = await Promise.all(cleanTeams.map((t) => resolveTeamReference(t)))
    const unknownTeams = cleanTeams.filter((_, i) => !resolvedTeams[i])
    if (unknownTeams.length > 0) {
      return { ok: false, error: `Unknown team: ${unknownTeams.join(', ')}. Please choose from the listed teams.` }
    }
    const teamReferences = resolvedTeams.filter((ref): ref is { _type: 'reference'; _ref: string } => ref !== null)
    const primaryTeamReference = teamReferences[0]

    // 3. Process Birthday Picture via Google Apps Script bridge if provided
    let profileImageUrl: string | undefined = undefined
    const cleanFileName = `${cleanFullName.replace(/\s+/g, '_')}_${cleanTeam.replace(/\s+/g, '_')}_BirthdayPic.jpg`

    if (input.birthdayPictureBase64 && process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL) {
      try {
        const gasRes = await fetch(process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: input.birthdayPictureBase64,
            cleanFileName,
          }),
        })
        if (gasRes.ok) {
          const gasData = (await gasRes.json()) as { fileUrl?: string }
          if (gasData.fileUrl) {
            profileImageUrl = gasData.fileUrl
          }
        }
      } catch (err) {
        console.warn('[registerWorker] Google Apps Script image upload fallback:', err)
      }
    }

    let passwordHash: string | undefined = undefined
    if (input.password && input.password.length >= 8) {
      const rawHash = await bcrypt.hash(input.password, 10)
      // Double layer protection: Encrypt the bcrypt hash with AES-256-GCM before storing in Sanity
      passwordHash = encrypt(rawHash)
    }

    // 4. New Worker -> Create document with initial updateLog
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
      birthDate: cleanBirthDate,
      ...(cleanBirthMonth ? { birthMonth: cleanBirthMonth } : {}),
      ...(cleanBirthDay ? { birthDay: cleanBirthDay } : {}),
      verificationStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updateLog: initialLogs,
    }

    if (profileImageUrl) {
      newDoc.profileImageUrl = profileImageUrl
    }

    if (input.isExco && passwordHash && input.requestedRole) {
      newDoc.passwordHash = passwordHash
      newDoc.requestedRole = input.requestedRole
      newDoc.isExcoApproved = false
    }

    await sanityWriteClient.create(newDoc)

    revalidatePath('/dashboard/workers')

    return {
      ok: true,
      isExco: Boolean(input.isExco),
      message: input.isExco
        ? `Welcome to ECCF, ${cleanFullName}! Your registration has been submitted to your Team Leader for verification, and your Exco dashboard request is pending CSGB approval.`
        : `Welcome to the Workforce, ${cleanFullName}! Your registration has been submitted to your Team Leader for membership approval.`,
    }
  } catch (err) {
    console.error('[registerWorker] Error:', err)
    return {
      ok: false,
      error: 'An unexpected error occurred while saving your registration. Please try again.',
    }
  }
}

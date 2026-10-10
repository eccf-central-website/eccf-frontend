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
import { revalidatePath } from 'next/cache'
import { sanityWriteClient } from '@/lib/sanity'
import type { WorkerRole } from '@/types'

export interface WorkerRegistrationInput {
  fullName: string
  email: string
  phoneNumber: string
  team?: string
  teams?: string[]
  hall: string
  roomNumber: string
  birthDate: string
  birthdayPictureBase64?: string
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
}

async function resolveTeamReference(
  teamName: string
): Promise<{ _type: 'reference'; _ref: string }> {
  const normalized = teamName.trim()
  const existingTeam = await sanityWriteClient.fetch<{ _id: string; name: string }>(
    `*[_type == "teamUnit" && (lower(name) == lower($name) || name match $name)][0]{ _id, name }`,
    { name: normalized }
  )

  if (existingTeam?._id) {
    return { _type: 'reference', _ref: existingTeam._id }
  }

  // Auto-create teamUnit document in Sanity if not present
  const newTeam = await sanityWriteClient.create({
    _type: 'teamUnit',
    name: normalized,
    description: `${normalized} operational team of ECCF.`,
    order: 10,
  })

  return { _type: 'reference', _ref: newTeam._id }
}

export async function lookupWorkerByPhone(phoneNumber: string): Promise<{
  found: boolean
  worker?: {
    fullName: string
    team: string
    teams?: string[]
    hall?: string
    roomNumber?: string
    email?: string
    birthDate?: string
    profileImageUrl?: string
    role?: WorkerRole
    isExcoApproved?: boolean
  }
}> {
  try {
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '')
    if (cleanPhone.length < 8) return { found: false }

    const existing = await sanityWriteClient.fetch<{
      fullName?: string
      team?: string
      teams?: string[]
      hall?: string
      roomNumber?: string
      email?: string
      birthDate?: string
      profileImageUrl?: string
      role?: WorkerRole
      isExcoApproved?: boolean
    }>(
      `*[_type == "worker" && phoneNumber == $phoneNumber][0]{
        fullName,
        "team": coalesce(team->name, team),
        "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
        hall,
        roomNumber,
        email,
        birthDate,
        profileImageUrl,
        role,
        isExcoApproved
      }`,
      { phoneNumber: cleanPhone }
    )

    if (!existing || !existing.fullName) {
      return { found: false }
    }

    const resolvedTeams = (
      existing.teams && existing.teams.length > 0
        ? existing.teams
        : [existing.team || 'General']
    ).filter(Boolean)

    return {
      found: true,
      worker: {
        fullName: existing.fullName,
        team: existing.team || resolvedTeams[0] || 'General',
        teams: resolvedTeams,
        hall: existing.hall,
        roomNumber: existing.roomNumber,
        email: existing.email,
        birthDate: existing.birthDate,
        profileImageUrl: existing.profileImageUrl,
        role: existing.role,
        isExcoApproved: existing.isExcoApproved,
      },
    }
  } catch (err) {
    console.error('[lookupWorkerByPhone] Error:', err)
    return { found: false }
  }
}

export async function registerWorker(
  input: WorkerRegistrationInput
): Promise<WorkerRegistrationResult> {
  try {
    // 1. Validation
    if (!input.fullName || input.fullName.trim().length < 2) {
      return { ok: false, error: 'Please enter your full legal name.' }
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
    if (!input.birthDate) {
      return { ok: false, error: 'Please enter your birth date for the birthday tracker.' }
    }
    if (!input.ndprConsent) {
      return { ok: false, error: 'You must consent to data processing per NDPR guidelines.' }
    }

    const cleanPhone = input.phoneNumber.trim().replace(/\s+/g, '')
    const cleanFullName = input.fullName.trim()
    const cleanTeams = Array.from(new Set(selectedTeams))
    const cleanTeam = cleanTeams[0] || 'General'
    const today = new Date().toISOString().split('T')[0]

    // 2. Check if worker already exists (Deduplication / Upsert check)
    const existing = await sanityWriteClient.fetch<{
      _id: string
      fullName?: string
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
    }>(
      `*[_type == "worker" && phoneNumber == $phoneNumber][0]{
        _id,
        fullName,
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
      { phoneNumber: cleanPhone }
    )

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
    } else {
      // Existing worker updating location / profile
      if (input.password && input.password.length < 8) {
        return { ok: false, error: 'Password must be at least 8 characters long.' }
      }
      // If a previously general worker (no passwordHash) requests Exco designation for the first time
      if (input.isExco && !existing.passwordHash && !existing.role) {
        if (!input.password || input.password.length < 8) {
          return { ok: false, error: 'Exco accounts require a secure password of at least 8 characters.' }
        }
      }
    }

    // Resolve team references to match Sanity schema
    const teamReferences = await Promise.all(cleanTeams.map((t) => resolveTeamReference(t)))
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
      passwordHash = await bcrypt.hash(input.password, 10)
    }

    if (existing) {
      // 4a. Worker Exists -> Compute Delta Log and Patch
      const deltaLogs: string[] = []

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
      if (existing.roomNumber && existing.roomNumber !== input.roomNumber) {
        deltaLogs.push(`Changed Room from ${existing.roomNumber} to ${input.roomNumber} on ${today}`)
      }
      if (existing.email && existing.email !== input.email) {
        deltaLogs.push(`Updated Email on ${today}`)
      }
      if (existing.birthDate && existing.birthDate !== input.birthDate) {
        deltaLogs.push(`Updated Birth Date on ${today}`)
      }
      if (profileImageUrl) {
        deltaLogs.push(`Updated Birthday Picture on ${today}`)
      }
      if (input.isExco && input.requestedRole) {
        deltaLogs.push(`Requested Exco role (${input.requestedRole}) on ${today} (pending approval)`)
      }

      if (deltaLogs.length === 0) {
        deltaLogs.push(`Profile re-verified on ${today}`)
      }

      const patchData: Record<string, unknown> = {
        fullName: cleanFullName,
        email: input.email.trim().toLowerCase(),
        team: primaryTeamReference,
        teams: teamReferences,
        hall: input.hall,
        roomNumber: input.roomNumber,
        birthDate: input.birthDate,
        updatedAt: new Date().toISOString(),
      }

      if (profileImageUrl) {
        patchData.profileImageUrl = profileImageUrl
      }

      if (input.isExco && passwordHash) {
        patchData.passwordHash = passwordHash
        patchData.requestedRole = input.requestedRole
        patchData.isExcoApproved = false
      }

      await sanityWriteClient
        .patch(existing._id)
        .set(patchData)
        .append('updateLog', deltaLogs)
        .commit()

      revalidatePath('/dashboard/workers')

      const isNewlyRequestingExco = Boolean(input.isExco && passwordHash && !existing.isExcoApproved && !existing.role)
      return {
        ok: true,
        isExco: Boolean(existing.role || input.isExco),
        message: isNewlyRequestingExco
          ? 'Profile updated successfully! Your Exco dashboard request has been submitted for administrator approval.'
          : 'Profile and location updated successfully! Your fellowship records have been refreshed.',
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
        email: input.email.trim().toLowerCase(),
        phoneNumber: cleanPhone,
        team: primaryTeamReference,
        teams: teamReferences,
        hall: input.hall,
        roomNumber: input.roomNumber,
        birthDate: input.birthDate,
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
        isExco: input.isExco,
        message: input.isExco
          ? 'Worker registration successful! Your Exco dashboard account has been created and is pending administrator approval.'
          : 'Worker registration successful! Welcome to the fellowship workforce.',
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

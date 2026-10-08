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
  team: string
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
    if (!input.team || input.team.trim().length === 0) {
      return { ok: false, error: 'Please select your operational team.' }
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

    if (input.isExco) {
      if (!input.requestedRole || !['admin', 'hall_rep', 'finance'].includes(input.requestedRole)) {
        return { ok: false, error: 'Please select your Exco designation.' }
      }
      if (!input.password || input.password.length < 8) {
        return { ok: false, error: 'Exco accounts require a secure password of at least 8 characters.' }
      }
    }

    const cleanPhone = input.phoneNumber.trim().replace(/\s+/g, '')
    const cleanFullName = input.fullName.trim()
    const cleanTeam = input.team.trim()
    const today = new Date().toISOString().split('T')[0]

    // 2. Process Birthday Picture via Google Apps Script bridge if provided
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

    // 3. Upsert Lookup by phoneNumber (SDD §6.4)
    const existing = await sanityWriteClient.fetch<{
      _id: string
      fullName?: string
      team?: string
      hall?: string
      roomNumber?: string
      email?: string
      birthDate?: string
      updateLog?: string[]
    }>(
      `*[_type == "worker" && phoneNumber == $phoneNumber][0]{
        _id,
        fullName,
        team,
        hall,
        roomNumber,
        email,
        birthDate,
        updateLog
      }`,
      { phoneNumber: cleanPhone }
    )

    let passwordHash: string | undefined = undefined
    if (input.isExco && input.password) {
      passwordHash = await bcrypt.hash(input.password, 10)
    }

    if (existing) {
      // 4a. Worker Exists -> Compute Delta Log and Patch
      const deltaLogs: string[] = []

      if (existing.team && existing.team !== cleanTeam) {
        deltaLogs.push(`Changed Team from ${existing.team} to ${cleanTeam} on ${today}`)
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
        team: cleanTeam,
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

      return {
        ok: true,
        isExco: input.isExco,
        message: input.isExco
          ? 'Profile updated successfully! Your Exco dashboard request has been submitted for administrator approval.'
          : 'Profile updated successfully! Your worker details have been refreshed.',
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
        team: cleanTeam,
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

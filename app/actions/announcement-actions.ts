/**
 * Announcement Server Actions — app/actions/announcement-actions.ts
 *
 * Implements the Sunday Announcements Engine mutations:
 * - RBAC: Restricted to CSGB members (President, Vice-Presidents, General Secretary, Prayer Coordinator)
 * - Create (Draft or Published)
 * - Update
 * - Delete (with cleanup)
 * - Toggle Pin status
 * - Automatic revalidation of `/dashboard/announcements`, `/announcements`, and `/`
 */

'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/dashboard/auth'
import { isCSGBMember } from '@/lib/dashboard/rbac'
import { sanityWriteClient } from '@/lib/sanity'
import type { Announcement, PortableTextBlock } from '@/types'
import { stringToPortableText } from '@/lib/portable-text-helpers'

export interface AnnouncementInput {
  title: string
  category?: string
  time?: string
  location?: string
  eventDate?: string
  publishDate?: string
  content?: string | PortableTextBlock[]
  isPinned?: boolean
  isPublished?: boolean
  sendBroadcastOnPublish?: boolean
}

export interface UpdateAnnouncementInput extends AnnouncementInput {
  _id: string
}

/**
 * Create a new announcement (published or draft)
 */
export async function createAnnouncement(
  input: AnnouncementInput
): Promise<{ ok: true; data: Announcement } | { ok: false; error: string }> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Unauthorized: Authentication required.' }
  }
  if (!isCSGBMember(session)) {
    return { ok: false, error: 'Permission denied: Only CSGB members can manage announcements.' }
  }

  if (!input.title || input.title.trim().length < 3) {
    return { ok: false, error: 'Title must be at least 3 characters long.' }
  }

  const rawContent = input.content
  const blocks =
    typeof rawContent === 'string'
      ? stringToPortableText(rawContent)
      : Array.isArray(rawContent) && rawContent.length > 0
      ? rawContent
      : stringToPortableText('')

  const isPublished = input.isPublished !== false
  const publishDate = input.publishDate || new Date().toISOString().split('T')[0]
  const location = input.location?.trim() || 'NLT 5, Faculty of Law, ESUI'
  const category = input.category?.trim() || 'WEEKLY SERVICES'

  const doc = {
    _type: 'announcement',
    title: input.title.trim(),
    category,
    time: input.time?.trim() || undefined,
    location,
    eventDate: input.eventDate?.trim() || undefined,
    publishDate,
    content: blocks,
    isPinned: Boolean(input.isPinned),
    isPublished,
    sendBroadcastOnPublish: Boolean(input.sendBroadcastOnPublish),
    sentToSubscribers: false,
  }

  try {
    const created = await sanityWriteClient.create(doc)

    revalidatePath('/dashboard/announcements')
    revalidatePath('/announcements')
    revalidatePath('/')

    return { ok: true, data: created as unknown as Announcement }
  } catch (err: unknown) {
    console.error('[createAnnouncement] Error:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to create announcement in Sanity.',
    }
  }
}

/**
 * Update an existing announcement
 */
export async function updateAnnouncement(
  input: UpdateAnnouncementInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Unauthorized: Authentication required.' }
  }
  if (!isCSGBMember(session)) {
    return { ok: false, error: 'Permission denied: Only CSGB members can manage announcements.' }
  }

  if (!input._id) {
    return { ok: false, error: 'Announcement ID is required for updating.' }
  }
  if (!input.title || input.title.trim().length < 3) {
    return { ok: false, error: 'Title must be at least 3 characters long.' }
  }

  const cleanId = input._id.replace(/^drafts\./, '')
  const rawContent = input.content
  const blocks =
    typeof rawContent === 'string'
      ? stringToPortableText(rawContent)
      : Array.isArray(rawContent) && rawContent.length > 0
      ? rawContent
      : stringToPortableText('')

  const patchData: Record<string, unknown> = {
    title: input.title.trim(),
    category: input.category?.trim() || 'WEEKLY SERVICES',
    time: input.time?.trim() || '',
    location: input.location?.trim() || 'NLT 5, Faculty of Law, ESUI',
    eventDate: input.eventDate?.trim() || '',
    publishDate: input.publishDate || new Date().toISOString().split('T')[0],
    content: blocks,
    isPinned: Boolean(input.isPinned),
    isPublished: Boolean(input.isPublished),
  }

  if (input.sendBroadcastOnPublish !== undefined) {
    patchData.sendBroadcastOnPublish = Boolean(input.sendBroadcastOnPublish)
  }

  try {
    await sanityWriteClient.patch(cleanId).set(patchData).commit()

    revalidatePath('/dashboard/announcements')
    revalidatePath('/announcements')
    revalidatePath('/')

    return { ok: true }
  } catch (err: unknown) {
    console.error('[updateAnnouncement] Error:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update announcement.',
    }
  }
}

/**
 * Delete an announcement with confirmation
 */
export async function deleteAnnouncement(
  announcementId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Unauthorized: Authentication required.' }
  }
  if (!isCSGBMember(session)) {
    return { ok: false, error: 'Permission denied: Only CSGB members can manage announcements.' }
  }

  if (!announcementId) {
    return { ok: false, error: 'Announcement ID is required.' }
  }

  const cleanId = announcementId.replace(/^drafts\./, '')

  try {
    await sanityWriteClient.delete(cleanId)

    // Defensively attempt to delete drafts copy if separate draft exists
    try {
      await sanityWriteClient.delete(`drafts.${cleanId}`)
    } catch {
      // Ignore if draft doesn't exist
    }

    revalidatePath('/dashboard/announcements')
    revalidatePath('/announcements')
    revalidatePath('/')

    return { ok: true }
  } catch (err: unknown) {
    console.error('[deleteAnnouncement] Error:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to delete announcement.',
    }
  }
}

/**
 * Toggle announcement pin status
 */
export async function togglePinAnnouncement(
  announcementId: string,
  currentPinStatus: boolean
): Promise<{ ok: true; isPinned: boolean } | { ok: false; error: string }> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Unauthorized: Authentication required.' }
  }
  if (!isCSGBMember(session)) {
    return { ok: false, error: 'Permission denied: Only CSGB members can manage announcements.' }
  }

  if (!announcementId) {
    return { ok: false, error: 'Announcement ID is required.' }
  }

  const cleanId = announcementId.replace(/^drafts\./, '')
  const nextPin = !currentPinStatus

  try {
    await sanityWriteClient
      .patch(cleanId)
      .set({ isPinned: nextPin })
      .commit()

    revalidatePath('/dashboard/announcements')
    revalidatePath('/announcements')
    revalidatePath('/')

    return { ok: true, isPinned: nextPin }
  } catch (err: unknown) {
    console.error('[togglePinAnnouncement] Error:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update announcement pin state.',
    }
  }
}

// Announcements server actions for ECCF dashboard
'use server'

import { revalidatePath } from 'next/cache';
import { sanityWriteClient } from '@/lib/sanity';
import { requirePermission } from '@/lib/dashboard/rbac';

/**
 * Create a new announcement.
 */
export async function createAnnouncement(
  formData: {
    title: string;
    content?: string;
    publishDate: string;
    isPublished: boolean;
  },
  session: { role: string; name: string }
) {
  requirePermission(session.role, 'announcements');

  if (!formData.title) {
    throw new Error('Title is required');
  }

  const doc = {
    _type: 'announcement',
    title: formData.title,
    content: formData.content ?? '',
    publishDate: formData.publishDate,
    isPublished: formData.isPublished,
  };

  await sanityWriteClient.create(doc);

  revalidatePath('/dashboard/announcements');
  revalidatePath('/');
  return { success: true };
}

/**
 * Update an existing announcement.
 */
export async function updateAnnouncement(
  id: string,
  formData: {
    title: string;
    content?: string;
    publishDate: string;
    isPublished: boolean;
  },
  session: { role: string; name: string }
) {
  requirePermission(session.role, 'announcements');

  await sanityWriteClient
    .patch(id)
    .set({
      title: formData.title,
      content: formData.content ?? '',
      publishDate: formData.publishDate,
      isPublished: formData.isPublished,
    })
    .commit();

  revalidatePath('/dashboard/announcements');
  revalidatePath('/');
  return { success: true };
}

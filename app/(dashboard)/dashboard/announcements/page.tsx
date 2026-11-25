/**
 * Announcements — /dashboard/announcements
 *
 * Implements the notices & broadcast queue:
 * - One semantic h1: Announcements (Belleza via PageHeader inside AnnouncementsClient)
 * - Subtitle: Plan, schedule, and broadcast notices.
 * - Date-only eyebrow via formatDate(lagosDate()).
 * - Guarded by requireSection('announcements').
 */

import type { Metadata } from 'next'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import AnnouncementsClient from '@/components/dashboard/announcements/AnnouncementsClient'
import { requireSection } from '@/lib/dashboard/auth'
import { listAnnouncements } from '@/lib/dashboard/data'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatDate } from '@/lib/dashboard/format'
import { sanityPrivateClient } from '@/lib/sanity'

export const metadata: Metadata = {
  title: 'Announcements — ECCF Exco Dashboard',
  description: 'Plan, schedule, and broadcast fellowship notices.',
}

export const dynamic = 'force-dynamic'

async function getActiveSubscriberCount(): Promise<number | null> {
  const isMock =
    process.env.DASHBOARD_DATA_SOURCE === 'mock' ||
    (process.env.NODE_ENV !== 'production' && !process.env.DASHBOARD_DATA_SOURCE)
  if (isMock || !sanityPrivateClient.config().token) return null

  try {
    const count = await sanityPrivateClient.fetch<number>(
      `count(*[_type == "subscriber" && isActive != false && defined(email) && email != ""])`
    )
    return typeof count === 'number' ? count : null
  } catch {
    return null
  }
}

export default async function AnnouncementsPage() {
  const session = await requireSection('announcements')
  const [announcements, subscriberCount] = await Promise.all([
    listAnnouncements(session),
    getActiveSubscriberCount(),
  ])

  const todayLabel = formatDate(lagosDate())

  return (
    <PageContainer>
      <AnnouncementsClient
        initialAnnouncements={announcements}
        session={session}
        today={todayLabel}
        subscriberCount={subscriberCount}
      />
    </PageContainer>
  )
}

/**
 * Announcements — /dashboard/announcements
 *
 * Implements the notices & broadcast queue:
 * - One semantic h1: Announcements
 * - Subtitle: Plan, schedule, and broadcast notices.
 * - Date-only eyebrow.
 * - Guarded by requireSection('announcements').
 */

import { requireSection } from '@/lib/dashboard/auth'
import { listAnnouncements } from '@/lib/dashboard/data'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import AnnouncementsClient from '@/components/dashboard/announcements/AnnouncementsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Announcements — ECCF Exco Dashboard',
  description: 'Plan, schedule, and broadcast fellowship notices.',
}

export const dynamic = 'force-dynamic'

export default async function AnnouncementsPage() {
  const session = await requireSection('announcements')
  const announcements = await listAnnouncements(session)

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <PageContainer>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {todayStr}
        </p>
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Announcements
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Plan, schedule, and broadcast notices.
        </p>
      </div>

      <AnnouncementsClient
        initialAnnouncements={announcements}
        session={session}
      />
    </PageContainer>
  )
}

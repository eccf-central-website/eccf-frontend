/**
 * Announcements Management — /dashboard/announcements
 *
 * Strict Access Restriction:
 * Only accessible to CSGB Members: President, Vice-Presidents, Prayer Team Leader/Coordinator, and General Secretary.
 * Guarded by `requireSection('announcements')`.
 */

import { requireSection } from '@/lib/dashboard/auth'
import { listAnnouncements } from '@/lib/dashboard/data'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import AnnouncementsClient from '@/components/dashboard/announcements/AnnouncementsClient'
import { Megaphone } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sunday Announcements Engine — Exco Dashboard',
  description: 'Manage, edit, publish, and broadcast fellowship notices and bulletins.',
}

export const dynamic = 'force-dynamic'

export default async function AnnouncementsPage() {
  const session = await requireSection('announcements')
  const announcements = await listAnnouncements(session)

  return (
    <PageContainer>
      {/* Section Header */}
      <div className="flex flex-col gap-2 border-b pb-5">
        <div className="flex items-center gap-2.5 text-primary">
          <Megaphone className="h-6 w-6 shrink-0" />
          <h2 className="font-serif text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            Sunday Announcements Engine
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage Sunday service announcements, mid-week notices, academic clinics, and broadcast bulletins to active email subscribers.
        </p>
      </div>

      <AnnouncementsClient
        initialAnnouncements={announcements}
        session={session}
      />
    </PageContainer>
  )
}

/**
 * Prayer Requests — /dashboard/prayer-requests
 *
 * Feed of intercessory prayer requests submitted through the Connect page.
 * Displays submitter names (or Anonymous badges), timestamps, and quick intercession copy actions.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import PrayerRequestsFeed from '@/components/dashboard/prayer/PrayerRequestsFeed'
import { requireSection } from '@/lib/dashboard/auth'
import { listPrayerRequests } from '@/lib/dashboard/data'
import { HeartHandshake } from 'lucide-react'

export default async function PrayerRequestsPage() {
  await requireSection('prayerRequests')
  const rows = await listPrayerRequests()

  if (rows.length === 0) {
    return (
      <SectionEmpty
        section="prayerRequests"
        title="No prayer requests yet"
        description="Prayer requests submitted on the Connect page will appear here."
      />
    )
  }

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b pb-5">
        <div className="flex items-center gap-2.5 text-primary">
          <HeartHandshake className="h-6 w-6" />
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Prayer Requests Feed
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time feed of intercessory requests submitted through the Connect page with timestamps and submission details.
        </p>
      </div>

      {/* Main Feed Component */}
      <PrayerRequestsFeed requests={rows} />
    </PageContainer>
  )
}

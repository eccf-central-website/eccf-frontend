/**
 * Prayer requests — /dashboard/prayer-requests
 *
 * Implements the calm prayer feed:
 * - One semantic h1: Prayer requests
 * - Subtitle: A quiet feed for intercession and follow-up.
 * - Date-only eyebrow.
 * - Tonal card surfaces for intercessory requests without nested borders.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import PrayerRequestsFeed from '@/components/dashboard/prayer/PrayerRequestsFeed'
import { requireSection } from '@/lib/dashboard/auth'
import { listPrayerRequests } from '@/lib/dashboard/data'

export const dynamic = 'force-dynamic'

export default async function PrayerRequestsPage() {
  const session = await requireSection('prayerRequests')
  const rows = await listPrayerRequests(session)

  if (rows.length === 0) {
    return (
      <SectionEmpty
        section="prayerRequests"
        title="No prayer requests yet"
        description="Prayer requests submitted on the Connect page will appear here."
      />
    )
  }

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
          Prayer requests
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          A quiet feed for intercession and follow-up.
        </p>
      </div>

      {/* Main Feed Component */}
      <PrayerRequestsFeed requests={rows} />
    </PageContainer>
  )
}

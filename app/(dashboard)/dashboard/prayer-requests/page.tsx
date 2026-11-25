/**
 * Prayer requests — /dashboard/prayer-requests
 *
 * Implements the calm prayer feed:
 * - One semantic h1: Prayer requests (Belleza via PageHeader)
 * - Subtitle: A quiet feed for intercession and follow-up.
 * - Date-only eyebrow via formatDate(lagosDate()).
 * - Tonal card surfaces for intercessory requests without nested borders.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import PrayerRequestsFeed from '@/components/dashboard/prayer/PrayerRequestsFeed'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { requireSection } from '@/lib/dashboard/auth'
import { listPrayerRequests } from '@/lib/dashboard/data'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatDate } from '@/lib/dashboard/format'

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

  const todayIso = lagosDate()

  return (
    <PageContainer>
      <PageHeader
        eyebrow={formatDate(todayIso)}
        title="Prayer requests"
        description="A quiet feed for intercession and follow-up."
      />

      <PrayerRequestsFeed requests={rows} todayIso={todayIso} />
    </PageContainer>
  )
}


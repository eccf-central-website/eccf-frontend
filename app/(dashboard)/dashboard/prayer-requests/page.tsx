/**
 * Prayer Requests — /dashboard/prayer-requests
 *
 * Stub until feature/dashboard-data-tables:
 * guards direct-URL access with requireSection() and
 * already fetches the section's data, so the dev switcher's slow / empty /
 * error states exercise loading.tsx, SectionEmpty and error.tsx here.
 */

import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'
import { listPrayerRequests } from '@/lib/dashboard/data'

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
    <SectionPlaceholder
      section="prayerRequests"
      branch="feature/dashboard-data-tables"
      description="Feed of prayer requests submitted through the Connect page."
      count={rows.length}
    />
  )
}

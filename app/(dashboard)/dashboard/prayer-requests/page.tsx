/**
 * Prayer Requests — /dashboard/prayer-requests
 *
 * Stub from feature/dashboard-layout: guards direct-URL access with
 * requireSection() so RBAC is testable before feature/dashboard-data-tables lands.
 */

import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'

export default async function PrayerRequestsPage() {
  await requireSection('prayerRequests')

  return (
    <SectionPlaceholder
      section="prayerRequests"
      branch="feature/dashboard-data-tables"
      description="Feed of prayer requests submitted through the Connect page."
    />
  )
}

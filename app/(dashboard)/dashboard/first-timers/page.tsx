/**
 * First-Timers — /dashboard/first-timers
 *
 * Stub from feature/dashboard-layout: guards direct-URL access with
 * requireSection() so RBAC is testable before feature/dashboard-data-tables lands.
 */

import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'

export default async function FirstTimersPage() {
  await requireSection('firstTimers')

  return (
    <SectionPlaceholder
      section="firstTimers"
      branch="feature/dashboard-data-tables"
      description="Feed of first-timer intake forms from the Connect page."
    />
  )
}

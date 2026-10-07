/**
 * First-Timers — /dashboard/first-timers
 *
 * Stub until feature/dashboard-data-tables:
 * guards direct-URL access with requireSection() and
 * already fetches the section's data, so the dev switcher's slow / empty /
 * error states exercise loading.tsx, SectionEmpty and error.tsx here.
 */

import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'
import { listFirstTimers } from '@/lib/dashboard/data'

export default async function FirstTimersPage() {
  await requireSection('firstTimers')
  const rows = await listFirstTimers()

  if (rows.length === 0) {
    return (
      <SectionEmpty
        section="firstTimers"
        title="No first-timers yet"
        description="First-timer forms submitted on the Connect page will appear here."
      />
    )
  }

  return (
    <SectionPlaceholder
      section="firstTimers"
      branch="feature/dashboard-data-tables"
      description="Feed of first-timer intake forms from the Connect page."
      count={rows.length}
    />
  )
}
